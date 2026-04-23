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
1. Read the issue entirely — understand its type (US/BUG/TASK/SPIKE) and the Acceptance Criteria.
2. Read `docs/pdlc.md` — understand the PDLC and the Definition of Done in this project.
3. Read all files mentioned in the issue's technical context.
4. Implement the **minimum viable change** that satisfies the ACs — do not refactor beyond scope.
5. Run tests: `echo "No tests/build needed."`
6. Run typecheck: `echo "No typecheck needed."`
7. Create a Pull Request with `Closes #N` in the body — automation moves the board.

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
