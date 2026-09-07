"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";

function Stat({ icon, value, colorClass, href }: { icon: string; value: number | string; colorClass: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5">
      <span className="text-xl leading-none">{icon}</span>
      <span className={`font-display font-extrabold text-lg ${colorClass}`}>{value}</span>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export function TopBar() {
  const { user, refresh } = useUserStore();

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000); // pick up passive heart regen
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-swan bg-white/90 px-4 backdrop-blur dark:border-[var(--border-default)] dark:bg-[var(--bg-surface)]/90 md:px-8">
      <Link href="/learn" className="flex items-center gap-2">
        <span className="text-2xl">🇪🇸</span>
        <span className="hidden font-display text-lg font-extrabold text-feather sm:inline">Spanish</span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <Stat icon="🔥" value={user?.current_streak ?? "–"} colorClass="text-fox" href="/profile" />
        <Stat icon="⚡" value={user?.total_xp ?? "–"} colorClass="text-bee-dark dark:text-bee" href="/profile" />
        <Stat icon="💎" value={user?.gems ?? "–"} colorClass="text-macaw" />
        <Stat icon="❤️" value={user ? `${user.hearts}/${user.max_hearts}` : "–"} colorClass="text-cardinal" href="/learn" />
      </div>
    </header>
  );
}
