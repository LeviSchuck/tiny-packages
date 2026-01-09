#!/bin/bash
set -e

# Clean all package builds by removing dist directories
# Usage: ./scripts/clean-all-npm.sh

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Cleaning all package builds..."

# Read packages from workspace.json
PACKAGES=$(jq -r '.packages[]' "$PROJECT_ROOT/workspace.json")

# Remove dist directories from all packages
for package in $PACKAGES; do
  package_path="packages/$package"
  if [ -d "${package_path}/dist" ]; then
    echo "Removing ${package_path}/dist"
    rm -rf "${package_path}/dist"
  fi
  if [ -d "${package_path}/npm_build" ]; then
    echo "Removing ${package_path}/npm_build"
    rm -rf "${package_path}/npm_build"
  fi
done

echo "All package builds cleaned successfully!"
