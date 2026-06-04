# {{PROJECT_NAME}}

**What it is:** {{PROJECT_DESCRIPTION}}

## Non-Negotiable Invariants

1. **Minimum viable change** — implement exactly what the spec says. No refactoring beyond scope, no future-proofing, no abstractions for hypothetical needs.
2. **Spec before code** — never edit files, create branches, or commit unless the linked issue has label `spec:approved` (set by PM only) or the branch starts with `hotfix/`.

## Stage Gate

Three labels gate every issue:

| Label | Who sets it | What it unlocks |
|---|---|---|
| `stage:brainstorming` | Agent (first action) | Reading code + presenting options |
| `stage:approval` | Agent (after spec is written) | Signals spec is ready for PM review |
| `spec:approved` | **PM only** | Clears agent to implement |

**NEVER apply `spec:approved`.** The PM sets it after reviewing the spec in the issue body. Applying it triggers irreversible automation.

## Workflow

1. Apply `stage:brainstorming` immediately — before reading code or invoking any tool.
2. Read the issue. Present problem summary + 2–3 solution options. **Stop and wait for PM to choose.**
3. Once PM selects an approach, write the complete spec into the issue body (`gh issue edit <N> --body "..."`). Advance to `stage:approval`.
4. **Stop.** Wait for PM to add `spec:approved`.
5. After `spec:approved`: create branch, implement minimum viable change, open PR with `Closes #N`.

## Hook Behavior

A `PreToolUse` hook blocks `gh pr create` unless:
- The linked issue has `spec:approved`, **or**
- The branch name starts with `hotfix/`

If blocked: check the issue labels before retrying.

## What NOT to Do

- Never commit to `main` directly.
- Never open a PR without `spec:approved` on the linked issue.
- Never implement beyond the immediate scope of the spec.
- Never add abstractions, error handling, or features for hypothetical future needs.
- Never apply `spec:approved`, `stage:development`, or `qa:*` — these are PM/automation only.
