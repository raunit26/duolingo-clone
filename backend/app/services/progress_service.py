"""Gamification business logic: hearts, XP, streaks, crowns/unlocks, achievements.

Kept separate from the route handlers so the rules (how much XP, how hearts
regen, how a streak increments) live in one place and are unit-testable
independent of HTTP.
"""
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from .. import models

HEART_REGEN_MINUTES = 30  # 1 heart every 30 min (documented shortcut vs Duolingo's ~4h, for demo-ability)
BASE_LESSON_XP = 10
PERFECT_BONUS_XP = 5

ACCENT_FOLD = str.maketrans("áéíóúñü", "aeiounu")


def normalize_answer(text: str) -> str:
    """Lenient compare for type_answer/fill_blank: case/whitespace/accent/punct insensitive."""
    cleaned = text.strip().lower().translate(ACCENT_FOLD)
    cleaned = "".join(ch for ch in cleaned if ch.isalnum() or ch.isspace())
    return " ".join(cleaned.split())


def regen_hearts(user: models.User, db: Session) -> None:
    """Passively refill hearts based on elapsed time since next_heart_regen_at."""
    if user.hearts >= user.max_hearts:
        user.next_heart_regen_at = None
        return
    if user.next_heart_regen_at is None:
        return
    now = datetime.utcnow()
    if now < user.next_heart_regen_at:
        return
    elapsed = now - user.next_heart_regen_at
    hearts_gained = 1 + elapsed // timedelta(minutes=HEART_REGEN_MINUTES)
    user.hearts = min(user.max_hearts, user.hearts + int(hearts_gained))
    if user.hearts >= user.max_hearts:
        user.next_heart_regen_at = None
    else:
        user.next_heart_regen_at = user.next_heart_regen_at + hearts_gained * timedelta(minutes=HEART_REGEN_MINUTES)
    db.add(user)


def lose_heart(user: models.User, db: Session) -> None:
    if user.hearts <= 0:
        return
    user.hearts -= 1
    if user.next_heart_regen_at is None:
        user.next_heart_regen_at = datetime.utcnow() + timedelta(minutes=HEART_REGEN_MINUTES)
    db.add(user)


def _update_streak(user: models.User, today: date) -> None:
    if user.last_active_date == today:
        return  # already counted today
    if user.last_active_date == today - timedelta(days=1):
        user.current_streak += 1
    else:
        user.current_streak = 1
    user.longest_streak = max(user.longest_streak, user.current_streak)
    user.last_active_date = today


def award_xp_and_streak(user: models.User, db: Session, is_perfect: bool, today: date | None = None) -> int:
    """Applies XP (with perfect + first-lesson-of-day bonuses), updates streak
    and daily_activity. Returns the XP actually awarded."""
    today = today or date.today()

    activity = (
        db.query(models.DailyActivity)
        .filter(models.DailyActivity.user_id == user.id, models.DailyActivity.date == today)
        .first()
    )
    is_first_today = activity is None
    if activity is None:
        activity = models.DailyActivity(user_id=user.id, date=today, xp_earned=0, goal_met=False)
        db.add(activity)

    xp = BASE_LESSON_XP + (PERFECT_BONUS_XP if is_perfect else 0)
    if is_first_today:
        xp *= 2

    activity.xp_earned += xp
    activity.goal_met = activity.xp_earned >= user.daily_xp_goal

    user.total_xp += xp
    user.weekly_xp += xp
    _update_streak(user, today)
    db.add(user)
    return xp


def unlock_next_skills(user: models.User, completed_skill: models.Skill, db: Session) -> list[int]:
    """Called once a skill first reaches crown 1. Unlocks the next skill in
    the unit, or the first skill of the next unit if this was the last one."""
    unit = completed_skill.unit
    siblings = sorted(unit.skills, key=lambda s: s.order_index)
    newly_unlocked: list[int] = []

    def _progress_for(skill: models.Skill) -> models.UserSkillProgress:
        row = (
            db.query(models.UserSkillProgress)
            .filter(models.UserSkillProgress.user_id == user.id, models.UserSkillProgress.skill_id == skill.id)
            .first()
        )
        if row is None:
            row = models.UserSkillProgress(user_id=user.id, skill_id=skill.id, status=models.SkillStatus.locked, crowns=0)
            db.add(row)
        return row

    idx = siblings.index(completed_skill)
    if idx + 1 < len(siblings):
        nxt = _progress_for(siblings[idx + 1])
        if nxt.status == models.SkillStatus.locked:
            nxt.status = models.SkillStatus.available
            newly_unlocked.append(siblings[idx + 1].id)
    else:
        course_units = sorted(unit.course.units, key=lambda u: u.order_index)
        uidx = course_units.index(unit)
        if uidx + 1 < len(course_units):
            next_unit_skills = sorted(course_units[uidx + 1].skills, key=lambda s: s.order_index)
            if next_unit_skills:
                nxt = _progress_for(next_unit_skills[0])
                if nxt.status == models.SkillStatus.locked:
                    nxt.status = models.SkillStatus.available
                    newly_unlocked.append(next_unit_skills[0].id)
    return newly_unlocked


ACHIEVEMENT_CHECKERS = {
    "streak": lambda user, db: user.current_streak,
    "total_xp": lambda user, db: user.total_xp,
    "perfect_lessons": lambda user, db: db.query(models.LessonAttempt).filter(
        models.LessonAttempt.user_id == user.id,
        models.LessonAttempt.status == models.LessonStatus.completed,
        models.LessonAttempt.is_perfect.is_(True),
    ).count(),
    "lessons_completed": lambda user, db: db.query(models.LessonAttempt).filter(
        models.LessonAttempt.user_id == user.id,
        models.LessonAttempt.status == models.LessonStatus.completed,
    ).count(),
}


def check_achievements(user: models.User, db: Session) -> list[models.Achievement]:
    earned_ids = {ua.achievement_id for ua in user.achievements}
    newly_earned = []
    for ach in db.query(models.Achievement).all():
        if ach.id in earned_ids:
            continue
        checker = ACHIEVEMENT_CHECKERS.get(ach.criteria_type)
        if checker and checker(user, db) >= ach.criteria_value:
            db.add(models.UserAchievement(user_id=user.id, achievement_id=ach.id))
            newly_earned.append(ach)
    return newly_earned
