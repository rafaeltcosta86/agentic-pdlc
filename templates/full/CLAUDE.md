<!-- agentic-full -->
## Multi-Agent Pipeline

This project uses automated agents beyond the spec gate:

| Agent | Role | Trigger |
|---|---|---|
| Implementation Agent (Jules or custom) | Implements spec after `spec:approved` | `agent-trigger.yml` |
| QA Agent | Verifies PR against ACs via GitHub Models | `project-automation.yml` Variant B |
| Sentinel | Architecture audit via Gemini Code Assist CI | `architecture-violation` label |

**QA Labels — automation-owned, never apply manually:**
- `qa:approved` — QA Agent passed; card moves to Code Review
- `qa:needs-work` — QA Agent found issues; PR flow halts
- `infra:qa-broken` — QA Agent error; requires manual review

**Board Automation:**
`project-automation.yml` moves cards between board columns based on labels and PR events.
Column Option IDs and Project IDs are documented in `docs/pdlc.md`.

Read `docs/pdlc.md` for the full board layout, column IDs, and label reference.

**Pipeline Updates:**
To add or configure optional agents (Jules, QA Agent, Sentinel):
```bash
npx create-agentic-pdlc --update
```

Run this when asked to "update the pipeline", "configure the agents", or "update the board".
It detects what is already configured and sets up what is missing — without touching user-owned files.
