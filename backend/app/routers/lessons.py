import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_current_user, get_db
from ..services import lesson_service
from ..services.progress_service import award_xp_and_streak, check_achievements, lose_heart, regen_hearts, unlock_next_skills

router = APIRouter(prefix="/api", tags=["lessons"])


@router.post("/skills/{skill_id}/lesson/start", response_model=schemas.LessonStartOut)
def start_lesson(skill_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    regen_hearts(user, db)
    db.commit()

    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")

    progress = (
        db.query(models.UserSkillProgress)
        .filter(models.UserSkillProgress.user_id == user.id, models.UserSkillProgress.skill_id == skill_id)
        .first()
    )
    if progress is not None and progress.status == models.SkillStatus.locked:
        raise HTTPException(status_code=403, detail="Skill is locked")
    if user.hearts <= 0:
        raise HTTPException(status_code=402, detail="out_of_hearts")

    exercises = lesson_service.build_lesson_exercises(skill)
    if not exercises:
        raise HTTPException(status_code=500, detail="Skill has no seeded exercises")

    attempt = models.LessonAttempt(
        user_id=user.id,
        skill_id=skill.id,
        exercise_ids=json.dumps([e.id for e in exercises]),
        status=models.LessonStatus.in_progress,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return schemas.LessonStartOut(
        attempt_id=attempt.id,
        skill_id=skill.id,
        exercises=[schemas.ExercisePublicOut.model_validate(e) for e in exercises],
    )


@router.post("/exercises/{exercise_id}/check", response_model=schemas.ExerciseCheckOut)
def check_exercise(
    exercise_id: int,
    payload: schemas.ExerciseCheckIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    attempt = (
        db.query(models.LessonAttempt)
        .filter(models.LessonAttempt.id == payload.attempt_id, models.LessonAttempt.user_id == user.id)
        .first()
    )
    if attempt is None or attempt.status != models.LessonStatus.in_progress:
        raise HTTPException(status_code=404, detail="Lesson attempt not found or already finished")

    exercise = lesson_service.find_exercise_in_attempt(db, attempt, exercise_id)
    if exercise is None:
        raise HTTPException(status_code=404, detail="Exercise not part of this lesson attempt")

    is_correct, correct_text, explanation = lesson_service.grade_exercise(exercise, payload.answer)

    db.add(
        models.ExerciseAttempt(
            lesson_attempt_id=attempt.id,
            exercise_id=exercise.id,
            user_answer=payload.answer,
            is_correct=is_correct,
        )
    )
    if not is_correct:
        attempt.mistake_count += 1
        attempt.hearts_lost += 1
        lose_heart(user, db)

    db.commit()
    db.refresh(user)

    return schemas.ExerciseCheckOut(
        correct=is_correct,
        correct_text=correct_text,
        explanation=explanation,
        hearts_remaining=user.hearts,
    )


@router.post("/lessons/complete", response_model=schemas.LessonCompleteOut)
def complete_lesson(
    payload: schemas.LessonCompleteIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    attempt = (
        db.query(models.LessonAttempt)
        .filter(models.LessonAttempt.id == payload.attempt_id, models.LessonAttempt.user_id == user.id)
        .first()
    )
    if attempt is None or attempt.status != models.LessonStatus.in_progress:
        raise HTTPException(status_code=404, detail="Lesson attempt not found or already finished")

    from datetime import datetime

    attempt.completed_at = datetime.utcnow()
    attempt.status = models.LessonStatus.completed
    attempt.is_perfect = attempt.mistake_count == 0

    xp_earned = award_xp_and_streak(user, db, is_perfect=attempt.is_perfect)
    attempt.xp_earned = xp_earned

    skill = db.query(models.Skill).filter(models.Skill.id == attempt.skill_id).first()
    progress = (
        db.query(models.UserSkillProgress)
        .filter(models.UserSkillProgress.user_id == user.id, models.UserSkillProgress.skill_id == skill.id)
        .first()
    )
    if progress is None:
        progress = models.UserSkillProgress(user_id=user.id, skill_id=skill.id, status=models.SkillStatus.available, crowns=0)
        db.add(progress)

    was_first_crown = progress.crowns == 0
    progress.crowns = min(skill.max_crowns, progress.crowns + 1)
    progress.status = models.SkillStatus.completed
    from datetime import datetime as _dt

    progress.last_practiced_at = _dt.utcnow()

    newly_unlocked: list[int] = []
    if was_first_crown:
        newly_unlocked = unlock_next_skills(user, skill, db)

    new_achievements = check_achievements(user, db)

    db.commit()
    db.refresh(user)
    db.refresh(progress)

    return schemas.LessonCompleteOut(
        xp_earned=xp_earned,
        is_perfect=attempt.is_perfect,
        new_total_xp=user.total_xp,
        new_streak=user.current_streak,
        crowns=progress.crowns,
        max_crowns=skill.max_crowns,
        skill_completed=progress.crowns >= skill.max_crowns,
        newly_unlocked_skill_ids=newly_unlocked,
        hearts_remaining=user.hearts,
        new_achievements=[schemas.AchievementOut.model_validate(a) for a in new_achievements],
    )
