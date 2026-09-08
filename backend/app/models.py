from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Participant(Base):
    __tablename__ = "participants"

    participant_id: Mapped[str] = mapped_column(String, primary_key=True)
    is_submitted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    has_seen_orientation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    assignments: Mapped[list["Assignment"]] = relationship(back_populates="participant")
    effects: Mapped[list["Effect"]] = relationship(back_populates="participant")


class Prompt(Base):
    __tablename__ = "prompts"

    prompt_id: Mapped[str] = mapped_column(String, primary_key=True)
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    assignments: Mapped[list["Assignment"]] = relationship(back_populates="prompt")
    effects: Mapped[list["Effect"]] = relationship(back_populates="prompt")


class Assignment(Base):
    __tablename__ = "assignments"
    __table_args__ = (
        UniqueConstraint("participant_id", "prompt_id", name="uq_assignment_participant_prompt"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_id: Mapped[str] = mapped_column(
        String, ForeignKey("participants.participant_id"), nullable=False, index=True
    )
    prompt_id: Mapped[str] = mapped_column(
        String, ForeignKey("prompts.prompt_id"), nullable=False, index=True
    )
    randomized_position: Mapped[int] = mapped_column(Integer, nullable=False)
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    participant: Mapped["Participant"] = relationship(back_populates="assignments")
    prompt: Mapped["Prompt"] = relationship(back_populates="assignments")


class Effect(Base):
    __tablename__ = "effects"

    effect_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_id: Mapped[str] = mapped_column(
        String, ForeignKey("participants.participant_id"), nullable=False, index=True
    )
    prompt_id: Mapped[str] = mapped_column(
        String, ForeignKey("prompts.prompt_id"), nullable=False, index=True
    )
    is_relevant: Mapped[bool] = mapped_column(Boolean, nullable=False)
    dimension: Mapped[str | None] = mapped_column(String, nullable=True)
    valence: Mapped[str | None] = mapped_column(String, nullable=True)
    coder_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    participant: Mapped["Participant"] = relationship(back_populates="effects")
    prompt: Mapped["Prompt"] = relationship(back_populates="effects")
