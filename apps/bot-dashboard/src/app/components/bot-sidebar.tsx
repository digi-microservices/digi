"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "~/lib/auth-client";
import Icon from "~/../public/no_background/digi_icon_mark-transparent.png";

const navItems = [
  { label: "Tickets", href: "/tickets", icon: TicketIcon },
];

export default function BotSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-white/5 bg-charcoal">
      <div className="flex h-14 items-center gap-2.5 border-b border-white/5 px-5">
        <div className="flex h-6 w-6 items-center justify-center">
          <Image src={Icon} width={16} height={16} alt="Digi Logo" />
        </div>
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-white"
        >
          Digi <span className="font-normal text-neutral-500">support</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20"
                  : "text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-indigo-400" : "text-neutral-600"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 px-3 py-3">
        <button
          onClick={handleSignOut}
          className="w-full cursor-pointer rounded-xl px-3 py-2 text-left text-xs text-neutral-600 transition hover:bg-white/5 hover:text-red-400"
        >
          <p className="px-3"> Sign out</p>
        </button>
      </div>
    </aside>
  );
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
    </svg>
  );
}
