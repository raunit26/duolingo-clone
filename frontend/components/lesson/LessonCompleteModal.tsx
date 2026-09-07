"use client";

import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";
import type { LessonCompleteOut } from "@/lib/types";

export function LessonCompleteModal({ result, onContinue }: { result: LessonCompleteOut; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-pop-in w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-[var(--bg-surface)]">
        <Mascot mood="excited" className="mx-auto h-24 w-24" />
        <h1 className="mt-4 font-display text-3xl font-extrabold text-feather">
          {result.is_perfect ? "Perfect Lesson!" : "Lesson Complete!"}
        </h1>
        <p className="mt-1 text-wolf">
          {result.skill_completed ? "Skill fully mastered — 👑 max crowns!" : "Keep going, you're on a roll."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-bee/15 p-4">
            <p className="text-2xl font-extrabold text-bee-dark">+{result.xp_earned} XP</p>
            <p className="text-xs font-bold uppercase text-wolf">Total XP</p>
          </div>
          <div className="rounded-2xl bg-fox/15 p-4">
            <p className="text-2xl font-extrabold text-fox">🔥 {result.new_streak}</p>
            <p className="text-xs font-bold uppercase text-wolf">Day streak</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1">
          {Array.from({ length: result.max_crowns }).map((_, i) => (
            <span key={i} className={i < result.crowns ? "text-2xl" : "text-2xl opacity-25 grayscale"}>
              👑
            </span>
          ))}
        </div>

        {result.new_achievements.length > 0 && (
          <div className="mt-6 space-y-2 rounded-2xl border-2 border-bee bg-bee/10 p-4 text-left">
            <p className="text-center font-display font-extrabold text-bee-dark">🏆 Achievement Unlocked!</p>
            {result.new_achievements.map((a) => (
              <div key={a.code} className="flex items-center gap-3">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="font-bold">{a.title}</p>
                  <p className="text-xs text-wolf">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button onClick={onContinue} fullWidth className="mt-8">
          Continue
        </Button>
      </div>
    </div>
  );
}
