# {{PROJECT_NAME}} — Gemini CLI Instructions

> **The full behavioral contract (stage gates, workflow, spec format, label rules, PR gate) is in `AGENTS.md`. Read it before starting any work.**

## Gemini CLI-Specific

### Enforcement Note

Gemini CLI has no PreToolUse hook. The `spec:approved` gate must be enforced manually.

Before running `gh pr create`, always verify:

```bash
gh issue view <N> --json labels --jq '.labels[].name'
# Must include: spec:approved
```

If `spec:approved` is not present — stop. Complete the spec, advance to `stage:approval`, and wait for the PM.

### Invariants

{{EXTRA_PATTERNS}}
