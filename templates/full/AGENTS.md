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
1. **Stage Check**: Before applying any label or taking any action, run `gh issue view <N> --json labels,title` to determine the issue's current stage. State: *"Issue #N — [title] — is currently at `<stage>`. Requesting confirmation to advance to `<next>`."* Wait for an explicit stage-advancement signal in this conversation turn. A prioritization signal ("work on X", "tackle X next") does **not** count as confirmation — only an explicit signal counts (e.g. "start brainstorming", "yes advance", "go"). **Exceptions — skip this step and proceed directly**:
   - `spec:approved` → begin implementation (gate already passed)
   - `stage:development` → issue is owned by automation; do not intervene unless explicitly asked to fix a specific problem
   - `stage:approval` → spec already written; wait for PM to add `spec:approved` before doing anything
2. **Initial State**: Apply the `stage:brainstorming` label using the GitHub CLI (`gh issue edit <N> --add-label "stage:brainstorming"`). **Exception — pre-spec'd issue**: if the issue body already contains all required spec sections (`## Problem`, `## Solution`, `## Acceptance Criteria`, `## Edge Cases`, `## Out of Scope`, `## Files to Modify`) — all present and non-empty — apply `stage:approval` directly in a single call instead, skipping `stage:brainstorming` and `stage:detailing`.
3. Read the issue entirely — understand its type (US/BUG/TASK/SPIKE) and the Acceptance Criteria.
4. Read `docs/pdlc.md` — understand the PDLC and the Definition of Done in this project.
5. Read all files mentioned in the issue's technical context.
6. Implement the **minimum viable change** that satisfies the ACs — do not refactor beyond scope.
7. Run tests: `{{TEST_COMMAND}}`
8. Run typecheck (if applicable): `{{TYPECHECK_COMMAND}}`
9. Create a Pull Request with `Closes #N` in the body — automation moves the board.

## Spec Format

When writing or rewriting an issue body during detailing, include ALL sections below. Omitting any section blocks `stage:approval`.

**Destination: the issue body.** Write spec content to the issue body using `gh issue edit <N> --body "..."` — not to a file. A file is acceptable as optional reference only. Automation checks the issue body for `## Acceptance Criteria` and `## Files to Modify` to advance the stage; content that exists only in a file is invisible to it.

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

## Stage Transition Rules (non-negotiable)

MUST apply `stage:brainstorming` label immediately on starting work — before reading
any code, before invoking any skill. Then read context and present problem summary
+ 2–3 solution options in a single message.

MUST NOT add `stage:detailing` label until the user has explicitly selected
an approach in the current conversation turn. Work done in a prior
planning session does NOT count as confirmation.

MUST NOT add `spec:approved` or `stage:development` — these represent final
human approval or automation output. Adding them manually triggers irreversible
automation (Jules dispatch, board move).

MUST NOT manually add `stage:approval` except via the pre-spec'd exception
below. In the standard flow, `stage:approval` is set after you write a complete
spec and the user confirms; it is not applied before the spec exists.

Each stage transition requires a fresh explicit signal from the user in the same
session where the transition happens. The pre-spec'd exception is the only
deviation from this rule.

**Pre-spec'd exception**: if the issue body already contains all required spec
sections (`## Problem`, `## Solution`, `## Acceptance Criteria`, `## Edge Cases`,
`## Out of Scope`, `## Files to Modify`) — all present and non-empty — apply
`stage:approval` directly in a single `gh issue edit` call, skipping
`stage:brainstorming` and `stage:detailing`. One label event eliminates the
race condition that causes the project board to land on the wrong column.

## ⛔ NEVER Open a PR Without `spec:approved`

**This is the most important rule in this file.**

Opening a PR without `spec:approved` on the linked issue bypasses the human review gate and breaks the PDLC contract with your team.

**Before running `gh pr create`, always verify:**

```bash
gh issue view <N> --json labels --jq '.labels[].name'
# Must include: spec:approved
```

If `spec:approved` is not present — stop. Go back to the issue, complete the spec, advance to `stage:approval`, and wait for the PM to add the label.

> Claude Code enforces this automatically via a PreToolUse hook.
> All other agents must enforce it manually — treat it as a hard constraint, not a guideline.

## Pipeline Updates

To add or configure optional agents (Jules, QA Agent, Sentinel) at any time:

```bash
npx create-agentic-pdlc --update
```

Run this when the user says anything like "update the pipeline", "update the board", or "configure the agents". It detects what is already configured and interactively sets up what is missing — without touching this file or any user-owned config.

## What NOT to do

- Never commit directly to `main`.
- Never open a PR without passing the tests.
- Never implement beyond the immediate scope of the issue.
- Never create future-proofing abstractions for hypothetical features.
- The agent MUST NOT apply these labels under any circumstances (PM only):
  - `spec:approved`: triggers Jules dispatch + board move to Development.
  - `qa:approved`: triggers board move to Code Review.
  - `qa:needs-work`: signals the PR requires changes and halts the flow.
- Never add or remove stage:* labels manually, except: `stage:brainstorming` as the initial label when starting work, or `stage:approval` directly when applying the pre-spec'd exception. All other stage transitions are owned by GitHub Actions automation and the PM.
{{EXTRA_DONT}}

## Project Standards

- **Tests:** `{{TEST_COMMAND}}`
- **Lint/Types:** `{{LINT_COMMAND}}`
- **Typecheck:** `{{TYPECHECK_COMMAND}}`
- **Build:** `{{BUILD_COMMAND}}`
{{EXTRA_PATTERNS}}
