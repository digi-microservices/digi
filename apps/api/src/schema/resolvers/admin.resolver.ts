import { eq, desc } from "drizzle-orm";
import { users, auditLogs, services } from "@digi/db/schema";
import { generateId } from "@digi/shared/utils";
import { type Context } from "../../context";

function requireAdmin(ctx: Context) {
  if (!ctx.user) throw new Error("Unauthorized");
  if (ctx.user.role !== "admin") throw new Error("Forbidden: admin only");
}

export const adminResolvers = {
  Query: {
    users: async (
      _: unknown,
      args: { limit?: number; offset?: number },
      ctx: Context,
    ) => {
      requireAdmin(ctx);
      const rawUsers = await ctx.db.query.users.findMany({
        limit: args.limit ?? 50,
        offset: args.offset ?? 0,
        orderBy: desc(users.createdAt),
      });

      const formattedUsers = rawUsers.map(async (u) => {
        const userServices = await ctx.db.query.services.findMany({
          where: eq(services.userId, u.id),
        });
        return {
          ...u,
          services: userServices,
          serviceCount: userServices.length,
        };
      });

      return formattedUsers;
    },

    auditLogs: async (
      _: unknown,
      args: { limit?: number; offset?: number },
      ctx: Context,
    ) => {
      requireAdmin(ctx);
      return ctx.db.query.auditLogs.findMany({
        limit: args.limit ?? 50,
        offset: args.offset ?? 0,
        orderBy: desc(auditLogs.createdAt),
      });
    },

    adminOverview: async (_: unknown, __: unknown, ctx: Context) => {
      requireAdmin(ctx);

      const userCount = await ctx.db.query.users.findMany();
      const serviceCount = await ctx.db.query.services.findMany();
      const serverCount = await ctx.db.query.servers.findMany();
      const vmCount = await ctx.db.query.vms.findMany();
      const activeServices = await ctx.db.query.services.findMany({
        where: eq(services.status, "running"),
      });

      return {
        totalUsers: userCount.length,
        totalServices: serviceCount.length,
        totalServers: serverCount.length,
        totalVms: vmCount.length,
        activeServices: activeServices.length,
        mrr: 0,
      };
    },
  },

  Mutation: {
    suspendUser: async (_: unknown, args: { id: string }, ctx: Context) => {
      requireAdmin(ctx);

      await ctx.db
        .update(users)
        .set({ suspended: true, updatedAt: new Date() })
        .where(eq(users.id, args.id));

      await ctx.db.insert(auditLogs).values({
        id: generateId("log"),
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

    unsuspendUser: async (_: unknown, args: { id: string }, ctx: Context) => {
      requireAdmin(ctx);

      await ctx.db
        .update(users)
        .set({ suspended: false, updatedAt: new Date() })
        .where(eq(users.id, args.id));

      await ctx.db.insert(auditLogs).values({
        id: generateId("log"),
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

    deleteUser: async (_: unknown, args: { id: string }, ctx: Context) => {
      requireAdmin(ctx);

      await ctx.db.delete(users).where(eq(users.id, args.id));

      await ctx.db.insert(auditLogs).values({
        id: generateId("log"),
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
