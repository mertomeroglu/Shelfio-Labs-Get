#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_NAME="${PROJECT_NAME:-getshelfio}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
FRONTEND_PORT="${FRONTEND_PORT:-3007}"
BACKEND_PORT="${BACKEND_PORT:-4017}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${BACKEND_PORT}/health}"

cd "$REPO_DIR"

log() {
  printf '[deploy] %s\n' "$1"
}

port_in_use_by_other_project() {
  local port="$1"
  docker ps --format '{{.Names}} {{.Ports}}' \
    | grep -E "0\.0\.0\.0:${port}->|127\.0\.0\.1:${port}->|\[::\]:${port}->" \
    | grep -v "^${PROJECT_NAME}-" >/dev/null
}

log "Fetching ${DEPLOY_BRANCH}"
git fetch --prune origin "$DEPLOY_BRANCH"
git reset --hard "origin/${DEPLOY_BRANCH}"

log "Validating compose configuration"
docker compose -p "$PROJECT_NAME" config >/dev/null

if port_in_use_by_other_project "$FRONTEND_PORT"; then
  log "Port ${FRONTEND_PORT} is already used by another Docker project"
  exit 1
fi

if port_in_use_by_other_project "$BACKEND_PORT"; then
  log "Port ${BACKEND_PORT} is already used by another Docker project"
  exit 1
fi

log "Building production images"
docker compose -p "$PROJECT_NAME" build

log "Running database migrations"
docker compose -p "$PROJECT_NAME" run --rm --no-deps shelfio-service-api npm run db:migrate:prod

log "Starting services"
docker compose -p "$PROJECT_NAME" up -d

log "Checking backend health"
for attempt in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    log "Health check passed"
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    log "Health check failed"
    docker compose -p "$PROJECT_NAME" ps
    exit 1
  fi

  sleep 2
done

if command -v nginx >/dev/null 2>&1; then
  log "Reloading nginx"
  nginx -t
  systemctl reload nginx
fi

log "Deploy finished"
