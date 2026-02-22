import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "~/env";
import AdminShell from "~/components/admin-shell";
import { AppFooter } from "@digi/ui";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieHeader = (await headers()).get("cookie") ?? "";

  let sessionUser: { name?: string; email?: string } | null = null;
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/get-session`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (res.ok) {
      const session = (await res.json()) as {
        user?: { name?: string; email?: string; role?: string };
      } | null;
      if (session?.user?.role === "admin") {
        sessionUser = { name: session.user.name, email: session.user.email };
      }
    }
  } catch {
    // network error — deny access
  }

  if (!sessionUser) {
    redirect("/login");
  }

  return (
    
    <div className="flex min-h-screen flex-col">
      <AdminShell user={sessionUser}>
        <main className="flex-1 pl-56 pt-14">
          <div className="p-10">{children}</div>
        </main>
        <div className="pl-56">
          <AppFooter />
        </div>
      </AdminShell>
    </div>
  );
}
