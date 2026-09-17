#!/usr/bin/env bash
set -euo pipefail

PR_NUMBER="${PR_NUMBER:?PR_NUMBER is required}"
REVIEW_JSON="${REVIEW_JSON:?REVIEW_JSON is required}"

json="$(printf '%s\n' "$REVIEW_JSON" | jq -n -c 'input | select(.decision != null)' 2>/dev/null || true)"

if [[ -z "$json" ]]; then
  snippet="$(printf '%s\n' "$REVIEW_JSON" | head -c 2000)"
  gh pr comment "$PR_NUMBER" --body "❌ Review nie zwrócił poprawnego JSON.

\`\`\`
${snippet}
\`\`\`"
  exit 0
fi

DECISION="$(printf '%s\n' "$json" | jq -r '.decision')"
SUMMARY="$(printf '%s\n' "$json" | jq -r '.summary')"
ISSUES="$(printf '%s\n' "$json" | jq -r 'if (.issues | length) == 0 then "brak" else (.issues | join(", ")) end')"

if [[ "$DECISION" == "PASS" ]]; then
  ICON="✅ Zatwierdzono"
else
  ICON="❌ Odrzucono"
fi

BODY="${ICON}

${SUMMARY}

Problemy: ${ISSUES}"

gh pr comment "$PR_NUMBER" --body "$BODY"
