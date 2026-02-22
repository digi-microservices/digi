import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { type Database } from "@digi/db";
import * as schema from "@digi/db/schema";
import { generateId } from "@digi/shared/utils";

export interface AuthConfig {
  db: Database;
  baseURL: string;
  secret: string;
  trustedOrigins?: string[];
  github?: {
    clientId: string;
    clientSecret: string;
  };
  discord?: {
    clientId: string;
    clientSecret: string;
  };
}

export function createAuth(config: AuthConfig) {
  return betterAuth({
    database: drizzleAdapter(config.db, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    baseURL: config.baseURL,
    secret: config.secret,
    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://app.localhost",
      "http://support.localhost",
      "http://admin.localhost",
      "http://bot.localhost",
      "http://localhost",
      ...(config.trustedOrigins ?? []),
    ],
    advanced: {
      generateId: ({ model }: { model: string }) => {
        const prefixMap: Record<string, string> = {
          user: "usr",
          session: "ses",
          account: "acc",
          verification: "vrf",
        };
        const prefix = prefixMap[model] ?? model;
        return generateId(prefix as Parameters<typeof generateId>[0]);
      },
      crossSubdomainCookies: {
        enabled: false,
      },
      defaultCookieAttributes: {
        sameSite: "lax",
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      ...(config.github
        ? {
            github: {
              clientId: config.github.clientId,
              clientSecret: config.github.clientSecret,
            },
          }
        : {}),
      ...(config.discord
        ? {
            discord: {
              clientId: config.discord.clientId,
              clientSecret: config.discord.clientSecret,
            },
          }
        : {}),
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "user",
          input: false,
        },
        suspended: {
          type: "boolean",
          defaultValue: false,
          input: false,
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
