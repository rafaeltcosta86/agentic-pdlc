# PDLC Stage Gate

NEVER run `gh pr create` unless one of these is true:
- The linked issue has label `stage:approval`
- The branch name starts with `hotfix/`

Advance stages first: `exploration` → `brainstorming` → `detailing` → `approval`

The PreToolUse hook will block the action automatically if this rule is violated.
