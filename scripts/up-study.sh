#!/usr/bin/env bash
# Start the full study stack (N=100) and seed with reset.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-spc-study}"
export FRONTEND_PORT="${FRONTEND_PORT:-8081}"
export BACKEND_PORT="${BACKEND_PORT:-8001}"
export DB_PORT="${DB_PORT:-5434}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT}}"

echo "Starting study stack (project=${COMPOSE_PROJECT_NAME}, UI=${FRONTEND_PORT}, API=${BACKEND_PORT}, DB=${DB_PORT})…"
docker compose up --build -d

echo "Seeding study prompts (N=100) with --reset…"
docker compose run --rm backend python -m app.seed --reset \
  --prompts /study_data/prompts_eval_v1.csv \
  --participants data/participants.txt

echo
echo "Study stack is ready."
echo "  App:      http://localhost:${FRONTEND_PORT}"
echo "  Admin:    http://localhost:${FRONTEND_PORT}/admin"
echo "  API docs: http://localhost:${BACKEND_PORT}/docs"
echo "  Admin key: ${ADMIN_KEY:-dev-admin-key}"
echo "  Demo IDs:  see backend/data/participants.txt"
echo
echo "Stop:  ./scripts/down-study.sh"
echo "Wipe DB volume: ./scripts/down-study.sh --volumes"
