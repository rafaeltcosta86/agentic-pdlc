# PROJECT_ID as Actions Variable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded `PROJECT_ID: "PVT_xxx"` in installed YAML files with `${{ vars.PROJECT_ID }}`, and have the installer set the value via the GitHub Actions Variables REST API.

**Architecture:** Three workflow templates swap their `PROJECT_ID` env value and guard condition. `bin/cli.js` gains a `setActionsVariable(repo, name, value, execFn)` helper (dependency-injected `execFn` for testability) called after board creation in both the `runFullSetup` and `runUpgradeToAgentic` flows.

**Tech Stack:** Node.js 22, `node:test` + `node:assert/strict`, `gh` CLI (`execFileSync`), GitHub Actions Variables REST API (`PATCH`/`POST /repos/{owner}/{repo}/actions/variables`).

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `templates/.github/workflows/project-automation.yml` | Remove `{{PROJECT_ID}}` placeholder, source from `vars` |
| Modify | `templates/.github/workflows/add-to-board.yml` | Same |
| Modify | `templates/.github/workflows/agent-trigger.yml` | Same |
| Modify | `bin/cli.js` | Add helper, wire call sites, export helper |
| Modify | `tests/cli.test.js` | Tests for `setActionsVariable` logic |

---

### Task 1: Update workflow templates

**Files:**
- Modify: `templates/.github/workflows/project-automation.yml`
- Modify: `templates/.github/workflows/add-to-board.yml`
- Modify: `templates/.github/workflows/agent-trigger.yml`

No tests for template content — correctness is verified by the installer integration.

- [ ] **Step 1: Replace `PROJECT_ID` env value in all three templates**

In each of the three files, find every line matching:
```yaml
PROJECT_ID: "{{PROJECT_ID}}"
```
Replace with:
```yaml
PROJECT_ID: ${{ vars.PROJECT_ID }}
```

`project-automation.yml` line 12, `add-to-board.yml` line 8, `agent-trigger.yml` line 21.

- [ ] **Step 2: Replace guard conditions in all three templates**

In each of the three files, find every line matching:
```yaml
env.PROJECT_ID != '{{PROJECT_ID}}'
```
Replace with:
```yaml
env.PROJECT_ID != ''
```

Do a full-file search in each — there are multiple occurrences per file (every job that conditionally runs).

- [ ] **Step 3: Verify no `{{PROJECT_ID}}` remains in workflow files**

Run:
```bash
grep -rn "{{PROJECT_ID}}" templates/.github/workflows/
```

Expected: no output. If any lines appear, fix them before proceeding.

- [ ] **Step 4: Commit**

```bash
git add templates/.github/workflows/project-automation.yml \
        templates/.github/workflows/add-to-board.yml \
        templates/.github/workflows/agent-trigger.yml
git commit -m "feat(templates): source PROJECT_ID from vars instead of hardcoded placeholder"
```

---

### Task 2: Remove `{{PROJECT_ID}}` YAML substitution from `scaffoldFullTemplates`

**Files:**
- Modify: `bin/cli.js:345`

- [ ] **Step 1: Delete the single PROJECT_ID substitution line**

In `bin/cli.js`, find and remove exactly this line (currently line 345):
```javascript
    if (projectId)     wfContent = wfContent.replace(/\{\{PROJECT_ID\}\}/g,      () => projectId);
```

The block around it (lines 342–356) substitutes `STATUS_FIELD_ID` and all `ID_*` column options into `project-automation.yml`. Keep all those lines. Only the `PROJECT_ID` line is removed.

- [ ] **Step 2: Verify other substitutions are intact**

Run:
```bash
grep -n "wfContent.replace" bin/cli.js
```

Expected output must include lines for `STATUS_FIELD_ID`, `ID_IDEA`, `ID_BRAINSTORMING`, `ID_DETAILING`, `ID_APPROVAL`, `ID_DEVELOPMENT`, `ID_TESTING`, `ID_CODE_REVIEW_PR`, `ID_PRODUCTION`. Must NOT include `PROJECT_ID`.

- [ ] **Step 3: Commit**

```bash
git add bin/cli.js
git commit -m "fix(cli): remove PROJECT_ID hardcoding from scaffoldFullTemplates"
```

---

### Task 3: Add `setActionsVariable` helper (TDD)

**Files:**
- Modify: `bin/cli.js` (add function before `scaffoldFullTemplates`, ~line 283)
- Modify: `tests/cli.test.js` (add describe block)
- Modify: `bin/cli.js:793` (add to `module.exports`)

- [ ] **Step 1: Write failing tests**

Add to `tests/cli.test.js`:

```javascript
const { describe, it, mock } = require('node:test');

// ... existing imports and tests above ...

describe('setActionsVariable', () => {
  it('calls PATCH first', () => {
    const calls = [];
    const execFn = (cmd, args) => { calls.push(args); };
    const { setActionsVariable } = require('../bin/cli.js');
    setActionsVariable('owner/repo', 'PROJECT_ID', 'PVT_abc', execFn);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].includes('--method'));
    assert.ok(calls[0].includes('PATCH'));
    assert.ok(calls[0].some(a => a.includes('PROJECT_ID')));
  });

  it('falls back to POST on 404', () => {
    const calls = [];
    let callCount = 0;
    const execFn = (cmd, args) => {
      calls.push([...args]);
      callCount++;
      if (callCount === 1) {
        const err = new Error('Not Found');
        err.stderr = Buffer.from('Not Found');
        throw err;
      }
    };
    const { setActionsVariable } = require('../bin/cli.js');
    setActionsVariable('owner/repo', 'PROJECT_ID', 'PVT_abc', execFn);
    assert.equal(calls.length, 2);
    assert.ok(calls[0].includes('PATCH'));
    assert.ok(calls[1].includes('POST'));
  });

  it('throws on 403', () => {
    const execFn = () => {
      const err = new Error('Forbidden');
      err.stderr = Buffer.from('Forbidden');
      throw err;
    };
    const { setActionsVariable } = require('../bin/cli.js');
    assert.throws(
      () => setActionsVariable('owner/repo', 'PROJECT_ID', 'PVT_abc', execFn),
      /Forbidden/
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: 3 new test failures — `setActionsVariable` is not exported yet.

- [ ] **Step 3: Add `setActionsVariable` to `bin/cli.js`**

Insert this function before `scaffoldFullTemplates` (~line 283):

```javascript
function setActionsVariable(repo, name, value, execFn = execFileSync) {
  try {
    execFn('gh', [
      'api', `repos/${repo}/actions/variables/${name}`,
      '--method', 'PATCH',
      '-f', `name=${name}`,
      '-f', `value=${value}`
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    const msg = (err.stderr?.toString() || '') + (err.message || '');
    if (msg.includes('404') || msg.includes('Not Found')) {
      execFn('gh', [
        'api', `repos/${repo}/actions/variables`,
        '--method', 'POST',
        '-f', `name=${name}`,
        '-f', `value=${value}`
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
    } else {
      throw err;
    }
  }
}
```

- [ ] **Step 4: Export the function**

In `bin/cli.js` at line 793, update:
```javascript
if (typeof module !== 'undefined') module.exports = { resolveMode };
```
to:
```javascript
if (typeof module !== 'undefined') module.exports = { resolveMode, setActionsVariable };
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```

Expected: all tests pass including the 3 new `setActionsVariable` tests.

- [ ] **Step 6: Commit**

```bash
git add bin/cli.js tests/cli.test.js
git commit -m "feat(cli): add setActionsVariable helper with PATCH→POST fallback"
```

---

### Task 4: Wire `setActionsVariable` into the create flow (`runFullSetup`)

**Files:**
- Modify: `bin/cli.js` (~line 554)

- [ ] **Step 1: Add the call site after the PROJECT_PAT block**

In `bin/cli.js`, locate the end of the `PROJECT_PAT` block in `runFullSetup` (the `} else if (projectId && isOrg)` line at ~554). Add after it:

```javascript
  // Set PROJECT_ID as GitHub Actions Variable
  if (projectId) {
    try {
      setActionsVariable(repo, 'PROJECT_ID', projectId);
      console.log(`${green}✅ vars.PROJECT_ID set as Actions Variable.${reset}`);
    } catch (_) {
      console.log(`${yellow}⚠️  Could not set vars.PROJECT_ID — token may lack variables:write scope.\n   Set manually: repo Settings → Secrets and variables → Variables → PROJECT_ID = ${projectId}${reset}`);
    }
  }
```

Insert this block between line 554 (`} else if (projectId && isOrg) { ... }`) and line 556 (`await setBranchProtection(...)`).

- [ ] **Step 2: Verify placement**

```bash
grep -n "vars.PROJECT_ID\|setBranchProtection\|isOrg\)" bin/cli.js | head -20
```

The `vars.PROJECT_ID` console log should appear between the `isOrg` block and `setBranchProtection`.

- [ ] **Step 3: Commit**

```bash
git add bin/cli.js
git commit -m "feat(cli): set vars.PROJECT_ID as Actions Variable in create flow"
```

---

### Task 5: Wire `setActionsVariable` into the upgrade flow (`runUpgradeToAgentic`)

**Files:**
- Modify: `bin/cli.js` (~line 1006)

- [ ] **Step 1: Add the call site after the PROJECT_PAT block in the upgrade flow**

In `bin/cli.js`, locate the end of the `PROJECT_PAT` block in `runUpgradeToAgentic` (the closing `}` of `if (projectId && !isOrg)` at ~line 1006). Add after it:

```javascript
  // Set PROJECT_ID as GitHub Actions Variable
  if (projectId) {
    try {
      setActionsVariable(repo, 'PROJECT_ID', projectId);
      console.log(`${green}✅ vars.PROJECT_ID set as Actions Variable.${reset}`);
    } catch (_) {
      console.log(`${yellow}⚠️  Could not set vars.PROJECT_ID — token may lack variables:write scope.\n   Set manually: repo Settings → Secrets and variables → Variables → PROJECT_ID = ${projectId}${reset}`);
    }
  }
```

Insert between line ~1006 (`}` closing the `PROJECT_PAT` block) and line ~1008 (`console.log scaffolding`).

- [ ] **Step 2: Verify no `{{PROJECT_ID}}` placeholder survives install**

```bash
grep -rn "{{PROJECT_ID}}" templates/
```

Expected: only `templates/full/docs/pdlc.md` (the documentation file). No workflow YAML files.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add bin/cli.js
git commit -m "feat(cli): set vars.PROJECT_ID as Actions Variable in upgrade flow"
```

---

## Self-Review Checklist

- Acceptance Criteria 1 (new install sets `vars.PROJECT_ID`): Task 4 ✓
- Acceptance Criteria 2 (`resolve-ids` works without YAML modification): Task 1 ✓
- Acceptance Criteria 3 (`--update` sets variable): Task 5 ✓
- Acceptance Criteria 4 (403 warning, non-fatal): Tasks 3, 4, 5 ✓
- Edge case — PATCH first, POST on 404: Task 3 ✓
- Edge case — `vars.PROJECT_ID` unset resolves to `''`, guard works: Task 1 ✓
- No `{{PROJECT_ID}}` in any YAML after install: Tasks 1 + 2 ✓
- All other ID substitutions preserved: Task 2 Step 2 ✓
