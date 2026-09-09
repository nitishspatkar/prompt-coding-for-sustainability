from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.migrate import ensure_schema
from app.routers import admin, auth, prompts

Base.metadata.create_all(bind=engine)
ensure_schema()

app = FastAPI(title="Sustainability Prompt Coder", version="1.0.0")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(prompts.router)
app.include_router(admin.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
