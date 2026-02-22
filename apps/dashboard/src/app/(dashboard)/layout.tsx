"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "~/components/sidebar";
import { authClient } from "~/lib/auth-client";
import { Navbar, AppFooter } from "@digi/ui";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string; image?: string | null } | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient
      .getSession()
      .then((session) => {
        if (!session.data?.user) {
          router.push("/login");
          return;
        }
        setUser({
          email: session.data.user.email,
          name: session.data.user.name,
          image: session.data.user.image,
        });
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  async function handleSignOut() {
    try {
      await authClient.signOut();
    } catch {
      // Ignore sign-out errors — redirect regardless
    }
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} onSignOut={handleSignOut} />
      <Sidebar />
      <main className="flex-1 pl-56 pt-14">
        <div className="p-10">{children}</div>
      </main>
      <div className="pl-56">
        <AppFooter />
      </div>
    </div>
  );
}
