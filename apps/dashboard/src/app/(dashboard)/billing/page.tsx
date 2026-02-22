"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { gql } from "~/lib/graphql";
import { fadeInUp, staggerContainer, staggerItem } from "~/lib/animations";

interface Plan {
  id: string;
  name: string;
  diskGb: number;
  maxServices: number;
  priceMonthPence: number;
}

interface Subscription {
  id: string;
  planId: string;
  plan: Plan | null;
  status: string;
  stripeCustomerId: string | null;
  extraStorageGb: number;
  currentPeriodEnd: string | null;
}

interface MeData {
  subscription: Subscription | null;
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated! Welcome to Pro.");
    } else if (searchParams.get("cancelled") === "true") {
      toast("Checkout cancelled.");
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      gql<{ me: MeData }>(`
        query {
          me {
            subscription {
              id
              planId
              plan { id name diskGb maxServices priceMonthPence }
              status
              stripeCustomerId
              extraStorageGb
              currentPeriodEnd
            }
          }
        }
      `),
      gql<{ plans: Plan[] }>(`
        query { plans { id name diskGb maxServices priceMonthPence } }
      `),
    ])
      .then(([meData, plansData]) => {
        setSub(meData.me.subscription);
        setPlans(plansData.plans);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(planId: string) {
    setUpgrading(true);
    try {
      const data = await gql<{ createCheckoutSession: { url: string } }>(`
        mutation($planId: String!) {
          createCheckoutSession(planId: $planId) { url }
        }
      `, { planId });
      window.location.href = data.createCheckoutSession.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
      setUpgrading(false);
    }
  }

  async function handleManageBilling() {
    setManagingBilling(true);
    try {
      const data = await gql<{ createCustomerPortalSession: { url: string } }>(`
        mutation { createCustomerPortalSession { url } }
      `);
      window.location.href = data.createCustomerPortalSession.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open billing portal");
      setManagingBilling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const currentPlan = sub?.plan;
  const isPro = currentPlan && currentPlan.priceMonthPence > 0;
  const isExpired = sub?.status === "cancelled" || sub?.status === "past_due";
  const totalDisk = (currentPlan?.diskGb ?? 16) + (sub?.extraStorageGb ?? 0);

  // Separate free and paid plans
  const freePlan = plans.find((p) => p.priceMonthPence === 0);
  const paidPlans = plans.filter((p) => p.priceMonthPence > 0);

  return (
    <div className="mx-auto max-w-2xl">
      <motion.h1 {...fadeInUp} className="mb-8 text-2xl font-bold text-white">
        Billing
      </motion.h1>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Expired plan warning */}
        {isExpired && (
          <motion.div
            variants={staggerItem}
            className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-400"
          >
            Your plan has expired. Services have been paused. Upgrade to resume
            or downgrade to Free tier limits.
          </motion.div>
        )}

        {/* Current Plan */}
        <motion.section
          variants={staggerItem}
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">
            Current Plan
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">
                  {currentPlan?.name ?? "Free"}
                </p>
                {sub?.status && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      sub.status === "active"
                        ? "bg-green-500/10 text-green-400"
                        : sub.status === "past_due"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {sub.status === "active"
                      ? "Active"
                      : sub.status === "past_due"
                        ? "Past Due"
                        : "Cancelled"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                {isPro
                  ? `${currentPlan.diskGb} GB storage · ${currentPlan.maxServices} services · Custom domains`
                  : `${freePlan?.diskGb ?? 16} GB storage · ${freePlan?.maxServices ?? 3} services`}
              </p>
            </div>
            {isPro && sub?.stripeCustomerId && (
              <button
                onClick={handleManageBilling}
                disabled={managingBilling}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {managingBilling ? "Opening..." : "Manage Billing"}
              </button>
            )}
          </div>
        </motion.section>

        {/* Plans comparison */}
        <motion.section variants={staggerItem}>
          <h2 className="mb-4 text-lg font-semibold text-white">Plans</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Free plan */}
            {freePlan && (
              <div
                className={`rounded-xl border p-5 ${
                  !isPro
                    ? "border-blue-500/50 bg-blue-500/[0.03]"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {freePlan.name}
                  </h3>
                  {!isPro && (
                    <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                      Current
                    </span>
                  )}
                </div>
                <p className="mb-4 text-2xl font-bold text-white">Free</p>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-green-400" />
                    {freePlan.diskGb} GB storage
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-green-400" />
                    {freePlan.maxServices} services
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-green-400" />
                    Community support
                  </li>
                </ul>
              </div>
            )}

            {/* Paid plans */}
            {paidPlans.map((plan) => {
              const isCurrent = currentPlan?.id === plan.id && !isExpired;
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-5 ${
                    isCurrent
                      ? "border-blue-500/50 bg-blue-500/[0.03]"
                      : "border-white/[0.08] bg-white/[0.02]"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mb-4 text-2xl font-bold text-white">
                    £{(plan.priceMonthPence / 100).toFixed(2)}
                    <span className="text-sm font-normal text-neutral-500">
                      /mo
                    </span>
                  </p>
                  <ul className="mb-5 space-y-2 text-sm text-neutral-400">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-green-400" />
                      {plan.diskGb} GB storage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-green-400" />
                      {plan.maxServices} services
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-green-400" />
                      Custom domains & SSL
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-green-400" />
                      Priority support
                    </li>
                  </ul>
                  {!isCurrent && (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgrading}
                      className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
                    >
                      {upgrading
                        ? "Redirecting..."
                        : isExpired
                          ? "Re-subscribe"
                          : "Upgrade"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Storage */}
        <motion.section
          variants={staggerItem}
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Storage</h2>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-3xl font-bold text-white">
              {totalDisk} GB
            </span>
            <span className="text-sm text-neutral-500">per VM</span>
          </div>
          {sub?.extraStorageGb ? (
            <p className="text-sm text-neutral-400">
              {currentPlan?.diskGb ?? 16} GB base + {sub.extraStorageGb} GB
              extra
            </p>
          ) : null}
        </motion.section>

        {/* Billing Period */}
        {sub?.currentPeriodEnd && (
          <motion.section
            variants={staggerItem}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6"
          >
            <h2 className="mb-2 text-lg font-semibold text-white">
              Billing Period
            </h2>
            <p className="text-sm text-neutral-400">
              Current period ends{" "}
              <span className="text-white">
                {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </span>
            </p>
          </motion.section>
        )}
      </motion.div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
