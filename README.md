# Sustainability Prompt Coder

Vite + React frontend, FastAPI + Postgres backend. Coding tool for the sustainability prompt study.

Seed prompts (N=100) ship in [`study_data/`](study_data/) so they are available when this repo is cloned.

---

## Prerequisites

- Docker
- Python 3.11+
- Node.js 20+

---

## Local setup

### 1. Postgres

From this directory:

```bash
docker compose up -d
```

Listens on **localhost:5433** (`coder` / `coder` / `prompt_coder`).

### 2. Backend

```bash
cd backend
cp .env.example .env          # first time; DATABASE_URL must use port 5433
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `ADMIN_KEY` | `/admin` and CSV export |
| `SESSION_SECRET` | Session tokens |
| `CORS_ORIGINS` | e.g. `http://localhost:5173` |

### 3. Participant IDs and seed

IDs are created by the study team (one per line in `backend/data/participants.txt`). Login only accepts IDs present in the DB.

```text
# backend/data/participants.txt
P-0417
P-0418
P-0520
```

Seed the study set (from `backend/`, venv active):

```bash
python -m app.seed --reset \
  --prompts ../study_data/prompts_eval_v1.csv \
  --participants data/participants.txt
```

- `--reset` wipes prompts, participants, assignments, and effects.
- Without `--reset`, updates prompts and adds **new** participant IDs only (keeps existing coding).

Email each coder **only their own** ID. Keep email↔ID mapping offline.

Demo prompts instead: `python -m app.seed --reset` (uses `backend/data/prompts.csv`).

### 4. Run

Terminal A — API:

```bash
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal B — UI:

```bash
cd frontend
npm install    # first time
npm run dev
```

| | URL |
|---|---|
| App | http://localhost:5173 |
| Admin | http://localhost:5173/admin |
| API docs | http://localhost:8000/docs |

---

## Typical expected workflow

| Task | How |
|---|---|
| Start | `docker compose up -d` if needed; start backend + frontend |
| Smoke-test | Log in with a test ID; progress should be **/ 100** |
| Invite coders | Email each person their participant ID |
| Progress | http://localhost:5173/admin (`ADMIN_KEY`) |
| Export | Admin → Export effects CSV, or `GET /admin/export?key=…` |
| Add a coder mid-study | Append ID to `participants.txt`; seed **without** `--reset` |
| Reset / new wave | Seed again **with** `--reset` (same commands as setup §3) |

Export columns: `se_activity`, `is_relevant`, `dimension`, `valence`, `coder_note`, …

Coders assign SE activity, then relevance / effects per the guidebook; confirm per prompt; submit when done.

---

## Troubleshooting

| Problem | Check |
|---|---|
| Unknown participant ID | In `participants.txt` and seeded? |
| DB errors | `docker compose ps`; `DATABASE_URL` port **5433** |
| 25 demo prompts instead of 100 | Re-seed with `../study_data/prompts_eval_v1.csv` |
| Frontend cannot reach API | Backend on :8000 |
| `se_activity` errors after pull | Restart uvicorn (column added on startup) |

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
study_data/      prompts_eval_v1.csv (+ meta) — frozen study set
backend/app/     FastAPI (routers, models, seed, migrate)
backend/data/    participants.txt, demo prompts.csv
frontend/        Vite + React
design/          UI reference HTML
```
