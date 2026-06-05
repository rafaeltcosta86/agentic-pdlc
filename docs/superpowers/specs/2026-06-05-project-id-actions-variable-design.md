# Design: Set PROJECT_ID as Actions Variable During Install

**Issue:** #179
**Date:** 2026-06-05
**Status:** Approved

## Problem

The `create-agentic-pdlc` installer embeds the GitHub Project ID (`PVT_xxx`) directly into workflow YAML files by replacing `{{PROJECT_ID}}` placeholders during `scaffoldFullTemplates`. This means new repo installs get workflows with a hardcoded value in source-controlled files — brittle, hard to rotate, and inconsistent with how GitHub recommends storing non-secret configuration.

The fix: set `vars.PROJECT_ID` as a GitHub Actions Variable via the REST API during install, and have workflow templates source it from `vars` at runtime.

## Approach: env block sourced from `vars`

Keep the `PROJECT_ID:` entry in the workflow-level `env` block — just change its value from a hardcoded placeholder to `${{ vars.PROJECT_ID }}`. All `process.env.PROJECT_ID` references inside `actions/github-script` bodies remain unchanged. Minimal diff, maximum behavioral parity.

Rejected alternatives:
- **Inline `vars` everywhere**: larger diff, all script bodies change, no benefit.
- **Set vars + keep YAML hardcode**: adds complexity, defeats the goal.

## Changes

### 1. Templates — 3 workflow files

Files: `templates/.github/workflows/project-automation.yml`, `add-to-board.yml`, `agent-trigger.yml`

Every occurrence of:

| Before | After |
|---|---|
| `PROJECT_ID: "{{PROJECT_ID}}"` | `PROJECT_ID: ${{ vars.PROJECT_ID }}` |
| `env.PROJECT_ID != '{{PROJECT_ID}}'` | `env.PROJECT_ID != ''` |

Guard correctness: when `vars.PROJECT_ID` is unset, `${{ vars.PROJECT_ID }}` resolves to `''` at workflow startup → `env.PROJECT_ID != ''` suppresses execution cleanly. Verified: `vars.*` in workflow-level `env` block resolves before jobs run.

`pdlc.md` keeps `{{PROJECT_ID}}` substitution — it is a documentation file, not a YAML workflow.

### 2. `bin/cli.js` — new helper `setActionsVariable`

```javascript
function setActionsVariable(repo, name, value) {
  try {
    execFileSync('gh', ['api', `repos/${repo}/actions/variables/${name}`,
      '--method', 'PATCH', '-f', `name=${name}`, '-f', `value=${value}`],
      { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    const msg = err.stderr?.toString() || '';
    if (msg.includes('404') || msg.includes('Not Found')) {
      execFileSync('gh', ['api', `repos/${repo}/actions/variables`,
        '--method', 'POST', '-f', `name=${name}`, '-f', `value=${value}`],
        { stdio: ['ignore', 'pipe', 'pipe'] });
    } else {
      throw err; // 403 bubbles up → caller emits user-visible warning
    }
  }
}
```

Uses `gh api` via `execFileSync` — consistent with all other API calls in `cli.js`. PATCH on existing variable, POST on 404, throws on 403 so the caller can warn the user.

**Token scope requirement:** fine-grained PAT needs `variables:write`; classic PAT needs `repo` scope. `GITHUB_TOKEN` (workflow-issued) will return 403 — cannot set repo variables. The installer already calls `gh auth token` for `PROJECT_PAT`; the same authenticated session is used here.

### 3. `bin/cli.js` — `scaffoldFullTemplates` (line 345)

Remove the single line that substitutes `{{PROJECT_ID}}` in `project-automation.yml`:

```javascript
// REMOVE this line:
if (projectId) wfContent = wfContent.replace(/\{\{PROJECT_ID\}\}/g, () => projectId);
```

All other substitutions on lines 346–355 (`STATUS_FIELD_ID`, `ID_BRAINSTORMING`, `ID_DETAILING`, etc.) are preserved unchanged.

### 4. Create flow — call site

Inside the existing `if (projectId)` block (after `PROJECT_PAT` secret is set, ~line 541):

```javascript
try {
  setActionsVariable(repo, 'PROJECT_ID', projectId);
  console.log(`${green}✅ vars.PROJECT_ID set as Actions Variable.${reset}`);
} catch (_) {
  console.log(`${yellow}⚠️  Could not set vars.PROJECT_ID — token may lack variables:write scope.\n   Set it manually: repo Settings → Secrets and variables → Variables → PROJECT_ID = ${projectId}${reset}`);
}
```

Non-fatal. Install continues regardless.

### 5. `--update` flow — same call site

The `--update` command is a **lite → full upgrade** — it exits early if the profile is already `full` (line 865). For lite → full, a new board is created via `createProjectV2` (line 920), producing a fresh `projectId`. Call `setActionsVariable` in the same `if (projectId)` block after board creation. Identical error handling to the create flow.

No "find existing project" query is needed. `projectId` is always available from the mutation result in both flows.

## Acceptance Criteria

- `npx create-agentic-pdlc` → `vars.PROJECT_ID` set as GitHub Actions Variable on the target repo
- No `PVT_xxx` value appears in any installed YAML file
- `resolve-ids` job resolves column IDs without any YAML modification
- `--update` (lite → full) → `vars.PROJECT_ID` set with the newly created board ID
- If token lacks scope → installer prints actionable warning with manual steps; install does not abort

## Out of Scope

- Migrating existing full installs (board already set up, YAML already hardcoded)
- Changing how `PROJECT_ID` is resolved during install (GraphQL flow unchanged)
- `--update` on an already-full install (exits early before any board logic runs)

## Files to Modify

- `templates/.github/workflows/project-automation.yml`
- `templates/.github/workflows/add-to-board.yml`
- `templates/.github/workflows/agent-trigger.yml`
- `bin/cli.js` — `setActionsVariable` helper, `scaffoldFullTemplates` line 345, create flow call site, update flow call site
