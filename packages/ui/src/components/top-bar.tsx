"use client";

import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TopBarProps {
  breadcrumbs?: BreadcrumbItem[];
  user?: { email?: string; name?: string };
  onSignOut?: () => void;
}

export function TopBar({ breadcrumbs = [], user, onSignOut }: TopBarProps) {
  return (
    <header className="fixed left-56 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-charcoal px-6 backdrop-blur-md">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg className="h-3.5 w-3.5 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={i === breadcrumbs.length - 1
                  ? "font-medium text-white"
                  : "text-neutral-500 hover:text-neutral-300 transition-colors"}
              >
                {item.label}
              </Link>
            ) : (
              <span className={i === breadcrumbs.length - 1 ? "font-medium text-white" : "text-neutral-500"}>
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 hidden sm:block truncate max-w-[200px]">
            {user.email ?? user.name}
          </span>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-neutral-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
