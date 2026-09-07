"use client";

import { useState } from "react";
import clsx from "clsx";
import type { ExercisePublicOut, ExerciseOptionOut } from "@/lib/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Rendered with `key={exercise.id}` by the lesson page, so a new exercise
// gets a fresh mount (and fresh `picked` state) for free.
export function ExerciseTranslate({
  exercise,
  disabled,
  correctness,
  onSubmit,
}: {
  exercise: ExercisePublicOut;
  disabled: boolean;
  correctness: "idle" | "correct" | "incorrect";
  onSubmit: (answerIds: number[]) => void;
}) {
  const [bank] = useState(() => shuffle(exercise.options));
  const [picked, setPicked] = useState<ExerciseOptionOut[]>([]);

  const availableIds = new Set(picked.map((p) => p.id));

  function pick(opt: ExerciseOptionOut) {
    if (disabled) return;
    const next = [...picked, opt];
    setPicked(next);
    if (next.length === exercise.options.length) onSubmit(next.map((o) => o.id));
  }

  function unpick(index: number) {
    if (disabled) return;
    setPicked((p) => p.filter((_, i) => i !== index));
  }

  return (
    <div className="w-full max-w-lg">
      <h2 className="mb-6 font-display text-xl font-bold sm:text-2xl">{exercise.prompt}</h2>

      <div
        className={clsx(
          "mb-6 flex min-h-16 flex-wrap gap-2 rounded-2xl border-2 border-dashed p-3",
          correctness === "correct" && "border-feather-dark bg-feather/10",
          correctness === "incorrect" && "border-cardinal-dark bg-cardinal/10 animate-shake",
          correctness === "idle" && "border-swan dark:border-[var(--border-default)]"
        )}
      >
        {picked.map((opt, i) => (
          <button
            key={`${opt.id}-${i}`}
            onClick={() => unpick(i)}
            className="btn-press rounded-xl border-2 border-macaw-dark bg-macaw px-3 py-2 font-bold text-white"
          >
            {opt.text}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {bank.map((opt) => (
          <button
            key={opt.id}
            disabled={disabled || availableIds.has(opt.id)}
            onClick={() => pick(opt)}
            className={clsx(
              "btn-press rounded-xl border-2 px-3 py-2 font-bold",
              availableIds.has(opt.id)
                ? "invisible"
                : "border-swan text-eel hover:bg-black/5 dark:border-[var(--border-default)] dark:text-[var(--text-primary)]"
            )}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
