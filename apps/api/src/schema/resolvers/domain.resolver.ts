import { eq } from "drizzle-orm";
import { platformDomains, auditLogs } from "@digi/db/schema";
import { generateId } from "@digi/shared/utils";
import { CacheKeys, CacheTTL } from "@digi/redis/cache";
import { type Context } from "../../context";

function requireAdmin(ctx: Context) {
  if (!ctx.user) throw new Error("Unauthorized");
  if (ctx.user.role !== "admin") throw new Error("Forbidden: admin only");
}

interface AddDomainInput {
  domain: string;
  cloudflareZoneId: string;
  isDefault?: boolean;
}

export const domainResolvers = {
  Query: {
    domains: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const cached = await ctx.cache.get(CacheKeys.domainList());
      if (cached) return cached;

      const result = await ctx.db.query.platformDomains.findMany();

      await ctx.cache.set(CacheKeys.domainList(), result, CacheTTL.DOMAIN_LIST);
      return result;
    },
  },

  Mutation: {
    addDomain: async (
      _: unknown,
      args: { input: AddDomainInput },
      ctx: Context,
    ) => {
      requireAdmin(ctx);

      const id = generateId("dom");

      // If setting as default, unset current default
      if (args.input.isDefault) {
        const current = await ctx.db.query.platformDomains.findFirst({
          where: eq(platformDomains.isDefault, true),
        });
        if (current) {
          await ctx.db
            .update(platformDomains)
            .set({ isDefault: false })
            .where(eq(platformDomains.id, current.id));
        }
      }

      await ctx.db.insert(platformDomains).values({
        id,
        domain: args.input.domain,
        cloudflareZoneId: args.input.cloudflareZoneId,
        isDefault: args.input.isDefault ?? false,
      });

      await ctx.db.insert(auditLogs).values({
        id: generateId("log"),
        actorId: ctx.user!.id,
        actorType: "admin",
        action: "domain.add",
        resourceType: "domain",
        resourceId: id,
        metadata: { domain: args.input.domain },
      });

      await ctx.cache.del(CacheKeys.domainList());

      return ctx.db.query.platformDomains.findFirst({
        where: eq(platformDomains.id, id),
      });
    },

    removeDomain: async (_: unknown, args: { id: string }, ctx: Context) => {
      requireAdmin(ctx);

      await ctx.db
        .delete(platformDomains)
        .where(eq(platformDomains.id, args.id));

      await ctx.db.insert(auditLogs).values({
        id: generateId("log"),
        actorId: ctx.user!.id,
        actorType: "admin",
        action: "domain.remove",
        resourceType: "domain",
        resourceId: args.id,
      });

      await ctx.cache.del(CacheKeys.domainList());
      return true;
    },

    setDomainDefault: async (
      _: unknown,
      args: { id: string },
      ctx: Context,
    ) => {
      requireAdmin(ctx);

      // Unset all defaults
      await ctx.db.update(platformDomains).set({ isDefault: false });

      // Set new default
      await ctx.db
        .update(platformDomains)
        .set({ isDefault: true })
        .where(eq(platformDomains.id, args.id));

      await ctx.cache.del(CacheKeys.domainList());

      return ctx.db.query.platformDomains.findFirst({
        where: eq(platformDomains.id, args.id),
      });
    },
  },
};
