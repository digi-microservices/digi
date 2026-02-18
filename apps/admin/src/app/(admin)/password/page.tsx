"use client";

import { useEffect, useState } from "react";
import { graphqlClient } from "~/lib/graphql";

interface PasswordInfo {
  currentPassword: string;
  rotatesAt: string;
  lastRotatedAt: string;
}

export default function PasswordPage() {
  const [info, setInfo] = useState<PasswordInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    graphqlClient<{ adminPassword: PasswordInfo }>(`
      query { adminPassword { currentPassword rotatesAt lastRotatedAt } }
    `)
      .then((res) => {
        if (res.data) setInfo(res.data.adminPassword);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleCopy() {
    if (info) {
      navigator.clipboard.writeText(info.currentPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-white">Admin Password</h1>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="mb-4 text-sm text-neutral-400">
          The admin password rotates every 24 hours. Copy it before it changes.
        </p>

        {info && (
          <>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-neutral-500">Current Password</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white">
                  {visible ? info.currentPassword : "•".repeat(32)}
                </code>
                <button
                  onClick={() => setVisible(!visible)}
                  className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  {visible ? "Hide" : "Show"}
                </button>
                <button
                  onClick={handleCopy}
                  className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Last rotated</span>
                <span className="text-neutral-300">{new Date(info.lastRotatedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Next rotation</span>
                <span className="text-neutral-300">{new Date(info.rotatesAt).toLocaleString()}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
