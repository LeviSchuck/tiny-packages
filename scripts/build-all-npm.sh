#!/bin/bash
set -e

# Build all packages in dependency order
# Usage: ./scripts/build-all-npm.sh

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Building all packages in dependency order..."

# Build packages in dependency order
cd packages/tiny-png && bun run build
cd ../tiny-qr && bun run build
cd ../tiny-qr-png && bun run build
cd ../tiny-qr-svg && bun run build
cd ../..

echo "All packages built successfully!"
