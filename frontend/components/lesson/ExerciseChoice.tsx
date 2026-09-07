"use client";

import clsx from "clsx";
import type { ExercisePublicOut } from "@/lib/types";

/** Shared UI for multiple_choice and fill_blank — both are "pick the right option". */
export function ExerciseChoice({
  exercise,
  selectedId,
  disabled,
  correctness,
  onSelect,
}: {
  exercise: ExercisePublicOut;
  selectedId: number | null;
  disabled: boolean;
  correctness: "idle" | "correct" | "incorrect";
  onSelect: (id: number) => void;
}) {
  return (
    <div className="w-full max-w-lg">
      <h2 className="mb-6 font-display text-xl font-bold sm:text-2xl">{exercise.prompt}</h2>
      <div className="grid grid-cols-2 gap-3">
        {exercise.options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const showState = isSelected && correctness !== "idle";
          return (
            <button
              key={opt.id}
              disabled={disabled}
              onClick={() => onSelect(opt.id)}
              className={clsx(
                "btn-press rounded-2xl border-2 px-4 py-4 text-left font-bold transition-colors",
                !showState &&
                  (isSelected
                    ? "border-macaw bg-macaw/10 text-macaw"
                    : "border-swan text-eel hover:bg-black/5 dark:border-[var(--border-default)] dark:text-[var(--text-primary)] dark:hover:bg-white/5"),
                showState && correctness === "correct" && "border-feather-dark bg-feather/10 text-feather-dark",
                showState && correctness === "incorrect" && "border-cardinal-dark bg-cardinal/10 text-cardinal-dark animate-shake"
              )}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
