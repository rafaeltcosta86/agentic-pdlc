# Spike: Upstream Flow Gap Analysis

This document analyzes the three gaps identified in the upstream flow of the Agentic PDLC framework and proposes solutions to ensure future projects receive these behaviors out of the box.

## 1. Sprint start → cards move to Exploration automatically

**Analysis:**
Currently, when a PM selects issues for a sprint and tells the upstream agent to begin, the cards do not move automatically unless the agent explicitly runs a `gh issue edit` command.
- `AGENTS.md` does not instruct the upstream agent to add `stage:exploration` (or equivalent) as its first action upon starting.
- `project-automation.yml` does respond to the label `stage:exploration` and moves the card to the Exploration column.
- The label naming convention (`stage:exploration`, `stage:brainstorming`, `stage:detailing`) is established in the workflow but not explicitly documented as a mandatory first step for the agent.

**Solution (Gap):**
- **Fix:** Update `AGENTS.md` and `adapters/claude-code/skill.md` to explicitly instruct the agent: *"When beginning work on a new issue, your first action must be to apply the `stage:exploration` label using the GitHub CLI."*

## 2. Brainstorm gate — agent observes comments for PM approval

**Analysis:**
After the agent posts an exploration/brainstorming comment on the issue, it needs PM feedback (approval or requested changes) to proceed to Solution Detail.
- There is no mechanism (webhook or workflow) for the upstream agent to automatically detect PM approval in an issue comment.
- In current practice, the PM must manually notify the agent in the chat (e.g., "The brainstorm for #123 is approved").
- This is a known limitation of current agent interfaces (which require explicit chat prompts to resume execution) and is not documented in the framework.

**Solution (Gap):**
- **Fix:** Acknowledge this limitation in the framework documentation. Update `SETUP.md` and/or a new `docs/workflow-guide.md` to establish the pattern: *"To pass Gate 1 (Brainstorming), the PM must review the issue comments and explicitly tell the agent in the chat to proceed to detailing for that specific issue."*

## 3. spec:approved → implementation agent picks up the card

**Analysis:**
Cards in the "Approval" column wait for the PM to add the `spec:approved` label to signal the handoff to the implementation agent.
- `agent-trigger.yml` correctly fires on the `spec:approved` label and comments on the issue to notify the implementation agent (e.g., Jules).
- However, when `spec:approved` is added, `project-automation.yml` currently tries to move the card to `STATUS_APPROVAL` — which is the column it is already in.
- The intent is for the card to move to "Development" when the handoff occurs.

**Solution (Gap):**
- **Fix:** Update `project-automation.yml`. In the `move-card-on-label` job, change the target status for `spec:approved` from `STATUS_APPROVAL` to `STATUS_DEVELOPMENT`.

---
*This analysis addresses the questions raised in Issue #4.*
