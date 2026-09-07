"""Idempotent seed script: one Spanish course, 3 units x 3 skills, ~8 exercises
per skill spanning all 5 exercise types, a demo learner with realistic
partial progress, and bot users for the leaderboard.

Run with: `python -m app.seed` (from backend/, inside the venv).
"""
from datetime import date, datetime, timedelta

from .database import Base, SessionLocal, engine
from . import models

# ---------------------------------------------------------------------------
# Exercise-spec helpers — each returns a plain dict; create_exercise() below
# turns it into Exercise + ExerciseOption rows.
# ---------------------------------------------------------------------------

def mc(prompt, options, correct_index, explanation=None, audio=None):
    return dict(type=models.ExerciseType.multiple_choice, prompt=prompt, audio_text=audio,
                explanation=explanation, options=[(o, i == correct_index) for i, o in enumerate(options)])


def fib(prompt, options, correct_index, explanation=None, audio=None):
    return dict(type=models.ExerciseType.fill_blank, prompt=prompt, audio_text=audio,
                explanation=explanation, options=[(o, i == correct_index) for i, o in enumerate(options)])


def ta(prompt, correct, explanation=None, audio=None):
    return dict(type=models.ExerciseType.type_answer, prompt=prompt, correct_text=correct,
                audio_text=audio or correct, explanation=explanation, options=[])


def wb(prompt, correct_words, explanation=None, audio=None):
    return dict(type=models.ExerciseType.translate, prompt=prompt, audio_text=audio or " ".join(correct_words),
                explanation=explanation, options=[(w, True) for w in correct_words], ordered=True)


def mp(prompt, pairs, explanation=None):
    opts = []
    for i, (left, right) in enumerate(pairs):
        opts.append((left, str(i), 0))
        opts.append((right, str(i), 1))
    return dict(type=models.ExerciseType.match_pairs, prompt=prompt, explanation=explanation, pair_options=opts)


def create_exercise(db, skill, order_index, spec):
    ex = models.Exercise(
        skill_id=skill.id,
        order_index=order_index,
        type=spec["type"],
        prompt=spec["prompt"],
        correct_text=spec.get("correct_text"),
        audio_text=spec.get("audio_text"),
        explanation=spec.get("explanation"),
    )
    db.add(ex)
    db.flush()

    if spec["type"] == models.ExerciseType.match_pairs:
        for i, (text, pair_key, side) in enumerate(spec["pair_options"]):
            db.add(models.ExerciseOption(exercise_id=ex.id, text=text, pair_key=pair_key, order_index=side, is_correct=False))
    elif spec["type"] == models.ExerciseType.translate:
        for i, (text, is_correct) in enumerate(spec["options"]):
            db.add(models.ExerciseOption(exercise_id=ex.id, text=text, order_index=i, is_correct=is_correct))
    else:
        for i, (text, is_correct) in enumerate(spec["options"]):
            db.add(models.ExerciseOption(exercise_id=ex.id, text=text, order_index=i, is_correct=is_correct))
    return ex


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------

UNITS = [
    dict(title="Basics 1", description="Greetings, food, and animals", color_theme="green", skills=[
        dict(title="Greetings", icon="👋", exercises=[
            mc("\"Hola\" means...", ["Hello", "Goodbye", "Please", "Thank you"], 0, audio="Hola"),
            mc("\"Gracias\" means...", ["Sorry", "Thank you", "Yes", "No"], 1, audio="Gracias"),
            fib("___, ¿cómo estás? (Hello, how are you?)", ["Hola", "Adiós", "Gracias", "Por favor"], 0),
            ta("Type the Spanish word for \"goodbye\"", "adiós"),
            ta("Type the Spanish word for \"please\"", "por favor"),
            wb("Translate: \"Good morning\"", ["Buenos", "días"]),
            mp("Match the pairs", [("Hola", "Hello"), ("Adiós", "Goodbye"), ("Gracias", "Thank you"), ("Por favor", "Please")]),
            mc("\"¿Cómo estás?\" means...", ["How are you?", "What's your name?", "Good night", "Where are you?"], 0),
        ]),
        dict(title="Food", icon="🍎", exercises=[
            mc("\"El pan\" means...", ["Bread", "Water", "Cheese", "Rice"], 0, audio="El pan"),
            mc("\"La manzana\" means...", ["Apple", "Milk", "Soup", "Meat"], 0, audio="La manzana"),
            fib("Yo bebo ___ (I drink water)", ["agua", "pan", "queso", "carne"], 0),
            ta("Type the Spanish word for \"cheese\"", "queso"),
            ta("Type the Spanish word for \"milk\"", "leche"),
            wb("Translate: \"I eat rice\"", ["Yo", "como", "arroz"]),
            mp("Match the pairs", [("El pan", "Bread"), ("El agua", "Water"), ("La leche", "Milk"), ("La sopa", "Soup")]),
            mc("\"La carne\" means...", ["Meat", "Fish", "Bird", "Bread"], 0),
        ]),
        dict(title="Animals", icon="🐶", exercises=[
            mc("\"El perro\" means...", ["Dog", "Cat", "Bird", "Fish"], 0, audio="El perro"),
            mc("\"El gato\" means...", ["Cat", "Horse", "Cow", "Bear"], 0, audio="El gato"),
            fib("El ___ nada en el mar (The fish swims in the sea)", ["pez", "perro", "gato", "oso"], 0),
            ta("Type the Spanish word for \"bird\"", "pájaro"),
            ta("Type the Spanish word for \"horse\"", "caballo"),
            wb("Translate: \"The cat is black\"", ["El", "gato", "es", "negro"]),
            mp("Match the pairs", [("El perro", "Dog"), ("El gato", "Cat"), ("El pájaro", "Bird"), ("La vaca", "Cow")]),
            mc("\"El oso\" means...", ["Bear", "Lion", "Horse", "Cow"], 0),
        ]),
    ]),
    dict(title="Basics 2", description="Family, colors, and numbers", color_theme="blue", skills=[
        dict(title="Family", icon="👪", exercises=[
            mc("\"La madre\" means...", ["Mother", "Father", "Sister", "Brother"], 0, audio="La madre"),
            mc("\"El hermano\" means...", ["Brother", "Sister", "Son", "Daughter"], 0, audio="El hermano"),
            fib("Mi ___ se llama Ana (My sister is named Ana)", ["hermana", "hermano", "madre", "padre"], 0),
            ta("Type the Spanish word for \"father\"", "padre"),
            ta("Type the Spanish word for \"family\"", "familia"),
            wb("Translate: \"My family is big\"", ["Mi", "familia", "es", "grande"]),
            mp("Match the pairs", [("La madre", "Mother"), ("El padre", "Father"), ("La hija", "Daughter"), ("El hijo", "Son")]),
            mc("\"Los abuelos\" means...", ["Grandparents", "Parents", "Cousins", "Siblings"], 0),
        ]),
        dict(title="Colors", icon="🎨", exercises=[
            mc("\"Rojo\" means...", ["Red", "Blue", "Green", "Yellow"], 0, audio="Rojo"),
            mc("\"Azul\" means...", ["Blue", "Black", "White", "Orange"], 0, audio="Azul"),
            fib("El cielo es ___ (The sky is blue)", ["azul", "rojo", "verde", "negro"], 0),
            ta("Type the Spanish word for \"green\"", "verde"),
            ta("Type the Spanish word for \"yellow\"", "amarillo"),
            wb("Translate: \"The car is black\"", ["El", "carro", "es", "negro"]),
            mp("Match the pairs", [("Rojo", "Red"), ("Verde", "Green"), ("Blanco", "White"), ("Morado", "Purple")]),
            mc("\"Naranja\" means...", ["Orange", "Purple", "Black", "White"], 0),
        ]),
        dict(title="Numbers", icon="🔢", exercises=[
            mc("\"Tres\" means...", ["Three", "Two", "Four", "Five"], 0, audio="Tres"),
            mc("\"Siete\" means...", ["Seven", "Six", "Eight", "Nine"], 0, audio="Siete"),
            fib("Tengo ___ perros (I have five dogs)", ["cinco", "dos", "ocho", "uno"], 0),
            ta("Type the Spanish word for \"one\"", "uno"),
            ta("Type the Spanish word for \"eight\"", "ocho"),
            wb("Translate: \"I have four cats\"", ["Tengo", "cuatro", "gatos"]),
            mp("Match the pairs", [("Uno", "One"), ("Dos", "Two"), ("Cuatro", "Four"), ("Seis", "Six")]),
            mc("\"Diez\" means...", ["Ten", "Nine", "Seven", "Six"], 0),
        ]),
    ]),
    dict(title="Phrases", description="Travel, verbs, and questions", color_theme="purple", skills=[
        dict(title="Travel", icon="✈️", exercises=[
            mc("\"El aeropuerto\" means...", ["Airport", "Hotel", "Train", "Beach"], 0, audio="El aeropuerto"),
            mc("\"La maleta\" means...", ["Suitcase", "Passport", "Ticket", "Map"], 0, audio="La maleta"),
            fib("Necesito mi ___ para viajar (I need my passport to travel)", ["pasaporte", "mapa", "boleto", "hotel"], 0),
            ta("Type the Spanish word for \"train\"", "tren"),
            ta("Type the Spanish word for \"beach\"", "playa"),
            wb("Translate: \"The hotel is big\"", ["El", "hotel", "es", "grande"]),
            mp("Match the pairs", [("El aeropuerto", "Airport"), ("El tren", "Train"), ("La playa", "Beach"), ("El boleto", "Ticket")]),
            mc("\"El mapa\" means...", ["Map", "Ticket", "Passport", "Suitcase"], 0),
        ]),
        dict(title="Verbs", icon="⚡", exercises=[
            mc("\"Comer\" means...", ["To eat", "To drink", "To speak", "To live"], 0, audio="Comer"),
            mc("\"Hablar\" means...", ["To speak", "To eat", "To go", "To have"], 0, audio="Hablar"),
            fib("Yo ___ español (I speak Spanish)", ["hablo", "como", "vivo", "tengo"], 0),
            ta("Type the Spanish word for \"to have\"", "tener"),
            ta("Type the Spanish word for \"to go\"", "ir"),
            wb("Translate: \"I live in Spain\"", ["Yo", "vivo", "en", "España"]),
            mp("Match the pairs", [("Comer", "To eat"), ("Beber", "To drink"), ("Vivir", "To live"), ("Hacer", "To do")]),
            mc("\"Tener\" means...", ["To have", "To be", "To go", "To eat"], 0),
        ]),
        dict(title="Questions", icon="❓", exercises=[
            mc("\"¿Qué?\" means...", ["What?", "Where?", "When?", "Who?"], 0, audio="¿Qué?"),
            mc("\"¿Dónde?\" means...", ["Where?", "What?", "Why?", "How?"], 0, audio="¿Dónde?"),
            fib("¿___ vives? (Where do you live?)", ["Dónde", "Qué", "Cuándo", "Quién"], 0),
            ta("Type the Spanish word for \"why\"", "por qué"),
            ta("Type the Spanish word for \"who\"", "quién"),
            wb("Translate: \"How are you?\"", ["¿Cómo", "estás?"]),
            mp("Match the pairs", [("¿Qué?", "What?"), ("¿Cuándo?", "When?"), ("¿Quién?", "Who?"), ("¿Cuánto?", "How much?")]),
            mc("\"¿Cuál?\" means...", ["Which?", "What?", "Where?", "When?"], 0),
        ]),
    ]),
]

ACHIEVEMENTS = [
    dict(code="first_lesson", title="First Steps", description="Complete your first lesson", icon="🎉", criteria_type="lessons_completed", criteria_value=1),
    dict(code="streak_3", title="On a Roll", description="Reach a 3-day streak", icon="🔥", criteria_type="streak", criteria_value=3),
    dict(code="streak_7", title="Warrior", description="Reach a 7-day streak", icon="⚔️", criteria_type="streak", criteria_value=7),
    dict(code="xp_100", title="Century", description="Earn 100 total XP", icon="💯", criteria_type="total_xp", criteria_value=100),
    dict(code="xp_500", title="High Flyer", description="Earn 500 total XP", icon="🚀", criteria_type="total_xp", criteria_value=500),
    dict(code="perfect_5", title="Sharpshooter", description="Complete 5 perfect lessons", icon="🎯", criteria_type="perfect_lessons", criteria_value=5),
]

BOT_USERS = [
    dict(username="sofia_l", display_name="Sofia", avatar_emoji="🦊", weekly_xp=340, total_xp=1820),
    dict(username="marcus_t", display_name="Marcus", avatar_emoji="🐼", weekly_xp=260, total_xp=990),
    dict(username="amara_k", display_name="Amara", avatar_emoji="🐸", weekly_xp=210, total_xp=1330),
    dict(username="lin_z", display_name="Lin", avatar_emoji="🐵", weekly_xp=150, total_xp=540),
    dict(username="jamal_r", display_name="Jamal", avatar_emoji="🐨", weekly_xp=90, total_xp=310),
    dict(username="priya_s", display_name="Priya", avatar_emoji="🐯", weekly_xp=60, total_xp=210),
]


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        course = models.Course(language_name="Spanish", language_code="es", from_language="English", flag_emoji="🇪🇸")
        db.add(course)
        db.flush()

        first_skill_by_unit = []
        for u_idx, unit_def in enumerate(UNITS):
            unit = models.Unit(course_id=course.id, order_index=u_idx, title=unit_def["title"],
                                description=unit_def["description"], color_theme=unit_def["color_theme"])
            db.add(unit)
            db.flush()
            for s_idx, skill_def in enumerate(unit_def["skills"]):
                skill = models.Skill(unit_id=unit.id, order_index=s_idx, title=skill_def["title"],
                                      icon=skill_def["icon"], max_crowns=4)
                db.add(skill)
                db.flush()
                for e_idx, spec in enumerate(skill_def["exercises"]):
                    create_exercise(db, skill, e_idx, spec)
                if s_idx == 0:
                    first_skill_by_unit.append(skill)
        db.flush()

        for ach in ACHIEVEMENTS:
            db.add(models.Achievement(**ach))
        db.flush()

        today = date.today()
        demo = models.User(
            username="demo", display_name="Alex", avatar_emoji="🦉",
            total_xp=250, weekly_xp=120, current_streak=5, longest_streak=5,
            last_active_date=today - timedelta(days=1),
            hearts=5, max_hearts=5, gems=500, daily_xp_goal=30, is_bot=False,
        )
        db.add(demo)
        db.flush()

        for b in BOT_USERS:
            db.add(models.User(is_bot=True, hearts=5, max_hearts=5, gems=0, daily_xp_goal=30, **b))

        # Progress: Greetings + Food completed (2 crowns), Animals unlocked/available.
        unit1 = course.units[0]
        greetings, food, animals = unit1.skills[0], unit1.skills[1], unit1.skills[2]
        db.add(models.UserSkillProgress(user_id=demo.id, skill_id=greetings.id, status=models.SkillStatus.completed, crowns=2))
        db.add(models.UserSkillProgress(user_id=demo.id, skill_id=food.id, status=models.SkillStatus.completed, crowns=2))
        db.add(models.UserSkillProgress(user_id=demo.id, skill_id=animals.id, status=models.SkillStatus.available, crowns=0))

        # A handful of completed lesson attempts (2 each for greetings/food) for history/achievements.
        import json
        for skill, n in [(greetings, 2), (food, 2)]:
            for i in range(n):
                ex_ids = [e.id for e in skill.exercises[:8]]
                attempt = models.LessonAttempt(
                    user_id=demo.id, skill_id=skill.id, exercise_ids=json.dumps(ex_ids),
                    status=models.LessonStatus.completed, xp_earned=10, mistake_count=0, hearts_lost=0, is_perfect=True,
                    completed_at=datetime.utcnow() - timedelta(days=4 - i),
                )
                db.add(attempt)

        # 5 consecutive days of daily_activity ending yesterday, matching current_streak=5.
        for i in range(5):
            d = today - timedelta(days=5 - i)
            db.add(models.DailyActivity(user_id=demo.id, date=d, xp_earned=30 + i * 5, goal_met=True))

        db.flush()

        # Pre-earn achievements already satisfied by the seeded state.
        for code in ("first_lesson", "streak_3", "xp_100"):
            ach = db.query(models.Achievement).filter(models.Achievement.code == code).first()
            db.add(models.UserAchievement(user_id=demo.id, achievement_id=ach.id, earned_at=datetime.utcnow()))

        db.commit()
        print(f"Seeded course '{course.language_name}' with {len(UNITS)} units, "
              f"{sum(len(u['skills']) for u in UNITS)} skills, demo user 'demo', and {len(BOT_USERS)} bot users.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
