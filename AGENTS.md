# agentic-pdlc — AI Agent Instructions

This template is the contract between the project and any external AI agent 
(Claude Code, Cursor, Copilot, Jules, Codex, Sweep, etc.). Read this before committing any change.

## Project Overview

The Agentic PDLC Framework is a lightweight, universal boilerplate that standardizes how your AI assistants (Claude, Cursor, Copilot, etc.) interpret tasks, respect your project's rules, and collaborate seamlessly from an idea to production.

**Structure:**
Markdown documentation and GitHub Actions YAMLs.

## Before Any Change

```bash
git fetch origin && git checkout main && git pull
```

Always start from the current `main` HEAD. Never work over stale snapshots.

## Invariants / Non-negotiable business rules

1. **Keep it Lightweight & Universal**: Never introduce complex scripts (Node, Python, Bash) if a simple Markdown instruction or standard GitHub Action step suffices. The framework must remain easy for solo developers to adopt regardless of their tech stack.
2. **Template Purity**: Never remove `{{SCREAMING_SNAKE_CASE}}` placeholders from the files inside the `templates/` folder. They must remain intact for the Setup Mode replacement logic to work.
3. **No Placeholders in Root**: Conversely, files in the root (like `README.md` or `SETUP.md`) are for human readers on GitHub. Never leave unreplaced template variables in root documents.

## Mandatory Workflow

0. **Identity**: Always prefix your GitHub comments with `🤖 **Agent:** ` to distinguish yourself.
1. **Stage Check**: Before applying any label or taking any action, run `gh issue view <N> --json labels,title` to determine the issue's current stage. State: *"Issue #N — [title] — is currently at `<stage>`. Requesting confirmation to advance to `<next>`."* Wait for an explicit stage-advancement signal in this conversation turn. A prioritization signal ("work on X", "tackle X next") does **not** count as confirmation — only an explicit signal counts (e.g. "start brainstorming", "yes advance", "go"). **Exception**: if the issue already has `spec:approved`, proceed directly to development without asking.
2. **Initial State**: Apply the `stage:brainstorming` label using the GitHub CLI (`gh issue edit <N> --add-label "stage:brainstorming"`). **Exception — pre-spec'd issue**: if the issue body already contains all required spec sections (`## Problem`, `## Solution`, `## Acceptance Criteria`, `## Edge Cases`, `## Out of Scope`, `## Files to Modify`) — all present and non-empty — apply `stage:approval` directly in a single call instead, skipping `stage:brainstorming` and `stage:detailing`.
3. Read the issue entirely — understand its type (US/BUG/TASK/SPIKE) and the Acceptance Criteria.
4. Read `docs/pdlc.md` — understand the PDLC and the Definition of Done in this project.
5. Read all files mentioned in the issue's technical context.
6. Implement the **minimum viable change** that satisfies the ACs — do not refactor beyond scope.
7. Run tests: `echo "No tests/build needed."`
8. Run typecheck: `echo "No typecheck needed."`
9. Create a Pull Request with `Closes #N` in the body — automation moves the board.

## Spec Format

When writing or rewriting an issue body during detailing, include ALL sections below. Omitting any section blocks `stage:approval`.

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

## What NOT to do

- Never commit directly to `main`.
- Never open a PR without passing the tests.
- Never implement beyond the immediate scope of the issue.
- Never create future-proofing abstractions for hypothetical features.


## Project Standards

- **Tests:** `echo "No tests/build needed."`
- **Lint/Types:** `echo "No tests/build needed."`
- **Typecheck:** `echo "No typecheck needed."`
- **Build:** `echo "No tests/build needed."`
- **Canonical secret name:** `PROJECT_TOKEN` (not `PROJECT_PAT`) — use this in all workflow files, both live and templates
