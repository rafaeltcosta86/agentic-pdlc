# PDLC — agentic-pdlc

## Board Columns

| Column | Meaning | Who moves the card |
|---|---|---|
| 💡 Idea | Backlog — every new issue lands here | Manual |
| 🔍 Exploration | AI is analyzing code and context | Label `stage:exploration` |
| 🧠 Brainstorming | AI proposed approaches and trade-offs | Label `stage:brainstorming` |
| 📐 Detail Solution | AI is writing the technical spec | Label `stage:detailing` |
| ✅ Approval | Your turn, awaiting `spec:approved` label | Label `spec:approved` |
| ⚙️ Development | AI implementing the spec | Label `stage:development` |
| 🧪 Testing | CI pipeline running | GitHub Actions |
| 👁 Code Review / PR | PR opened, awaiting human review | GitHub Actions |
| 🚀 Production | Merged | GitHub Actions |

<!--
Adapt columns as needed. The functional baseline is:
💡 Idea → ⚙️ Development → 👁 Code Review / PR → 🚀 Production
-->

## Board Identifiers (GitHub Projects)

```
PROJECT_ID   = {{PROJECT_ID}}
STATUS_FIELD = {{STATUS_FIELD_ID}}
REPO         = {{REPO_OWNER}}/{{REPO_NAME}}
```

## Column Option IDs

| Column | Option ID |
|---|---|
| 💡 Idea | `{{ID_IDEA}}` |
| 🔍 Exploration | `{{ID_EXPLORATION}}` |
| 🧠 Brainstorming | `{{ID_BRAINSTORMING}}` |
| 📐 Detail Solution | `{{ID_DETAIL}}` |
| ✅ Approval | `{{ID_APPROVAL}}` |
| ⚙️ Development | `{{ID_DEVELOPMENT}}` |
| 🧪 Testing | `{{ID_TESTING}}` |
| 👁 Code Review / PR | `{{ID_CODE_REVIEW_PR}}` |
| 🚀 Production | `{{ID_PRODUCTION}}` |

## Agent × Phase Mapping

| Phase | Responsible |
|---|---|
| 💡 → 📐 (upstream) | Claude (or ideation agent) in conversational session |
| ⚙️ → 🔀 (downstream) | {{IMPLEMENTATION_AGENT}} (e.g. Jules `@google-labs-jules`) |
| 👁 Code Review / PR | Human (you) |
| Automatic transitions | GitHub Actions |

## Issue Title Conventions

```
[icon] [PREFIX]: [short description, imperative tense]

👤 US:     user story
🐛 BUG:    bug
🔧 TASK:   operational task
🔬 SPIKE:  exploration/evaluation spike
```

## Labels

| Label | Entity | Color | Meaning |
|---|---|---|---|
| `stage:exploration` | Issue | Purple | Issue is being evaluated |
| `stage:brainstorming` | Issue | Pink | Proposed approaches awaiting PM gate |
| `stage:detailing` | Issue | Blue | Technical spec is being written |
| `stage:development` | Issue | Orange | Agent is implementing the spec |
| `spec:approved` | Issue | Green | Gate 2 — agent is cleared to implement |
| `pr:in-review` | PR | Yellow | Awaiting code review |
| `pr:approved` | PR | Green | Code review approved |

## Approval Gates

**Gate 1 — PM/Ideation (Brainstorming):**
You comment on the issue approving one of the approaches proposed by the ideation agent.
Format: *"Approved — proceed with option X."*

**Gate 2 — Tech Lead (Spec):**
You add the `spec:approved` label to the issue after reviewing the technical spec in the body.
This triggers the implementation agent via `agent-trigger.yml`.

## Shortcuts by Type

- **BUG** — Skips Brainstorming; enters Detail Solution with diagnostics + fix.
- **TASK** — Skips Brainstorming; enters Detail Solution with operational steps.
- **SPIKE** — Never reaches Development; delivery is a concluding comment.
- **US** — Full flow observing both gates.

## Definition of Done

An issue is truly done when:
- [ ] All Acceptance Criteria described in the body are implemented
- [ ] Tests passing: `echo "No tests/build needed."`
- [ ] No invariant violations (CI green)
- [ ] Associated PR explicitly contains `Closes #N`
- [ ] Basic manual smoke test executed after deploy (when applicable)
