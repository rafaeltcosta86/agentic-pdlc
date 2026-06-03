#!/bin/bash
# PDLC Stage Gate — blocks gh pr create and file edits without spec:approved on linked issue.
# Bypass: branch prefix hotfix/ skips all checks.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.command // ""' 2>/dev/null || echo "")
FILE_PATH=$(echo "$INPUT" | jq -r '.file_path // ""' 2>/dev/null || echo "")

IS_PR_CREATE=false
IS_FILE_EDIT=false

if echo "$COMMAND" | grep -q "gh pr create"; then
  IS_PR_CREATE=true
elif [ -n "$FILE_PATH" ]; then
  IS_FILE_EDIT=true
fi

if ! $IS_PR_CREATE && ! $IS_FILE_EDIT; then
  exit 0
fi

BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if echo "$BRANCH" | grep -qE "^hotfix/"; then
  exit 0
fi

ISSUE_NUM=$(echo "$BRANCH" | grep -oE '[0-9]+' | head -1)

if [ -z "$ISSUE_NUM" ]; then
  if $IS_FILE_EDIT; then
    exit 0
  fi
  echo "❌ PDLC Stage Gate: Cannot determine issue from branch '$BRANCH'."
  echo "   Use: feat/<issue-number>-<description> or hotfix/<issue-number>-<description>"
  exit 1
fi

LABELS=$(gh issue view "$ISSUE_NUM" --json labels --jq '[.labels[].name] | join(" ")' 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$LABELS" ]; then
  echo "❌ PDLC Stage Gate: Could not fetch labels for issue #$ISSUE_NUM."
  echo "   Missing condition: spec:approved"
  echo "   Next step: verify gh auth and issue number, then have PM add spec:approved."
  exit 1
fi

if echo "$LABELS" | grep -qw "spec:approved"; then
  exit 0
fi

STAGE=$(echo "$LABELS" | tr ' ' '\n' | grep "^stage:" | head -1 || echo "none")

if $IS_PR_CREATE; then
  echo "❌ PDLC Stage Gate: PR creation blocked — issue #$ISSUE_NUM missing spec:approved."
  echo "   Current stage: $STAGE"
  echo "   Missing condition: spec:approved (set by PM after reviewing spec in issue body)"
  echo "   Next step: complete spec → stage:approval → wait for PM to add spec:approved."
  echo "   Emergency bypass: rename branch to hotfix/<issue-number>-<description>."
else
  echo "❌ PDLC Stage Gate: File edit blocked — issue #$ISSUE_NUM missing spec:approved."
  echo "   Current stage: $STAGE"
  echo "   Missing condition: spec:approved (set by PM after reviewing spec in issue body)"
  echo "   Next step: complete spec → stage:approval → wait for PM to add spec:approved."
  echo "   Emergency bypass: rename branch to hotfix/<issue-number>-<description>."
fi
exit 1
