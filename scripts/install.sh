#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "[Error] Node.js is not installed or not on PATH." >&2
  echo "Please install Node.js 18 or later before running this script." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[Error] npm is not installed or not on PATH." >&2
  echo "Please install npm 9 or later before running this script." >&2
  exit 1
fi

cd "${PROJECT_ROOT}"

echo "Installing dependencies..."
npm install

echo
echo "✅ Installation complete. You can now launch the app using scripts/start.sh or scripts\\start.bat on Windows."
