#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/nerd-compose.yaml"

echo "🚀 Starting Helpernote local test environment (nerdctl compose)"
echo "─────────────────────────────────────────────────────────────"

# Check if nerdctl is installed
if ! command -v nerdctl >/dev/null 2>&1; then
  echo "❌ Error: nerdctl is not installed or not in PATH." >&2
  echo "Install nerdctl (https://github.com/containerd/nerdctl) and try again." >&2
  exit 1
fi

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ Error: $COMPOSE_FILE not found." >&2
  exit 1
fi

# Create data directories
mkdir -p "$PROJECT_ROOT/.docker/postgres-data" "$PROJECT_ROOT/.docker/minio-data"

# Start containers
echo ""
echo "📦 Starting PostgreSQL and MinIO containers..."
nerdctl compose -f "$COMPOSE_FILE" up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
if nerdctl exec nerd-postgres-1 pg_isready -U helpernote >/dev/null 2>&1; then
  echo "✅ PostgreSQL is ready"
else
  echo "⚠️  PostgreSQL is not ready yet, waiting..."
  sleep 10
fi

# Check MinIO
if curl -sf http://localhost:9000/minio/health/live >/dev/null 2>&1; then
  echo "✅ MinIO is ready"
else
  echo "⚠️  MinIO is not ready yet, waiting..."
  sleep 10
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "✅ Test environment is ready!"
echo ""
echo "Services:"
echo "  PostgreSQL: localhost:5432"
echo "  MinIO API:  localhost:9000"
echo "  MinIO UI:   http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "Next steps:"
echo "  1. Run backend tests:  cd backend && cargo test"
echo "  2. Run frontend tests: cd frontend && npm test"
echo "  3. Run E2E tests:      cd frontend && npm run test:e2e"
echo ""
echo "To stop:"
echo "  nerdctl compose -f nerd-compose.yaml down"
echo "  or: ./scripts/nerd-compose-down.sh"
echo "─────────────────────────────────────────────────────────────"
