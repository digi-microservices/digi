import { eq } from "drizzle-orm";
import { coupons, auditLogs } from "@digi/db/schema";
import { generateId } from "@digi/shared/utils";
import { type Context } from "../../context.js";

function requireAdmin(ctx: Context) {
  if (!ctx.user) throw new Error("Unauthorized");
  if (ctx.user.role !== "admin") throw new Error("Forbidden: admin only");
}

interface CreateCouponInput {
  code: string;
  type: string;
  amount: number;
  currency?: string;
  expiresAt?: string;
  maxRedemptions?: number;
}

export const couponResolvers = {
  Query: {
    coupons: async (_: unknown, __: unknown, ctx: Context) => {
      requireAdmin(ctx);
      return ctx.db.query.coupons.findMany();
    },
  },

  Mutation: {
    createCoupon: async (
      _: unknown,
      args: { input: CreateCouponInput },
      ctx: Context
    ) => {
      requireAdmin(ctx);

      const id = generateId();

      await ctx.db.insert(coupons).values({
        id,
        code: args.input.code,
        type: args.input.type as "percentage" | "fixed",
        amount: args.input.amount,
        currency: args.input.currency ?? "gbp",
        expiresAt: args.input.expiresAt
          ? new Date(args.input.expiresAt)
          : undefined,
        maxRedemptions: args.input.maxRedemptions,
      });

      // TODO: Create corresponding Stripe coupon

      await ctx.db.insert(auditLogs).values({
        id: generateId(),
        actorId: ctx.user!.id,
        actorType: "admin",
        action: "coupon.create",
        resourceType: "coupon",
        resourceId: id,
        metadata: { code: args.input.code },
      });

      return ctx.db.query.coupons.findFirst({
        where: eq(coupons.id, id),
      });
    },

    deactivateCoupon: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ) => {
      requireAdmin(ctx);

      await ctx.db
        .update(coupons)
        .set({ isActive: false })
        .where(eq(coupons.id, args.id));

      await ctx.db.insert(auditLogs).values({
        id: generateId(),
        actorId: ctx.user!.id,
        actorType: "admin",
        action: "coupon.deactivate",
        resourceType: "coupon",
        resourceId: args.id,
      });

      return ctx.db.query.coupons.findFirst({
        where: eq(coupons.id, args.id),
      });
    },

    deleteCoupon: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ) => {
      requireAdmin(ctx);

      await ctx.db.delete(coupons).where(eq(coupons.id, args.id));

      await ctx.db.insert(auditLogs).values({
        id: generateId(),
        actorId: ctx.user!.id,
        actorType: "admin",
        action: "coupon.delete",
        resourceType: "coupon",
        resourceId: args.id,
      });

      return true;
    },
  },
};
