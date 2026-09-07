"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ProfileOut } from "@/lib/types";
import { Mascot } from "@/components/ui/Mascot";

function StreakCalendar({ activity }: { activity: ProfileOut["daily_activity"] }) {
  const byDate = new Map(activity.map((a) => [a.date, a]));
  const days: { key: string; met: boolean; xp: number }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = byDate.get(key);
    days.push({ key, met: row?.goal_met ?? false, xp: row?.xp_earned ?? 0 });
  }
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d) => (
        <div
          key={d.key}
          title={`${d.key}: ${d.xp} XP`}
          className={`aspect-square rounded-md ${d.met ? "bg-feather" : d.xp > 0 ? "bg-feather/40" : "bg-swan dark:bg-[var(--border-default)]"}`}
        />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileOut | null>(null);

  useEffect(() => {
    api.getProfile().then(setProfile);
  }, []);

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Mascot mood="neutral" className="h-20 w-20 animate-pop-in" />
      </div>
    );
  }

  const { user } = profile;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-feather text-4xl">
          {user.avatar_emoji}
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold">{user.display_name}</h1>
          <p className="text-sm text-wolf">@{user.username}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="🔥" label="Streak" value={user.current_streak} />
        <StatCard icon="⚡" label="Total XP" value={user.total_xp} />
        <StatCard icon="👑" label="Skills" value={`${profile.skills_completed}/${profile.total_skills}`} />
        <StatCard icon="🎯" label="Today" value={`${profile.today_xp}/${user.daily_xp_goal}`} />
      </div>

      <div className="mb-8 rounded-2xl border-2 border-swan p-5 dark:border-[var(--border-default)]">
        <h2 className="mb-3 font-display font-extrabold">Last 28 days</h2>
        <StreakCalendar activity={profile.daily_activity} />
      </div>

      <div className="rounded-2xl border-2 border-swan p-5 dark:border-[var(--border-default)]">
        <h2 className="mb-3 font-display font-extrabold">🏆 Achievements</h2>
        {profile.achievements.length === 0 ? (
          <p className="text-sm text-wolf">Complete lessons to start earning achievements!</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {profile.achievements.map((a) => (
              <div key={a.achievement.code} className="flex flex-col items-center gap-1 rounded-xl bg-bee/10 p-4 text-center">
                <span className="text-3xl">{a.achievement.icon}</span>
                <p className="text-sm font-bold">{a.achievement.title}</p>
                <p className="text-xs text-wolf">{a.achievement.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border-2 border-swan p-4 text-center dark:border-[var(--border-default)]">
      <p className="text-2xl">{icon}</p>
      <p className="font-display text-xl font-extrabold">{value}</p>
      <p className="text-xs font-bold uppercase text-wolf">{label}</p>
    </div>
  );
}
