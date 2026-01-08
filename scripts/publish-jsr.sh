#!/bin/bash
set -e

# Publish a package to JSR
# Usage: ./scripts/publish-jsr.sh <package-name> [--dry-run]
# Example: ./scripts/publish-jsr.sh tiny-png --dry-run

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PACKAGE_NAME=$1
DRY_RUN=$2

if [ -z "$PACKAGE_NAME" ]; then
  echo "Error: Package name is required"
  echo "Usage: ./scripts/publish-jsr.sh <package-name> [--dry-run]"
  exit 1
fi

PACKAGE_DIR="$PROJECT_ROOT/packages/$PACKAGE_NAME"

if [ ! -d "$PACKAGE_DIR" ]; then
  echo "Error: Package directory $PACKAGE_DIR does not exist"
  exit 1
fi

cd "$PACKAGE_DIR"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed"
  exit 1
fi

# Get local version from package.json
LOCAL_VERSION=$(jq -r '.version' package.json)
if [ -z "$LOCAL_VERSION" ] || [ "$LOCAL_VERSION" = "null" ]; then
  echo "Error: Could not read version from package.json"
  exit 1
fi

# Get JSR package name from package.json (e.g., @levischuck/tiny-encodings)
JSR_PACKAGE_NAME=$(jq -r '.name' package.json)
if [ -z "$JSR_PACKAGE_NAME" ] || [ "$JSR_PACKAGE_NAME" = "null" ]; then
  echo "Error: Could not read package name from package.json"
  exit 1
fi

echo "Local version: $LOCAL_VERSION"

# Get published version from JSR
JSR_VERSION=$(bunx jsr info "$JSR_PACKAGE_NAME" 2>/dev/null | grep latest | cut -d"|" -f 1 | cut -d"@" -f3 | tr -d ' ' || echo "not-published")

if [ "$JSR_VERSION" = "not-published" ] || [ -z "$JSR_VERSION" ]; then
  echo "Package not yet published to JSR"
else
  echo "JSR version: $JSR_VERSION"

  if [ "$LOCAL_VERSION" = "$JSR_VERSION" ]; then
    echo "Version $LOCAL_VERSION is already published to JSR. Skipping publish."
    exit 0
  fi
fi

# Build the package before publishing to JSR
echo "Building $PACKAGE_NAME..."
bun run build

if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "Running jsr publish --dry-run for $PACKAGE_NAME..."
  bunx jsr publish --dry-run
else
  echo "Publishing $PACKAGE_NAME to JSR (version $LOCAL_VERSION)..."
  bunx jsr publish
fi
