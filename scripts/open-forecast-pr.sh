#!/usr/bin/env bash
set -euo pipefail

BRANCH="${BRANCH:-forecast/$(date -u +%Y-%m-%d)}"
TITLE="$(npx tsx -e "
import { readFileSync } from 'node:fs';
import { ForecastSchema } from './src/domain/forecast.ts';
import { toCommitSummary } from './src/domain/forecast-view.ts';
const forecast = ForecastSchema.parse(JSON.parse(readFileSync('src/data/latest.json', 'utf8')));
console.log('forecast: ' + toCommitSummary(forecast));
")"

EXISTING="$(gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number' 2>/dev/null || true)"

if [[ -n "$EXISTING" && "$EXISTING" != "null" ]]; then
  echo "$EXISTING"
  exit 0
fi

gh pr create \
  --head "$BRANCH" \
  --base main \
  --title "$TITLE" \
  --body "Automatyczna prognoza paliw wygenerowana przez agenta badawczego."

gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number'
