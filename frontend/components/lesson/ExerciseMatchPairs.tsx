"use client";

import { useEffect, useRef, useState } from "react";
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
// gets a fresh mount (and fresh state) for free — no reset-on-id-change
// effect needed here.
export function ExerciseMatchPairs({
  exercise,
  onAllMatched,
}: {
  exercise: ExercisePublicOut;
  onAllMatched: () => void;
}) {
  const [left] = useState(() => shuffle(exercise.options.filter((o) => o.order_index % 2 === 0)));
  const [right] = useState(() => shuffle(exercise.options.filter((o) => o.order_index % 2 === 1)));
  const totalPairs = left.length;

  const [selectedLeft, setSelectedLeft] = useState<ExerciseOptionOut | null>(null);
  const [selectedRight, setSelectedRight] = useState<ExerciseOptionOut | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongFlash, setWrongFlash] = useState(false);
  // Guards against onAllMatched firing more than once for the same exercise —
  // its identity changes on every parent render, which would otherwise
  // re-trigger the effect below (and double-submit) on any unrelated re-render.
  const submittedRef = useRef(false);

  // The match/mismatch decision is a direct response to the user's second
  // tap, so it's resolved right in the click handlers below rather than in
  // a useEffect watching selection state.
  function resolve(left: ExerciseOptionOut, right: ExerciseOptionOut) {
    if (left.pair_key === right.pair_key) {
      setMatched((m) => new Set(m).add(left.pair_key!));
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedLeft(left);
      setSelectedRight(right);
      setWrongFlash(true);
      setTimeout(() => {
        setWrongFlash(false);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 450);
    }
  }

  function tap(opt: ExerciseOptionOut, side: "left" | "right") {
    if (matched.has(opt.pair_key ?? "") || wrongFlash) return;
    if (side === "left") {
      if (selectedRight) resolve(opt, selectedRight);
      else setSelectedLeft(opt);
    } else {
      if (selectedLeft) resolve(selectedLeft, opt);
      else setSelectedRight(opt);
    }
  }

  useEffect(() => {
    if (totalPairs > 0 && matched.size === totalPairs && !submittedRef.current) {
      submittedRef.current = true;
      onAllMatched();
    }
  }, [matched, totalPairs, onAllMatched]);

  function card(opt: ExerciseOptionOut, side: "left" | "right") {
    const isMatched = matched.has(opt.pair_key ?? "");
    const isSelected = side === "left" ? selectedLeft?.id === opt.id : selectedRight?.id === opt.id;
    return (
      <button
        key={opt.id}
        disabled={isMatched}
        onClick={() => tap(opt, side)}
        className={clsx(
          "btn-press w-full rounded-2xl border-2 px-4 py-4 font-bold transition-colors",
          isMatched && "invisible",
          !isMatched && isSelected && !wrongFlash && "border-macaw bg-macaw/10 text-macaw",
          !isMatched && isSelected && wrongFlash && "border-cardinal-dark bg-cardinal/10 text-cardinal-dark animate-shake",
          !isMatched && !isSelected && "border-swan text-eel hover:bg-black/5 dark:border-[var(--border-default)] dark:text-[var(--text-primary)]"
        )}
      >
        {opt.text}
      </button>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <h2 className="mb-6 font-display text-xl font-bold sm:text-2xl">{exercise.prompt}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">{left.map((o) => card(o, "left"))}</div>
        <div className="flex flex-col gap-3">{right.map((o) => card(o, "right"))}</div>
      </div>
    </div>
  );
}
