"""Dev/QA-only endpoints. Not part of the product surface — used to exercise
streak increment/reset logic without waiting real days. See README."""
from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/api/dev", tags=["dev"])


@router.post("/simulate-day", response_model=schemas.UserOut)
def simulate_day(
    payload: schemas.SimulateDayIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Shifts the user's stored dates backward by N days, so the *next* real
    lesson completion is treated as happening N days later — letting you
    demo streak continuation/reset without waiting."""
    shift = timedelta(days=payload.days_forward)
    if user.last_active_date:
        user.last_active_date -= shift
    for row in db.query(models.DailyActivity).filter(models.DailyActivity.user_id == user.id):
        row.date -= shift
    db.commit()
    db.refresh(user)
    return user
