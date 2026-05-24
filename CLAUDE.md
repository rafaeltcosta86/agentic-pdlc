# agentic-pdlc

**What it is:** npm CLI (`npx create-agentic-pdlc`) that installs a PDLC workflow for AI agent projects. Stack: Markdown + GitHub Actions YAML only — never complex Node/Python/Bash scripts.

**Workflow:** `stage:exploration` → `stage:brainstorming` → `stage:detailing` → `spec:approved` → `stage:development` → PR → merge. Labels move the board automatically.

## Session Startup

Read: `AGENTS.md` (mandatory contract), `docs/pdlc.md` (board + labels — only when operating on the board).
Run: `gh issue list --state open --label "stage:development" --json number,title --jq '.[] | "#\(.number) \(.title)"'`

# PDLC Stage Gate

NEVER run `gh pr create` unless one of these is true:
- The linked issue has label `spec:approved`
- The branch name starts with `hotfix/`

NEVER edit files, create branches, or commit unless the linked issue has label `spec:approved` (set by human PM only) or the branch name starts with `hotfix/`.

Advance stages first: `exploration` → `brainstorming` → `detailing` → `approval` → (human adds `spec:approved`) → `development`

The PreToolUse hook will block `gh pr create` automatically if this rule is violated.

## Human-in-the-Loop

| Transition | Gate |
|---|---|
| → `stage:exploration` | Autonomous — apply immediately |
| → `stage:brainstorming` | Ask user — present exploration findings, wait for ok |
| → `stage:detailing` | Ask user — present brainstorming plan, wait for ok |
| → `stage:approval` | **Autonomous** — agent completes spec end-to-end, advances without asking |
| `spec:approved` | **Human PM only** — agent waits; never adds this label |
| → `stage:development` | Human applies `spec:approved` label — that IS the gate |

**Detailing is fully autonomous.** Write the complete spec, add it to the issue, advance to `stage:approval` — no confirmation needed. Then **stop and wait** for human to add `spec:approved` before any implementation.

## Stage Transition Rules (non-negotiable)

MUST NOT add `stage:brainstorming` label until exploration findings have been
presented to the user and the user has responded in the current conversation turn.

MUST NOT add `stage:detailing` label until the user has explicitly confirmed
the proposed approach in the current conversation turn. Work done in a prior
planning session does NOT count as confirmation.

MUST NOT add `spec:approved` or any approval-trigger label under any
circumstances — these are set by the PM (human) only, after reviewing the spec
in the issue body. Adding them triggers irreversible automation (Jules dispatch,
board move).

MUST NOT add or remove `stage:development`, `spec:approved`, or `qa:*` labels —
these are owned by GitHub Actions automation and the PM. The agent is responsible
for applying `stage:exploration`, `stage:brainstorming`, `stage:detailing`, and
`stage:approval` as part of the prescribed workflow above.

Each stage transition requires a fresh explicit signal from the user in the same
session where the transition happens. These rules have no exceptions.
