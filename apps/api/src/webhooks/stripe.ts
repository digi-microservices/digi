import { eq, and } from "drizzle-orm";
import { subscriptions, services } from "@digi/db/schema";
import { type Database } from "@digi/db";
import { type Cache } from "@digi/redis/cache";
import { CacheKeys } from "@digi/redis/cache";
import { constructWebhookEvent } from "../services/stripe.service";

async function pauseUserServices(db: Database, userId: string) {
  const runningServices = await db.query.services.findMany({
    where: and(eq(services.userId, userId), eq(services.status, "running")),
  });

  for (const svc of runningServices) {
    await db
      .update(services)
      .set({ status: "stopped", updatedAt: new Date() })
      .where(eq(services.id, svc.id));
  }

  return runningServices.length;
}

export function createStripeWebhookHandler(db: Database, cache: Cache) {
  return async (request: Request): Promise<Response> => {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    try {
      const event = constructWebhookEvent(body, signature);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as {
            metadata?: { userId?: string; planId?: string };
            customer?: string;
            subscription?: string;
          };

          if (session.metadata?.userId && session.metadata?.planId) {
            const { generateId } = await import("@digi/shared/utils");

            // Check if subscription exists
            const existing = await db.query.subscriptions.findFirst({
              where: eq(subscriptions.userId, session.metadata.userId),
            });

            if (existing) {
              await db
                .update(subscriptions)
                .set({
                  planId: session.metadata.planId,
                  stripeCustomerId: session.customer as string,
                  stripeSubscriptionId: session.subscription as string,
                  status: "active",
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.id, existing.id));
            } else {
              await db.insert(subscriptions).values({
                id: generateId("sub"),
                userId: session.metadata.userId,
                planId: session.metadata.planId,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                status: "active",
              });
            }

            await cache.del(
              CacheKeys.userSubscription(session.metadata.userId),
            );
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as {
            id: string;
            status: string;
            current_period_start: number;
            current_period_end: number;
          };

          const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscription.id),
          });

          if (sub) {
            await db
              .update(subscriptions)
              .set({
                status: subscription.status as
                  | "active"
                  | "past_due"
                  | "cancelled",
                currentPeriodStart: new Date(
                  subscription.current_period_start * 1000,
                ),
                currentPeriodEnd: new Date(
                  subscription.current_period_end * 1000,
                ),
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, sub.id));

            // Auto-pause services when subscription becomes past_due or cancelled
            if (
              subscription.status === "past_due" ||
              subscription.status === "cancelled"
            ) {
              await pauseUserServices(db, sub.userId);
            }

            await cache.del(CacheKeys.userSubscription(sub.userId));
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as { id: string };

          const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscription.id),
          });

          if (sub) {
            await db
              .update(subscriptions)
              .set({ status: "cancelled", updatedAt: new Date() })
              .where(eq(subscriptions.id, sub.id));

            // Auto-pause all running services
            await pauseUserServices(db, sub.userId);

            await cache.del(CacheKeys.userSubscription(sub.userId));
          }
          break;
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[STRIPE WEBHOOK ERROR]", err);
      return new Response("Webhook error", { status: 400 });
    }
  };
}
