"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/learn", icon: "🏠", label: "Learn" },
  { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
  { href: "/quests", icon: "🎯", label: "Quests" },
  { href: "/shop", icon: "🛍️", label: "Shop" },
  { href: "/profile", icon: "👤", label: "Profile" },
  { href: "/settings", icon: "⚙️", label: "More" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: left rail */}
      <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r-2 border-swan p-4 dark:border-[var(--border-default)] md:flex lg:w-64">
        <div className="mb-4 px-2 font-display text-2xl font-extrabold text-feather">Lingopal</div>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-4 rounded-2xl border-2 px-4 py-3 font-extrabold uppercase tracking-wide text-sm transition-colors",
                active
                  ? "border-macaw bg-macaw/10 text-macaw"
                  : "border-transparent text-eel hover:bg-black/5 dark:text-[var(--text-primary)] dark:hover:bg-white/5"
              )}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile: bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t-2 border-swan bg-white dark:border-[var(--border-default)] dark:bg-[var(--bg-surface)] md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("flex flex-col items-center text-xs font-bold", active ? "text-macaw" : "text-wolf")}
            >
              <span className="text-xl">{item.icon}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
