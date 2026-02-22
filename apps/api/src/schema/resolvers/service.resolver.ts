import { eq, and } from "drizzle-orm";
import {
  services,
  containers,
  deployments,
  customDomains,
  platformDomains,
  jobs,
} from "@digi/db/schema";
import { generateId, generateSubdomain } from "@digi/shared/utils";
import { CacheKeys, CacheTTL } from "@digi/redis/cache";
import { Channels } from "@digi/redis/pubsub";
import { type Context } from "../../context";
import { generateContainerSubdomain } from "@digi/shared/utils";

interface CreateServiceInput {
  name: string;
  sourceType: string;
  gitUrl?: string;
  branch?: string;
  dockerImage?: string;
  dockerPort?: number;
  internalPort?: number;
  platformDomainId?: string;
  customDomain?: string;
  containers: Array<{
    type: string;
    name: string;
    dockerImage?: string;
    envVars?: Record<string, string>;
    resourceLimits?: Record<string, string>;
    internalPort?: number;
  }>;
  envVars?: Record<string, string>;
}

interface UpdateServiceInput {
  name?: string;
  branch?: string;
  envVars?: Record<string, string>;
}

export const serviceResolvers = {
  Query: {
    services: async (_: unknown, args: { userId?: string }, ctx: Context) => {
      // console.log(ctx)
      if (!ctx.user) throw new Error("Unauthorized");

      const userId =
        ctx.user.role === "admin" && args.userId ? args.userId : ctx.user.id;

      // Check cache
      const cached = await ctx.cache.get(CacheKeys.userServices(userId));
      if (cached) return cached;

      const result = await ctx.db.query.services.findMany({
        where: eq(services.userId, userId),
        with: { containers: true },
      });

      await ctx.cache.set(
        CacheKeys.userServices(userId),
        result,
        CacheTTL.USER_SERVICES,
      );

      return result;
    },

    service: async (_: unknown, args: { id: string }, ctx: Context) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const result = await ctx.db.query.services.findFirst({
        where: eq(services.id, args.id),
        with: {
          containers: true,
          deployments: true,
          customDomains: true,
        },
      });

      if (!result) throw new Error("Service not found");
      if (result.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return result;
    },
  },

  Mutation: {
    createService: async (
      _: unknown,
      args: { input: CreateServiceInput },
      ctx: Context,
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { input } = args;

      // Select platform domain (fewest services)
      let domainId = input.platformDomainId;
      if (!domainId) {
        const domain = await ctx.db.query.platformDomains.findFirst({
          orderBy: (d, { asc }) => [asc(d.serviceCount)],
        });
        if (domain) domainId = domain.id;
      }

      const subdomain = generateSubdomain(input.name);
      const serviceId = generateId("svc");

      const platformDomain = domainId
        ? await ctx.db.query.platformDomains.findFirst({
            where: eq(platformDomains.id, domainId),
          })
        : null;

      const publicUrl = platformDomain
        ? `https://${subdomain}.${platformDomain.domain}`
        : `https://${subdomain}.localhost`;

      const dashboardUrl = `http://localhost:3001/services/${serviceId}`;
      console.log(input);
      // Create service
      await ctx.db.insert(services).values({
        id: serviceId,
        userId: ctx.user.id,
        name: input.name,
        subdomain,
        platformDomainId: domainId,
        sourceType: input.sourceType as "github" | "docker",
        gitUrl: input.gitUrl,
        branch: input.branch ?? "main",
        dockerImage: input.dockerImage,
        envVars: input.envVars ?? {},
        publicUrl,
        dashboardUrl,
      });

      // Create containers
      for (const c of input.containers) {
        const containerSubdomain =
          c.type === "app"
            ? subdomain
            : generateContainerSubdomain(subdomain, c.type);

        await ctx.db.insert(containers).values({
          id: generateId("ctr"),
          serviceId,
          type: c.type as "app" | "postgres" | "redis" | "docker",
          name: c.name,
          subdomain: containerSubdomain,
          dockerImage: c.dockerImage,
          internalPort: c.internalPort,
          envVars: c.envVars ?? {},
          resourceLimits: c.resourceLimits ?? {},
        });
      }

      // Update domain service count
      if (domainId) {
        const domain = await ctx.db.query.platformDomains.findFirst({
          where: eq(platformDomains.id, domainId),
        });
        if (domain) {
          await ctx.db
            .update(platformDomains)
            .set({ serviceCount: domain.serviceCount + 1 })
            .where(eq(platformDomains.id, domainId));
        }
      }

      // Invalidate cache
      await ctx.cache.del(CacheKeys.userServices(ctx.user.id));
      await ctx.cache.del(CacheKeys.domainList());

      const result = await ctx.db.query.services.findFirst({
        where: eq(services.id, serviceId),
        with: { containers: true },
      });

      return result;
    },

    deleteService: async (_: unknown, args: { id: string }, ctx: Context) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const service = await ctx.db.query.services.findFirst({
        where: eq(services.id, args.id),
      });

      if (!service) throw new Error("Service not found");
      if (service.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      // Queue destroy job
      const jobId = generateId("job");
      await ctx.db.insert(jobs).values({
        id: jobId,
        type: "destroy",
        payload: { serviceId: args.id },
      });
      await ctx.pubsub.publish(Channels.jobNew(), {
        id: jobId,
        type: "destroy",
      });

      // Update status
      await ctx.db
        .update(services)
        .set({ status: "destroying" })
        .where(eq(services.id, args.id));

      // Invalidate cache
      await ctx.cache.del(CacheKeys.userServices(ctx.user.id));
      await ctx.cache.del(CacheKeys.domainList());

      return true;
    },

    updateService: async (
      _: unknown,
      args: { id: string; input: UpdateServiceInput },
      ctx: Context,
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const service = await ctx.db.query.services.findFirst({
        where: eq(services.id, args.id),
      });

      if (!service) throw new Error("Service not found");
      if (service.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const updates: Record<string, unknown> = {};
      if (args.input.name) updates.name = args.input.name;
      if (args.input.branch) updates.branch = args.input.branch;
      if (args.input.envVars) updates.envVars = args.input.envVars;
      updates.updatedAt = new Date();

      await ctx.db
        .update(services)
        .set(updates)
        .where(eq(services.id, args.id));

      await ctx.cache.del(CacheKeys.userServices(ctx.user.id));

      return ctx.db.query.services.findFirst({
        where: eq(services.id, args.id),
        with: { containers: true },
      });
    },

    deployService: async (
      _: unknown,
      args: { serviceId: string },
      ctx: Context,
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const service = await ctx.db.query.services.findFirst({
        where: eq(services.id, args.serviceId),
      });

      if (!service) throw new Error("Service not found");
      if (service.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const deploymentId = generateId("dpl");
      const jobId = generateId("job");

      // Create deployment record
      await ctx.db.insert(deployments).values({
        id: deploymentId,
        serviceId: args.serviceId,
        userId: ctx.user.id,
        status: "queued",
      });

      // Queue deploy job
      await ctx.db.insert(jobs).values({
        id: jobId,
        type: "deploy",
        payload: { serviceId: args.serviceId, deploymentId },
      });
      await ctx.pubsub.publish(Channels.jobNew(), {
        id: jobId,
        type: "deploy",
      });

      // Update service status
      await ctx.db
        .update(services)
        .set({ status: "deploying", currentDeploymentId: deploymentId })
        .where(eq(services.id, args.serviceId));

      return ctx.db.query.deployments.findFirst({
        where: eq(deployments.id, deploymentId),
      });
    },

    setEnvVars: async (
      _: unknown,
      args: {
        serviceId: string;
        containerId?: string;
        vars: Record<string, string>;
      },
      ctx: Context,
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      if (args.containerId) {
        await ctx.db
          .update(containers)
          .set({ envVars: args.vars })
          .where(
            and(
              eq(containers.id, args.containerId),
              eq(containers.serviceId, args.serviceId),
            ),
          );
      } else {
        await ctx.db
          .update(services)
          .set({ envVars: args.vars })
          .where(eq(services.id, args.serviceId));
      }

      return true;
    },
  },

  Subscription: {
    containerLogs: {
      subscribe: async function* (
        _: unknown,
        args: { serviceId: string; containerId: string },
        ctx: Context,
      ) {
        const channel = Channels.containerLogs(
          args.serviceId,
          args.containerId,
        );
        const messages: unknown[] = [];
        let resolve: (() => void) | null = null;

        const unsub = await ctx.pubsub.subscribe(channel, (msg) => {
          messages.push(msg);
          if (resolve) {
            resolve();
            resolve = null;
          }
        });

        try {
          while (true) {
            if (messages.length === 0) {
              await new Promise<void>((r) => {
                resolve = r;
              });
            }
            while (messages.length > 0) {
              yield { containerLogs: messages.shift() };
            }
          }
        } finally {
          await unsub();
        }
      },
    },
    deploymentStatus: {
      subscribe: async function* (
        _: unknown,
        args: { jobId: string },
        ctx: Context,
      ) {
        const channel = Channels.deploymentStatus(args.jobId);
        const messages: unknown[] = [];
        let resolve: (() => void) | null = null;

        const unsub = await ctx.pubsub.subscribe(channel, (msg) => {
          messages.push(msg);
          if (resolve) {
            resolve();
            resolve = null;
          }
        });

        try {
          while (true) {
            if (messages.length === 0) {
              await new Promise<void>((r) => {
                resolve = r;
              });
            }
            while (messages.length > 0) {
              yield { deploymentStatus: messages.shift() };
            }
          }
        } finally {
          await unsub();
        }
      },
    },
  },
};
