"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

export interface NavbarProps {
  appLabel?: string;
  logoSrc?: string;
  user?: { email?: string; name?: string; image?: string | null };
  onSignOut?: () => void;
  settingsHref?: string;
  billingHref?: string;
  helpHref?: string;
}

export function Navbar({
  appLabel,
  logoSrc = "/no_background/digi_icon_mark-transparent.png",
  user,
  onSignOut,
  settingsHref = "/settings",
  billingHref = "/billing",
  helpHref = "/docs",
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : "?";

  return (
    <header className="bg-charcoal fixed inset-x-0 top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/[0.06] px-5 backdrop-blur-md">
      {/* Left: Logo + app label */}
      <div className="flex items-center gap-2.5 ml-4">
        <div className="flex h-7 w-7 items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Digi" className="h-5 w-5 object-contain" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">
          Digi
          {appLabel && (
            <span className="ml-1.5 font-normal text-neutral-500">
              {appLabel}
            </span>
          )}
        </span>
      </div>

      {/* Right: Help + user avatar */}
      <div className="flex items-center gap-3 mr-4">
        <a
          href={helpHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg px-2.5 py-1.5 text-xs text-neutral-500 transition hover:bg-white/[0.04] hover:text-neutral-300"
        >
          Help
        </a>

        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex cursor-pointer h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-500/10 text-xs font-semibold text-blue-400 ring-1 ring-blue-500/20 transition hover:ring-blue-500/40"
            >
              {user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    left: "-600%"
                  }}
                  className="absolute top-full mt-2 w-56 rounded-xl border border-white/[0.08] bg-neutral-900 py-1 shadow-xl"
                >
                  <div className="border-b border-white/[0.06] px-4 py-3">
                    <p className="truncate text-sm font-medium text-white">
                      {user.name || "User"}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {user.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href={settingsHref}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-400 transition hover:bg-white/[0.04] hover:text-white"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link
                      href={billingHref}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-400 transition hover:bg-white/[0.04] hover:text-white"
                    >
                      <CreditCardIcon className="h-4 w-4" />
                      Billing
                    </Link>
                  </div>
                  {onSignOut && (
                    <div className="border-t border-white/[0.06] py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onSignOut();
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-neutral-400 transition hover:bg-white/[0.04] hover:text-red-400"
                      >
                        <SignOutIcon className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
      />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
      />
    </svg>
  );
}
