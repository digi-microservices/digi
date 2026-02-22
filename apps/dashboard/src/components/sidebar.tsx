"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { gql } from "~/lib/graphql";

interface ServiceItem {
  id: string;
  name: string;
  status: string;
}

const statusColors: Record<string, string> = {
  running: "bg-green-500",
  deploying: "bg-yellow-500",
  stopped: "bg-neutral-500",
  error: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  running: "Running",
  deploying: "Deploying",
  stopped: "Stopped",
  error: "Error",
};

export function Sidebar() {
  const pathname = usePathname();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [servicesOpen, setServicesOpen] = useState(true);

  useEffect(() => {
    gql<{ services: ServiceItem[] }>(`
      query { services { id name status } }
    `)
      .then((data) => setServices(data.services))
      .catch(() => {});
  }, []);

  const runningCount = services.filter((s) => s.status === "running").length;
  const errorCount = services.filter((s) => s.status === "error").length;

  return (
    <aside className="fixed left-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] w-56 flex-col border-r border-white/[0.06] bg-charcoal">
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* ── Main navigation ── */}
        <div className="space-y-0.5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Navigation</p>

          {/* Services link */}
          <div>
            <Link
              href="/services"
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                pathname === "/services" || pathname === "/services/new"
                  ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                  : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-200"
              }`}
            >
              <ServerIcon className={`h-4 w-4 shrink-0 ${pathname === "/services" || pathname === "/services/new" ? "text-blue-400" : "text-neutral-600"}`} />
              Services
              {services.length > 0 && (
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-neutral-400">
                    {services.length}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setServicesOpen(!servicesOpen);
                    }}
                    className="text-neutral-600 hover:text-neutral-400"
                  >
                    <ChevronIcon className={`h-3.5 w-3.5 transition ${servicesOpen ? "rotate-90" : ""}`} />
                  </button>
                </span>
              )}
            </Link>

            {/* Collapsible services list */}
            <AnimatePresence initial={false}>
              {servicesOpen && services.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-4 mt-1 overflow-hidden border-l border-white/[0.06] pl-3"
                >
                  <div className="space-y-0.5">
                    {services.map((svc) => {
                      const svcActive = pathname === `/services/${svc.id}` || pathname.startsWith(`/services/${svc.id}/`);
                      return (
                        <Link
                          key={svc.id}
                          href={`/services/${svc.id}`}
                          className={`group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                            svcActive
                              ? "bg-white/[0.04] text-blue-400"
                              : "text-neutral-500 hover:bg-white/[0.02] hover:text-neutral-300"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColors[svc.status] ?? "bg-neutral-600"}`} title={statusLabels[svc.status] ?? svc.status} />
                          <span className="truncate">{svc.name}</span>
                        </Link>
                      );
                    })}
                    <Link
                      href="/services/new"
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                        pathname === "/services/new"
                          ? "text-blue-400"
                          : "text-neutral-600 hover:text-neutral-400"
                      }`}
                    >
                      <PlusIcon className="h-3 w-3" />
                      New service
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Billing */}
          <Link
            href="/billing"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
              pathname.startsWith("/billing")
                ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-200"
            }`}
          >
            <CreditCardIcon className={`h-4 w-4 shrink-0 ${pathname.startsWith("/billing") ? "text-blue-400" : "text-neutral-600"}`} />
            Billing
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
              pathname === "/settings"
                ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-200"
            }`}
          >
            <GearIcon className={`h-4 w-4 shrink-0 ${pathname === "/settings" ? "text-blue-400" : "text-neutral-600"}`} />
            Settings
          </Link>
        </div>

        {/* ── Developer section ── */}
        <div className="mt-6 space-y-0.5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Developer</p>

          <Link
            href="/settings/tokens"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
              pathname.startsWith("/settings/tokens")
                ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-200"
            }`}
          >
            <KeyIcon className={`h-4 w-4 shrink-0 ${pathname.startsWith("/settings/tokens") ? "text-blue-400" : "text-neutral-600"}`} />
            API Tokens
          </Link>

          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-neutral-500 transition hover:bg-white/[0.04] hover:text-neutral-200"
          >
            <BookIcon className="h-4 w-4 shrink-0 text-neutral-600" />
            Docs
          </a>
        </div>

        {/* ── Status summary ── */}
        {services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Status</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Running
                </span>
                <span className="tabular-nums text-neutral-300">{runningCount}</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    Errors
                  </span>
                  <span className="tabular-nums text-red-400">{errorCount}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Total</span>
                <span className="tabular-nums text-neutral-300">{services.length}</span>
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </aside>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 0 0-.12-1.03l-2.268-9.64a3.375 3.375 0 0 0-3.285-2.602H7.923a3.375 3.375 0 0 0-3.285 2.602l-2.268 9.64a4.5 4.5 0 0 0-.12 1.03v.228m19.5 0a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3m19.5 0a3 3 0 0 0-3-3H5.25a3 3 0 0 0-3 3m16.5 0h.008v.008h-.008v-.008Zm-3 0h.008v.008h-.008v-.008Z" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
