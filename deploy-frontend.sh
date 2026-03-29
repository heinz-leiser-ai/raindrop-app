#!/usr/bin/env bash
# Alle Source-Aenderungen + Patch-Version committen und pushen.
# Vercel baut automatisch nach Push.
# Nutzung: ./deploy-frontend.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

npm version patch --no-git-tag-version

VER="$(node -p "require('./package.json').version")"

git add -A -- src/ package.json package-lock.json
git commit -m "chore: Version ${VER}" --allow-empty

git push origin HEAD

echo "OK: Version ${VER} committed und gepusht. Vercel deployed automatisch."
