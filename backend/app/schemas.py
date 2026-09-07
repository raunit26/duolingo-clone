"""Pydantic request/response models — the API's public contract."""
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict

ExerciseTypeLiteral = Literal[
    "multiple_choice", "translate", "match_pairs", "fill_blank", "type_answer"
]
SkillStatusLiteral = Literal["locked", "available", "completed"]


# ---------- user / stats ----------
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    display_name: str
    avatar_emoji: str
    total_xp: int
    weekly_xp: int
    current_streak: int
    longest_streak: int
    hearts: int
    max_hearts: int
    next_heart_regen_at: Optional[datetime]
    gems: int
    daily_xp_goal: int


class DailyActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: date
    xp_earned: int
    goal_met: bool


class AchievementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    code: str
    title: str
    description: str
    icon: str


class EarnedAchievementOut(BaseModel):
    achievement: AchievementOut
    earned_at: datetime


class ProfileOut(BaseModel):
    user: UserOut
    today_xp: int
    daily_activity: list[DailyActivityOut]
    achievements: list[EarnedAchievementOut]
    skills_completed: int
    total_skills: int


# ---------- course / path ----------
class ExerciseOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    text: str
    order_index: int
    pair_key: Optional[str] = None
    # NOTE: is_correct is intentionally withheld from the client — grading
    # happens server-side in /exercises/{id}/check.


class ExercisePublicOut(BaseModel):
    """What the client receives when a lesson starts — no answers included."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    type: ExerciseTypeLiteral
    prompt: str
    audio_text: Optional[str] = None
    options: list[ExerciseOptionOut] = []


class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    icon: str
    order_index: int
    max_crowns: int
    status: SkillStatusLiteral
    crowns: int


class UnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    color_theme: str
    order_index: int
    skills: list[SkillOut]


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    language_name: str
    language_code: str
    flag_emoji: str
    units: list[UnitOut]


# ---------- lesson flow ----------
class LessonStartOut(BaseModel):
    attempt_id: int
    skill_id: int
    exercises: list[ExercisePublicOut]


class ExerciseCheckIn(BaseModel):
    attempt_id: int
    answer: str  # JSON-encoded on the client for match_pairs; plain text otherwise


class ExerciseCheckOut(BaseModel):
    correct: bool
    correct_text: Optional[str] = None
    explanation: Optional[str] = None
    hearts_remaining: int


class LessonCompleteIn(BaseModel):
    attempt_id: int


class LessonCompleteOut(BaseModel):
    xp_earned: int
    is_perfect: bool
    new_total_xp: int
    new_streak: int
    crowns: int
    max_crowns: int
    skill_completed: bool
    newly_unlocked_skill_ids: list[int]
    hearts_remaining: int
    new_achievements: list[AchievementOut]


class OutOfHeartsError(BaseModel):
    detail: str = "out_of_hearts"
    next_heart_regen_at: Optional[datetime] = None


class HeartsRefillOut(BaseModel):
    hearts: int
    gems: int


class LeaderboardEntryOut(BaseModel):
    rank: int
    username: str
    display_name: str
    avatar_emoji: str
    weekly_xp: int
    is_current_user: bool


class SimulateDayIn(BaseModel):
    days_forward: int = 1
