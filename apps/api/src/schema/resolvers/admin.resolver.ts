import { eq, desc } from "drizzle-orm";
import { users, auditLogs } from "@digi/db/schema";
import { generateId } from "@digi/shared/utils";
import { type Context } from "../../context.js";

function requireAdmin(ctx: Context) {
  if (!ctx.user) throw new Error("Unauthorized");
  if (ctx.user.role !== "admin") throw new Error("Forbidden: admin only");
}

export const adminResolvers = {
  Query: {
    users: async (
      _: unknown,
      args: { limit?: number; offset?: number },
      ctx: Context
    ) => {
      requireAdmin(ctx);
      return ctx.db.query.users.findMany({
        limit: args.limit ?? 50,
        offset: args.offset ?? 0,
        orderBy: desc(users.createdAt),
      });
    },

    auditLogs: async (
      _: unknown,
      args: { limit?: number; offset?: number },
      ctx: Context
    ) => {
      requireAdmin(ctx);
      return ctx.db.query.auditLogs.findMany({
        limit: args.limit ?? 50,
        offset: args.offset ?? 0,
        orderBy: desc(auditLogs.createdAt),
      });
    },
  },

  Mutation: {
    suspendUser: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ) => {
      requireAdmin(ctx);

      await ctx.db
        .update(users)
        .set({ suspended: true, updatedAt: new Date() })
        .where(eq(users.id, args.id));

      await ctx.db.insert(auditLogs).values({
        id: generateId(),
        actorId: ctx.user!.id,
        actorType: "admin",
        action: "user.suspend",
        resourceType: "user",
        resourceId: args.id,
      });

      return ctx.db.query.users.findFirst({
        where: eq(users.id, args.id),
      });
    },

    unsuspendUser: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ) => {
      requireAdmin(ctx);

      await ctx.db
        .update(users)
        .set({ suspended: false, updatedAt: new Date() })
        .where(eq(users.id, args.id));

      await ctx.db.insert(auditLogs).values({
        id: generateId(),
        actorId: ctx.user!.id,
        actorType: "admin",
        action: "user.unsuspend",
        resourceType: "user",
        resourceId: args.id,
      });

      return ctx.db.query.users.findFirst({
        where: eq(users.id, args.id),
      });
    },

    deleteUser: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ) => {
      requireAdmin(ctx);

      await ctx.db.delete(users).where(eq(users.id, args.id));

      await ctx.db.insert(auditLogs).values({
        id: generateId(),
        actorId: ctx.user!.id,
        actorType: "admin",
        action: "user.delete",
        resourceType: "user",
        resourceId: args.id,
      });

      return true;
    },
  },
};
