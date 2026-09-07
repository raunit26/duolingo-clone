"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { api, OutOfHeartsError } from "@/lib/api";
import type { LessonCompleteOut } from "@/lib/types";
import { useLessonSession } from "@/store/lessonSession";
import { useUserStore } from "@/store/userStore";
import { HeartsDisplay } from "@/components/lesson/HeartsDisplay";
import { LessonProgressBar } from "@/components/lesson/LessonProgressBar";
import { ExerciseChoice } from "@/components/lesson/ExerciseChoice";
import { ExerciseTypeAnswer } from "@/components/lesson/ExerciseTypeAnswer";
import { ExerciseTranslate } from "@/components/lesson/ExerciseTranslate";
import { ExerciseMatchPairs } from "@/components/lesson/ExerciseMatchPairs";
import { FeedbackBar } from "@/components/lesson/FeedbackBar";
import { SpeakButton } from "@/components/lesson/SpeakButton";
import { LessonCompleteModal } from "@/components/lesson/LessonCompleteModal";
import { OutOfHeartsModal } from "@/components/lesson/OutOfHeartsModal";
import { Mascot } from "@/components/ui/Mascot";

function fireConfetti() {
  confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
}

export default function LessonPage({ params }: { params: Promise<{ skillId: string }> }) {
  const { skillId } = use(params);
  const router = useRouter();
  const session = useLessonSession();
  const userStore = useUserStore();

  const [blockedAtStart, setBlockedAtStart] = useState(false);
  const [checking, setChecking] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [completeResult, setCompleteResult] = useState<LessonCompleteOut | null>(null);
  const [resetForExerciseId, setResetForExerciseId] = useState<number | null>(null);

  const beginLesson = useCallback(async () => {
    setBlockedAtStart(false);
    session.reset();
    setCompleteResult(null);
    try {
      // Read via getState() rather than the destructured `userStore` above —
      // that snapshot is frozen at the render this callback was created in,
      // so after a hearts refill it would still report the old (0) count.
      const me = useUserStore.getState().user ?? (await userStore.refresh());
      const data = await api.startLesson(Number(skillId));
      session.start(data.attempt_id, data.skill_id, data.exercises, me?.hearts ?? 5);
    } catch (e) {
      if (e instanceof OutOfHeartsError) setBlockedAtStart(true);
      else console.error(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  useEffect(() => {
    // Fetch-on-mount/param-change: the canonical use of an effect to
    // synchronize with an external system (the lessons API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    beginLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  const current = session.queue[0] ?? null;

  // Once the queue drains, finalize the lesson server-side.
  useEffect(() => {
    if (session.attemptId && !current && !completeResult && !session.outOfHearts && !blockedAtStart) {
      api.completeLesson(session.attemptId).then((result) => {
        setCompleteResult(result);
        userStore.applyLessonComplete({ total_xp: result.new_total_xp, streak: result.new_streak });
        userStore.refresh();
        if (result.is_perfect || result.skill_completed) fireConfetti();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, session.attemptId, completeResult, session.outOfHearts, blockedAtStart]);

  async function grade(answer: string) {
    if (!session.attemptId || !current || checking) return;
    setChecking(true);
    try {
      const res = await api.checkExercise(current.id, session.attemptId, answer);
      session.setHearts(res.hearts_remaining);
      userStore.applyHeartsUpdate(res.hearts_remaining);
      session.showFeedback(
        res.correct
          ? { status: "correct" }
          : { status: "incorrect", correctText: res.correct_text, explanation: res.explanation },
        res.correct ? undefined : current
      );
    } finally {
      setChecking(false);
    }
  }

  async function refill(method: "practice" | "gems") {
    await api.refillHearts(method);
    const me = await userStore.refresh();
    session.setHearts(me?.hearts ?? session.hearts);
  }

  if (blockedAtStart) {
    return (
      <OutOfHeartsModal
        gems={userStore.user?.gems ?? 0}
        onRefillPractice={() => refill("practice").then(beginLesson)}
        onRefillGems={() => refill("gems").then(beginLesson)}
        onExit={() => router.push("/learn")}
      />
    );
  }

  if (completeResult) {
    return <LessonCompleteModal result={completeResult} onContinue={() => router.push("/learn")} />;
  }

  if (session.outOfHearts) {
    return (
      <OutOfHeartsModal
        gems={userStore.user?.gems ?? 0}
        onRefillPractice={() => refill("practice")}
        onRefillGems={() => refill("gems")}
        onExit={() => router.push("/learn")}
      />
    );
  }

  if (!session.attemptId || !current) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Mascot mood="neutral" className="h-20 w-20 animate-pop-in" />
      </div>
    );
  }

  // Reset per-exercise local input state whenever the active exercise changes
  // — adjusted during render (React's recommended pattern for this) rather
  // than in an effect, since it's plain derived UI state, not a side effect.
  if (current.id !== resetForExerciseId) {
    setResetForExerciseId(current.id);
    setSelectedId(null);
    setTypedAnswer("");
  }

  const feedbackActive = session.feedback.status !== "idle";
  const canCheck =
    current.type === "multiple_choice" || current.type === "fill_blank"
      ? selectedId !== null
      : current.type === "type_answer"
      ? typedAnswer.trim().length > 0
      : false;

  function handleCheckClick() {
    if (current!.type === "type_answer") grade(typedAnswer.trim());
    else if (selectedId !== null) grade(String(selectedId));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-8">
        <button onClick={() => router.push("/learn")} aria-label="Exit lesson" className="text-2xl text-wolf hover:text-eel">
          ✕
        </button>
        <LessonProgressBar completed={session.completedCount} total={session.originalTotal} />
        <HeartsDisplay hearts={session.hearts} maxHearts={userStore.user?.max_hearts ?? 5} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-32">
        {current.audio_text && <SpeakButton text={current.audio_text} />}

        {(current.type === "multiple_choice" || current.type === "fill_blank") && (
          <ExerciseChoice
            key={current.id}
            exercise={current}
            selectedId={selectedId}
            disabled={feedbackActive || checking}
            correctness={session.feedback.status}
            onSelect={setSelectedId}
          />
        )}

        {current.type === "type_answer" && (
          <ExerciseTypeAnswer
            key={current.id}
            exercise={current}
            value={typedAnswer}
            disabled={feedbackActive || checking}
            correctness={session.feedback.status}
            onChange={setTypedAnswer}
            onSubmit={() => grade(typedAnswer.trim())}
          />
        )}

        {current.type === "translate" && (
          <ExerciseTranslate
            key={current.id}
            exercise={current}
            disabled={feedbackActive || checking}
            correctness={session.feedback.status}
            onSubmit={(ids) => grade(ids.join(","))}
          />
        )}

        {current.type === "match_pairs" && (
          <ExerciseMatchPairs key={current.id} exercise={current} onAllMatched={() => grade("matched")} />
        )}
      </div>

      {!feedbackActive && current.type !== "translate" && current.type !== "match_pairs" && (
        <div className="fixed inset-x-0 bottom-0 border-t-2 border-swan bg-white p-4 dark:border-[var(--border-default)] dark:bg-[var(--bg-surface)]">
          <div className="mx-auto flex max-w-2xl justify-end">
            <button
              disabled={!canCheck || checking}
              onClick={handleCheckClick}
              className="btn-press rounded-2xl border-2 border-feather-dark bg-feather px-8 py-3 font-extrabold uppercase tracking-wide text-white disabled:border-swan disabled:bg-swan disabled:text-wolf"
            >
              Check
            </button>
          </div>
        </div>
      )}

      <FeedbackBar feedback={session.feedback} onContinue={() => session.advance()} />
    </div>
  );
}
