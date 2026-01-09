#!/bin/bash
set -e

# Publish all packages in order to npm and JSR
# Usage: ./scripts/publish-all.sh [--dry-run]
# Packages are published in dependency order:
# 1. tiny-png (no dependencies)
# 2. tiny-qr (no dependencies)
# 3. tiny-qr-png (depends on tiny-qr and tiny-png)
# 4. tiny-qr-svg (depends on tiny-qr)

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

DRY_RUN=$1

# Read packages from workspace.json
PACKAGES=$(jq -r '.packages[]' "$PROJECT_ROOT/workspace.json")

for PACKAGE in $PACKAGES; do
  echo ""
  echo "=========================================="
  echo "Publishing $PACKAGE"
  echo "=========================================="
  
  # Publish to npm
  if [ "$DRY_RUN" = "--dry-run" ]; then
    "$SCRIPT_DIR/publish-npm.sh" "$PACKAGE" --dry-run
  else
    "$SCRIPT_DIR/publish-npm.sh" "$PACKAGE"
  fi
  
  echo ""
done

echo "All packages published successfully!"
