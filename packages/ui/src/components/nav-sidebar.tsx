"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.FC<{ className?: string }>;
  exactMatch?: boolean;
}

export interface NavSidebarProps {
  items: NavItem[];
  footerItems?: NavItem[];
  logo?: React.ReactNode;
  appName?: string;
  appLabel?: string;
}

export function NavSidebar({ items, footerItems = [], logo, appName = "Digi", appLabel }: NavSidebarProps) {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    if (item.exactMatch) return pathname === item.href;
    return item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-white/[0.06] bg-charcoal">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/[0.06] px-5">
        {logo ?? (
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/30">
            <span className="text-[10px] font-bold text-blue-400">D</span>
          </div>
        )}
        <Link href="/" className="text-sm font-semibold tracking-tight text-white">
          {appName}
          {appLabel && <span className="ml-1 font-normal text-neutral-500">{appLabel}</span>}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                  : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-200"
              }`}
            >
              {Icon && (
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-blue-400" : "text-neutral-600"}`} />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer items */}
      {footerItems.length > 0 && (
        <div className="border-t border-white/[0.06] px-3 py-3 space-y-0.5">
          {footerItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                    : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-200"
                }`}
              >
                {Icon && (
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-blue-400" : "text-neutral-600"}`} />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
