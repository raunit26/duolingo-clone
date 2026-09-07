// Mirrors backend/app/schemas.py — the API's public contract.

export type ExerciseType = "multiple_choice" | "translate" | "match_pairs" | "fill_blank" | "type_answer";
export type SkillStatus = "locked" | "available" | "completed";

export interface UserOut {
  id: number;
  username: string;
  display_name: string;
  avatar_emoji: string;
  total_xp: number;
  weekly_xp: number;
  current_streak: number;
  longest_streak: number;
  hearts: number;
  max_hearts: number;
  next_heart_regen_at: string | null;
  gems: number;
  daily_xp_goal: number;
}

export interface DailyActivityOut {
  date: string;
  xp_earned: number;
  goal_met: boolean;
}

export interface AchievementOut {
  code: string;
  title: string;
  description: string;
  icon: string;
}

export interface EarnedAchievementOut {
  achievement: AchievementOut;
  earned_at: string;
}

export interface ProfileOut {
  user: UserOut;
  today_xp: number;
  daily_activity: DailyActivityOut[];
  achievements: EarnedAchievementOut[];
  skills_completed: number;
  total_skills: number;
}

export interface ExerciseOptionOut {
  id: number;
  text: string;
  order_index: number;
  pair_key: string | null;
}

export interface ExercisePublicOut {
  id: number;
  type: ExerciseType;
  prompt: string;
  audio_text: string | null;
  options: ExerciseOptionOut[];
}

export interface SkillOut {
  id: number;
  title: string;
  icon: string;
  order_index: number;
  max_crowns: number;
  status: SkillStatus;
  crowns: number;
}

export interface UnitOut {
  id: number;
  title: string;
  description: string;
  color_theme: string;
  order_index: number;
  skills: SkillOut[];
}

export interface CourseOut {
  id: number;
  language_name: string;
  language_code: string;
  flag_emoji: string;
  units: UnitOut[];
}

export interface LessonStartOut {
  attempt_id: number;
  skill_id: number;
  exercises: ExercisePublicOut[];
}

export interface ExerciseCheckOut {
  correct: boolean;
  correct_text: string | null;
  explanation: string | null;
  hearts_remaining: number;
}

export interface LessonCompleteOut {
  xp_earned: number;
  is_perfect: boolean;
  new_total_xp: number;
  new_streak: number;
  crowns: number;
  max_crowns: number;
  skill_completed: boolean;
  newly_unlocked_skill_ids: number[];
  hearts_remaining: number;
  new_achievements: AchievementOut[];
}

export interface HeartsRefillOut {
  hearts: number;
  gems: number;
}

export interface LeaderboardEntryOut {
  rank: number;
  username: string;
  display_name: string;
  avatar_emoji: string;
  weekly_xp: number;
  is_current_user: boolean;
}
