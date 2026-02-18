import { eq, and } from "drizzle-orm";
import { services, subscriptions, apiTokens } from "@digi/db/schema";
import { generateId } from "@digi/shared/utils";
import { type Context } from "../../context.js";

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(hashBuffer), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export const userResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) return null;
      return ctx.user;
    },
  },
  Mutation: {
    generateApiToken: async (
      _: unknown,
      args: { name: string },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      // 256-bit random token with a recognisable prefix (aids detection if leaked)
      const randomBytes = crypto.getRandomValues(new Uint8Array(32));
      const randomHex = Array.from(randomBytes, (b) =>
        b.toString(16).padStart(2, "0")
      ).join("");
      const token = `digi_${randomHex}`;

      // SHA-256 for deterministic DB lookup — safe because the token has 256 bits
      // of entropy, making brute-force preimage attacks computationally infeasible.
      const tokenHash = await sha256Hex(token);
      const id = generateId();

      await ctx.db.insert(apiTokens).values({
        id,
        userId: ctx.user.id,
        name: args.name,
        tokenHash,
      });

      return { id, name: args.name, token, createdAt: new Date() };
    },

    revokeApiToken: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      // Scope deletion to the requesting user — prevents cross-user token deletion.
      await ctx.db
        .delete(apiTokens)
        .where(
          and(eq(apiTokens.id, args.id), eq(apiTokens.userId, ctx.user.id))
        );

      return true;
    },
  },
  User: {
    services: async (parent: { id: string }, _: unknown, ctx: Context) => {
      return ctx.db.query.services.findMany({
        where: eq(services.userId, parent.id),
      });
    },
    subscription: async (
      parent: { id: string },
      _: unknown,
      ctx: Context
    ) => {
      return ctx.db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, parent.id),
        with: { plan: true },
      });
    },
  },
};
