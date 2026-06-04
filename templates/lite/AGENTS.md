# {{PROJECT_NAME}} — AI Agent Instructions

This is the contract between the project and any external AI agent
(Claude Code, Cursor, Copilot, Codex, Sweep, etc.). Read this before committing any change.

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
1. **Minimum viable change** — implement exactly what the spec says; no future-proofing.
2. **Human-in-the-Loop** — No external side-effect actions without explicit human approval.
3. **Immutable Audit-Log** — INSERT only on audit_log; never UPDATE/DELETE.
-->

## Mandatory Workflow

0. **Identity**: Always prefix your GitHub comments with `🤖 **Agent:** ` to distinguish yourself.
1. **Stage Check**: Run `gh issue view <N> --json labels,title` to determine current stage.
   - `spec:approved` → begin implementation (gate already passed)
   - `stage:approval` → spec written; wait for PM to add `spec:approved`
   - Otherwise → follow the stage gate below
2. Apply `stage:brainstorming` before reading any code: `gh issue edit <N> --add-label "stage:brainstorming"`
3. Read the issue entirely — understand type and Acceptance Criteria.
4. Read all files mentioned in the issue's technical context.
5. Present problem summary + 2–3 solution options. **Stop and wait for PM choice.**
6. Once PM selects an approach, write the complete spec into the issue body. Advance to `stage:approval`.
7. Wait for PM to add `spec:approved`. Then implement the **minimum viable change** that satisfies the ACs.
8. Run tests: `{{TEST_COMMAND}}`
9. Create a Pull Request with `Closes #N` in the body.

## Spec Format

**Destination: the issue body.** Write spec content using `gh issue edit <N> --body "..."` — not to a file.
Automation checks the issue body for `## Acceptance Criteria` and `## Files to Modify`.

```
## Problem
[1-3 sentences. What fails. Who affected. Measured impact.]

## Sprint Goal / Success Metrics
| Metric | Baseline | Target | When |
|--------|----------|--------|------|

## Solution
[Behavioral description of what is built. No implementation details.]

## Acceptance Criteria
**AC1 — [name]**
- Given [precondition]
- When [action]
- Then [outcome]

## Edge Cases
- EC1: [condition] → [expected behavior]

## Out of Scope
- [item] — reason

## Non-Functional Requirements
- Performance: [metric with number]
- Security: [constraint]
- Reliability: [constraint]
> For pure docs/markdown issues with zero runtime behavior, include the NFRs section and state "N/A".

## Files to Modify
- `path/to/file` — what changes
```

## Stage Gate Labels

| Label | Who sets it | Meaning |
|---|---|---|
| `stage:brainstorming` | Agent | Brainstorming started — first action before reading code |
| `stage:detailing` | Agent | Spec is being written |
| `stage:approval` | Agent | Spec complete, awaiting PM review |
| `spec:approved` | **PM only** | Gate cleared — implement |

**NEVER apply `spec:approved`, `stage:development`, or `qa:*`.** These are owned by the PM and automation.

## Stage Transition Rules (non-negotiable)

MUST apply `stage:brainstorming` immediately on starting work — before reading any code,
before invoking any skill.

MUST NOT add `stage:detailing` until the user has explicitly selected an approach
in the current conversation turn.

MUST NOT add `spec:approved` or any approval-trigger label under any circumstances.

Each stage transition requires a fresh explicit signal from the user in the same session.

## What NOT to Do

- Never commit directly to `main`.
- Never open a PR without `spec:approved` on the linked issue.
- Never implement beyond the immediate scope of the issue.
- Never create future-proofing abstractions for hypothetical features.
{{EXTRA_DONT}}

## Project Standards

- **Tests:** `{{TEST_COMMAND}}`
- **Lint/Types:** `{{LINT_COMMAND}}`
- **Typecheck:** `{{TYPECHECK_COMMAND}}`
- **Build:** `{{BUILD_COMMAND}}`
{{EXTRA_PATTERNS}}
