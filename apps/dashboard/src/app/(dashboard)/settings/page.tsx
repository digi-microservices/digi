"use client";

import { useEffect, useState } from "react";
import { gql } from "~/lib/graphql";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gql<{ me: User }>(`query { me { id name email createdAt } }`)
      .then((data) => setUser(data.me))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-white">Account Settings</h1>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Name</label>
            <p className="text-white">{user?.name}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Email</label>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Member since</label>
            <p className="text-white">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
