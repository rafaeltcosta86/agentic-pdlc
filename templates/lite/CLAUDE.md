# {{PROJECT_NAME}} — Claude Code Instructions

> **The full behavioral contract (stage gates, workflow, spec format, label rules, PR gate) is in `AGENTS.md`. Read it before starting any work.**

## Claude Code-Specific

### Hook Enforcement

A `PreToolUse` hook automatically blocks `gh pr create` if the linked issue lacks `spec:approved`.
If blocked: check the issue labels and advance the spec before retrying.

### Invariants

{{EXTRA_PATTERNS}}
