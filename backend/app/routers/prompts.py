from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Assignment, Effect, Participant
from app.schemas import (
    SE_ACTIVITIES,
    ConfirmRequest,
    EffectOut,
    ProgressOut,
    PromptListItem,
    PromptListResponse,
    PromptOut,
    SubmitRequest,
    SubmitResponse,
)

router = APIRouter(prefix="/prompts", tags=["prompts"])


def _progress(db: Session, participant_id: str) -> ProgressOut:
    total = (
        db.query(func.count(Assignment.id))
        .filter(Assignment.participant_id == participant_id)
        .scalar()
        or 0
    )
    confirmed = (
        db.query(func.count(Assignment.id))
        .filter(
            Assignment.participant_id == participant_id,
            Assignment.is_confirmed.is_(True),
        )
        .scalar()
        or 0
    )
    return ProgressOut(total=total, confirmed=confirmed, remaining=total - confirmed)


def _effects_for(db: Session, participant_id: str, prompt_id: str) -> list[EffectOut]:
    rows = (
        db.query(Effect)
        .filter(
            Effect.participant_id == participant_id,
            Effect.prompt_id == prompt_id,
        )
        .order_by(Effect.effect_id)
        .all()
    )
    return [
        EffectOut(
            effect_id=r.effect_id,
            is_relevant=r.is_relevant,
            dimension=r.dimension,
            valence=r.valence,
            coder_note=r.coder_note,
        )
        for r in rows
    ]


def _assignment_to_prompt_out(db: Session, assignment: Assignment) -> PromptOut:
    total = (
        db.query(func.count(Assignment.id))
        .filter(Assignment.participant_id == assignment.participant_id)
        .scalar()
        or 0
    )
    return PromptOut(
        prompt_id=assignment.prompt.prompt_id,
        prompt_text=assignment.prompt.prompt_text,
        randomized_position=assignment.randomized_position,
        total=total,
        is_confirmed=assignment.is_confirmed,
        opened_at=assignment.opened_at,
        confirmed_at=assignment.confirmed_at,
        se_activity=assignment.se_activity,
        effects=_effects_for(db, assignment.participant_id, assignment.prompt_id),
        progress=_progress(db, assignment.participant_id),
    )


def _require_participant(db: Session, pid: str) -> Participant:
    participant = db.get(Participant, pid)
    if participant is None:
        raise HTTPException(status_code=404, detail="Unknown participant ID")
    return participant


@router.get("/next", response_model=PromptOut)
def next_prompt(pid: str = Query(...), db: Session = Depends(get_db)) -> PromptOut:
    _require_participant(db, pid)
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.participant_id == pid,
            Assignment.is_confirmed.is_(False),
        )
        .order_by(Assignment.randomized_position)
        .first()
    )
    if assignment is None:
        # All confirmed — return first in randomized order for revisiting
        assignment = (
            db.query(Assignment)
            .filter(Assignment.participant_id == pid)
            .order_by(Assignment.randomized_position)
            .first()
        )
        if assignment is None:
            raise HTTPException(status_code=404, detail="No prompts assigned")
    if assignment.opened_at is None:
        assignment.opened_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(assignment)
    return _assignment_to_prompt_out(db, assignment)


@router.get("/all", response_model=PromptListResponse)
def all_prompts(pid: str = Query(...), db: Session = Depends(get_db)) -> PromptListResponse:
    participant = _require_participant(db, pid)
    assignments = (
        db.query(Assignment)
        .filter(Assignment.participant_id == pid)
        .order_by(Assignment.randomized_position)
        .all()
    )
    items: list[PromptListItem] = []
    for a in assignments:
        effects = _effects_for(db, pid, a.prompt_id)
        is_relevant = None
        if effects:
            is_relevant = effects[0].is_relevant
        effect_count = (
            len([e for e in effects if e.is_relevant and e.dimension])
            if is_relevant
            else 0
        )
        items.append(
            PromptListItem(
                prompt_id=a.prompt_id,
                prompt_text=a.prompt.prompt_text,
                randomized_position=a.randomized_position,
                is_confirmed=a.is_confirmed,
                is_relevant=is_relevant,
                se_activity=a.se_activity,
                effect_count=effect_count,
                opened_at=a.opened_at,
            )
        )
    return PromptListResponse(
        prompts=items,
        progress=_progress(db, pid),
        is_submitted=participant.is_submitted,
    )


@router.get("/{prompt_id}", response_model=PromptOut)
def get_prompt(
    prompt_id: str, pid: str = Query(...), db: Session = Depends(get_db)
) -> PromptOut:
    _require_participant(db, pid)
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.participant_id == pid,
            Assignment.prompt_id == prompt_id,
        )
        .first()
    )
    if assignment is None:
        raise HTTPException(status_code=404, detail="Prompt not assigned to participant")
    if assignment.opened_at is None:
        assignment.opened_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(assignment)
    return _assignment_to_prompt_out(db, assignment)


@router.post("/confirm")
def confirm_prompt(body: ConfirmRequest, db: Session = Depends(get_db)) -> PromptOut:
    participant = _require_participant(db, body.participant_id)
    if participant.is_submitted:
        raise HTTPException(status_code=403, detail="Submission is locked; coding is read-only")

    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.participant_id == body.participant_id,
            Assignment.prompt_id == body.prompt_id,
        )
        .first()
    )
    if assignment is None:
        raise HTTPException(status_code=404, detail="Prompt not assigned to participant")

    if body.se_activity not in SE_ACTIVITIES:
        raise HTTPException(
            status_code=400,
            detail=f"se_activity must be one of: {', '.join(SE_ACTIVITIES)}",
        )

    if body.is_relevant:
        if not body.effects:
            raise HTTPException(
                status_code=400, detail="Relevant prompts require at least one effect"
            )
        for e in body.effects:
            if not e.dimension or not e.valence:
                raise HTTPException(
                    status_code=400,
                    detail="Each effect requires dimension and valence",
                )
    else:
        if body.effects and any(e.dimension or e.valence for e in body.effects):
            raise HTTPException(
                status_code=400,
                detail="Not-relevant prompts must not include dimension/valence",
            )

    db.query(Effect).filter(
        Effect.participant_id == body.participant_id,
        Effect.prompt_id == body.prompt_id,
    ).delete()

    if body.is_relevant:
        for e in body.effects:
            db.add(
                Effect(
                    participant_id=body.participant_id,
                    prompt_id=body.prompt_id,
                    is_relevant=True,
                    dimension=e.dimension,
                    valence=e.valence,
                    coder_note=e.coder_note or None,
                )
            )
    else:
        db.add(
            Effect(
                participant_id=body.participant_id,
                prompt_id=body.prompt_id,
                is_relevant=False,
                dimension=None,
                valence=None,
                coder_note=(body.effects[0].coder_note if body.effects else None),
            )
        )

    now = datetime.now(timezone.utc)
    if assignment.opened_at is None:
        assignment.opened_at = now
    assignment.confirmed_at = now
    assignment.is_confirmed = True
    assignment.se_activity = body.se_activity
    db.commit()
    db.refresh(assignment)
    return _assignment_to_prompt_out(db, assignment)


@router.post("/submit", response_model=SubmitResponse)
def submit_all(body: SubmitRequest, db: Session = Depends(get_db)) -> SubmitResponse:
    participant = _require_participant(db, body.participant_id)
    progress = _progress(db, body.participant_id)
    if progress.remaining > 0:
        raise HTTPException(
            status_code=400,
            detail=f"{progress.remaining} prompts still unconfirmed",
        )
    if participant.is_submitted:
        raise HTTPException(status_code=400, detail="Already submitted")

    effect_total = (
        db.query(func.count(Effect.effect_id))
        .filter(
            Effect.participant_id == body.participant_id,
            Effect.is_relevant.is_(True),
            Effect.dimension.isnot(None),
        )
        .scalar()
        or 0
    )
    participant.is_submitted = True
    participant.submitted_at = datetime.now(timezone.utc)
    db.commit()
    return SubmitResponse(
        participant_id=participant.participant_id,
        is_submitted=True,
        submitted_at=participant.submitted_at,
        total=progress.total,
        effect_total=effect_total,
    )
