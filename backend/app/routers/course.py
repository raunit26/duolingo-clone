from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/api", tags=["course"])


@router.get("/course", response_model=schemas.CourseOut)
def get_course(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).first()
    progress_by_skill = {
        row.skill_id: row
        for row in db.query(models.UserSkillProgress).filter(models.UserSkillProgress.user_id == user.id)
    }

    units_out = []
    for unit in sorted(course.units, key=lambda u: u.order_index):
        skills_out = []
        for skill in sorted(unit.skills, key=lambda s: s.order_index):
            prog = progress_by_skill.get(skill.id)
            skills_out.append(
                schemas.SkillOut(
                    id=skill.id,
                    title=skill.title,
                    icon=skill.icon,
                    order_index=skill.order_index,
                    max_crowns=skill.max_crowns,
                    status=(prog.status.value if prog else "locked"),
                    crowns=(prog.crowns if prog else 0),
                )
            )
        units_out.append(
            schemas.UnitOut(
                id=unit.id,
                title=unit.title,
                description=unit.description,
                color_theme=unit.color_theme,
                order_index=unit.order_index,
                skills=skills_out,
            )
        )

    return schemas.CourseOut(
        id=course.id,
        language_name=course.language_name,
        language_code=course.language_code,
        flag_emoji=course.flag_emoji,
        units=units_out,
    )
