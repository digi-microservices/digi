"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@digi/ui";
import AdminSidebar from "~/components/admin-sidebar";
import { authClient } from "~/lib/auth-client";
import "~/styles/globals.css";

interface AdminShellProps {
  user: { email?: string; name?: string };
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await authClient.signOut();
    } catch {
      // Ignore sign-out errors — redirect regardless
    }
    router.push("/login");
  }

  return (
    <>
      <div className="flex h-14 w-screen">
        <Navbar
          appLabel="Admin"
          user={user}
          onSignOut={handleSignOut}
          settingsHref="/password"
          billingHref="/billing"
        />
      </div>
      <AdminSidebar />
      {children}
    </>
  );
}
