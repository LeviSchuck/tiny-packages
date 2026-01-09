#!/bin/bash
set -e

# Build all packages in dependency order
# Usage: ./scripts/build-all-npm.sh

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Building all packages in dependency order..."

# Read packages from workspace.json
PACKAGES=$(jq -r '.packages[]' "$PROJECT_ROOT/workspace.json")

# Build packages in dependency order
for package in $PACKAGES; do
  echo "Building $package..."
  cd "$PROJECT_ROOT/packages/$package" && bun run build
done

cd "$PROJECT_ROOT"

echo "All packages built successfully!"
