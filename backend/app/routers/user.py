from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_current_user, get_db
from ..services.progress_service import regen_hearts

router = APIRouter(prefix="/api", tags=["user"])

GEMS_REFILL_COST = 350


@router.get("/me", response_model=schemas.UserOut)
def get_me(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    regen_hearts(user, db)
    db.commit()
    db.refresh(user)
    return user


@router.get("/profile", response_model=schemas.ProfileOut)
def get_profile(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    regen_hearts(user, db)
    db.commit()

    since = date.today() - timedelta(days=30)
    activity = (
        db.query(models.DailyActivity)
        .filter(models.DailyActivity.user_id == user.id, models.DailyActivity.date >= since)
        .order_by(models.DailyActivity.date)
        .all()
    )
    today_row = next((a for a in activity if a.date == date.today()), None)

    earned = (
        db.query(models.UserAchievement)
        .filter(models.UserAchievement.user_id == user.id)
        .order_by(models.UserAchievement.earned_at.desc())
        .all()
    )

    total_skills = db.query(models.Skill).count()
    skills_completed = (
        db.query(models.UserSkillProgress)
        .filter(models.UserSkillProgress.user_id == user.id, models.UserSkillProgress.crowns >= 1)
        .count()
    )

    return schemas.ProfileOut(
        user=user,
        today_xp=today_row.xp_earned if today_row else 0,
        daily_activity=activity,
        achievements=[schemas.EarnedAchievementOut(achievement=ua.achievement, earned_at=ua.earned_at) for ua in earned],
        skills_completed=skills_completed,
        total_skills=total_skills,
    )


@router.post("/hearts/refill", response_model=schemas.HeartsRefillOut)
def refill_hearts(
    method: str = Query("practice", pattern="^(practice|gems)$"),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Mocked refill: 'practice' is a free instant refill (stands in for a
    real practice-quiz flow); 'gems' spends mocked gem currency."""
    if user.hearts >= user.max_hearts:
        raise HTTPException(status_code=400, detail="Hearts already full")
    if method == "gems":
        if user.gems < GEMS_REFILL_COST:
            raise HTTPException(status_code=400, detail="Not enough gems")
        user.gems -= GEMS_REFILL_COST
    user.hearts = user.max_hearts
    user.next_heart_regen_at = None
    db.commit()
    db.refresh(user)
    return schemas.HeartsRefillOut(hearts=user.hearts, gems=user.gems)
