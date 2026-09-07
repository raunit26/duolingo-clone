# Lingopal — a Duolingo clone

A functional clone of the Duolingo web app: a skill-tree learning path, a lesson player with five
exercise types, hearts/XP/streak/gems gamification, crowns/unlocks, a seeded leaderboard,
achievements, and a persistent per-user profile — built for the SDE Fullstack Assignment.

**Stack:** Next.js 16 (TypeScript, App Router, Tailwind v4) · FastAPI (Python) · SQLAlchemy · SQLite

---

## Quick start

### 1. Backend (FastAPI + SQLite)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed              # creates backend/app.db and seeds course content + demo user
uvicorn app.main:app --reload --port 8000
```

The API is now live at `http://localhost:8000` (interactive docs at `/docs`).

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:3000` — you're auto-logged-in as the seeded demo learner ("Alex").

Re-running `python -m app.seed` at any time wipes and re-seeds the database back to the pristine
demo state described below (it's idempotent — safe to run repeatedly).

---

## Architecture overview

```
duolingo-clone/
├── backend/
│   └── app/
│       ├── main.py            FastAPI app, CORS, router registration
│       ├── database.py        SQLAlchemy engine/session (SQLite)
│       ├── models.py          ORM models — the schema (see below)
│       ├── schemas.py         Pydantic request/response contracts
│       ├── deps.py            get_db, get_current_user (single seeded learner)
│       ├── seed.py            course/units/skills/exercises + demo + bot users
│       ├── routers/           course, lessons, user, leaderboard, dev
│       └── services/
│           ├── progress_service.py   XP, streak, hearts-regen, achievements
│           └── lesson_service.py     exercise selection + server-side grading
└── frontend/
    ├── app/
    │   ├── (main)/            shared shell (sidebar + top stats bar)
    │   │   ├── learn/         the skill-tree path
    │   │   ├── leaderboard/
    │   │   ├── profile/
    │   │   ├── quests/, shop/ mocked "coming soon" sections
    │   │   └── settings/      dark-mode toggle, account placeholders, dev tools
    │   └── lesson/[skillId]/  full-screen lesson player
    ├── components/
    │   ├── path/              UnitBanner, SkillNode
    │   ├── lesson/             one component per exercise type + feedback bar,
    │   │                       progress bar, hearts, complete/out-of-hearts modals
    │   └── ui/                 Sidebar, TopBar, Button, Mascot (original SVG), etc.
    ├── store/                  Zustand: lessonSession (in-lesson state), userStore (stats)
    └── lib/                    typed API client, shared types, TTS helper
```

**Auth** is intentionally simplified per the assignment spec: every request resolves to a single
seeded "demo" learner (`deps.get_current_user`). There's no login screen — swapping in real auth
later just means changing that one dependency to read a session/JWT instead.

**Why FastAPI over Django:** the API surface here is a handful of focused REST endpoints with no
admin panel or heavy ORM migrations needed — FastAPI's async routing + Pydantic validation gets
there with less ceremony, and pairs naturally with SQLAlchemy for a schema this project wants to
own directly.

---

## Database schema

All tables live in `backend/app/models.py`. Design rationale: exercises are backed by two tables
(`exercises` + `exercise_options`) rather than one table per exercise type, so `exercise_options`
is reused polymorphically as multiple-choice options, word-bank tokens (ordered), or match-pair
entries (grouped by `pair_key`) — keeping the schema normalized without five near-duplicate tables.

| Table | Purpose |
|---|---|
| `users` | Learner profile + live gamification state (xp, streak, hearts, gems) |
| `courses` → `units` → `skills` | The content hierarchy (one course seeded: Spanish) |
| `user_skill_progress` | Per-(user, skill) status (locked/available/completed) + crown count |
| `exercises` | One row per exercise; `type` drives how the frontend renders + grades it |
| `exercise_options` | Polymorphic per-exercise items (choices / word-bank tokens / match pairs) |
| `lesson_attempts` | One row per lesson play-through: xp earned, mistakes, perfect flag |
| `exercise_attempts` | Per-exercise answer log within an attempt (audit trail / mistake review) |
| `daily_activity` | One row per (user, date) with xp earned — the source of truth for streaks |
| `achievements` / `user_achievements` | Achievement definitions + which ones a user has earned |

Streaks are derived from `daily_activity` rows rather than a single "last seen" timestamp, which
is what makes them simulate-able for testing (see **Assumptions** below) and immune to timezone
edge cases around one mutable field.

```
courses ─< units ─< skills ─< exercises ─< exercise_options
                       │
                       ├─< user_skill_progress >─ users
                       └─< lesson_attempts >─ users ─< exercise_attempts
users ─< daily_activity
users ─< user_achievements >─ achievements
```

---

## API overview

All routes are prefixed `/api`. Full interactive schema at `/docs` (Swagger) once the backend is
running.

| Method & path | Purpose |
|---|---|
| `GET /course` | Units + skills merged with the current user's progress/crowns |
| `GET /me` | Current user's live stats (also passively applies heart regen) |
| `GET /profile` | Stats + last-30-days activity + earned achievements |
| `GET /leaderboard` | All users ranked by weekly XP, current user flagged |
| `POST /skills/{id}/lesson/start` | Builds an 8-exercise lesson, returns exercises **without answers** |
| `POST /exercises/{id}/check` | Grades one answer server-side; deducts a heart on a miss |
| `POST /lessons/complete` | Finalizes XP/streak/crowns/achievements for a finished attempt |
| `POST /hearts/refill` | Mocked refill — `?method=practice` (free) or `?method=gems` (350 gems) |
| `POST /dev/simulate-day` | **Testing only** — shifts stored dates back a day (see Assumptions) |

**Grading contract per exercise type** (`lesson_service.grade_exercise`):
- `multiple_choice` / `fill_blank` — client submits a chosen option id; graded against `is_correct`.
- `type_answer` — free text, compared case/accent/punctuation-insensitively.
- `translate` (word bank) — client submits tapped option ids in order; compared against each
  option's `order_index`.
- `match_pairs` — both columns (with `pair_key`) are sent to the client up front, so matching is
  resolved client-side and `/check` just logs the attempt — there's no server secret left to grade
  once the pairing structure itself is visible, same tradeoff Duolingo's own client-side matching
  makes.

---

## Seeded content

One course — **Spanish for English speakers** — with 3 units × 3 skills (Greetings, Food, Animals,
Family, Colors, Numbers, Travel, Verbs, Questions), each with an 8-exercise pool spanning all five
exercise types. The demo learner ("Alex") starts with Greetings and Food already at 2 crowns,
Animals unlocked, a 5-day streak in progress, 250 XP, and one achievement already earned — so the
app is immediately explorable rather than an empty shell. Six bot users are seeded with weekly XP
for the leaderboard.

## Assumptions & known simplifications

- **Auth**: single default learner, no signup/login (per spec).
- **Streak testing**: real streaks depend on wall-clock dates, which is awkward to demo/grade on
  demand. `POST /api/dev/simulate-day` (exposed in Settings → Developer tools in the UI) shifts the
  user's stored dates back a day so the *next* lesson you complete is treated as happening the
  following day — letting you verify increment/reset logic without waiting.
- **Hearts regen** is set to 1 heart per 30 minutes (vs. Duolingo's ~4h) purely so it's observable
  during a grading session; documented in `progress_service.py`.
- **Gems / Super / social features** are mocked placeholders ("Coming soon"), per spec.
- **Audio** uses the browser's built-in `SpeechSynthesis` API (no external TTS key required) —
  optional/placeholder per spec.
- **Abandoned lessons**: exiting a lesson mid-way (✕ button, or declining a hearts refill) leaves
  that `lesson_attempts` row as `in_progress` rather than explicitly cancelling it — harmless for
  this project's scope, but a real product would want an explicit abandon endpoint.
- **Mascot**: an original, simplified owl illustration (`components/ui/Mascot.tsx`) — not a
  reproduction of Duolingo's copyrighted character — used to carry the same playful tone.

## Testing the gamification loop manually

1. Complete a lesson with at least one mistake → confirms hearts deplete, wrong answers get
   requeued once, XP/crown/streak update on the lesson-complete screen.
2. Deplete all 5 hearts → the "Out of Hearts" modal blocks further lessons; use the free "Practice
   to refill" action to continue.
3. Settings → Developer tools → "Simulate next day", then complete another lesson → streak should
   increment by exactly 1 (or reset to 1 if you simulate more than one day).
