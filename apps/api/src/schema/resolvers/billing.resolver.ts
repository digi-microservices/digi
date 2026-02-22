import { eq, and } from "drizzle-orm";
import { subscriptions, plans, services } from "@digi/db/schema";
import {
  STORAGE_INCREMENT_GB,
  STORAGE_INCREMENT_PRICE_PENCE,
} from "@digi/shared";
import { type Context } from "../../context";
import { env } from "../../env";

export const billingResolvers = {
  Query: {
    plans: async (_: unknown, _args: unknown, ctx: Context) => {
      return ctx.db.query.plans.findMany({
        where: (p, { eq }) => eq(p.isActive, true),
      });
    },
  },
  Mutation: {
    createCheckoutSession: async (
      _: unknown,
      args: { planId: string },
      ctx: Context,
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
        success_url: `${process.env.DASHBOARD_URL ?? "http://localhost:3001"}/billing?success=true`,
        cancel_url: `${process.env.DASHBOARD_URL ?? "http://localhost:3001"}/billing?cancelled=true`,
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
      ctx: Context,
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      if (args.additionalGb % STORAGE_INCREMENT_GB !== 0) {
        throw new Error(
          `Storage must be upgraded in increments of ${STORAGE_INCREMENT_GB}GB`,
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

    applyCoupon: async (_: unknown, args: { code: string }, ctx: Context) => {
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

    createCustomerPortalSession: async (
      _: unknown,
      _args: unknown,
      ctx: Context,
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      if (!env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe is not configured");
      }

      const sub = await ctx.db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, ctx.user.id),
      });

      if (!sub?.stripeCustomerId) {
        throw new Error("No active subscription with a Stripe customer");
      }

      const { createBillingPortalSession } =
        await import("../../services/stripe.service.js");
      const returnUrl = `${process.env.DASHBOARD_URL ?? "http://localhost:3001"}/billing`;
      const url = await createBillingPortalSession(
        sub.stripeCustomerId,
        returnUrl,
      );

      return { url };
    },

    cancelSubscription: async (_: unknown, _args: unknown, ctx: Context) => {
      if (!ctx.user) throw new Error("Unauthorized");

      if (!env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe is not configured");
      }

      const sub = await ctx.db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, ctx.user.id),
      });

      if (!sub?.stripeSubscriptionId) {
        throw new Error("No active Stripe subscription");
      }

      const { cancelSubscription: stripeCancelSub } =
        await import("../../services/stripe.service.js");
      await stripeCancelSub(sub.stripeSubscriptionId);

      await ctx.db
        .update(subscriptions)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));

      const { CacheKeys } = await import("@digi/redis/cache");
      await ctx.cache.del(CacheKeys.userSubscription(ctx.user.id));

      return true;
    },

    downgradeToFree: async (
      _: unknown,
      args: { serviceId: string },
      ctx: Context,
    ) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const service = await ctx.db.query.services.findFirst({
        where: and(
          eq(services.id, args.serviceId),
          eq(services.userId, ctx.user.id),
        ),
      });

      if (!service) throw new Error("Service not found");

      // Find the free plan
      const freePlan = await ctx.db.query.plans.findFirst({
        where: (p, { eq, and }) =>
          and(eq(p.isActive, true), eq(p.priceMonthPence, 0)),
      });

      // Ensure user has a subscription record (create free one if missing)
      const existingSub = await ctx.db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, ctx.user.id),
      });

      if (!existingSub && freePlan) {
        const { generateId } = await import("@digi/shared/utils");
        await ctx.db.insert(subscriptions).values({
          id: generateId("sub"),
          userId: ctx.user.id,
          planId: freePlan.id,
          status: "active",
        });
      } else if (existingSub && freePlan) {
        await ctx.db
          .update(subscriptions)
          .set({
            planId: freePlan.id,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existingSub.id));
      }

      // Update service status back to running (it was stopped)
      const [updated] = await ctx.db
        .update(services)
        .set({ status: "created", updatedAt: new Date() })
        .where(eq(services.id, service.id))
        .returning();

      const { CacheKeys } = await import("@digi/redis/cache");
      await ctx.cache.del(CacheKeys.userSubscription(ctx.user.id));

      return updated;
    },
  },
};
