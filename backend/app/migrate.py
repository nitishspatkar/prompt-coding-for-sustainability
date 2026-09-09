"""Lightweight schema helpers for local research DB (no Alembic)."""

from sqlalchemy import inspect, text

from app.database import engine


def ensure_schema() -> None:
    """Add columns introduced after initial create_all (idempotent)."""
    inspector = inspect(engine)
    if "assignments" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("assignments")}
    if "se_activity" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE assignments ADD COLUMN se_activity VARCHAR"))
