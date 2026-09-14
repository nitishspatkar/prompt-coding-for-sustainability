from datetime import datetime

from pydantic import BaseModel, Field

SE_ACTIVITIES = (
    "Requirements",
    "Architecture",
    "Design",
    "Construction",
    "Testing",
    "Operations",
    "Maintenance",
    "Other",
)


class LoginRequest(BaseModel):
    participant_id: str = Field(min_length=1)


class LoginResponse(BaseModel):
    token: str
    participant_id: str
    has_seen_orientation: bool
    is_submitted: bool


class OrientationRequest(BaseModel):
    participant_id: str


class EffectIn(BaseModel):
    is_relevant: bool
    dimension: str | None = None
    valence: str | None = None
    coder_note: str | None = None


class ConfirmRequest(BaseModel):
    participant_id: str
    prompt_id: str
    se_activity: str
    is_relevant: bool
    effects: list[EffectIn] = Field(default_factory=list)


class EffectOut(BaseModel):
    effect_id: int | None = None
    is_relevant: bool
    dimension: str | None = None
    valence: str | None = None
    coder_note: str | None = None


class PromptOut(BaseModel):
    prompt_id: str
    prompt_text: str
    randomized_position: int
    total: int
    is_confirmed: bool
    opened_at: datetime | None = None
    confirmed_at: datetime | None = None
    se_activity: str | None = None
    effects: list[EffectOut] = Field(default_factory=list)
    progress: "ProgressOut"


class ProgressOut(BaseModel):
    total: int
    confirmed: int
    remaining: int


class PromptListItem(BaseModel):
    prompt_id: str
    prompt_text: str
    randomized_position: int
    is_confirmed: bool
    is_relevant: bool | None = None
    se_activity: str | None = None
    effect_count: int = 0
    opened_at: datetime | None = None


class PromptListResponse(BaseModel):
    prompts: list[PromptListItem]
    progress: ProgressOut
    is_submitted: bool


class SubmitRequest(BaseModel):
    participant_id: str


class SubmitResponse(BaseModel):
    participant_id: str
    is_submitted: bool
    submitted_at: datetime | None
    total: int
    effect_total: int


class AdminParticipantRow(BaseModel):
    participant_id: str
    confirmed_count: int
    total_prompts: int
    is_submitted: bool
    submitted_at: datetime | None = None


class AdminOverviewResponse(BaseModel):
    participants: list[AdminParticipantRow]
