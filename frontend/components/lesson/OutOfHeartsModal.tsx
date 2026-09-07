"use client";

import { useState } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";

export function OutOfHeartsModal({
  gems,
  onRefillPractice,
  onRefillGems,
  onExit,
}: {
  gems: number;
  onRefillPractice: () => Promise<void>;
  onRefillGems: () => Promise<void>;
  onExit: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const canGems = gems >= 350;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-pop-in w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-[var(--bg-surface)]">
        <Mascot mood="sad" className="mx-auto h-24 w-24" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-cardinal">Out of Hearts!</h1>
        <p className="mt-1 text-wolf">Refill your hearts to keep learning, or come back later.</p>

        <div className="mt-6 flex flex-col gap-3">
          <Button variant="primary" disabled={busy} onClick={() => run(onRefillPractice)} fullWidth>
            Practice to refill (free)
          </Button>
          <Button variant="secondary" disabled={busy || !canGems} onClick={() => run(onRefillGems)} fullWidth>
            💎 Refill with 350 gems
          </Button>
          <Button variant="ghost" disabled={busy} onClick={onExit} fullWidth>
            No thanks
          </Button>
        </div>
      </div>
    </div>
  );
}
