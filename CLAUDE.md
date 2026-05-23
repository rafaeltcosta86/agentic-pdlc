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

## Human-in-the-Loop (MANDATORY)

NEVER apply `stage:brainstorming`, `stage:detailing`, `stage:approval`, or `stage:development` labels without **explicit user confirmation in the current conversation**.

- Apply `stage:exploration` autonomously (first action on any issue)
- For every subsequent stage: present findings/plan, stop, wait for user to say "ok" / "avança" / equivalent
- A PreToolUse hook enforces this at the system level — do not attempt to chain stage advances in a single command
