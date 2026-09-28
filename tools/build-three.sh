#!/usr/bin/env sh
# Ricostruisce vendor/three-guglielmo.min.js da una versione precisa di Three.js (licenza MIT).
# Uso: sh tools/build-three.sh [versione]   (predefinita: quella indicata sotto)
set -eu
VERSION="${1:-0.186.1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
npm init -y >/dev/null
npm install --silent --no-audit --no-fund "three@$VERSION" "esbuild@0.25"
cp "$ROOT/tools/three-guglielmo.entry.js" ./entry.js
npx esbuild ./entry.js --bundle --minify --format=esm --target=es2020 \
  --legal-comments=none \
  --banner:js="/*! three.js r$(echo "$VERSION" | cut -d. -f2) (solo i moduli usati da Guglielmo) | MIT License | https://github.com/mrdoob/three.js/blob/dev/LICENSE */" \
  --outfile="$ROOT/vendor/three-guglielmo.min.js"
echo "Creato vendor/three-guglielmo.min.js (three@$VERSION)"
