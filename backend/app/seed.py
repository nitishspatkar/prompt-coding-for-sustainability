"""Seed prompts and participants, and generate randomized assignments.

Usage (from backend/):
  python -m app.seed
  python -m app.seed --prompts data/prompts.csv --participants data/participants.txt
"""

from __future__ import annotations

import argparse
import csv
import random
import sys
from pathlib import Path

from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import Assignment, Effect, Participant, Prompt

DEFAULT_PROMPTS = Path(__file__).resolve().parent.parent / "data" / "prompts.csv"
DEFAULT_PARTICIPANTS = Path(__file__).resolve().parent.parent / "data" / "participants.txt"


def load_prompts(path: Path) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames or "prompt_id" not in reader.fieldnames or "prompt_text" not in reader.fieldnames:
            raise SystemExit("prompts.csv must have columns: prompt_id, prompt_text")
        for row in reader:
            pid = (row.get("prompt_id") or "").strip()
            text = row.get("prompt_text") or ""
            if not pid:
                continue
            rows.append((pid, text))
    if not rows:
        raise SystemExit(f"No prompts found in {path}")
    return rows


def load_participants(path: Path) -> list[str]:
    ids: list[str] = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            pid = line.strip()
            if pid and not pid.startswith("#"):
                ids.append(pid)
    if not ids:
        raise SystemExit(f"No participant IDs found in {path}")
    return ids


def seed(
    db: Session,
    prompts_path: Path,
    participants_path: Path,
    *,
    reset: bool = False,
    seed_value: int | None = 42,
) -> None:
    if reset:
        db.query(Effect).delete()
        db.query(Assignment).delete()
        db.query(Prompt).delete()
        db.query(Participant).delete()
        db.commit()

    prompt_rows = load_prompts(prompts_path)
    participant_ids = load_participants(participants_path)

    existing_prompts = {p.prompt_id for p in db.query(Prompt).all()}
    for index, (prompt_id, prompt_text) in enumerate(prompt_rows):
        if prompt_id in existing_prompts:
            prompt = db.get(Prompt, prompt_id)
            assert prompt is not None
            prompt.prompt_text = prompt_text
            prompt.order_index = index
        else:
            db.add(
                Prompt(
                    prompt_id=prompt_id,
                    prompt_text=prompt_text,
                    order_index=index,
                )
            )
    db.commit()

    rng = random.Random(seed_value)
    prompt_ids = [p[0] for p in prompt_rows]

    for participant_id in participant_ids:
        participant = db.get(Participant, participant_id)
        if participant is None:
            participant = Participant(participant_id=participant_id)
            db.add(participant)
            db.flush()

        existing = (
            db.query(Assignment)
            .filter(Assignment.participant_id == participant_id)
            .count()
        )
        if existing:
            continue

        order = list(prompt_ids)
        rng.shuffle(order)
        for position, prompt_id in enumerate(order):
            db.add(
                Assignment(
                    participant_id=participant_id,
                    prompt_id=prompt_id,
                    randomized_position=position,
                )
            )
    db.commit()
    print(
        f"Seeded {len(prompt_rows)} prompts and {len(participant_ids)} participants "
        f"(assignments created for new participants only)."
    )


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Seed the prompt coding database")
    parser.add_argument("--prompts", type=Path, default=DEFAULT_PROMPTS)
    parser.add_argument("--participants", type=Path, default=DEFAULT_PARTICIPANTS)
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing participants, prompts, assignments, and effects first",
    )
    parser.add_argument("--seed", type=int, default=42, help="RNG seed for shuffle")
    args = parser.parse_args(argv)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db, args.prompts, args.participants, reset=args.reset, seed_value=args.seed)
    finally:
        db.close()


if __name__ == "__main__":
    main(sys.argv[1:])
