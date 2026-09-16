#!/usr/bin/env bash
set -euo pipefail

git add src/data/
MESSAGE="$(npx tsx scripts/format-forecast-commit.ts)"
git commit -m "$MESSAGE"
