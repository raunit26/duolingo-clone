from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import course, dev, leaderboard, lessons, user

app = FastAPI(title="Duolingo Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo/assignment scope — see README
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(course.router)
app.include_router(lessons.router)
app.include_router(user.router)
app.include_router(leaderboard.router)
app.include_router(dev.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
