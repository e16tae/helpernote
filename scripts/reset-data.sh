#!/bin/bash
# Reset all local development data (PostgreSQL + MinIO)
# Usage: ./scripts/reset-data.sh [--docker|--nerdctl]

set -e

COMPOSE_TYPE="${1:-auto}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Helpernote Data Reset Script         ║${NC}"
echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo ""

# Auto-detect compose type
if [ "$COMPOSE_TYPE" = "auto" ]; then
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        COMPOSE_TYPE="docker"
    elif command -v nerdctl &> /dev/null; then
        COMPOSE_TYPE="nerdctl"
    else
        echo -e "${RED}Error: Neither docker compose nor nerdctl found${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Detected compose type: $COMPOSE_TYPE${NC}"
echo ""

# Confirm action
echo -e "${RED}WARNING: This will DELETE ALL data in PostgreSQL and MinIO!${NC}"
echo -e "${YELLOW}This includes:${NC}"
echo "  - All database tables and records"
echo "  - All uploaded files in MinIO"
echo "  - All container volumes"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

cd "$PROJECT_ROOT"

if [ "$COMPOSE_TYPE" = "docker" ]; then
    echo -e "${YELLOW}Using Docker Compose...${NC}"

    # Stop and remove containers
    echo "1. Stopping containers..."
    docker compose -f docker-compose.dev.yml down -v 2>/dev/null || true

    # Remove volumes
    echo "2. Removing volumes..."
    docker volume rm helpernote-postgres-data 2>/dev/null || true
    docker volume rm helpernote-minio-data 2>/dev/null || true

    # Clean up local data directories
    echo "3. Cleaning local data directories..."
    rm -rf .docker/postgres-data
    rm -rf .docker/minio-data

    # Restart containers
    echo "4. Starting fresh containers..."
    docker compose -f docker-compose.dev.yml up -d

    # Wait for services to be ready
    echo "5. Waiting for services to be ready..."
    sleep 5

    # Check health
    echo "6. Checking service health..."
    docker compose -f docker-compose.dev.yml ps

elif [ "$COMPOSE_TYPE" = "nerdctl" ]; then
    echo -e "${YELLOW}Using nerdctl compose...${NC}"

    # Check if we need sudo
    NERDCTL_CMD="nerdctl"
    if ! nerdctl ps &> /dev/null; then
        NERDCTL_CMD="sudo nerdctl"
    fi

    # Stop and remove containers
    echo "1. Stopping containers..."
    $NERDCTL_CMD compose -f nerd-compose.yaml down -v 2>/dev/null || true

    # Remove volumes manually
    echo "2. Removing volumes..."
    $NERDCTL_CMD volume rm helpernote-postgres-data 2>/dev/null || true
    $NERDCTL_CMD volume rm helpernote-minio-data 2>/dev/null || true
    $NERDCTL_CMD volume rm nerd_postgres-data 2>/dev/null || true
    $NERDCTL_CMD volume rm nerd_minio-data 2>/dev/null || true

    # Restart containers
    echo "3. Starting fresh containers..."
    $NERDCTL_CMD compose -f nerd-compose.yaml up -d

    # Wait for services to be ready
    echo "4. Waiting for services to be ready..."
    sleep 5

    # Check health
    echo "5. Checking service health..."
    $NERDCTL_CMD compose -f nerd-compose.yaml ps
fi

# Create MinIO bucket
echo ""
echo -e "${YELLOW}Setting up MinIO bucket...${NC}"
sleep 2

if command -v mc &> /dev/null; then
    echo "Configuring MinIO client..."
    mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null || true

    echo "Creating 'helpernote' bucket..."
    mc mb local/helpernote 2>/dev/null || echo "  Bucket already exists or MinIO not ready yet"

    echo "Listing buckets..."
    mc ls local/ || echo "  MinIO not ready yet, you may need to run: mc mb local/helpernote"
else
    echo -e "${YELLOW}MinIO client (mc) not found. Please create bucket manually:${NC}"
    echo "  mc alias set local http://localhost:9000 minioadmin minioadmin"
    echo "  mc mb local/helpernote"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Data Reset Complete!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Run database migrations (if needed)"
echo "  2. Create test users"
echo "  3. Start backend and frontend"
echo ""
echo "Quick start:"
echo "  cd backend && cargo run"
echo "  cd frontend && npm run dev"
