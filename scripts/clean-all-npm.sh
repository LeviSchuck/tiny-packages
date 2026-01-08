#!/bin/bash
set -e

# Clean all package builds by removing dist directories
# Usage: ./scripts/clean-all-npm.sh

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Cleaning all package builds..."

# Remove dist directories from all packages
for package in packages/*/; do
  if [ -d "${package}dist" ]; then
    echo "Removing ${package}dist"
    rm -rf "${package}dist"
  fi
done

echo "All package builds cleaned successfully!"
