# agentic-pdlc

**What it is:** npm CLI (`npx create-agentic-pdlc`) that installs a PDLC workflow for AI agent projects.

**Workflow:** `stage:brainstorming` → `stage:detailing` → `spec:approved` → `stage:development` → PR → merge. Labels move the board automatically.

## Session Startup

Read: `AGENTS.md` (mandatory contract), `docs/pdlc.md` (board + labels — only when operating on the board).
Run: `gh issue list --state open --label "stage:development" --json number,title --jq '.[] | "#\(.number) \(.title)"'`

# PDLC Stage Gate

NEVER run `gh pr create` unless one of these is true:
- The linked issue has label `spec:approved`
- The branch name starts with `hotfix/`

NEVER edit files, create branches, or commit unless the linked issue has label `spec:approved` (set by human PM only) or the branch name starts with `hotfix/`.

Advance stages first: `brainstorming` → `detailing` → `approval` → (human adds `spec:approved`) → `development`

The PreToolUse hook will block `gh pr create` automatically if this rule is violated.

## Human-in-the-Loop

| Transition | Gate |
|---|---|
| → `stage:brainstorming` | Autonomous — apply immediately |
| → `stage:detailing` | Ask user — present problem summary + options, wait for choice |
| → `stage:approval` | **Autonomous** — agent completes spec end-to-end, advances without asking |
| `spec:approved` | **Human PM only** — agent waits; never adds this label |
| → `stage:development` | Human applies `spec:approved` label — that IS the gate |

**Detailing is fully autonomous.** Write the complete spec, add it to the issue, advance to `stage:approval` — no confirmation needed. Then **stop and wait** for human to add `spec:approved` before any implementation.

**Spec destination: the issue body.** Write spec content to the issue body using `gh issue edit <N> --body "..."` — not to a file. A file is acceptable as optional reference only. Automation checks the issue body for `## Acceptance Criteria` and `## Files to Modify` to advance the stage; content that exists only in a file is invisible to it.

## Stage Transition Rules (non-negotiable)

MUST apply `stage:brainstorming` label immediately on starting work — before
reading any code, before invoking any skill. Then read context and present
problem summary + 2–3 solution options in a single message.

MUST NOT add `stage:detailing` label until the user has explicitly selected
an approach in the current conversation turn. Work done in a prior
planning session does NOT count as confirmation.

MUST NOT add `spec:approved` or any approval-trigger label under any
circumstances — these are set by the PM (human) only, after reviewing the spec
in the issue body. Adding them triggers irreversible automation (Jules dispatch,
board move).

MUST NOT add or remove `stage:development`, `spec:approved`, or `qa:*` labels —
these are owned by GitHub Actions automation and the PM. The agent is responsible
for applying `stage:brainstorming`, `stage:detailing`, and `stage:approval` as
part of the prescribed workflow above.

Each stage transition requires a fresh explicit signal from the user in the same
session where the transition happens. These rules have no exceptions.
