# PDLC — {{PROJECT_NAME}}

## Board Columns

| Column | Meaning | Who moves the card |
|---|---|---|
| 💡 Idea | Backlog — tell agent: "work on issue #XX" | Don't move manually |
| 🧠 Brainstorming | AI reading context, proposing approaches and trade-offs | Label `stage:brainstorming` |
| 📐 Detail Solution | Claude is writing the technical spec | Label `stage:detailing` |
| ✅ Approval | Spec ready, awaiting `spec:approved` label | Label `spec:approved` |
| ⚙️ Development | Agent implementing the spec | Label `stage:development` |
| 🧪 Testing | CI pipeline or AI QA Agent running (Variant B) | GitHub Actions / QA Agent |
| 👁 Code Review / PR | PR opened (Variant A) or QA passed (Variant B) | GitHub Actions |
| 🚀 Ready for Production | Merged | GitHub Actions |

<!--
Adapt columns as needed. The functional baseline is:
💡 Idea → ⚙️ Development → 👁 Code Review / PR → 🚀 Ready for Production
-->

## Workflow Variants (QA Agent)

- **Variant A (Default):** PRs bypass the `Testing` column and land directly in `Code Review / PR`.
- **Variant B (QA Agent Enabled):** PRs land in the `Testing` column first. An AI QA agent verifies the PR, adding `qa:approved` or `qa:needs-work`. Only after a `qa:approved` is the issue moved to `Code Review / PR`.

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
| 🧠 Brainstorming | `{{ID_BRAINSTORMING}}` |
| 📐 Detail Solution | `{{ID_DETAIL}}` |
| ✅ Approval | `{{ID_APPROVAL}}` |
| ⚙️ Development | `{{ID_DEVELOPMENT}}` |
| 🧪 Testing | `{{ID_TESTING}}` |
| 👁 Code Review / PR | `{{ID_CODE_REVIEW_PR}}` |
| 🚀 Ready for Production | `{{ID_READY_FOR_PRODUCTION}}` |

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

✨ feat:   new feature or behavioral change
🐛 BUG:    bug
🔧 TASK:   operational task
🔬 SPIKE:  exploration/evaluation spike
```

## Labels

| Label | Entity | Color | Meaning |
|---|---|---|---|
| `stage:brainstorming` | Issue | Pink | Proposed approaches awaiting PM gate |
| `stage:detailing` | Issue | Blue | Technical spec is being written |
| `stage:development` | Issue | Orange | Agent is implementing the spec |
| `spec:approved` | Issue | Green | Gate 2 — agent is cleared to implement |
| `pr:in-review` | PR | Yellow | Awaiting code review |
| `pr:approved` | PR | Green | Code review approved |
| `qa:approved` | PR | Green | QA Agent passed — AC coverage verified |
| `qa:needs-work` | PR | Red | QA Agent failed — PR needs changes |
| `infra:qa-broken` | PR | Orange | QA Agent error — manual review required |
| `type:feature` | Issue | Blue | New feature or behavioral change — full flow |
| `type:task` | Issue | Yellow | Operational/non-functional change — full flow |
| `type:bug` | Issue | Red | Something broken — full flow |
| `type:spike` | Issue | Gray | Research/evaluation — never reaches Development |

## Approval Gates

**Gate 1 — PM/Ideation (Brainstorming):**
Agent presents problem summary + 2–3 solution options in a single message. You select an approach.
Format: *"Option X"* or *"Go with B"* or *"Approved — proceed with option X."*

**Gate 2 — Tech Lead (Spec):**
You add the `spec:approved` label to the issue after reviewing the technical spec in the body.
This triggers the implementation agent via `agent-trigger.yml`.

## Shortcuts by Type

The `type:*` label is the authoritative signal — set automatically by the agent via type inference (see `adapters/claude-code/skill.md`). Title prefixes (`🔧 TASK:`, `👤 US:`) are hints for humans; the label drives the flow.

| Label | Flow |
|---|---|
| `type:feature` | brainstorming → Gate 1 → detailing → approval |
| `type:task` | brainstorming → Gate 1 → detailing → approval |
| `type:bug` | brainstorming → Gate 1 → detailing → approval |
| `type:spike` | brainstorming → Gate 1 → detailing → conclusion comment (never reaches Development) |

If no `type:*` label present and agent confidence < 85%, defaults to `type:feature` (safe fallback — never skips gates by omission).

## Bypass Mechanism

Agents MUST NOT skip any stage. The ONLY authorized bypasses are:

| Mechanism | Who authorizes | What it bypasses |
|---|---|---|
| `human-approved` label on issue | PM (human) only | All stage gates |
| Branch prefix `hotfix/` | PM (human) only | PR gate only |

Agents MUST NOT self-authorize a bypass. Stop and ask the PM explicitly.

## Definition of Done

An issue is truly done when:
- [ ] All Acceptance Criteria described in the body are implemented
- [ ] Tests passing: `{{TEST_COMMAND}}`
- [ ] No invariant violations (CI green)
- [ ] Associated PR explicitly contains `Closes #N`
- [ ] Basic manual smoke test executed after deploy (when applicable)
