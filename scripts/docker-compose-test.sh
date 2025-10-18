#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.dev.yml"

echo "🚀 Starting Helpernote local test environment (Docker Compose)"
echo "─────────────────────────────────────────────────────────────"

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Error: docker is not installed or not in PATH." >&2
  echo "Install Docker (https://docs.docker.com/get-docker/) and try again." >&2
  exit 1
fi

# Check if Docker Compose is available
if ! docker compose version >/dev/null 2>&1; then
  echo "❌ Error: docker compose is not available." >&2
  echo "Please install Docker Compose v2 or use docker-compose (v1)." >&2
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
docker compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check PostgreSQL
if docker compose -f "$COMPOSE_FILE" ps | grep -q "postgres.*healthy"; then
  echo "✅ PostgreSQL is healthy"
else
  echo "⚠️  PostgreSQL is not healthy yet, waiting..."
  sleep 10
fi

# Check MinIO
if docker compose -f "$COMPOSE_FILE" ps | grep -q "minio.*healthy"; then
  echo "✅ MinIO is healthy"
else
  echo "⚠️  MinIO is not healthy yet, waiting..."
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
echo "  docker compose -f docker-compose.dev.yml down"
echo "  or: make dev-down"
echo "─────────────────────────────────────────────────────────────"
