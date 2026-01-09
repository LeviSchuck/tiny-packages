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
    # exit 0
  fi
fi

PROV=""
if [ "$CI" = "true" ]; then
  PROV="--provenance"
fi

# Run build before creating npm_build
echo "Running build..."
bun run build

# Create npm_build folder
NPM_BUILD_DIR="$PACKAGE_DIR/npm_build"
echo "Creating build directory: $NPM_BUILD_DIR"
rm -rf "$NPM_BUILD_DIR"
mkdir -p "$NPM_BUILD_DIR"

# Copy files to npm_build
echo "Copying files to npm_build..."
cp -r dist "$NPM_BUILD_DIR/" 2>/dev/null || true
cp .gitignore "$NPM_BUILD_DIR/" 2>/dev/null || true
cp .npmignore "$NPM_BUILD_DIR/" 2>/dev/null || true
cp LICENSE.txt "$NPM_BUILD_DIR/" 2>/dev/null || true
cp package.json "$NPM_BUILD_DIR/"
cp README.md "$NPM_BUILD_DIR/" 2>/dev/null || true
cp tsconfig.json "$NPM_BUILD_DIR/" 2>/dev/null || true
cp vite.config.ts "$NPM_BUILD_DIR/" 2>/dev/null || true

# Change to npm_build directory
cd "$NPM_BUILD_DIR"

# Remove prepublishOnly script from package.json
echo "Removing prepublishOnly script..."
jq 'del(.scripts.prepublishOnly)' package.json > package.json.tmp && mv package.json.tmp package.json

# Update workspace dependencies to actual versions
echo "Updating workspace dependencies..."
TEMP_PKG=$(mktemp)
jq -r '.dependencies // {} | to_entries[] | select(.value == "workspace:*") | .key' package.json | while read -r dep_name; do
  # Extract package name from scoped name (e.g., @levischuck/tiny-qr -> tiny-qr)
  WORKSPACE_PKG_NAME="${dep_name##*\/}"
  WORKSPACE_PKG_DIR="$PROJECT_ROOT/packages/$WORKSPACE_PKG_NAME"

  if [ -d "$WORKSPACE_PKG_DIR" ]; then
    DEP_VERSION=$(jq -r '.version' "$WORKSPACE_PKG_DIR/package.json")
    echo "  Updating $dep_name: workspace:* -> ^$DEP_VERSION"
    jq --arg dep "$dep_name" --arg ver "^$DEP_VERSION" '.dependencies[$dep] = $ver' package.json > "$TEMP_PKG" && mv "$TEMP_PKG" package.json
  fi
done

DRY=""
if [ "$DRY_RUN" = "--dry-run" ]; then
  DRY="--dry-run"
fi
if [ "$DRY_RUN" = "--dryrun" ]; then
  DRY="--dry-run"
fi

# Build the package (prepublishOnly will also build, but this ensures dry-run works)
echo "Publishing $NPM_PACKAGE_NAME to npm (version $LOCAL_VERSION)..."
echo npm publish $DRY $PROV
npm publish $DRY $PROV

# Clean up
cd "$PACKAGE_DIR"
echo "Cleaning up npm_build directory..."
# rm -rf "$NPM_BUILD_DIR"
