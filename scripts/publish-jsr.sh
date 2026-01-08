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

# Clean and prepare dist folder for JSR publishing
echo "Preparing dist folder for JSR publishing..."
rm -rf jsr_build
mkdir -p jsr_build

# Copy necessary files to dist
if [ -d "src" ]; then
  cp -r src jsr_build/
  # Remove test files from dist/src
  find jsr_build/src -name "*.test.ts" -type f -delete
fi

if [ -f "jsr.json" ]; then
  cp jsr.json jsr_build/
fi

cp package.json jsr_build/

# Copy README.md and LICENSE.txt if they exist
if [ -f "README.md" ]; then
  cp README.md jsr_build/
fi

if [ -f "LICENSE.txt" ]; then
  cp LICENSE.txt jsr_build/
fi

# Update exports, module, main, and types in package.json for JSR
echo "Updating package.json for JSR..."
jq '.exports["."] = "./src/index.ts" | .module = "./src/index.ts" | del(.main, .types)' jsr_build/package.json > jsr_build/package.json.tmp
mv jsr_build/package.json.tmp jsr_build/package.json

if [ -f "import_map.json" ]; then
  cp import_map.json jsr_build/

  # Update import_map.json with versioned dependencies
  echo "Updating import map with versioned dependencies..."
  IMPORT_MAP_PATH="jsr_build/import_map.json"

  # Get all package names from the import map
  PACKAGES=$(jq -r '.imports | keys[]' "$IMPORT_MAP_PATH")

  # Create a temporary file for the updated import map
  TMP_MAP=$(mktemp)
  cp "$IMPORT_MAP_PATH" "$TMP_MAP"

  for PKG in $PACKAGES; do
    # Extract package name without scope (e.g., tiny-qr from @levischuck/tiny-qr)
    PKG_DIR_NAME=$(echo "$PKG" | sed 's/.*\///')
    PKG_DIR="$PROJECT_ROOT/packages/$PKG_DIR_NAME"

    if [ -d "$PKG_DIR" ] && [ -f "$PKG_DIR/package.json" ]; then
      PKG_VERSION=$(jq -r '.version' "$PKG_DIR/package.json")
      echo "  $PKG@$PKG_VERSION"

      # Update the import map value to include version
      jq --arg pkg "$PKG" --arg version "@^$PKG_VERSION" \
        '.imports[$pkg] = (.imports[$pkg] + $version)' \
        "$TMP_MAP" > "$IMPORT_MAP_PATH"
      cp "$IMPORT_MAP_PATH" "$TMP_MAP"
    fi
  done

  rm "$TMP_MAP"

  # Update package.json dependencies with versioned imports from import map
  echo "Updating package.json dependencies with import map values..."
  PACKAGE_JSON_PATH="jsr_build/package.json"

  # Get all dependency keys from package.json
  DEPS=$(jq -r '(.dependencies // {}) | keys[]' "$PACKAGE_JSON_PATH" 2>/dev/null || echo "")

  if [ -n "$DEPS" ]; then
    # Create a temporary file for the updated package.json
    TMP_PKG=$(mktemp)
    cp "$PACKAGE_JSON_PATH" "$TMP_PKG"

    for DEP in $DEPS; do
      # Get the import map value for this dependency
      IMPORT_VALUE=$(jq -r --arg dep "$DEP" '.imports[$dep] // empty' "$IMPORT_MAP_PATH")

      if [ -n "$IMPORT_VALUE" ]; then
        echo "  Updating $DEP to $IMPORT_VALUE"
        # Update the dependency value in package.json
        jq --arg dep "$DEP" --arg value "$IMPORT_VALUE" \
          '.dependencies[$dep] = $value' \
          "$TMP_PKG" > "$PACKAGE_JSON_PATH"
        cp "$PACKAGE_JSON_PATH" "$TMP_PKG"
      fi
    done

    rm "$TMP_PKG"
  fi
fi

# Create deno.json from the modified package.json and jsr.json
echo "Creating deno.json..."
PACKAGE_JSON_PATH="jsr_build/package.json"
JSR_JSON_PATH="jsr_build/jsr.json"
DENO_JSON_PATH="jsr_build/deno.json"

# Start with essential fields from package.json
jq '{
  name: .name,
  version: .version,
  exports: .exports,
  license: .license,
  lock: false
}' "$PACKAGE_JSON_PATH" > "$DENO_JSON_PATH"

# Merge in fields from jsr.json if it exists
if [ -f "$JSR_JSON_PATH" ]; then
  TMP_DENO=$(mktemp)
  # Merge jsr.json into deno.json, with jsr.json taking precedence
  jq -s '.[0] * .[1]' "$DENO_JSON_PATH" "$JSR_JSON_PATH" > "$TMP_DENO"
  mv "$TMP_DENO" "$DENO_JSON_PATH"
fi

# Add import map if it exists
if [ -f "jsr_build/import_map.json" ]; then
  TMP_DENO=$(mktemp)
  jq '. + {"imports": input.imports}' "$DENO_JSON_PATH" jsr_build/import_map.json > "$TMP_DENO"
  mv "$TMP_DENO" "$DENO_JSON_PATH"
fi

echo "deno.json created successfully"

# Build the package before publishing to JSR
echo "Building $PACKAGE_NAME..."
bun run build:jsr

# Publish from the dist directory
cd jsr_build

if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "Running jsr publish --dry-run for $PACKAGE_NAME..."
  bunx jsr publish --dry-run --allow-dirty
else
  echo "Publishing $PACKAGE_NAME to JSR (version $LOCAL_VERSION)..."
  bunx jsr publish --allow-dirty
fi

cd ..
rm -rf jsr_build