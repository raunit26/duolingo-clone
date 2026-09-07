"""SQLAlchemy ORM models — see README.md for the full schema diagram/rationale.

Design notes:
- `exercises` + `exercise_options` back all 5 exercise types off two tables
  instead of one table per type. `exercise_options` is reused polymorphically:
  multiple_choice/translate choices, word-bank tokens (with `order_index` as
  the correct sequence), and match_pairs entries (grouped by `pair_key`).
- Progress is tracked per (user, skill) in `user_skill_progress` rather than
  denormalized onto `users`, so a future multi-user/multi-course version just
  works.
- `daily_activity` is the source of truth for streaks (not a raw "last seen"
  timestamp) so streak math is testable/simulatable and immune to timezone
  edge cases around a single mutable field.
"""
import enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import relationship

from .database import Base


class SkillStatus(str, enum.Enum):
    locked = "locked"
    available = "available"
    completed = "completed"


class ExerciseType(str, enum.Enum):
    multiple_choice = "multiple_choice"
    translate = "translate"
    match_pairs = "match_pairs"
    fill_blank = "fill_blank"
    type_answer = "type_answer"


class LessonStatus(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    avatar_emoji = Column(String(16), default="🦉")

    total_xp = Column(Integer, default=0, nullable=False)
    weekly_xp = Column(Integer, default=0, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_active_date = Column(Date, nullable=True)

    hearts = Column(Integer, default=5, nullable=False)
    max_hearts = Column(Integer, default=5, nullable=False)
    next_heart_regen_at = Column(DateTime, nullable=True)

    gems = Column(Integer, default=500, nullable=False)
    daily_xp_goal = Column(Integer, default=30, nullable=False)

    is_bot = Column(Boolean, default=False, nullable=False)  # seeded leaderboard filler
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    skill_progress = relationship("UserSkillProgress", back_populates="user", cascade="all, delete-orphan")
    lesson_attempts = relationship("LessonAttempt", back_populates="user", cascade="all, delete-orphan")
    daily_activity = relationship("DailyActivity", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    language_name = Column(String(64), nullable=False)
    language_code = Column(String(8), nullable=False)
    from_language = Column(String(64), nullable=False, default="English")
    flag_emoji = Column(String(16), default="🏳️")

    units = relationship("Unit", back_populates="course", order_by="Unit.order_index", cascade="all, delete-orphan")


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    title = Column(String(120), nullable=False)
    description = Column(String(255), default="")
    color_theme = Column(String(32), default="green")  # tailwind color key

    course = relationship("Course", back_populates="units")
    skills = relationship("Skill", back_populates="unit", order_by="Skill.order_index", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    title = Column(String(120), nullable=False)
    icon = Column(String(16), default="⭐")
    max_crowns = Column(Integer, default=4, nullable=False)

    unit = relationship("Unit", back_populates="skills")
    exercises = relationship("Exercise", back_populates="skill", order_by="Exercise.order_index", cascade="all, delete-orphan")
    progress_rows = relationship("UserSkillProgress", back_populates="skill", cascade="all, delete-orphan")


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    status = Column(Enum(SkillStatus), default=SkillStatus.locked, nullable=False)
    crowns = Column(Integer, default=0, nullable=False)
    last_practiced_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="skill_progress")
    skill = relationship("Skill", back_populates="progress_rows")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    type = Column(Enum(ExerciseType), nullable=False)
    prompt = Column(Text, nullable=False)
    correct_text = Column(String(255), nullable=True)  # type_answer / fill_blank answer
    audio_text = Column(String(255), nullable=True)  # text fed to browser TTS
    explanation = Column(String(255), nullable=True)

    skill = relationship("Skill", back_populates="exercises")
    options = relationship(
        "ExerciseOption", back_populates="exercise", order_by="ExerciseOption.order_index", cascade="all, delete-orphan"
    )


class ExerciseOption(Base):
    """Polymorphic per-exercise item: MC/translate choice, word-bank token, or
    one side of a match_pairs pair (grouped via pair_key)."""

    __tablename__ = "exercise_options"

    id = Column(Integer, primary_key=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    text = Column(String(255), nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    pair_key = Column(String(64), nullable=True)  # e.g. "1" links a left/right pair

    exercise = relationship("Exercise", back_populates="options")


class LessonAttempt(Base):
    __tablename__ = "lesson_attempts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    started_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    completed_at = Column(DateTime, nullable=True)
    xp_earned = Column(Integer, default=0, nullable=False)
    hearts_lost = Column(Integer, default=0, nullable=False)
    mistake_count = Column(Integer, default=0, nullable=False)
    is_perfect = Column(Boolean, default=False, nullable=False)
    status = Column(Enum(LessonStatus), default=LessonStatus.in_progress, nullable=False)

    # snapshot of the exercise id sequence served for this attempt, so /check
    # and /complete can validate against exactly what the client was given
    exercise_ids = Column(Text, nullable=False, default="[]")  # JSON list[int]

    user = relationship("User", back_populates="lesson_attempts")
    exercise_attempts = relationship("ExerciseAttempt", back_populates="lesson_attempt", cascade="all, delete-orphan")


class ExerciseAttempt(Base):
    __tablename__ = "exercise_attempts"

    id = Column(Integer, primary_key=True)
    lesson_attempt_id = Column(Integer, ForeignKey("lesson_attempts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    user_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    lesson_attempt = relationship("LessonAttempt", back_populates="exercise_attempts")


class DailyActivity(Base):
    __tablename__ = "daily_activity"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    xp_earned = Column(Integer, default=0, nullable=False)
    goal_met = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="daily_activity")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True)
    code = Column(String(64), unique=True, nullable=False)
    title = Column(String(120), nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(16), default="🏆")
    criteria_type = Column(String(32), nullable=False)  # streak | total_xp | perfect_lessons | lessons_completed
    criteria_value = Column(Integer, nullable=False)


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")
