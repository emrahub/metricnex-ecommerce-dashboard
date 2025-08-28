#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/server-logs"
mkdir -p "$LOG_DIR"

kill_port() {
  PORT="$1"
  if command -v lsof >/dev/null 2>&1; then
    PID=$(lsof -ti tcp:"$PORT" || true)
    if [ -n "$PID" ]; then
      echo "Killing process on port $PORT (PID: $PID)"
      kill -9 $PID || true
      sleep 1
    fi
  fi
}

echo "Starting backend (port 3000)..."
(
  cd "$ROOT_DIR/backend"
  # Ensure uploads dir exists for reports
  mkdir -p uploads/reports
  # In dev: disable auth checks; force demo mode OFF for real analytics
  export DISABLE_AUTH=true
  export DEMO_MODE=false
  export FORCE_LISTEN=true
  export NODE_ENV=development
  nohup npm run dev > "$LOG_DIR/backend.log" 2>&1 & echo $! > "$LOG_DIR/backend.pid"
) 

echo "Starting frontend (port 3001)..."
(
  cd "$ROOT_DIR/frontend"
  kill_port 3001
  nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 & echo $! > "$LOG_DIR/frontend.pid"
)

echo "\nLogs: $LOG_DIR"
echo "Backend: http://localhost:3000 (health: /health)"
echo "Frontend: http://localhost:3001"
