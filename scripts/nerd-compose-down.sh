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

# Check if --volumes flag is provided
if [[ "${1:-}" == "--volumes" ]] || [[ "${1:-}" == "-v" ]]; then
  echo "Stopping containers and removing volumes..."
  nerdctl compose -f "$COMPOSE_FILE" down -v
  echo "✅ Containers stopped and volumes removed"
else
  echo "Stopping containers..."
  nerdctl compose -f "$COMPOSE_FILE" down
  echo "✅ Containers stopped (volumes preserved)"
  echo "💡 Use --volumes flag to also remove volumes"
fi
