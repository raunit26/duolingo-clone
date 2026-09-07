import type {
  CourseOut,
  ExerciseCheckOut,
  HeartsRefillOut,
  LeaderboardEntryOut,
  LessonCompleteOut,
  LessonStartOut,
  ProfileOut,
  UserOut,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class OutOfHeartsError extends Error {
  constructor() {
    super("out_of_hearts");
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
  });
  if (res.status === 402) throw new OutOfHeartsError();
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getMe: () => request<UserOut>("/api/me"),
  getCourse: () => request<CourseOut>("/api/course"),
  getProfile: () => request<ProfileOut>("/api/profile"),
  getLeaderboard: () => request<LeaderboardEntryOut[]>("/api/leaderboard"),

  startLesson: (skillId: number) =>
    request<LessonStartOut>(`/api/skills/${skillId}/lesson/start`, { method: "POST" }),

  checkExercise: (exerciseId: number, attemptId: number, answer: string) =>
    request<ExerciseCheckOut>(`/api/exercises/${exerciseId}/check`, {
      method: "POST",
      body: JSON.stringify({ attempt_id: attemptId, answer }),
    }),

  completeLesson: (attemptId: number) =>
    request<LessonCompleteOut>("/api/lessons/complete", {
      method: "POST",
      body: JSON.stringify({ attempt_id: attemptId }),
    }),

  refillHearts: (method: "practice" | "gems") =>
    request<HeartsRefillOut>(`/api/hearts/refill?method=${method}`, { method: "POST" }),

  simulateDay: (daysForward = 1) =>
    request<UserOut>("/api/dev/simulate-day", {
      method: "POST",
      body: JSON.stringify({ days_forward: daysForward }),
    }),
};
