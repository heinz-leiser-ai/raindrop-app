#!/usr/bin/env bash
# Bump Patch-Version (package.json), Commit, alle Extension-Targets bauen.
# Nutzung: ./build-extension.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

npm version patch --no-git-tag-version

VER="$(node -p "require('./package.json').version")"

git add package.json package-lock.json
git commit -m "chore: Version ${VER}"

npm run build:extension

echo "OK: Version ${VER} committed, Extension-Build fertig (dist/*/prod)."
