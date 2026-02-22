"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { gql } from "~/lib/graphql";
import { ServiceCard } from "~/components/service-card";
import { fadeInUp, staggerContainer, staggerItem, scaleIn } from "~/lib/animations";

interface Service {
  id: string;
  name: string;
  status: string;
  subdomain: string;
  createdAt: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [downgradingId, setDowngradingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      gql<{ services: Service[] }>(`
        query Services {
          services { id name status subdomain createdAt }
        }
      `),
      gql<{ me: { subscription: { status: string } | null } }>(`
        query { me { subscription { status } } }
      `),
    ])
      .then(([svcData, meData]) => {
        setServices(svcData.services);
        setSubStatus(meData.me.subscription?.status ?? null);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const isExpired = subStatus === "cancelled" || subStatus === "past_due";

  async function handleDowngrade(serviceId: string) {
    setDowngradingId(serviceId);
    try {
      await gql(`
        mutation($serviceId: String!) {
          downgradeToFree(serviceId: $serviceId) { id status }
        }
      `, { serviceId });
      // Update local state
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, status: "created" } : s))
      );
      toast.success("Service downgraded to free tier");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to downgrade");
    } finally {
      setDowngradingId(null);
    }
  }

  return (
    <div>
      <motion.div {...fadeInUp} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white">Services</h1>
          <p className="mt-1 text-sm text-neutral-500">Deploy and manage your microservices.</p>
        </div>
        <Link
          href="/services/new"
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
        >
          New Service
        </Link>
      </motion.div>

      {/* Expired plan warning banner */}
      {!loading && isExpired && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3"
        >
          <p className="text-sm text-amber-400">
            Your plan has expired. Services have been paused. Upgrade to resume or downgrade to Free tier limits.
          </p>
          <Link
            href="/billing"
            className="ml-4 shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-black transition hover:bg-amber-400"
          >
            View Plans
          </Link>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </motion.div>
        )}

        {!loading && error && (
          <motion.div
            key="error"
            {...scaleIn}
            className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400"
          >
            Failed to load services: {error}
          </motion.div>
        )}

        {!loading && !error && services.length === 0 && (
          <motion.div
            key="empty"
            {...scaleIn}
            className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] py-24"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-neutral-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 0 0-.12-1.03l-2.268-9.64a3.375 3.375 0 0 0-3.285-2.602H7.923a3.375 3.375 0 0 0-3.285 2.602l-2.268 9.64a4.5 4.5 0 0 0-.12 1.03v.228m19.5 0a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3m19.5 0a3 3 0 0 0-3-3H5.25a3 3 0 0 0-3 3m16.5 0h.008v.008h-.008v-.008Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-300">No services yet</p>
            <p className="mt-1 text-xs text-neutral-600">Deploy your first microservice to get started.</p>
            <Link
              href="/services/new"
              className="mt-5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
            >
              Create your first service
            </Link>
          </motion.div>
        )}

        {!loading && !error && services.length > 0 && (
          <motion.div
            key="grid"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {services.map((service) => (
              <motion.div key={service.id} variants={staggerItem}>
                <ServiceCard {...service} />
                {isExpired && service.status === "stopped" && (
                  <button
                    onClick={() => handleDowngrade(service.id)}
                    disabled={downgradingId === service.id}
                    className="mt-2 w-full rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {downgradingId === service.id ? "Downgrading..." : "Downgrade to Free"}
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
