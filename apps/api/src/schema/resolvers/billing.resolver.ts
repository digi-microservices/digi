import { eq } from "drizzle-orm";
import { subscriptions, auditLogs } from "@digi/db/schema";
import { generateId } from "@digi/shared/utils";
import { STORAGE_INCREMENT_GB, STORAGE_INCREMENT_PRICE_PENCE } from "@digi/shared";
import { type Context } from "../../context.js";
import { env } from "../../env.js";

export const billingResolvers = {
  Mutation: {
    createCheckoutSession: async (
      _: unknown,
      args: { planId: string },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      if (!env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe is not configured");
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);

      const plan = await ctx.db.query.plans.findFirst({
        where: (p, { eq }) => eq(p.id, args.planId),
      });

      if (!plan || !plan.stripePriceId) {
        throw new Error("Plan not found or has no Stripe price");
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: ctx.user.email,
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: `http://localhost:3001/billing?success=true`,
        cancel_url: `http://localhost:3001/billing?cancelled=true`,
        metadata: {
          userId: ctx.user.id,
          planId: args.planId,
        },
      });

      return {
        url: session.url!,
        sessionId: session.id,
      };
    },

    upgradeStorage: async (
      _: unknown,
      args: { additionalGb: number },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      if (args.additionalGb % STORAGE_INCREMENT_GB !== 0) {
        throw new Error(
          `Storage must be upgraded in increments of ${STORAGE_INCREMENT_GB}GB`
        );
      }

      const sub = await ctx.db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, ctx.user.id),
      });

      if (!sub) throw new Error("No active subscription");

      const newExtra = sub.extraStorageGb + args.additionalGb;

      await ctx.db
        .update(subscriptions)
        .set({ extraStorageGb: newExtra, updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));

      // TODO: Create Stripe invoice item for additional storage
      // const increments = args.additionalGb / STORAGE_INCREMENT_GB;
      // const additionalCost = increments * STORAGE_INCREMENT_PRICE_PENCE;

      const { CacheKeys } = await import("@digi/redis/cache");
      await ctx.cache.del(CacheKeys.userSubscription(ctx.user.id));

      return true;
    },

    applyCoupon: async (
      _: unknown,
      args: { code: string },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const { coupons } = await import("@digi/db/schema");
      const coupon = await ctx.db.query.coupons.findFirst({
        where: (c, { eq, and }) =>
          and(eq(c.code, args.code), eq(c.isActive, true)),
      });

      if (!coupon) throw new Error("Invalid or expired coupon");

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new Error("Coupon has expired");
      }

      if (
        coupon.maxRedemptions &&
        coupon.timesRedeemed >= coupon.maxRedemptions
      ) {
        throw new Error("Coupon has reached maximum redemptions");
      }

      // Increment redemption count
      await ctx.db
        .update(coupons)
        .set({ timesRedeemed: coupon.timesRedeemed + 1 })
        .where(eq(coupons.id, coupon.id));

      // TODO: Apply coupon to Stripe subscription
      return true;
    },
  },
};
