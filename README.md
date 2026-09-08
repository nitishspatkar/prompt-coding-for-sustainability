# Sustainability Prompt Coder

Lightweight web tool for coding of software-engineering prompts for sustainability-related content.

## Stack

- **Frontend:** Vite + React (`frontend/`)
- **Backend:** FastAPI + SQLAlchemy (`backend/`)
- **Database:** PostgreSQL

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker (recommended for Postgres) or a local Postgres instance

## 1. Start Postgres

From the project root:

```bash
docker compose up -d
```

This starts Postgres on `localhost:5433` with:

- user / password: `coder` / `coder`
- database: `prompt_coder`

## 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` if needed. Required variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy connection string |
| `ADMIN_KEY` | Static key for `/admin` and CSV export |
| `SESSION_SECRET` | Secret for session tokens |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |

## 3. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create tables and seed sample data:

```bash
python -m app.seed --reset
```

Seed inputs (editable):

- `backend/data/prompts.csv` — columns `prompt_id`, `prompt_text`
- `backend/data/participants.txt` — one participant ID per line

The seed script creates a **randomized prompt order per participant** in the `assignments` table.

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Vite proxies `/auth`, `/prompts`, and `/admin` to the FastAPI server.

## API overview

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Login with `participant_id`; rejects unknown IDs |
| `POST` | `/auth/orientation` | Mark orientation as seen |
| `GET` | `/prompts/next?pid=` | Next unconfirmed prompt (sets `opened_at` on first load) |
| `GET` | `/prompts/all?pid=` | All prompts + confirmation status |
| `GET` | `/prompts/{id}?pid=` | Load a specific assigned prompt |
| `POST` | `/prompts/confirm` | Save effects; replace prior effects for that prompt |
| `POST` | `/prompts/submit` | Final submission (all must be confirmed) |
| `GET` | `/admin/overview?key=` | Participant progress table |
| `GET` | `/admin/export?key=` | Full effects CSV |

## Project layout

```
backend/
  app/
    main.py
    config.py
    database.py
    models.py
    schemas.py
    seed.py
    routers/
      auth.py
      prompts.py
      admin.py
  data/
    prompts.csv
    participants.txt
frontend/
  src/
    components/
      Login.jsx
      Orientation.jsx
      CodingView.jsx
      AdminView.jsx
      ...
```

## Design reference

UI layout and typography follow `design/Sustainability Prompt Coder.dc.html`.
