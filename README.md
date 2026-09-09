# Sustainability Prompt Coder

Vite + React frontend, FastAPI + Postgres backend. Coding tool for the sustainability prompt study.

Seed prompts (N=100) ship in [`study_data/`](study_data/) so they are available when this repo is cloned.

---

## Prerequisites

- Docker (Docker Compose v2)

Optional for local hot-reload development: Python 3.11+, Node.js 20+.

---

## Quick start (recommended)

From this directory:

```bash
docker compose up --build -d
```

Then seed the study set (once, or after changing participants/prompts):

```bash
docker compose run --rm backend python -m app.seed --reset \
  --prompts /study_data/prompts_eval_v1.csv \
  --participants data/participants.txt
```

| | URL |
|---|---|
| App | http://localhost:8080 |
| Admin | http://localhost:8080/admin |
| API docs | http://localhost:8000/docs |

Default admin key: `dev-admin-key` (override with `ADMIN_KEY` in the environment or a `.env` next to `docker-compose.yml`).

Stop:

```bash
docker compose down
```

---

## Participant IDs and seed

IDs are created by the study team (one per line in `backend/data/participants.txt`). Login only accepts IDs present in the DB.

```text
# backend/data/participants.txt
P-0417
P-0418
P-0520
```

- `--reset` wipes prompts, participants, assignments, and effects.
- Without `--reset`, updates prompts and adds **new** participant IDs only (keeps existing coding).

Email each coder **only their own** ID. Keep email↔ID mapping offline.

Demo prompts instead:

```bash
docker compose run --rm backend python -m app.seed --reset
```

---

## Environment

Compose defaults (override via shell or `.env` beside `docker-compose.yml`):

| Variable | Purpose | Default |
|---|---|---|
| `ADMIN_KEY` | `/admin` and CSV export | `dev-admin-key` |
| `SESSION_SECRET` | Session tokens | `dev-session-secret-change-me` |
| `CORS_ORIGINS` | Allowed browser origins | `http://localhost:8080,...` |

Inside Compose, Postgres is reached as `db:5432`. Host tools can use **localhost:5433** (`coder` / `coder` / `prompt_coder`).

---

## Typical expected workflow

| Task | How |
|---|---|
| Start | `docker compose up --build -d` |
| Seed / reset | `docker compose run --rm backend python -m app.seed --reset --prompts /study_data/prompts_eval_v1.csv --participants data/participants.txt` |
| Smoke-test | Log in with a test ID; progress should be **/ 100** |
| Invite coders | Email each person their participant ID |
| Progress | http://localhost:8080/admin (`ADMIN_KEY`) |
| Export | Admin → Export effects CSV, or `GET /admin/export?key=…` |
| Add a coder mid-study | Append ID to `participants.txt`; seed **without** `--reset` |
| Reset / new wave | Seed again **with** `--reset` |

Export columns: `se_activity`, `is_relevant`, `dimension`, `valence`, `coder_note`, …

Coders assign SE activity, then relevance / effects per the guidebook; confirm per prompt; submit when done.

---

## Local hot-reload (optional)

Use when editing the UI or API without rebuilding images. Still start Postgres (and optionally the rest) with Compose, or only the DB:

```bash
docker compose up -d db
```

Backend:

```bash
cd backend
cp .env.example .env          # first time; DATABASE_URL must use port 5433
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend (Vite proxies API to `:8000`):

```bash
cd frontend
npm install    # first time
npm run dev
```

| | URL |
|---|---|
| App | http://localhost:5173 |
| Admin | http://localhost:5173/admin |

Set `CORS_ORIGINS=http://localhost:5173` in `backend/.env` for this mode.

Seed from the host (venv active, from `backend/`):

```bash
python -m app.seed --reset \
  --prompts ../study_data/prompts_eval_v1.csv \
  --participants data/participants.txt
```

---

## Troubleshooting

| Problem | Check |
|---|---|
| Unknown participant ID | In `participants.txt` and seeded? |
| DB errors | `docker compose ps`; wait for `db` healthy |
| 25 demo prompts instead of 100 | Re-seed with `/study_data/prompts_eval_v1.csv` |
| Frontend cannot reach API | Full stack: use http://localhost:8080 (nginx proxies). Hot-reload: backend on :8000 |
| Port 8080 / 8000 / 5433 busy | Stop other processes or change ports in `docker-compose.yml` |
| `se_activity` errors after pull | Restart backend (`docker compose up -d --build backend`) |

---

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Login; rejects unknown IDs |
| `POST` | `/auth/orientation` | Mark orientation seen |
| `GET` | `/prompts/next?pid=` | Next unconfirmed prompt |
| `GET` | `/prompts/all?pid=` | All prompts + status |
| `GET` | `/prompts/{id}?pid=` | One assigned prompt |
| `POST` | `/prompts/confirm` | Save `se_activity` + effects |
| `POST` | `/prompts/submit` | Final submission |
| `GET` | `/admin/overview?key=` | Progress table |
| `GET` | `/admin/export?key=` | Effects CSV |

---

## Layout

```
study_data/      prompts_eval_v1.csv (+ meta), reserved_ids.json
backend/app/     FastAPI (routers, models, seed, migrate)
backend/data/    participants.txt, demo prompts.csv
frontend/        Vite + React (+ nginx in Docker)
design/          UI reference HTML
docker-compose.yml
```
