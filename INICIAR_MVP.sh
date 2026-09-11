#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
if ! command -v node >/dev/null 2>&1; then
  echo 'Se necesita Node.js 26 o superior para iniciar el MVP.'
  exit 1
fi
if [ ! -d node_modules ]; then
  echo 'Primero ejecuta npm install en esta carpeta.'
  exit 1
fi
npm run dev
