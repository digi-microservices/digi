"use client";

import { GlobeIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { authClient } from "~/lib/auth-client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDiscordLogin() {
    setError("");
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "discord",
        callbackURL: "/tickets",
      });
    } catch (err) {
      setError("Failed to sign in with Discord. Please try again.");
      setLoading(false);
    }
  }

  return (
  

    <>
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Digi Support
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Manage your tickets and view your support history. Sign in with your
          Discord account to get started.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <button
          onClick={handleDiscordLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <GlobeIcon className="h-5 w-5" />
          )}
          {loading ? "Signing in…" : "Sign in with Discord"}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-neutral-600">
        Need help?{" "}
        <a href="https://docs.digi.bnhm.dev" className="hover:text-neutral-400">
          docs.digi.bnhm.dev
        </a>
      </p>
    </>
  );
}
