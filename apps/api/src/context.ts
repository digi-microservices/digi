import { type Database } from "@digi/db";
import { type Auth } from "@digi/auth/server";
import { type Cache } from "@digi/redis/cache";
import { type PubSub } from "@digi/redis/pubsub";
import { type RedisClient } from "@digi/redis";
import { type User, type Session } from "@digi/auth";
import { eq } from "drizzle-orm";
import { apiTokens, users as usersTable } from "@digi/db/schema";

export interface Context {
  db: Database;
  auth: Auth;
  cache: Cache;
  pubsub: PubSub;
  redis: RedisClient;
  user: User | null;
  session: Session | null;
  request: Request;
}

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(hashBuffer), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export function createContextFactory(deps: {
  db: Database;
  auth: Auth;
  cache: Cache;
  pubsub: PubSub;
  redis: RedisClient;
}) {
  return async (request: Request): Promise<Context> => {
    let user: User | null = null;
    let session: Session | null = null;

    // 1. Cookie/session-based authentication (browser clients, dashboard)
    try {
      const sessionResult = await deps.auth.api.getSession({
        headers: request.headers,
      });
      if (sessionResult) {
        user = sessionResult.user as User;
        session = sessionResult.session as Session;
      }
    } catch {
      // No valid session — fall through to token auth
    }

    // 2. Bearer token authentication (CLI, programmatic access)
    if (!user) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const rawToken = authHeader.slice(7).trim();
        try {
          const tokenHash = await sha256Hex(rawToken);
          const now = new Date();

          const tokenRecord = await deps.db.query.apiTokens.findFirst({
            where: eq(apiTokens.tokenHash, tokenHash),
          });

          if (
            tokenRecord &&
            (!tokenRecord.expiresAt || tokenRecord.expiresAt > now)
          ) {
            const foundUser = await deps.db.query.users.findFirst({
              where: eq(usersTable.id, tokenRecord.userId),
            });

            if (foundUser) {
              user = foundUser as User;

              // Update lastUsedAt in the background — non-blocking
              deps.db
                .update(apiTokens)
                .set({ lastUsedAt: now })
                .where(eq(apiTokens.id, tokenRecord.id))
                .execute()
                .catch(() => {});
            }
          }
        } catch {
          // Malformed token or transient DB error — deny access silently
        }
      }
    }

    return { ...deps, user, session, request };
  };
}
