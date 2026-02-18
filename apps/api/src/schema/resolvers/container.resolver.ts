import { eq, and } from "drizzle-orm";
import { containers, services } from "@digi/db/schema";
import { type Context } from "../../context.js";

export const containerResolvers = {
  Mutation: {
    stopContainer: async (
      _: unknown,
      args: { serviceId: string; containerId: string },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const service = await ctx.db.query.services.findFirst({
        where: eq(services.id, args.serviceId),
      });
      if (!service) throw new Error("Service not found");
      if (service.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      // TODO: Call Docker API to stop the container via docker.service.ts
      await ctx.db
        .update(containers)
        .set({ status: "stopped", updatedAt: new Date() })
        .where(
          and(
            eq(containers.id, args.containerId),
            eq(containers.serviceId, args.serviceId)
          )
        );

      return ctx.db.query.containers.findFirst({
        where: eq(containers.id, args.containerId),
      });
    },

    restartContainer: async (
      _: unknown,
      args: { serviceId: string; containerId: string },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const service = await ctx.db.query.services.findFirst({
        where: eq(services.id, args.serviceId),
      });
      if (!service) throw new Error("Service not found");
      if (service.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      // TODO: Call Docker API to restart the container via docker.service.ts
      await ctx.db
        .update(containers)
        .set({ status: "running", updatedAt: new Date() })
        .where(
          and(
            eq(containers.id, args.containerId),
            eq(containers.serviceId, args.serviceId)
          )
        );

      return ctx.db.query.containers.findFirst({
        where: eq(containers.id, args.containerId),
      });
    },
  },
};
