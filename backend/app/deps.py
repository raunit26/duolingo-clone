"""Shared FastAPI dependencies.

Auth is intentionally simplified per the assignment spec ("assume a default
logged-in learner"): every request is scoped to the single seeded human
user (`is_bot=False`, username "demo"). Swapping this for real auth later
just means changing `get_current_user` to read a session/JWT instead.
"""
from typing import Generator

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from . import models
from .database import SessionLocal

DEMO_USERNAME = "demo"


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(db: Session = Depends(get_db)) -> models.User:
    user = db.query(models.User).filter(models.User.username == DEMO_USERNAME).first()
    if user is None:
        raise HTTPException(status_code=500, detail="Demo user not seeded — run seed.py")
    return user
