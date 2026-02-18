import { eq } from "drizzle-orm";
import { servers, vms, auditLogs } from "@digi/db/schema";
import { generateId } from "@digi/shared/utils";
import { type Context } from "../../context.js";

function requireAdmin(ctx: Context) {
  if (!ctx.user) throw new Error("Unauthorized");
  if (ctx.user.role !== "admin") throw new Error("Forbidden: admin only");
}

interface AddProxmoxNodeInput {
  name: string;
  hostname: string;
  port?: number;
  apiTokenId: string;
  apiTokenSecret: string;
  region?: string;
  maxVms?: number;
}

export const serverResolvers = {
  Query: {
    servers: async (_: unknown, __: unknown, ctx: Context) => {
      requireAdmin(ctx);

      const nodes = await ctx.db.query.servers.findMany({
        with: { vms: true },
      });

      return nodes.map((node) => ({
        ...node,
        vmCount: node.vms.length,
      }));
    },

    vmStats: async (
      _: unknown,
      args: { vmId: string },
      ctx: Context
    ) => {
      requireAdmin(ctx);

      const { CacheKeys, CacheTTL } = await import("@digi/redis/cache");
      const cached = await ctx.cache.get(CacheKeys.vmStats(args.vmId));
      if (cached) return cached;

      // TODO: Fetch real stats from Proxmox API via proxmox.service.ts
      const vm = await ctx.db.query.vms.findFirst({
        where: eq(vms.id, args.vmId),
        with: { services: true },
      });

      if (!vm) throw new Error("VM not found");

      const stats = {
        vmId: vm.id,
        cpuUsage: 0,
        memoryUsedMb: 0,
        memoryTotalMb: vm.memoryMb,
        diskUsedGb: 0,
        diskTotalGb: vm.diskGb,
        containerCount: vm.services?.length ?? 0,
        uptime: 0,
      };

      await ctx.cache.set(CacheKeys.vmStats(args.vmId), stats, CacheTTL.VM_STATS);
      return stats;
    },
  },

  Mutation: {
    addProxmoxNode: async (
      _: unknown,
      args: { input: AddProxmoxNodeInput },
      ctx: Context
    ) => {
      requireAdmin(ctx);

      const id = generateId();
      await ctx.db.insert(servers).values({
        id,
        name: args.input.name,
        hostname: args.input.hostname,
        port: args.input.port ?? 8006,
        apiTokenId: args.input.apiTokenId,
        apiTokenSecret: args.input.apiTokenSecret,
        region: args.input.region ?? "uk",
        maxVms: args.input.maxVms ?? 50,
      });

      await ctx.db.insert(auditLogs).values({
        id: generateId(),
        actorId: ctx.user!.id,
        actorType: "admin",
        action: "server.add",
        resourceType: "server",
        resourceId: id,
        metadata: { name: args.input.name, hostname: args.input.hostname },
      });

      return ctx.db.query.servers.findFirst({
        where: eq(servers.id, id),
      });
    },

    removeProxmoxNode: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ) => {
      requireAdmin(ctx);

      await ctx.db.delete(servers).where(eq(servers.id, args.id));

      await ctx.db.insert(auditLogs).values({
        id: generateId(),
        actorId: ctx.user!.id,
        actorType: "admin",
        action: "server.remove",
        resourceType: "server",
        resourceId: args.id,
      });

      return true;
    },
  },
};
