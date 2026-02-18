import Stripe from "stripe";
import { env } from "../env.js";

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe not configured");
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export async function createCheckoutSession(
  customerEmail: string,
  priceId: string,
  metadata: Record<string, string>
): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `http://localhost:3001/billing?success=true`,
    cancel_url: `http://localhost:3001/billing?cancelled=true`,
    metadata,
  });
  return { url: session.url!, sessionId: session.id };
}

export async function createCustomer(
  email: string,
  name: string
): Promise<string> {
  const stripe = getStripe();
  const customer = await stripe.customers.create({ email, name });
  return customer.id;
}

export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.cancel(subscriptionId);
}

export async function createStripeCoupon(opts: {
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration: "once" | "repeating" | "forever";
  durationInMonths?: number;
  maxRedemptions?: number;
}): Promise<string> {
  const stripe = getStripe();
  const coupon = await stripe.coupons.create({
    percent_off: opts.percentOff,
    amount_off: opts.amountOff,
    currency: opts.currency ?? "gbp",
    duration: opts.duration,
    duration_in_months: opts.durationInMonths,
    max_redemptions: opts.maxRedemptions,
  });
  return coupon.id;
}

export async function deleteStripeCoupon(couponId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.coupons.del(couponId);
}

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    body,
    signature,
    env.STRIPE_WEBHOOK_SECRET!
  );
}
