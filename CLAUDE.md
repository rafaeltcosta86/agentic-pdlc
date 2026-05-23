# agentic-pdlc

**What it is:** npm CLI (`npx create-agentic-pdlc`) that installs a PDLC workflow for AI agent projects. Stack: Markdown + GitHub Actions YAML only — never complex Node/Python/Bash scripts.

**Workflow:** `stage:exploration` → `stage:brainstorming` → `stage:detailing` → `spec:approved` → `stage:development` → PR → merge. Labels move the board automatically.

## Session Startup

Read: `AGENTS.md` (mandatory contract), `docs/pdlc.md` (board + labels — only when operating on the board).
Run: `gh issue list --state open --label "stage:development" --json number,title --jq '.[] | "#\(.number) \(.title)"'`

# PDLC Stage Gate

NEVER run `gh pr create` unless one of these is true:
- The linked issue has label `stage:approval`
- The branch name starts with `hotfix/`

Advance stages first: `exploration` → `brainstorming` → `detailing` → `approval`

The PreToolUse hook will block the action automatically if this rule is violated.

## Human-in-the-Loop

| Transition | Gate |
|---|---|
| → `stage:exploration` | Autonomous — apply immediately |
| → `stage:brainstorming` | Ask user — present exploration findings, wait for ok |
| → `stage:detailing` | Ask user — present brainstorming plan, wait for ok |
| → `stage:approval` | **Autonomous** — agent completes spec end-to-end, advances without asking |
| → `stage:development` | Human applies `spec:approved` label — that IS the gate |

**Detailing is fully autonomous.** Write the complete spec, add it to the issue, advance to `stage:approval` — no confirmation needed.
