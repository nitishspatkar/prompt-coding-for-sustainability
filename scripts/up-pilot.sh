#!/usr/bin/env bash
# Start the pilot stack (N=20) and seed with reset.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-spc-pilot}"
export FRONTEND_PORT="${FRONTEND_PORT:-8080}"
export BACKEND_PORT="${BACKEND_PORT:-8000}"
export DB_PORT="${DB_PORT:-5433}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT}}"

echo "Starting pilot stack (project=${COMPOSE_PROJECT_NAME}, UI=${FRONTEND_PORT}, API=${BACKEND_PORT}, DB=${DB_PORT})…"
docker compose up --build -d

echo "Seeding pilot prompts (N=20) with --reset…"
docker compose run --rm backend python -m app.seed --reset \
  --prompts /study_data/prompts_pilot_v1.csv \
  --participants data/participants_pilot.txt

echo
echo "Pilot is ready."
echo "  App:      http://localhost:${FRONTEND_PORT}"
echo "  Admin:    http://localhost:${FRONTEND_PORT}/admin"
echo "  API docs: http://localhost:${BACKEND_PORT}/docs"
echo "  Admin key: ${ADMIN_KEY:-dev-admin-key}"
echo "  Demo IDs:  P-PILOT-01, P-PILOT-02, P-PILOT-03"
echo
echo "Stop:  ./scripts/down-pilot.sh"
echo "Wipe DB volume: ./scripts/down-pilot.sh --volumes"
