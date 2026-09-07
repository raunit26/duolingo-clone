"""Exercise selection + answer grading.

Grading contract per exercise type (see README "Assumptions" for the
security/UX tradeoff on match_pairs):
- multiple_choice / fill_blank: `answer` = the chosen ExerciseOption id (str).
- type_answer: `answer` = free text, compared leniently (case/accent/punct).
- translate (word bank): `answer` = comma-separated option ids in the order
  the learner tapped them; correct order is each option's `order_index`.
- match_pairs: matching happens entirely client-side (both columns, with
  `pair_key`, are sent up front — there is no secret left to grade), so
  `/check` just logs the attempt and always reports correct.
"""
import random

from sqlalchemy.orm import Session

from .. import models
from .progress_service import normalize_answer

LESSON_LENGTH = 8


def build_lesson_exercises(skill: models.Skill) -> list[models.Exercise]:
    pool = list(skill.exercises)
    random.shuffle(pool)
    return pool[:LESSON_LENGTH] if len(pool) > LESSON_LENGTH else pool


def grade_exercise(exercise: models.Exercise, answer: str) -> tuple[bool, str, str | None]:
    """Returns (is_correct, correct_text, explanation)."""
    options = sorted(exercise.options, key=lambda o: o.order_index)

    if exercise.type in (models.ExerciseType.multiple_choice, models.ExerciseType.fill_blank):
        correct_opt = next((o for o in options if o.is_correct), None)
        correct_text = correct_opt.text if correct_opt else (exercise.correct_text or "")
        try:
            chosen_id = int(answer)
        except ValueError:
            return False, correct_text, exercise.explanation
        chosen = next((o for o in options if o.id == chosen_id), None)
        is_correct = bool(chosen and chosen.is_correct)
        return is_correct, correct_text, exercise.explanation

    if exercise.type == models.ExerciseType.type_answer:
        correct_text = exercise.correct_text or ""
        is_correct = normalize_answer(answer) == normalize_answer(correct_text)
        return is_correct, correct_text, exercise.explanation

    if exercise.type == models.ExerciseType.translate:
        correct_ids = [str(o.id) for o in options]  # already ordered by order_index
        correct_text = " ".join(o.text for o in options)
        submitted_ids = [tok for tok in answer.split(",") if tok]
        is_correct = submitted_ids == correct_ids
        return is_correct, correct_text, exercise.explanation

    if exercise.type == models.ExerciseType.match_pairs:
        # Client-graded interaction (see module docstring) — trust completion.
        pairs = sorted({o.pair_key for o in options if o.pair_key})
        correct_text = ", ".join(
            f"{a.text}={b.text}"
            for a, b in (
                (
                    next(o for o in options if o.pair_key == pk and o.order_index % 2 == 0),
                    next(o for o in options if o.pair_key == pk and o.order_index % 2 == 1),
                )
                for pk in pairs
            )
        )
        return True, correct_text, exercise.explanation

    return False, "", exercise.explanation


def find_exercise_in_attempt(db: Session, attempt: models.LessonAttempt, exercise_id: int) -> models.Exercise | None:
    import json

    allowed_ids = json.loads(attempt.exercise_ids)
    if exercise_id not in allowed_ids:
        return None
    return db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
