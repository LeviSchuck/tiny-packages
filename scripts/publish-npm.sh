#!/bin/bash
set -e

# Publish a package to npm
# Usage: ./scripts/publish-npm.sh <package-name> [--dry-run]
# Example: ./scripts/publish-npm.sh tiny-png --dry-run

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PACKAGE_NAME=$1
DRY_RUN=$2

if [ -z "$PACKAGE_NAME" ]; then
  echo "Error: Package name is required"
  echo "Usage: ./scripts/publish-npm.sh <package-name> [--dry-run]"
  exit 1
fi

PACKAGE_DIR="$PROJECT_ROOT/packages/$PACKAGE_NAME"

if [ ! -d "$PACKAGE_DIR" ]; then
  echo "Error: Package directory $PACKAGE_DIR does not exist"
  exit 1
fi

cd "$PACKAGE_DIR"

# Build the package (prepublishOnly will also build, but this ensures dry-run works)
echo "Building $PACKAGE_NAME..."
bun run build

if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "Running npm publish --dry-run for $PACKAGE_NAME..."
  # For dry-run, we need to build manually since prepublishOnly doesn't run
  bun publish --dry-run
else
  echo "Publishing $PACKAGE_NAME to npm..."
  # prepublishOnly will build again, but that's fine as a safety check
  bun publish
fi
