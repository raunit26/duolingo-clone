"use client";

import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";
import type { FeedbackState } from "@/store/lessonSession";

export function FeedbackBar({ feedback, onContinue }: { feedback: FeedbackState; onContinue: () => void }) {
  if (feedback.status === "idle") return null;
  const correct = feedback.status === "correct";

  return (
    <div
      className={`animate-slide-up fixed inset-x-0 bottom-0 z-40 border-t-2 p-4 sm:p-6 ${
        correct
          ? "border-feather-dark bg-feather/15 dark:bg-feather/10"
          : "border-cardinal-dark bg-cardinal/15 dark:bg-cardinal/10"
      }`}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mascot mood={correct ? "excited" : "sad"} className="h-12 w-12 shrink-0" />
          <div>
            <p className={`font-display text-lg font-extrabold ${correct ? "text-feather-dark" : "text-cardinal-dark"}`}>
              {correct ? "Excellent!" : "Not quite!"}
            </p>
            {!correct && feedback.status === "incorrect" && feedback.correctText && (
              <p className="text-sm font-semibold text-eel dark:text-[var(--text-primary)]">
                Correct answer: <span className="font-bold">{feedback.correctText}</span>
              </p>
            )}
          </div>
        </div>
        <Button variant={correct ? "primary" : "danger"} onClick={onContinue} className="shrink-0">
          Continue
        </Button>
      </div>
    </div>
  );
}
