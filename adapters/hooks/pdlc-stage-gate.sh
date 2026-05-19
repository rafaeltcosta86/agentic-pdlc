#!/bin/bash
# PDLC Stage Gate — blocks gh pr create without stage:approval on linked issue.
# Bypass: branch prefix hotfix/ skips all checks.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | node -e "const d=JSON.parse(require('fs').readFileSync(0)); console.log(d.command || '')" 2>/dev/null || echo "")

if ! echo "$COMMAND" | grep -q "gh pr create"; then
  exit 0
fi

BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if echo "$BRANCH" | grep -qE "^hotfix/"; then
  echo "✅ PDLC: Hotfix branch — stage gate bypassed."
  exit 0
fi

ISSUE_NUM=$(echo "$BRANCH" | grep -oE '[0-9]+' | head -1)

if [ -z "$ISSUE_NUM" ]; then
  echo "❌ PDLC Stage Gate: Cannot determine issue from branch '$BRANCH'."
  echo "   Use: feat/<issue-number>-<description> or hotfix/<issue-number>-<description>"
  exit 1
fi

LABELS=$(gh issue view "$ISSUE_NUM" --json labels --jq '[.labels[].name] | join(" ")' 2>/dev/null || echo "")

if echo "$LABELS" | grep -qw "stage:approval"; then
  echo "✅ PDLC: Issue #$ISSUE_NUM approved — gate passed."
  exit 0
fi

if echo "$LABELS" | grep -qw "stage:development"; then
  echo "✅ PDLC: Issue #$ISSUE_NUM in development (spec already approved) — gate passed."
  exit 0
fi

STAGE=$(echo "$LABELS" | tr ' ' '\n' | grep "^stage:" | head -1 || echo "none")
echo "❌ PDLC Stage Gate: Issue #$ISSUE_NUM is not approved."
echo "   Current stage: $STAGE"
echo "   Required: stage:approval or stage:development label on the issue."
echo "   Emergency bypass: rename branch to hotfix/<issue-number>-<description>."
exit 1
