# Sustainability Prompt Coder

Vite + React frontend, FastAPI + Postgres backend. Coding tool for the sustainability prompt study.

Two modes share the same images; only seed data, Compose project name, and ports differ:

| Mode | Prompts | Script | UI port |
|---|---|---|---|
| **Pilot** (tool / E2E test) | N=20 [`study_data/prompts_pilot_v1.csv`](study_data/prompts_pilot_v1.csv) | `./scripts/up-pilot.sh` | **8080** |
| **Full study** | N=100 [`study_data/prompts_eval_v1.csv`](study_data/prompts_eval_v1.csv) | `./scripts/up-study.sh` | **8081** |

Do not mix pilot and study data in one database — the up scripts always seed with `--reset`.

---

## Prerequisites

- Docker (Docker Compose v2)

Optional for local hot-reload development: Python 3.11+, Node.js 20+.

---

## Quick start

### Pilot (N=20)

```bash
./scripts/up-pilot.sh
```

| | URL |
|---|---|
| App | http://localhost:8080 |
| Admin | http://localhost:8080/admin |
| API docs | http://localhost:8000/docs |

Demo IDs: `P-PILOT-01`, `P-PILOT-02`, `P-PILOT-03` ([`backend/data/participants_pilot.txt`](backend/data/participants_pilot.txt)).

Stop (keeps DB): `./scripts/down-pilot.sh`  
Wipe coding data: `./scripts/down-pilot.sh --volumes`

### Full study (N=100)

```bash
./scripts/up-study.sh
```

| | URL |
|---|---|
| App | http://localhost:8081 |
| Admin | http://localhost:8081/admin |
| API docs | http://localhost:8001/docs |

Demo IDs: see [`backend/data/participants.txt`](backend/data/participants.txt).

Stop: `./scripts/down-study.sh`  
Wipe: `./scripts/down-study.sh --volumes`

Default admin key for both: `dev-admin-key` (override with `ADMIN_KEY` in the environment or a `.env` next to `docker-compose.yml`).

Pilot and study can run side by side (different Compose projects and ports). Prefer one stack at a time if you only need one mode.

---

## Participant IDs and seed

IDs are created by the study team (one per line). Login only accepts IDs present in the DB.

| Mode | File |
|---|---|
| Pilot | `backend/data/participants_pilot.txt` |
| Study | `backend/data/participants.txt` |

The up scripts seed for you. Manual seed (same flags the scripts use):

```bash
# Pilot
docker compose run --rm backend python -m app.seed --reset \
  --prompts /study_data/prompts_pilot_v1.csv \
  --participants data/participants_pilot.txt

# Study
docker compose run --rm backend python -m app.seed --reset \
  --prompts /study_data/prompts_eval_v1.csv \
  --participants data/participants.txt
```

Set `COMPOSE_PROJECT_NAME` / ports to match the mode (see scripts) before running manual compose commands.

- `--reset` wipes prompts, participants, assignments, and effects.
- Without `--reset`, updates prompts and adds **new** participant IDs only (keeps existing coding).

Email each coder **only their own** ID. Keep email↔ID mapping offline.

---

## Environment

| Variable | Purpose | Default (via scripts) |
|---|---|---|
| `ADMIN_KEY` | `/admin` and CSV export | `dev-admin-key` |
| `SESSION_SECRET` | Session tokens | `dev-session-secret-change-me` |
| `CORS_ORIGINS` | Allowed browser origins | Matches the mode’s UI port |
| `COMPOSE_PROJECT_NAME` | Isolates containers + DB volume | `spc-pilot` / `spc-study` |
| `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT` | Host ports | Pilot 8080/8000/5433; study 8081/8001/5434 |

Inside Compose, Postgres is `db:5432`. Host tools use the published `DB_PORT`.

---

## Typical expected workflow

| Task | How |
|---|---|
| Start pilot | `./scripts/up-pilot.sh` |
| Start study | `./scripts/up-study.sh` |
| Smoke-test | Log in with a demo ID; progress **/ 20** (pilot) or **/ 100** (study) |
| Invite coders | Email each person their participant ID |
| Progress | Admin URL for that mode (`ADMIN_KEY`) |
| Export | Admin → Export effects CSV |
| Add a coder mid-run | Append ID to the right participants file; seed **without** `--reset` |
| Reset / new wave | Re-run the matching `up-*.sh` (seeds with `--reset`) or seed manually with `--reset` |

Export columns: `se_activity`, `is_relevant`, `dimension`, `valence`, `coder_note`, …

Coders assign SE activity, then relevance / effects per the guidebook; confirm per prompt; submit when done.

---

## Pilot go-live

When the team has tested locally and is ready for external pilot coding:

1. Clone this repo on the shared host.
2. Set strong `ADMIN_KEY`, `SESSION_SECRET`, and `CORS_ORIGINS` (public app URL) in a `.env` beside `docker-compose.yml`.
3. Run `./scripts/up-pilot.sh` (or the same env + compose + pilot seed).
4. Put HTTPS in front of the frontend port (Caddy/nginx). Do not put the admin key in invite emails.
5. Invite pilot coders with **pilot IDs only**; monitor Admin; export CSV when done.
6. When moving to the full study: use a **new** Compose project/volume (or `./scripts/down-pilot.sh --volumes`), then `./scripts/up-study.sh` with the real participant list. **Do not** reuse the pilot database.

## Study go-live

Same as pilot, but:

1. Confirm guidebook + `prompts_eval_v1.csv` are final.
2. Put real IDs in `backend/data/participants.txt`.
3. Run `./scripts/up-study.sh` with production secrets / CORS.
4. Invite study coders; export when all have submitted.

---

## Local hot-reload (optional)

Use when editing the UI or API without rebuilding images. Start only Postgres (or use an already-running mode’s DB):

```bash
export COMPOSE_PROJECT_NAME=spc-pilot DB_PORT=5433
docker compose up -d db
```

Backend:

```bash
cd backend
cp .env.example .env          # first time; DATABASE_URL must use the published DB port
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

---

## Advanced: raw Compose

Without the scripts:

```bash
export COMPOSE_PROJECT_NAME=spc-pilot FRONTEND_PORT=8080 BACKEND_PORT=8000 DB_PORT=5433
docker compose up --build -d
docker compose run --rm backend python -m app.seed --reset \
  --prompts /study_data/prompts_pilot_v1.csv \
  --participants data/participants_pilot.txt
```

---

## Troubleshooting

| Problem | Check |
|---|---|
| Unknown participant ID | In the correct `participants*.txt` and seeded? |
| DB errors | `docker compose ps`; wait for `db` healthy; project name matches mode |
| Wrong prompt count | Pilot seed vs study seed; re-run the matching `up-*.sh` |
| Frontend cannot reach API | Use the UI port for that mode (nginx proxies). Hot-reload: backend on :8000 |
| Port busy | Stop the other mode, or change `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT` |
| `se_activity` errors after pull | `docker compose up -d --build backend` |

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
study_data/      prompts_eval_v1.csv (N=100), prompts_pilot_v1.csv (N=20), meta, reserved_ids.json
backend/app/     FastAPI (routers, models, seed, migrate)
backend/data/    participants.txt, participants_pilot.txt, demo prompts.csv
frontend/        Vite + React (+ nginx in Docker)
scripts/         up-pilot / up-study / down-pilot / down-study
design/          UI reference HTML
docker-compose.yml
```
