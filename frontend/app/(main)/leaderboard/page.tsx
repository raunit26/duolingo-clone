"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/api";
import type { LeaderboardEntryOut } from "@/lib/types";
import { Mascot } from "@/components/ui/Mascot";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntryOut[] | null>(null);

  useEffect(() => {
    api.getLeaderboard().then(setEntries);
  }, []);

  if (!entries) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Mascot mood="neutral" className="h-20 w-20 animate-pop-in" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="text-4xl">🏆</span>
        <h1 className="font-display text-2xl font-extrabold">Bronze League</h1>
        <p className="text-sm text-wolf">Earn the most XP this week to climb the ranks!</p>
      </div>

      <div className="overflow-hidden rounded-2xl border-2 border-swan dark:border-[var(--border-default)]">
        {entries.map((e) => (
          <div
            key={e.username}
            className={clsx(
              "flex items-center gap-4 border-b border-swan px-4 py-3 last:border-0 dark:border-[var(--border-default)]",
              e.is_current_user && "bg-macaw/10"
            )}
          >
            <span className="w-8 text-center text-lg font-extrabold text-wolf">
              {MEDALS[e.rank - 1] ?? e.rank}
            </span>
            <span className="text-2xl">{e.avatar_emoji}</span>
            <span className={clsx("flex-1 font-bold", e.is_current_user && "text-macaw")}>
              {e.display_name}
              {e.is_current_user && <span className="ml-1 text-xs font-bold uppercase text-wolf">(You)</span>}
            </span>
            <span className="font-display font-extrabold text-bee-dark dark:text-bee">{e.weekly_xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
