from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/api", tags=["leaderboard"])


@router.get("/leaderboard", response_model=list[schemas.LeaderboardEntryOut])
def get_leaderboard(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    users = db.query(models.User).order_by(models.User.weekly_xp.desc()).all()
    return [
        schemas.LeaderboardEntryOut(
            rank=i + 1,
            username=u.username,
            display_name=u.display_name,
            avatar_emoji=u.avatar_emoji,
            weekly_xp=u.weekly_xp,
            is_current_user=(u.id == user.id),
        )
        for i, u in enumerate(users)
    ]
