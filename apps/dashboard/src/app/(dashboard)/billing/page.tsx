"use client";

import { useEffect, useState } from "react";
import { gql } from "~/lib/graphql";

interface Subscription {
  planId: string;
  planName: string;
  status: string;
  diskGb: number;
  extraStorageGb: number;
  currentPeriodEnd: string | null;
}

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [addingStorage, setAddingStorage] = useState(false);

  useEffect(() => {
    gql<{ mySubscription: Subscription | null }>(`
      query { mySubscription { planId planName status diskGb extraStorageGb currentPeriodEnd } }
    `)
      .then((data) => setSub(data.mySubscription))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const data = await gql<{ createCheckoutSession: { url: string } }>(`
        mutation { createCheckoutSession { url } }
      `);
      window.location.href = data.createCheckoutSession.url;
    } catch (err) {
      console.error(err);
      setUpgrading(false);
    }
  }

  async function handleAddStorage() {
    setAddingStorage(true);
    try {
      const data = await gql<{ upgradeStorage: { url: string } }>(`
        mutation { upgradeStorage { url } }
      `);
      window.location.href = data.upgradeStorage.url;
    } catch (err) {
      console.error(err);
      setAddingStorage(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const isPro = sub?.planName === "Pro";
  const totalDisk = (sub?.diskGb ?? 16) + (sub?.extraStorageGb ?? 0);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-white">Billing</h1>

      {/* Current Plan */}
      <section className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">{sub?.planName ?? "Free"}</p>
            <p className="text-sm text-neutral-400">
              {isPro ? "Paid plan with custom domains" : "Free tier — 16 GB storage, 3 services"}
            </p>
          </div>
          {!isPro && (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
            >
              {upgrading ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          )}
        </div>
      </section>

      {/* Storage */}
      <section className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Storage</h2>
        <div className="mb-2 flex items-end justify-between">
          <span className="text-3xl font-bold text-white">{totalDisk} GB</span>
          <span className="text-sm text-neutral-500">per VM</span>
        </div>
        {sub?.extraStorageGb ? (
          <p className="mb-4 text-sm text-neutral-400">
            {sub.diskGb} GB base + {sub.extraStorageGb} GB extra
          </p>
        ) : null}
        {isPro && (
          <button
            onClick={handleAddStorage}
            disabled={addingStorage}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {addingStorage ? "Redirecting..." : "Add 32 GB (+£5/mo)"}
          </button>
        )}
      </section>

      {/* Billing Period */}
      {sub?.currentPeriodEnd && (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">Billing Period</h2>
          <p className="text-sm text-neutral-400">
            Current period ends{" "}
            <span className="text-white">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
          </p>
        </section>
      )}
    </div>
  );
}
