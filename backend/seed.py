"""Import seed_data.json into SQLite database."""
import json
import os
from database import get_db, init_db

SEED_FILE = os.path.join(os.path.dirname(__file__), "seed_data.json")


def seed():
    if not os.path.exists(SEED_FILE):
        print(f"ERROR: Seed file not found: {SEED_FILE}")
        return
    try:
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in seed file: {e}")
        return

    math_deck = data.get("mathDeck", [])
    blank_steps = data.get("blankSteps", {})
    quiz_data = data.get("quizData", [])
    vocab_data = data.get("highfreqVocab", [])

    with get_db() as conn:
        # ── Cards — INSERT OR REPLACE for idempotent re-seeding ──
        for card in math_deck:
            card_id = card["id"]
            bs = blank_steps.get(card_id)
            bs_json = json.dumps(bs, ensure_ascii=False) if bs else None
            conn.execute(
                """INSERT OR REPLACE INTO cards
                   (id, deck, title, stars, difficulty, example, solution, answer, variants, blank_steps)
                   VALUES (?, 'math', ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    card_id,
                    card.get("title", ""),
                    card.get("stars", ""),
                    card.get("difficulty", ""),
                    card.get("example", ""),
                    card.get("solution", ""),
                    card.get("answer", ""),
                    card.get("variants", ""),
                    bs_json,
                ),
            )

        # ── Quiz items — INSERT OR REPLACE for idempotent re-seeding ──
        for i, q in enumerate(quiz_data, 1):
            conn.execute(
                """INSERT OR REPLACE INTO quiz_items (id, desc, opts, ans, tip)
                   VALUES (?, ?, ?, ?, ?)""",
                (
                    i,
                    q["desc"],
                    json.dumps(q["opts"], ensure_ascii=False),
                    q["ans"],
                    q.get("tip", ""),
                ),
            )

        # ── High-frequency vocab — INSERT OR REPLACE for idempotent re-seeding ──
        for v in vocab_data:
            conn.execute(
                """INSERT OR REPLACE INTO highfreq_vocab (word, meaning, category)
                   VALUES (?, ?, ?)""",
                (v["word"], v.get("meaning", ""), v.get("category", "考公高频")),
            )

        conn.commit()

    print(f"Seeded: {len(math_deck)} cards, {len(quiz_data)} quiz items, {len(vocab_data)} vocab entries")


if __name__ == "__main__":
    init_db()
    seed()
