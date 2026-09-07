"use client";

import { useEffect } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { useUserStore } from "@/store/userStore";

export default function ShopPage() {
  const { user, refresh } = useUserStore();
  useEffect(() => {
    refresh();
  }, [refresh]);

  const items = [
    { icon: "❤️", title: "Refill Hearts", cost: 350 },
    { icon: "🔥", title: "Streak Freeze", cost: 200 },
    { icon: "⚡", title: "2x XP Boost (15 min)", cost: 150 },
    { icon: "👕", title: "Mascot Outfit", cost: 500 },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Shop</h1>
        <span className="rounded-xl bg-macaw/10 px-3 py-1.5 font-bold text-macaw">💎 {user?.gems ?? 0}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.title} className="flex flex-col items-center gap-2 rounded-2xl border-2 border-swan p-5 text-center dark:border-[var(--border-default)]">
            <span className="text-4xl">{item.icon}</span>
            <p className="font-bold">{item.title}</p>
            <span className="rounded-full bg-swan px-3 py-1 text-xs font-bold uppercase text-wolf dark:bg-[var(--border-default)]">
              Coming soon
            </span>
          </div>
        ))}
      </div>
      <p className="mt-6 flex items-center gap-2 text-center text-sm text-wolf">
        <Mascot mood="happy" className="h-8 w-8" /> Gems and hearts refills are mocked for this demo — see Settings → Developer tools.
      </p>
    </div>
  );
}
