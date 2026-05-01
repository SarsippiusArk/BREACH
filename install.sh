#!/usr/bin/env bash
STORE_DIR="${PNPM_STORE_PATH:-/home/sandbox/.pnpm-store}"
pnpm config set store-dir "$STORE_DIR" >/dev/null

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "[install] Installing dependencies (pnpm, prefer offline, frozen lockfile)..."
NODE_ENV=development PNPM_CONFIG_PRODUCTION=false pnpm install --config.confirmModulesPurge=false --prefer-offline --frozen-lockfile || true
# Fix occasional chmod permission errors on bin scripts
find node_modules/.pnpm -name "*.js" -path "*/bin/*" -exec chmod +x {} \; 2>/dev/null || true
