#!/usr/bin/env bash
# Stop the study Compose project.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-spc-study}"
export FRONTEND_PORT="${FRONTEND_PORT:-8081}"
export BACKEND_PORT="${BACKEND_PORT:-8001}"
export DB_PORT="${DB_PORT:-5434}"

if [[ "${1:-}" == "--volumes" || "${1:-}" == "-v" ]]; then
  echo "Stopping study and removing DB volume (coding data will be deleted)…"
  docker compose down -v
else
  echo "Stopping study (DB volume kept)…"
  docker compose down
fi
