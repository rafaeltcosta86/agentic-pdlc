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
1. Read the issue entirely — understand its type (US/BUG/TASK/SPIKE) and the Acceptance Criteria.
2. Read `docs/pdlc.md` — understand the PDLC and the Definition of Done in this project.
3. Read all files mentioned in the issue's technical context.
4. Implement the **minimum viable change** that satisfies the ACs — do not refactor beyond scope.
5. Run tests: `{{TEST_COMMAND}}`
6. Create a Pull Request with `Closes #N` in the body — automation moves the board.

## What NOT to do

- Never commit directly to `main`.
- Never open a PR without passing the tests.
- Never implement beyond the immediate scope of the issue.
- Never create future-proofing abstractions for hypothetical features.
{{EXTRA_DONT}}

## Project Standards

- **Tests:** `{{TEST_COMMAND}}`
- **Lint/Types:** `{{LINT_COMMAND}}`
- **Build:** `{{BUILD_COMMAND}}`
{{EXTRA_PATTERNS}}
