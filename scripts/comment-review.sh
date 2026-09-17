#!/usr/bin/env bash
set -euo pipefail

PR_NUMBER="${PR_NUMBER:?PR_NUMBER is required}"
REVIEW_JSON="${REVIEW_JSON:?REVIEW_JSON is required}"

if ! echo "$REVIEW_JSON" | jq -e '.decision' >/dev/null 2>&1; then
  snippet="$(echo "$REVIEW_JSON" | head -c 2000)"
  gh pr comment "$PR_NUMBER" --body "❌ Review nie zwrócił poprawnego JSON.

\`\`\`
${snippet}
\`\`\`"
  exit 1
fi

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

Problemy: ${ISSUES}"

gh pr comment "$PR_NUMBER" --body "$BODY"
