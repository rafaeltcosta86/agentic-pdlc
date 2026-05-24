# {{PROJECT_NAME}} — AI Agent Instructions

This template is the contract between the project and any external AI agent 
(Claude Code, Cursor, Copilot, Jules, Codex, Sweep, etc.). Read this before committing any change.

## Project Overview

{{PROJECT_DESCRIPTION}}

**Structure:**
{{PROJECT_STRUCTURE}}

## Before Any Change

```bash
git fetch origin && git checkout main && git pull
```

Always start from the current `main` HEAD. Never work over stale snapshots.

## Invariants / Non-negotiable business rules

{{INVARIANTS}}
<!-- Examples:
1. **Human-in-the-Loop** — No external side-effect actions without explicit human approval.
2. **Immutable Audit-Log** — It's strictly forbidden to UPDATE/DELETE on audit_log; INSERT only.
3. **Credential Isolation** — Decryption occurs only in a specific service.
-->

## Mandatory Workflow

0. **Identity**: Always prefix your GitHub comments with `🤖 **Agent:** ` to distinguish yourself.
1. **Initial State**: When beginning work on a new issue, your very first action must be to apply the `stage:brainstorming` label using the GitHub CLI (`gh issue edit <N> --add-label "stage:brainstorming"`). **Exception — pre-spec'd issue**: if the issue body already contains all required spec sections (`## Problem`, `## Solution`, `## Acceptance Criteria`, `## Edge Cases`, `## Out of Scope`, `## Files to Modify`) — all present and non-empty — apply `stage:approval` directly in a single call instead, skipping `stage:brainstorming` and `stage:detailing`.
2. Read the issue entirely — understand its type (US/BUG/TASK/SPIKE) and the Acceptance Criteria.
3. Read `docs/pdlc.md` — understand the PDLC and the Definition of Done in this project.
4. Read all files mentioned in the issue's technical context.
5. Implement the **minimum viable change** that satisfies the ACs — do not refactor beyond scope.
6. Run tests: `{{TEST_COMMAND}}`
7. Run typecheck (if applicable): `{{TYPECHECK_COMMAND}}`
8. Create a Pull Request with `Closes #N` in the body — automation moves the board.

### Spec format (Upstream Agents)

When detailing a solution in an issue body, you must **always** include both the user story and the acceptance criteria. Never append only the ACs to an existing text; rewrite the full issue body in this standard format:

```
**As** [user],
**I want** [action],
**so that** [benefit].

---

## Acceptance Criteria

**AC1 — ...**
- Given ...
- When ...
- Then ...

**AC2 — ...**
...

## Files to modify
- `path/to/file.ts` — what changes
```

## Stage Transition Rules (non-negotiable)

MUST apply `stage:brainstorming` label immediately on starting work — before reading
any code, before invoking any skill. Then read context and present problem summary
+ 2–3 solution options in a single message.

MUST NOT add `stage:detailing` label until the user has explicitly selected
an approach in the current conversation turn. Work done in a prior
planning session does NOT count as confirmation.

MUST NOT add `spec:approved`, `stage:development`, or manually add
`stage:approval` — these represent final human approval or the result of it.
`stage:approval` is only set by system automation after you provide a complete
spec for human review. Adding them manually triggers irreversible automation
(Jules dispatch, board move).

Each stage transition requires a fresh explicit signal from the user in the same
session where the transition happens. These rules have no exceptions.

**Pre-spec'd exception**: if the issue body already contains all required spec
sections (`## Problem`, `## Solution`, `## Acceptance Criteria`, `## Edge Cases`,
`## Out of Scope`, `## Files to Modify`) — all present and non-empty — apply
`stage:approval` directly in a single `gh issue edit` call, skipping
`stage:brainstorming` and `stage:detailing`. One label event eliminates the
race condition that causes the project board to land on the wrong column.

## What NOT to do

- Never commit directly to `main`.
- Never open a PR without passing the tests.
- Never implement beyond the immediate scope of the issue.
- Never create future-proofing abstractions for hypothetical features.
- The agent MUST NOT apply these labels under any circumstances (PM only):
  - `spec:approved`: triggers Jules dispatch + board move to Development.
  - `qa:approved`: triggers board move to Code Review.
  - `qa:needs-work`: signals the PR requires changes and halts the flow.
{{EXTRA_DONT}}

## Project Standards

- **Tests:** `{{TEST_COMMAND}}`
- **Lint/Types:** `{{LINT_COMMAND}}`
- **Typecheck:** `{{TYPECHECK_COMMAND}}`
- **Build:** `{{BUILD_COMMAND}}`
{{EXTRA_PATTERNS}}
