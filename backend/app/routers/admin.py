import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Assignment, Effect, Participant, Prompt
from app.schemas import AdminOverviewResponse, AdminParticipantRow

router = APIRouter(prefix="/admin", tags=["admin"])


def _check_key(key: str) -> None:
    if key != settings.admin_key:
        raise HTTPException(status_code=401, detail="Invalid admin key")


@router.get("/overview", response_model=AdminOverviewResponse)
def admin_overview(key: str = Query(...), db: Session = Depends(get_db)) -> AdminOverviewResponse:
    _check_key(key)
    participants = db.query(Participant).order_by(Participant.participant_id).all()
    rows: list[AdminParticipantRow] = []
    for p in participants:
        total = (
            db.query(func.count(Assignment.id))
            .filter(Assignment.participant_id == p.participant_id)
            .scalar()
            or 0
        )
        confirmed = (
            db.query(func.count(Assignment.id))
            .filter(
                Assignment.participant_id == p.participant_id,
                Assignment.is_confirmed.is_(True),
            )
            .scalar()
            or 0
        )
        rows.append(
            AdminParticipantRow(
                participant_id=p.participant_id,
                confirmed_count=confirmed,
                total_prompts=total,
                is_submitted=p.is_submitted,
                submitted_at=p.submitted_at,
            )
        )
    return AdminOverviewResponse(participants=rows)


@router.get("/export")
def export_effects(key: str = Query(...), db: Session = Depends(get_db)) -> StreamingResponse:
    _check_key(key)
    rows = (
        db.query(Effect, Participant, Prompt, Assignment)
        .join(Participant, Effect.participant_id == Participant.participant_id)
        .join(Prompt, Effect.prompt_id == Prompt.prompt_id)
        .join(
            Assignment,
            (Assignment.participant_id == Effect.participant_id)
            & (Assignment.prompt_id == Effect.prompt_id),
        )
        .order_by(Effect.participant_id, Effect.prompt_id, Effect.effect_id)
        .all()
    )

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "effect_id",
            "participant_id",
            "is_submitted",
            "submitted_at",
            "prompt_id",
            "prompt_text",
            "order_index",
            "se_activity",
            "is_relevant",
            "dimension",
            "valence",
            "coder_note",
        ]
    )
    for effect, participant, prompt, assignment in rows:
        writer.writerow(
            [
                effect.effect_id,
                effect.participant_id,
                participant.is_submitted,
                participant.submitted_at.isoformat() if participant.submitted_at else "",
                effect.prompt_id,
                prompt.prompt_text,
                prompt.order_index,
                assignment.se_activity or "",
                effect.is_relevant,
                effect.dimension or "",
                effect.valence or "",
                effect.coder_note or "",
            ]
        )

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=effects_export.csv"},
    )
