#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/nerd-compose.yaml"

if ! command -v nerdctl >/dev/null 2>&1; then
  echo "Error: nerdctl is not installed or not in PATH." >&2
  echo "Install nerdctl (https://github.com/containerd/nerdctl) and try again." >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: $COMPOSE_FILE not found." >&2
  exit 1
fi

mkdir -p "$PROJECT_ROOT/.docker/postgres-data" "$PROJECT_ROOT/.docker/minio-data"

nerdctl compose -f "$COMPOSE_FILE" up -d "$@"
