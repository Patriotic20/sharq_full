#!/usr/bin/env bash
# Build the frontend via Docker and write ./frontend/dist to the host.
# Usage: ./scripts/build-frontend.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/frontend"

docker run --rm \
  -v "$PWD":/app \
  -v /app/node_modules \
  -w /app \
  node:20-alpine \
  sh -c "npm ci && npm run build"

echo "✓ dist written to $REPO_ROOT/frontend/dist"
