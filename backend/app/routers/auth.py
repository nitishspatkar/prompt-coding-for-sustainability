from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Participant
from app.schemas import LoginRequest, LoginResponse, OrientationRequest

router = APIRouter(prefix="/auth", tags=["auth"])


def create_token(participant_id: str) -> str:
    return jwt.encode(
        {"sub": participant_id, "iat": datetime.now(timezone.utc).timestamp()},
        settings.session_secret,
        algorithm="HS256",
    )


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    pid = body.participant_id.strip()
    participant = db.get(Participant, pid)
    if participant is None:
        raise HTTPException(status_code=401, detail="Unknown participant ID")
    return LoginResponse(
        token=create_token(pid),
        participant_id=pid,
        has_seen_orientation=participant.has_seen_orientation,
        is_submitted=participant.is_submitted,
    )


@router.post("/orientation")
def mark_orientation_seen(body: OrientationRequest, db: Session = Depends(get_db)) -> dict:
    participant = db.get(Participant, body.participant_id.strip())
    if participant is None:
        raise HTTPException(status_code=404, detail="Unknown participant ID")
    participant.has_seen_orientation = True
    db.commit()
    return {"ok": True}
