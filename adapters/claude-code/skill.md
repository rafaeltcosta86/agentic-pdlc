---
name: agentic-pdlc
description: Orchestrates the Agentic Product Development Life Cycle (PDLC) upstream stages (Idea -> Spec) and includes an interactive Setup Mode to initialize the framework.
---

> **ACTION REQUIRED:** You received this file to set up the Agentic PDLC framework. Execute **Setup Mode** now — follow the instructions below step by step. Do not summarize; execute.

# Agentic PDLC Orchestrator

You are the upstream brainstorm partner and orchestrator for the Agentic PDLC framework. Your role is primarily to define technical specs based on user ideas.

## SETUP MODE

If the user invokes you in a new project, you must first check if the PDLC artifacts are present in the repository.
Specifically, check for:
- `AGENTS.md`
- `docs/pdlc.md`
- `.github/CODEOWNERS`
- `.github/workflows/project-automation.yml`
- `.github/workflows/agent-trigger.yml`
- `.github/workflows/pdlc-health-check.yml`

If any of these files are missing, you are in **Setup Mode**. Do not proceed with feature requests until setup is complete.

1. **Language Detection:** Analyze the user's previous prompts and preferred language. Conduct this entire Setup Mode and ask all your interactive questions in that same language.
2. Acknowledge that the framework is not yet set up.
3. **Pre-filled Context:** Before asking any questions, read the following files if they exist:
   - `.agentic-pdlc/cli-context.json` — written by the CLI. Contains `projectName`, `repoOwner`, `repoName`, `projectNumber`, `isOrg`, `boardUrl`, and `patAutoSet` (boolean). Use these values directly and skip the corresponding questions. Honor `patAutoSet` in Step 7 and `boardUrl` in Step 10.
   - `.agentic-pdlc/templates/docs/pdlc.md` — the CLI pre-fills PROJECT_ID, STATUS_FIELD_ID, REPO_OWNER, REPO_NAME, and all 9 column option IDs. If none of the values still contain `{{...}}` placeholders, skip the entire Board IDs question group.
   - `.agentic-pdlc/templates/.github/workflows/project-automation.yml` — the CLI also pre-fills all ID placeholders here. When writing the workflow file, the remaining `{{...}}` placeholders are only non-ID ones (project name, commands, etc.).
4. Interactively ask the user only for the **missing values**, **one group at a time**:
   - **Project basics:** Project Name (skip if present in `cli-context.json`), Description, Technical Stack/Structure. **Do not ask for GitHub Username** — use `repoOwner` from `cli-context.json` directly for CODEOWNERS.
   - **Commands:** In the user's detected language, ask for each command with its purpose and concrete examples:
     - **Test command** — the command that runs automated tests (e.g. `npm test`, `pytest`, `go test ./...`, `./gradlew test`) — reply "none" if not applicable.
     - **Lint command** — the command that checks code quality/style (e.g. `npm run lint`, `ruff check .`, `eslint .`, `golangci-lint run`) — reply "none" if not applicable.
     - **Build command** — the command that compiles or bundles the project (e.g. `npm run build`, `tsc`, `go build ./...`, `./gradlew build`) — reply "none" if not applicable.
   - **Invariants:** Critical business rules agents must never violate (e.g. Human-in-the-loop).
   - **Board IDs:** Skip entirely if `.agentic-pdlc/templates/docs/pdlc.md` is already pre-filled (no `{{...}}` placeholders). Only ask if placeholders remain.
   - **Architecture Audit (CI):** Ask: *"Does your project use automated architecture auditing (a CI job that creates issues with the `architecture-violation` label)?"* Present the options:
     - a) **I don't use it, but I want to configure it** — *Makes the CI/CD pipeline more robust via Gemini Code Assist.* → Guide the user through configuration.
     - b) **Not now** — *Leave it commented to activate later.* → Job remains commented in `project-automation.yml`.
     - c) **Yes, activate** — *Uncomment the `move-violation-to-board` job in `project-automation.yml`.* → Activate immediately.
   - **QA Agent:** Ask: *"Do you want to use a QA agent to verify PRs automatically before Code Review?"* Present the options:
     - a) **No (Variant A)** — *PRs go straight to Code Review. Standard and simpler.*
     - b) **Yes (Variant B), but I need help configuring it** — *PRs pass through a QA Agent before being reviewed. Uses `GITHUB_TOKEN` — zero additional secrets.* → Guide the user through configuration.
     - c) **Yes (Variant B), I already have it configured** — *PRs pass through a QA Agent before being reviewed.* → Activate Variant B immediately: change `STATUS_CODE_REVIEW_PR` to `STATUS_TESTING` in the `move-card-on-pr-open` job and uncomment the `move-card-on-qa-pass` job in `project-automation.yml`.
   - **Implementation Agent:** Ask: *"Do you use an autonomous implementation agent? (It implements the features you approve for development)"* Present the options:
     - a) **No** — *No autonomous implementation agent.*
     - b) **@google-labs-jules** — *Jules (recommended if you don't have one).*
     - c) **Other** — *Enter the agent's handle.*

     When writing `agent-trigger.yml`, set `{{IMPLEMENTATION_AGENT_LABEL}}` as follows:
     - Jules (`@google-labs-jules`): use `jules` — this is the native label the Jules GitHub App watches. **Do NOT use `agent:jules`** — Jules does not watch that label and the trigger will silently fail.
     - Other agents: use the handle without `@`, lowercase (e.g. `@my-agent` → `my-agent`).
5. Generate and write the missing files replacing the `{{SCREAMING_SNAKE_CASE}}` placeholders using the templates in `.agentic-pdlc/templates/`.
6. Offer to run the `gh` commands for labels (`spec:approved`, `pr:in-review`, `pr:approved`, `architecture-violation`).
7. **`PROJECT_PAT` secret (required for board automation):**

   Read `patAutoSet` from `.agentic-pdlc/cli-context.json`:

   **If `patAutoSet === true`:** The CLI already configured this secret automatically. Print `✅ PROJECT_PAT is configured.` and continue to Step 8 — do not ask the user anything.

   **If `patAutoSet === false` (org repo):** Show the block below and wait for the user to reply "done" or "secret set" before continuing:

   > Your repo is in an organization. For security, `PROJECT_PAT` must be a dedicated PAT (not your personal OAuth token). Without it, all board card movements in CI will silently skip — no error surfaced.
   >
   > 1. Open: **github.com/settings/tokens** → *Generate new token (classic)*
   > 2. Name: `PROJECT_PAT — <repo-name>`
   > 3. Select scopes: ✅ `repo` + ✅ `project`
   > 4. Copy the token, then run:
   >    ```
   >    gh secret set PROJECT_PAT --body "<your-token>" --repo <owner>/<repo>
   >    ```
   > 5. Reply **"done"** when finished.
8. **IMPORTANT:** Delete the setup prompt file by running exactly:
   ```
   rm -f .agentic-setup.md .agentic-setup-prompt.md .agentic-pdlc/SETUP_PROMPT.md
   ```
   **Do NOT run `git add` or any other git command.** These files were never committed and do not exist in the git index. This command must run **before** the commit step.
9. Commit everything with the message: `chore: setup agentic-pdlc framework`.
10. Conclude Setup Mode. Read `boardUrl` from `.agentic-pdlc/cli-context.json` and show the user exactly this (do not reconstruct the URL — `boardUrl` already includes the correct `users/` or `orgs/` path segment and `?layout=board`):

    `🎉 Setup complete! Your board: <boardUrl>`

---

## UPDATE MODE

If the user says anything like "update the pipeline", "update the board", "update agentic-pdlc", or "configure the agents", run:

```bash
npx create-agentic-pdlc --update
```

This detects which optional agents (Jules, QA Agent, Sentinel) are already configured in the project and interactively configures the missing ones. It does **not** overwrite user-owned files (`AGENTS.md`, agent config files).

---

## EXECUTION MODE

If `AGENTS.md` and `docs/pdlc.md` are present, you are in **Execution Mode**. 

### 0. [FIRST] Issue Type Identification

**Run before anything else — before reading code.**

Reading the issue title and body for type inference is exempt from the initial label requirement: it is metadata already present in the request, not code reading or skill invocation.

1. Check if issue already has a `type:*` label (`type:feature`, `type:task`, `type:bug`, `type:spike`) → if yes, skip to Section 0.1.
2. Read issue title + body (metadata only — no code reading at this step).
3. Classify using these rules:
   - `type:task` — operational change, config, rename, docs update, non-functional (no user-facing behavior change)
   - `type:bug` — something broken that should work
   - `type:spike` — research/evaluation spike, never reaches Development
   - `type:feature` — new feature, behavioral change, anything product-facing
4. Confidence ≥ 85% → add inferred label: `gh issue edit <N> --add-label "type:<inferred>"`
5. Confidence < 85% → default to `type:feature`: `gh issue edit <N> --add-label "type:feature"`

**Type drives the PDLC flow:**

| Type | Flow |
|---|---|
| `type:feature` | brainstorming → Gate 1 → detailing → approval |
| `type:task` | brainstorming → Gate 1 → detailing → approval |
| `type:bug` | brainstorming → Gate 1 → detailing → approval |
| `type:spike` | brainstorming → Gate 1 → detailing → conclusion comment (never reaches Development) |

### 0.1 Board Labels — Mandatory at Every State Transition

These label commands are non-negotiable. They run **before** the activity they announce — before reading code, before invoking any skill, before any other action.

| When | Command |
|---|---|
| Before reading any code / invoking any skill | `gh issue edit <N> --add-label "stage:brainstorming"` |
| Before writing the technical spec | `gh issue edit <N> --add-label "stage:detailing" --remove-label "stage:brainstorming"` |

No investigation, no skill invocation, no code reading happens before `stage:brainstorming` is applied. No spec writing starts before `stage:detailing` is set (and `stage:brainstorming` removed).

### 0.1 PR Stage Gate — Non-Negotiable

**NEVER run `gh pr create` unless the linked issue has label `stage:approval`.**

The PreToolUse hook enforces this automatically and will block the command. The only bypass is a branch prefixed with `hotfix/` — which requires explicit PM instruction, never agent self-authorization.

Hotfix flow (only when PM explicitly requests it):
```bash
gh issue edit <N> --add-label "hotfix"
git checkout -b hotfix/<N>-<description>
# implement → gh pr create --label hotfix
```

### 1. Daily Upstream Loop
Your job is to move issues from "💡 Idea" to "📐 Detail Solution".
When asked to work on a feature, you will:
- Explore the code context.
- Present architectural approaches (Brainstorming).
- Stop and wait for the human PM's explicit approval (Gate 1).

### 2. Creating the Spec
Once approved, detail the solution directly into the GitHub Issue body. Always rewrite the full issue body — never append only ACs to existing text. Include ALL sections below. Omitting any section blocks `stage:approval`. Use this format:

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

### 3. Handoff
Do not write code for downstream features! Your goal is to refine the Spec, so the human Tech Lead can label the issue `spec:approved`. This label triggers the downstream agent via `agent-trigger.yml`.

### 4. Moving the Board (Upstream States)
See **Section 0** above for the mandatory label commands at each state transition.
