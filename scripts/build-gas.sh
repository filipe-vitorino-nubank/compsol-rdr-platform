#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo "==> Building with Vite (single-file)..."
npm run build

echo "==> Copying Apps Script server files to dist/..."
cp gas/Code.js dist/Code.js
cp gas/appsscript.json dist/appsscript.json

echo "==> Injecting GAS template tag into dist/index.html..."
if grep -q '<?!= appConfig ?>' dist/index.html; then
  echo "    (template tag already present, skipping)"
else
  sed -i.bak 's|<head>|<head><script>window.__APP_CONFIG__ = JSON.parse('"'"'<?!= appConfig ?>'"'"');</script>|' dist/index.html
  rm -f dist/index.html.bak
fi

echo "==> Verifying dist/ contents..."
ls -lh dist/

BUNDLE_SIZE=$(wc -c < dist/index.html | tr -d ' ')
LIMIT=1572864
if [ "$BUNDLE_SIZE" -gt "$LIMIT" ]; then
  echo "ERROR: dist/index.html is ${BUNDLE_SIZE} bytes (limit: ${LIMIT}). Reduce bundle size."
  exit 2
fi
echo "    index.html size: ${BUNDLE_SIZE} bytes (limit: ${LIMIT})"

if ! grep -q 'function doGet' dist/Code.js; then
  echo "ERROR: doGet not found in dist/Code.js"
  exit 2
fi

echo "==> Build complete. Pushing to Apps Script..."
clasp push --force

echo "==> Deploying..."
clasp deploy --description "deploy $(date +'%Y-%m-%d %H:%M')"

DEPLOY_ID=$(clasp deployments 2>/dev/null | grep -o 'AKfycb[^ ]*' | tail -1)

if [ -n "$DEPLOY_ID" ]; then
  echo ""
  echo "🌐 App URL:"
  echo "https://script.google.com/a/macros/nubank.com.br/s/${DEPLOY_ID}/exec"
  echo ""
fi
