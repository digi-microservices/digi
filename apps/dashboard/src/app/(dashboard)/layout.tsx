"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "~/components/sidebar";
import { authClient } from "~/lib/auth-client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient
      .getSession()
      .then((session) => {
        if (!session.data?.user) {
          router.push("/login");
          return;
        }
        setUserEmail(session.data.user.email);
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950">
      <Sidebar userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
