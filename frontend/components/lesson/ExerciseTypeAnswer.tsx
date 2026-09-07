"use client";

import clsx from "clsx";
import type { ExercisePublicOut } from "@/lib/types";

export function ExerciseTypeAnswer({
  exercise,
  value,
  disabled,
  correctness,
  onChange,
  onSubmit,
}: {
  exercise: ExercisePublicOut;
  value: string;
  disabled: boolean;
  correctness: "idle" | "correct" | "incorrect";
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="w-full max-w-lg">
      <h2 className="mb-6 font-display text-xl font-bold sm:text-2xl">{exercise.prompt}</h2>
      <input
        autoFocus
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && value.trim() && onSubmit()}
        placeholder="Type your answer in Spanish"
        className={clsx(
          "w-full rounded-2xl border-2 bg-transparent px-4 py-4 text-lg font-semibold outline-none",
          correctness === "idle" && "border-swan focus:border-macaw dark:border-[var(--border-default)]",
          correctness === "correct" && "border-feather-dark bg-feather/10",
          correctness === "incorrect" && "border-cardinal-dark bg-cardinal/10 animate-shake"
        )}
      />
    </div>
  );
}
