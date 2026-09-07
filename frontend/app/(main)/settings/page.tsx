"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/Button";

function Row({ icon, title, subtitle, action }: { icon: string; title: string; subtitle: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-swan py-4 last:border-0 dark:border-[var(--border-default)]">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-wolf">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function ComingSoonBadge() {
  return <span className="rounded-full bg-swan px-3 py-1 text-xs font-bold uppercase text-wolf dark:bg-[var(--border-default)]">Coming soon</span>;
}

export default function SettingsPage() {
  const { isDark, toggle } = useTheme();
  const { refresh } = useUserStore();
  const [simMsg, setSimMsg] = useState<string | null>(null);

  async function simulateDay() {
    const user = await api.simulateDay(1);
    await refresh();
    setSimMsg(`Simulated +1 day. Complete a lesson now to bump the streak past ${user.current_streak}.`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold">Settings</h1>

      <section className="mb-6 rounded-2xl border-2 border-swan p-5 dark:border-[var(--border-default)]">
        <h2 className="mb-2 font-display font-extrabold">Preferences</h2>
        <Row
          icon={isDark ? "🌙" : "☀️"}
          title="Dark mode"
          subtitle="Toggle the app's color theme"
          action={
            <button
              onClick={toggle}
              className={`btn-press h-8 w-14 rounded-full border-2 p-0.5 transition-colors ${isDark ? "border-macaw-dark bg-macaw" : "border-swan bg-swan dark:border-[var(--border-default)] dark:bg-[var(--border-default)]"}`}
            >
              <div className={`h-5 w-5 rounded-full bg-white transition-transform ${isDark ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          }
        />
        <Row icon="🔔" title="Notifications" subtitle="Daily reminders and streak alerts" action={<ComingSoonBadge />} />
        <Row icon="🔊" title="Sound effects" subtitle="Play sounds during lessons" action={<ComingSoonBadge />} />
      </section>

      <section className="mb-6 rounded-2xl border-2 border-swan p-5 dark:border-[var(--border-default)]">
        <h2 className="mb-2 font-display font-extrabold">Account</h2>
        <Row icon="👤" title="Edit profile" subtitle="Name, avatar, and bio" action={<ComingSoonBadge />} />
        <Row icon="🌐" title="Learning language" subtitle="Currently: Spanish 🇪🇸" action={<ComingSoonBadge />} />
        <Row icon="💳" title="Super subscription" subtitle="Go ad-free with unlimited hearts" action={<ComingSoonBadge />} />
        <Row icon="🔒" title="Privacy" subtitle="Manage your data" action={<ComingSoonBadge />} />
      </section>

      <section className="rounded-2xl border-2 border-dashed border-macaw p-5">
        <h2 className="mb-1 font-display font-extrabold text-macaw">🧪 Developer tools</h2>
        <p className="mb-3 text-sm text-wolf">
          For grading/testing: streaks are date-based, not wall-clock based. Use this to simulate a day
          passing so you can verify streak increment/reset logic without waiting.
        </p>
        <Button variant="secondary" onClick={simulateDay}>
          Simulate next day
        </Button>
        {simMsg && <p className="mt-3 text-sm font-bold text-macaw">{simMsg}</p>}
      </section>
    </div>
  );
}
