#!/usr/bin/env bash
set -euo pipefail

PR_NUMBER="${PR_NUMBER:?PR_NUMBER is required}"
REVIEW_JSON="${REVIEW_JSON:?REVIEW_JSON is required}"

DECISION="$(echo "$REVIEW_JSON" | jq -r '.decision')"
SUMMARY="$(echo "$REVIEW_JSON" | jq -r '.summary')"
ISSUES="$(echo "$REVIEW_JSON" | jq -r 'if (.issues | length) == 0 then "brak" else (.issues | join(", ")) end')"

if [[ "$DECISION" == "PASS" ]]; then
  ICON="✅ Zatwierdzono"
else
  ICON="❌ Odrzucono"
fi

BODY="${ICON}

${SUMMARY}

Problemy: ${ISSUES}

Rekomendacja modelu jest słaba — na stronie pod wynikami jest ten disclaimer."

gh pr comment "$PR_NUMBER" --body "$BODY"
