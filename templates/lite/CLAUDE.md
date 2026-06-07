# {{PROJECT_NAME}} — Claude Code Instructions

> **The full behavioral contract (stage gates, workflow, spec format, label rules, PR gate) is in `AGENTS.md`. Read it before starting any work.**

## Claude Code-Specific

### Hook Enforcement

A `PreToolUse` hook blocks `gh pr create` unless the linked issue has `spec:approved`, `stage:development`, or `human-approved`.
If blocked: check the issue labels and advance the spec before retrying.

### Invariants

{{EXTRA_PATTERNS}}
