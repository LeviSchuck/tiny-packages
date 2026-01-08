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

echo "Local version: $LOCAL_VERSION"

# Get published version from npm
NPM_PACKAGE_NAME=$(jq -r '.name' package.json)
NPM_VERSION=$(bun info "$NPM_PACKAGE_NAME" version 2>/dev/null || echo "not-published")

if [ "$NPM_VERSION" = "not-published" ]; then
  echo "Package not yet published to npm"
else
  echo "NPM version: $NPM_VERSION"

  if [ "$LOCAL_VERSION" = "$NPM_VERSION" ]; then
    echo "Version $LOCAL_VERSION is already published to npm. Skipping publish."
    exit 0
  fi
fi

PROV=""
if [ "$CI" = "true" ]; then
  PROV="--provenance"
fi

# Build the package (prepublishOnly will also build, but this ensures dry-run works)
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "Running npm publish --dry-run for $NPM_PACKAGE_NAME..."
  # For dry-run, we need to build manually since prepublishOnly doesn't run
  npm publish --dry-run $PROV
else
  echo "Publishing $NPM_PACKAGE_NAME to npm (version $LOCAL_VERSION)..."
  # prepublishOnly will build again, but that's fine as a safety check
  npm publish $PROV
fi
