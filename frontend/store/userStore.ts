import { create } from "zustand";
import { api } from "@/lib/api";
import type { UserOut } from "@/lib/types";

interface UserState {
  user: UserOut | null;
  loading: boolean;
  refresh: () => Promise<UserOut | null>;
  applyHeartsUpdate: (hearts: number) => void;
  applyLessonComplete: (patch: { total_xp: number; streak: number }) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  refresh: async () => {
    set({ loading: true });
    try {
      const user = await api.getMe();
      set({ user, loading: false });
      return user;
    } catch {
      set({ loading: false });
      return null;
    }
  },
  applyHeartsUpdate: (hearts) =>
    set((s) => (s.user ? { user: { ...s.user, hearts } } : s)),
  applyLessonComplete: ({ total_xp, streak }) =>
    set((s) => (s.user ? { user: { ...s.user, total_xp, current_streak: streak } } : s)),
}));
