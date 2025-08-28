#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/server-logs"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

mkdir -p "$LOG_DIR"

echo "==> Checking Node.js version"
NODE_VERSION=$(node -v || true)
echo "Node: $NODE_VERSION"

echo "==> Installing backend dependencies"
(
  cd "$BACKEND_DIR"
  npm ci
)

echo "==> Installing frontend dependencies"
(
  cd "$FRONTEND_DIR"
  npm ci
)

echo "==> Ensuring backend .env exists"
if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo "Created backend/.env from .env.example"
fi

echo "==> Starting backend (port 3000)"
(
  cd "$BACKEND_DIR"
  mkdir -p uploads/reports
  nohup npm run dev > "$LOG_DIR/backend.log" 2>&1 & echo $! > "$LOG_DIR/backend.pid"
)

sleep 1

echo "==> Ensuring port 3001 is free for frontend"
if command -v lsof >/dev/null 2>&1; then
  PID=$(lsof -ti tcp:3001 || true)
  if [ -n "$PID" ]; then
    echo "Killing process on port 3001 (PID: $PID)"
    kill -9 $PID || true
    sleep 1
  fi
fi

echo "==> Starting frontend (port 3001)"
(
  cd "$FRONTEND_DIR"
  nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 & echo $! > "$LOG_DIR/frontend.pid"
)

echo "\n==> Done."
echo "Backend:  http://localhost:3000  (health: /health)"
echo "Frontend: http://localhost:3001"
echo "Logs at:  $LOG_DIR"
