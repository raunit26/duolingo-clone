import { create } from "zustand";
import type { ExercisePublicOut } from "@/lib/types";

export type FeedbackState =
  | { status: "idle" }
  | { status: "correct" }
  | { status: "incorrect"; correctText: string | null; explanation: string | null };

interface LessonSessionState {
  attemptId: number | null;
  skillId: number | null;
  queue: ExercisePublicOut[]; // remaining exercises, in play order
  originalTotal: number; // for the progress bar denominator
  completedCount: number;
  hearts: number;
  mistakes: number;
  requeued: Set<number>;
  feedback: FeedbackState;
  outOfHearts: boolean;

  start: (attemptId: number, skillId: number, exercises: ExercisePublicOut[], hearts: number) => void;
  showFeedback: (feedback: FeedbackState, exerciseIdIfWrong?: ExercisePublicOut) => void;
  advance: () => void;
  setHearts: (hearts: number) => void;
  reset: () => void;
}

const initial = {
  attemptId: null,
  skillId: null,
  queue: [] as ExercisePublicOut[],
  originalTotal: 0,
  completedCount: 0,
  hearts: 5,
  mistakes: 0,
  requeued: new Set<number>(),
  feedback: { status: "idle" } as FeedbackState,
  outOfHearts: false,
};

export const useLessonSession = create<LessonSessionState>((set, get) => ({
  ...initial,

  start: (attemptId, skillId, exercises, hearts) =>
    set({
      ...initial,
      attemptId,
      skillId,
      queue: exercises,
      originalTotal: exercises.length,
      hearts,
      requeued: new Set(),
    }),

  showFeedback: (feedback, exerciseIfWrong) => {
    const { requeued, queue } = get();
    if (feedback.status === "incorrect" && exerciseIfWrong && !requeued.has(exerciseIfWrong.id)) {
      // Give it one more shot later in the lesson, like real Duolingo does.
      requeued.add(exerciseIfWrong.id);
      set({ feedback, queue: [...queue, exerciseIfWrong], requeued: new Set(requeued) });
    } else {
      set({ feedback });
    }
  },

  advance: () => {
    const { queue, completedCount, feedback } = get();
    const wasCorrect = feedback.status === "correct";
    set({
      queue: queue.slice(1),
      completedCount: wasCorrect ? completedCount + 1 : completedCount,
      mistakes: feedback.status === "incorrect" ? get().mistakes + 1 : get().mistakes,
      feedback: { status: "idle" },
    });
  },

  setHearts: (hearts) => set({ hearts, outOfHearts: hearts <= 0 }),

  reset: () => set({ ...initial, requeued: new Set() }),
}));
