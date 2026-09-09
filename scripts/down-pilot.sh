#!/usr/bin/env bash
# Stop the pilot Compose project.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-spc-pilot}"
export FRONTEND_PORT="${FRONTEND_PORT:-8080}"
export BACKEND_PORT="${BACKEND_PORT:-8000}"
export DB_PORT="${DB_PORT:-5433}"

if [[ "${1:-}" == "--volumes" || "${1:-}" == "-v" ]]; then
  echo "Stopping pilot and removing DB volume (coding data will be deleted)…"
  docker compose down -v
else
  echo "Stopping pilot (DB volume kept)…"
  docker compose down
fi
