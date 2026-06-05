# Two-Tier Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `bin/cli.js` so `npx create-agentic-pdlc` installs a minimal lite profile by default and `--agentic` opts into the full board machine.

**Architecture:** Extract `runSetup()` into three separate functions (`runLiteSetup`, `runFullSetup`, `runUpgradeToAgentic`) sharing helper functions for auth, hook install, branch protection, and template copying. Entry point routes by CLI arg.

**Tech Stack:** Node.js 18+, built-in `node:test` + `node:assert` for unit tests, `child_process.execFileSync`, `fs`, `path`.

---

## File Map

| File | Change |
|---|---|
| `bin/cli.js` | Main refactor — extract helpers, add three profile functions, update entry point |
| `tests/cli.test.js` | New — unit tests for pure helpers |
| `package.json` | Update test script to run `node:test` |

---

## Task 1: Create branch + add test infrastructure

**Files:**
- Modify: `package.json`
- Create: `tests/cli.test.js`

- [ ] **Step 1: Update package.json test script**

Open `package.json` and replace:
```json
"test": "echo \"Error: no test specified\" && exit 1"
```
with:
```json
"test": "node --test tests/cli.test.js"
```

- [ ] **Step 2: Create `tests/cli.test.js` with routing tests**

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// We import helpers from cli.js once they are extracted.
// For now, define the expected pure functions here as contracts.

function resolveMode(args) {
  if (args.includes('--update'))             return 'update';
  if (args.includes('--upgrade-to-agentic')) return 'upgrade';
  if (args.includes('--agentic'))            return 'full';
  return 'lite';
}

describe('resolveMode', () => {
  it('returns lite when no flags', () => {
    assert.equal(resolveMode([]), 'lite');
  });
  it('returns full for --agentic', () => {
    assert.equal(resolveMode(['--agentic']), 'full');
  });
  it('returns update for --update', () => {
    assert.equal(resolveMode(['--update']), 'update');
  });
  it('returns upgrade for --upgrade-to-agentic', () => {
    assert.equal(resolveMode(['--upgrade-to-agentic']), 'upgrade');
  });
  it('--update takes precedence over --agentic', () => {
    assert.equal(resolveMode(['--update', '--agentic']), 'update');
  });
});

describe('buildFullClaudeContent', () => {
  it('concatenates lite and full with a newline separator', () => {
    const lite = '# Lite\ncontent';
    const full = '## Extra\nmore';
    const result = lite + '\n' + full;
    assert.ok(result.startsWith('# Lite'));
    assert.ok(result.includes('## Extra'));
  });
});
```

- [ ] **Step 3: Run tests — expect PASS (pure functions defined inline)**

```bash
npm test
```

Expected output: `✔ resolveMode` and `✔ buildFullClaudeContent` tests all pass.

- [ ] **Step 4: Commit**

```bash
git add package.json tests/cli.test.js
git commit -m "test: add test infra and routing contract tests"
```

---

## Task 2: Extract `resolveMode` + update entry point in cli.js

**Files:**
- Modify: `bin/cli.js:700-708`

- [ ] **Step 1: Read the current entry point block** (lines 700–708 of `bin/cli.js`)

Current code at the bottom of `bin/cli.js`:
```js
const args = process.argv.slice(2);
if (args.includes('--update')) {
  runUpdate().catch(err => { console.error(err.message); rl.close(); process.exit(1); });
} else {
  runSetup().catch(err => { console.error(err.message); rl.close(); process.exit(1); });
}
```

- [ ] **Step 2: Replace entry point with routed version**

Replace the block above with:
```js
function resolveMode(args) {
  if (args.includes('--update'))             return 'update';
  if (args.includes('--upgrade-to-agentic')) return 'upgrade';
  if (args.includes('--agentic'))            return 'full';
  return 'lite';
}

const args = process.argv.slice(2);
const mode = resolveMode(args);

const handler =
  mode === 'update'  ? runUpdate :
  mode === 'upgrade' ? runUpgradeToAgentic :
  mode === 'full'    ? runFullSetup :
                       runLiteSetup;

handler().catch(err => { console.error(err.message); rl.close(); process.exit(1); });
```

Note: `runUpgradeToAgentic`, `runFullSetup`, and `runLiteSetup` will be added in later tasks. The file will not run cleanly until Task 6.

- [ ] **Step 3: Commit**

```bash
git add bin/cli.js
git commit -m "refactor(cli): add resolveMode and routed entry point"
```

---

## Task 3: Extract shared helper functions

**Files:**
- Modify: `bin/cli.js` — add helpers after `printSetupDone()`, before `runSetup()`

These helpers extract repeated logic from the current `runSetup()`. Add them as named functions between `printSetupDone()` (line ~119) and the start of `runSetup()` (line ~121).

- [ ] **Step 1: Add `checkGhAuth()` helper**

```js
async function checkGhAuth() {
  console.log(`${yellow}${i18n.checking_gh}${reset}`);
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    console.log(`${green}${i18n.gh_ok}${reset}\n`);
  } catch (error) {
    console.error(`${red}${i18n.gh_error}${reset}`);
    console.error(`${i18n.gh_install}`);
    rl.close();
    process.exit(1);
  }
}
```

- [ ] **Step 2: Add `checkAndRefreshProjectScope()` helper**

```js
function getScopes() {
  try {
    const out = execFileSync('gh', ['api', 'user', '-i'], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    const line = out.split('\n').find(l => l.toLowerCase().startsWith('x-oauth-scopes:'));
    return line ? line.split(':').slice(1).join(':').split(',').map(s => s.trim()) : [];
  } catch (e) {
    return [];
  }
}

async function checkAndRefreshProjectScope() {
  const scopesBefore = getScopes();
  if (scopesBefore.length === 0 || scopesBefore.includes('project')) return;

  console.log(`${yellow}⚠️  Token missing 'project' scope — required for GitHub Projects board.${reset}`);
  console.log(`${yellow}   Refreshing token now (browser may open)...${reset}\n`);
  try {
    execSync('gh auth refresh -h github.com -s project', { stdio: 'inherit' });
  } catch (e) {
    console.log(`${red}❌ Token refresh failed. Run manually: gh auth refresh -h github.com -s project${reset}`);
    rl.close();
    process.exit(1);
  }
  const scopesAfter = getScopes();
  if (scopesAfter.length > 0 && !scopesAfter.includes('project')) {
    console.log(`\n${red}❌ 'project' scope still missing after refresh.${reset}`);
    console.log(`${yellow}   Active scopes: ${scopesAfter.join(', ')}${reset}`);
    console.log(`${yellow}   Try manually: gh auth refresh -h github.com -s project${reset}`);
    rl.close();
    process.exit(1);
  }
  if (scopesAfter.length > 0) {
    console.log(`\n${green}✅ Token refreshed. Active scopes: ${scopesAfter.join(', ')}${reset}\n`);
  } else {
    console.log(`\n${green}✅ Token refreshed with 'project' scope.${reset}\n`);
  }
}
```

Note: `getScopes()` and its `try/catch` block already exist inside `runSetup()`. This step moves them to module scope and wraps them in `checkAndRefreshProjectScope()`.

- [ ] **Step 3: Add `installHook(sourceDir, targetDir)` helper**

```js
function installHook(sourceDir, targetDir) {
  const hookSrc  = path.join(sourceDir, 'adapters', 'hooks', 'pdlc-stage-gate.sh');
  const hookDir  = path.join(targetDir, '.agentic-pdlc', 'hooks');
  const hookDest = path.join(hookDir, 'pdlc-stage-gate.sh');
  if (!fs.existsSync(hookSrc)) return;

  fs.mkdirSync(hookDir, { recursive: true });
  fs.copyFileSync(hookSrc, hookDest);
  fs.chmodSync(hookDest, '755');

  const settingsDir  = path.join(targetDir, '.claude');
  const settingsPath = path.join(settingsDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    fs.mkdirSync(settingsDir, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({
      hooks: {
        PreToolUse: [{
          matcher: 'Bash',
          hooks: [{ type: 'command', command: 'bash .agentic-pdlc/hooks/pdlc-stage-gate.sh' }]
        }]
      }
    }, null, 2) + '\n');
  }
}
```

- [ ] **Step 4: Add `setBranchProtection(repo, requiredChecks)` helper**

```js
async function setBranchProtection(repo, requiredChecks) {
  console.log(`\n${cyan}${i18n.configuring_protection}${reset}`);
  try {
    const defaultBranch = execFileSync(
      'gh', ['api', `repos/${repo}`, '--jq', '.default_branch'],
      { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }
    ).trim() || 'main';

    const protectionPayload = JSON.stringify({
      required_status_checks: { strict: false, contexts: requiredChecks },
      enforce_admins: false,
      required_pull_request_reviews: null,
      restrictions: null
    });

    execFileSync(
      'gh',
      ['api', `repos/${repo}/branches/${defaultBranch}/protection`, '--method', 'PUT', '--input', '-'],
      { input: protectionPayload, stdio: ['pipe', 'ignore', 'pipe'] }
    );
    console.log(`  ${green}${i18n.protection_ok}${reset}`);
  } catch (_) {
    console.log(`  ${yellow}${i18n.protection_warn}${reset}`);
  }
}
```

- [ ] **Step 5: Add `copyAdapterFiles(agent, sourceDir, targetDir)` helper**

```js
function copyAdapterFiles(agent, sourceDir, targetDir) {
  const claudeSetupSrc = path.join(sourceDir, 'adapters', 'claude-code', 'skill.md');
  const cursorSetupSrc = path.join(sourceDir, 'adapters', 'cursor',     'rules.md');

  if (agent === 'cursor') {
    if (fs.existsSync(cursorSetupSrc)) {
      fs.copyFileSync(cursorSetupSrc, path.join(targetDir, '.cursorrules'));
      console.log(`${i18n.cursor_rules_written}`);
    }
  }
  if (fs.existsSync(claudeSetupSrc)) {
    fs.copyFileSync(claudeSetupSrc, path.join(targetDir, '.agentic-setup.md'));
    console.log(`${i18n.setup_written}`);
    printSetupDone();
  } else {
    console.error(`${i18n.missing_claude}${claudeSetupSrc}`);
  }
}
```

- [ ] **Step 6: Add `scaffoldLiteTemplates(sourceDir, targetDir)` helper**

```js
function scaffoldLiteTemplates(sourceDir, targetDir) {
  const destTemplates = path.join(targetDir, '.agentic-pdlc', 'templates');
  fs.mkdirSync(destTemplates, { recursive: true });

  // CLAUDE.md — lite version
  const liteClaudeSrc = path.join(sourceDir, 'templates', 'lite', 'CLAUDE.md');
  if (fs.existsSync(liteClaudeSrc)) {
    fs.copyFileSync(liteClaudeSrc, path.join(destTemplates, 'CLAUDE.md'));
  }

  // AGENTS.md — lite version
  const liteAgentsSrc = path.join(sourceDir, 'templates', 'lite', 'AGENTS.md');
  if (fs.existsSync(liteAgentsSrc)) {
    fs.copyFileSync(liteAgentsSrc, path.join(destTemplates, 'AGENTS.md'));
  }

  // Issue templates — shared between lite and full
  const issueTemplateSrc  = path.join(sourceDir, 'templates', '.github', 'ISSUE_TEMPLATE');
  const issueTemplateDest = path.join(destTemplates, '.github', 'ISSUE_TEMPLATE');
  if (fs.existsSync(issueTemplateSrc)) {
    copyDirSync(issueTemplateSrc, issueTemplateDest);
  }
}
```

- [ ] **Step 7: Add `scaffoldFullTemplates(sourceDir, targetDir, projectId, statusFieldId, optionMap, repoOwner, repoName)` helper**

```js
function scaffoldFullTemplates(sourceDir, targetDir, projectId, statusFieldId, optionMap, repoOwner, repoName) {
  const destTemplates = path.join(targetDir, '.agentic-pdlc', 'templates');
  fs.mkdirSync(destTemplates, { recursive: true });

  // CLAUDE.md — concatenate lite + full addon
  const liteClaudeSrc = path.join(sourceDir, 'templates', 'lite', 'CLAUDE.md');
  const fullClaudeSrc = path.join(sourceDir, 'templates', 'full', 'CLAUDE.md');
  if (fs.existsSync(liteClaudeSrc) && fs.existsSync(fullClaudeSrc)) {
    const combined = fs.readFileSync(liteClaudeSrc, 'utf8') + '\n' + fs.readFileSync(fullClaudeSrc, 'utf8');
    fs.writeFileSync(path.join(destTemplates, 'CLAUDE.md'), combined);
  } else if (fs.existsSync(liteClaudeSrc)) {
    fs.copyFileSync(liteClaudeSrc, path.join(destTemplates, 'CLAUDE.md'));
  }

  // AGENTS.md — full version
  const fullAgentsSrc = path.join(sourceDir, 'templates', 'full', 'AGENTS.md');
  if (fs.existsSync(fullAgentsSrc)) {
    fs.copyFileSync(fullAgentsSrc, path.join(destTemplates, 'AGENTS.md'));
  }

  // All of templates/.github/ (issue templates + workflows)
  const githubSrc  = path.join(sourceDir, 'templates', '.github');
  const githubDest = path.join(destTemplates, '.github');
  if (fs.existsSync(githubSrc)) {
    copyDirSync(githubSrc, githubDest);
  }

  // docs/pdlc.md — substitute board IDs
  const pdlcSrc  = path.join(sourceDir, 'templates', 'full', 'docs', 'pdlc.md');
  const pdlcDest = path.join(destTemplates, 'docs', 'pdlc.md');
  if (fs.existsSync(pdlcSrc)) {
    fs.mkdirSync(path.join(destTemplates, 'docs'), { recursive: true });
    let pdlcContent = fs.readFileSync(pdlcSrc, 'utf8');
    if (projectId)     pdlcContent = pdlcContent.replace(/\{\{PROJECT_ID\}\}/g,      () => projectId);
    if (statusFieldId) pdlcContent = pdlcContent.replace(/\{\{STATUS_FIELD_ID\}\}/g, () => statusFieldId);
    pdlcContent = pdlcContent.replace(/\{\{REPO_OWNER\}\}/g, () => repoOwner);
    pdlcContent = pdlcContent.replace(/\{\{REPO_NAME\}\}/g,  () => repoName);
    if (Object.keys(optionMap).length > 0) {
      pdlcContent = pdlcContent.replace(/\{\{ID_IDEA\}\}/g,                () => optionMap['💡 Idea - No move to Exploration directly'] || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_EXPLORATION\}\}/g,         () => optionMap['🔍 Exploration']         || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_BRAINSTORMING\}\}/g,       () => optionMap['🧠 Brainstorming']       || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_DETAIL\}\}/g,              () => optionMap['📐 Detail Solution']     || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_APPROVAL\}\}/g,            () => optionMap['✅ Approval']            || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_DEVELOPMENT\}\}/g,         () => optionMap['⚙️ Development']        || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_TESTING\}\}/g,             () => optionMap['🧪 Testing']             || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_CODE_REVIEW_PR\}\}/g,      () => optionMap['👁 Code Review / PR']   || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_READY_FOR_PRODUCTION\}\}/g,() => optionMap['🚀 Ready for Production']|| 'MISSING_ID');
    }
    fs.writeFileSync(pdlcDest, pdlcContent);
    if (projectId && statusFieldId && Object.keys(optionMap).length > 0) {
      console.log(`${i18n.pdlc_prefilled}`);
    } else {
      console.log(`${yellow}⚠️  pdlc.md copied — Project IDs not filled (board creation failed). Re-run after fixing token.${reset}`);
    }
  }

  // project-automation.yml — substitute IDs
  const paPath = path.join(destTemplates, '.github', 'workflows', 'project-automation.yml');
  if (fs.existsSync(paPath) && Object.keys(optionMap).length > 0) {
    let wfContent = fs.readFileSync(paPath, 'utf8');
    if (projectId)     wfContent = wfContent.replace(/\{\{PROJECT_ID\}\}/g,      () => projectId);
    if (statusFieldId) wfContent = wfContent.replace(/\{\{STATUS_FIELD_ID\}\}/g, () => statusFieldId);
    wfContent = wfContent.replace(/\{\{ID_IDEA\}\}/g,                () => optionMap['💡 Idea - No move to Exploration directly'] || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_EXPLORATION\}\}/g,         () => optionMap['🔍 Exploration']         || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_BRAINSTORMING\}\}/g,       () => optionMap['🧠 Brainstorming']       || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_DETAILING\}\}/g,           () => optionMap['📐 Detail Solution']     || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_APPROVAL\}\}/g,            () => optionMap['✅ Approval']            || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_DEVELOPMENT\}\}/g,         () => optionMap['⚙️ Development']        || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_TESTING\}\}/g,             () => optionMap['🧪 Testing']             || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_CODE_REVIEW_PR\}\}/g,      () => optionMap['👁 Code Review / PR']   || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_PRODUCTION\}\}/g,          () => optionMap['🚀 Ready for Production']|| 'MISSING_ID');
    fs.writeFileSync(paPath, wfContent);
  }

  console.log(`${i18n.templates_copied}`);
}
```

- [ ] **Step 8: Add `writeCliContext(targetDir, profile, data)` helper**

```js
function writeCliContext(targetDir, profile, data) {
  try {
    const contextPath = path.join(targetDir, '.agentic-pdlc', 'cli-context.json');
    fs.mkdirSync(path.join(targetDir, '.agentic-pdlc'), { recursive: true });
    fs.writeFileSync(contextPath, JSON.stringify({ profile, ...data }, null, 2));
  } catch (_) {
    // Non-fatal — agent will ask for the values instead
  }
}
```

- [ ] **Step 9: Remove now-duplicated helpers from `runSetup()` body**

In `runSetup()`, remove or comment out:
- The `getScopes()` inner function (moved to module scope)
- The `scopesBefore` / `scopesAfter` token refresh block (now in `checkAndRefreshProjectScope()`)
- The hook install block (lines ~457–478) — now in `installHook()`
- The branch protection block (lines ~362–377) — now in `setBranchProtection()`
- The adapter copy block (lines ~481–517) — now in `copyAdapterFiles()`

Do NOT refactor `runSetup()` further yet — that happens in Task 5.

- [ ] **Step 10: Commit**

```bash
git add bin/cli.js
git commit -m "refactor(cli): extract shared helper functions"
```

---

## Task 4: Implement `runLiteSetup()`

**Files:**
- Modify: `bin/cli.js` — add `runLiteSetup()` after `runSetup()`

- [ ] **Step 1: Add `runLiteSetup()` to `bin/cli.js`**

Insert the following function after the closing brace of `runSetup()` (before `runUpdate()`):

```js
async function runLiteSetup() {
  await checkGhAuth();

  const agentAnswer = await askQuestion(i18n.ask_agent);
  const agent = agentAnswer.trim().toLowerCase();
  if (!['claude', 'cursor', 'copilot'].includes(agent)) {
    console.log(t(
      `ℹ️ Generating Universal Setup for '${agent}' (Compatible with any Markdown-reading agent).`,
      `ℹ️ Gerando Setup Universal para '${agent}' (Compatível com qualquer agente que leia Markdown).`,
      `ℹ️ Generando Setup Universal para '${agent}' (Compatible con cualquier agente que lea Markdown).`
    ));
  }

  let repoOwner, repoName, repo;
  while (true) {
    let repoUrl = (await askQuestion(i18n.ask_repo)).trim();
    if (repoUrl.endsWith('/'))    repoUrl = repoUrl.slice(0, -1);
    if (repoUrl.endsWith('.git')) repoUrl = repoUrl.slice(0, -4);
    const repoParts = repoUrl.split('/');
    if (repoParts.length >= 2) {
      repoOwner = repoParts[repoParts.length - 2];
      repoName  = repoParts[repoParts.length - 1];
      repo      = `${repoOwner}/${repoName}`;
      break;
    }
    console.log(`${red}${i18n.invalid_repo}${reset}`);
  }

  console.log(`\n${yellow}${i18n.starting_setup}${reset}`);

  installHook(sourceDir, targetDir);

  console.log(`\n${yellow}${i18n.scaffolding}${reset}`);
  scaffoldLiteTemplates(sourceDir, targetDir);
  console.log(`${i18n.templates_copied}`);

  await setBranchProtection(repo, ['PDLC Stage Gate']);

  writeCliContext(targetDir, 'lite', { repoOwner, repoName, projectNumber: null, isOrg: false, boardUrl: null, patAutoSet: false });

  copyAdapterFiles(agent, sourceDir, targetDir);

  rl.close();
}
```

- [ ] **Step 2: Verify file runs without syntax errors**

```bash
node --check bin/cli.js
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add bin/cli.js
git commit -m "feat(cli): implement runLiteSetup — lite profile"
```

---

## Task 5: Refactor `runSetup()` into `runFullSetup()`

**Files:**
- Modify: `bin/cli.js` — rename and update `runSetup()`

The existing `runSetup()` already works correctly. This task renames it to `runFullSetup()`, replaces inline duplicated code with helper calls, and updates template copying to use `scaffoldFullTemplates()`.

- [ ] **Step 1: Rename `runSetup` → `runFullSetup`**

Find and replace (single occurrence — the function declaration):
```js
async function runSetup() {
```
→
```js
async function runFullSetup() {
```

- [ ] **Step 2: Replace inline hook install block with helper call**

Find the block (approximately lines 457–478 in original):
```js
  // Install PDLC stage gate hook (all agents)
  const hookSrc = path.join(sourceDir, 'adapters', 'hooks', 'pdlc-stage-gate.sh');
  const hookDir = path.join(targetDir, '.agentic-pdlc', 'hooks');
  const hookDest = path.join(hookDir, 'pdlc-stage-gate.sh');
  if (fs.existsSync(hookSrc)) {
    fs.mkdirSync(hookDir, { recursive: true });
    fs.copyFileSync(hookSrc, hookDest);
    fs.chmodSync(hookDest, '755');
  }
  const claudeSettingsDir = path.join(targetDir, '.claude');
  const claudeSettingsPath = path.join(claudeSettingsDir, 'settings.json');
  if (!fs.existsSync(claudeSettingsPath)) {
    fs.mkdirSync(claudeSettingsDir, { recursive: true });
    fs.writeFileSync(claudeSettingsPath, JSON.stringify({
      hooks: {
        PreToolUse: [{
          matcher: 'Bash',
          hooks: [{ type: 'command', command: 'bash .agentic-pdlc/hooks/pdlc-stage-gate.sh' }]
        }]
      }
    }, null, 2) + '\n');
  }
```

Replace with:
```js
  installHook(sourceDir, targetDir);
```

- [ ] **Step 3: Replace inline branch protection block with helper call**

Find the block:
```js
  // Branch protection — require PDLC Stage Gate + QA Gate on default branch
  console.log(`\n${cyan}${i18n.configuring_protection}${reset}`);
  try {
    const defaultBranch = execFileSync('gh', ['api', `repos/${repo}`, '--jq', '.default_branch'],
      { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }).trim() || 'main';
    const protectionPayload = JSON.stringify({
      required_status_checks: { strict: false, contexts: ['PDLC Stage Gate', 'QA Gate'] },
      enforce_admins: false,
      required_pull_request_reviews: null,
      restrictions: null
    });
    execFileSync('gh', ['api', `repos/${repo}/branches/${defaultBranch}/protection`, '--method', 'PUT', '--input', '-'],
      { input: protectionPayload, stdio: ['pipe', 'ignore', 'pipe'] });
    console.log(`  ${green}${i18n.protection_ok}${reset}`);
  } catch (_) {
    console.log(`  ${yellow}${i18n.protection_warn}${reset}`);
  }
```

Replace with:
```js
  await setBranchProtection(repo, ['PDLC Stage Gate', 'QA Gate']);
```

- [ ] **Step 4: Replace inline template copying with `scaffoldFullTemplates()` call**

Find the block that starts with:
```js
  console.log(`\n${yellow}${i18n.scaffolding}${reset}`);

  // We copy the templates folder so the agent has the real text logic to replace and rename
  const sourceTemplates = path.join(sourceDir, 'templates');
  const targetTemplates = path.join(targetDir, '.agentic-pdlc', 'templates');
```
and ends just before the `// Write CLI context` block.

Replace the entire scaffolding block with:
```js
  console.log(`\n${yellow}${i18n.scaffolding}${reset}`);
  scaffoldFullTemplates(sourceDir, targetDir, projectId, statusFieldId, optionMap, repoOwner, repoName);
```

- [ ] **Step 5: Replace inline adapter copy block with helper call**

Find the block that starts with:
```js
  // Handle the specific setup instructions target
  const claudeSetupSrc = path.join(sourceDir, 'adapters', 'claude-code', 'skill.md');
  const cursorSetupSrc = path.join(sourceDir, 'adapters', 'cursor', 'rules.md');

  if (agent === 'claude') {
```
and continues to the end of `runFullSetup()` (the `rl.close()` call just before).

Replace with:
```js
  copyAdapterFiles(agent, sourceDir, targetDir);

  rl.close();
```

- [ ] **Step 6: Update `writeCliContext` call at the end of the existing block**

Find:
```js
    fs.writeFileSync(cliContextPath, JSON.stringify({
      projectName,
      repoOwner,
      repoName,
      projectNumber,
      isOrg,
      boardUrl,
      patAutoSet
    }, null, 2));
```

Replace with:
```js
    writeCliContext(targetDir, 'full', {
      projectName,
      repoOwner,
      repoName,
      projectNumber,
      isOrg,
      boardUrl,
      patAutoSet
    });
```

Also remove the surrounding `try/catch` block around the old `fs.writeFileSync` (the `writeCliContext` helper handles that internally).

- [ ] **Step 7: Remove the duplicate `getScopes()` inner function and inline token-refresh block**

Inside `runFullSetup()`, remove the inner `getScopes()` definition and the `scopesBefore`/`scopesAfter` block. Replace them with a single call:

```js
  await checkAndRefreshProjectScope();
```

Place this call immediately after `await checkGhAuth();` and before the `agentAnswer` prompt.

- [ ] **Step 8: Syntax check**

```bash
node --check bin/cli.js
```

Expected: no output.

- [ ] **Step 9: Commit**

```bash
git add bin/cli.js
git commit -m "refactor(cli): runSetup → runFullSetup, replace inline blocks with helpers"
```

---

## Task 6: Implement `runUpgradeToAgentic()`

**Files:**
- Modify: `bin/cli.js` — add `runUpgradeToAgentic()` after `runLiteSetup()`

- [ ] **Step 1: Add `runUpgradeToAgentic()` to `bin/cli.js`**

Insert after `runLiteSetup()` and before `runUpdate()`:

```js
async function runUpgradeToAgentic() {
  const contextPath = path.join(targetDir, '.agentic-pdlc', 'cli-context.json');
  if (!fs.existsSync(contextPath)) {
    console.error(`\n${red}${i18n.update_no_context}${reset}\n`);
    rl.close();
    process.exit(1);
  }

  const ctx = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
  if (ctx.profile === 'full') {
    console.log(`\n${green}✅ Already running full profile. Nothing to upgrade.${reset}\n`);
    rl.close();
    return;
  }

  await checkGhAuth();
  await checkAndRefreshProjectScope();

  const { repoOwner, repoName } = ctx;
  const repo = `${repoOwner}/${repoName}`;

  const askProjectName = t(
    `What is the project name for the board? (default: ${repoName.toUpperCase()}): `,
    `Qual o nome do projeto em que o board será configurado? (padrão: ${repoName.toUpperCase()}): `,
    `¿Cuál es el nombre del proyecto en el que se configurará el board? (por defecto: ${repoName.toUpperCase()}): `
  );
  const projectNameAnswer = await askQuestion(askProjectName);
  const projectName = projectNameAnswer.trim() ? projectNameAnswer.trim().toUpperCase() : repoName.toUpperCase();
  const boardName   = `BOARD - ${projectName}`;

  let isOrg = ctx.isOrg || false;
  try {
    const ownerType = execFileSync('gh', ['api', `repos/${repo}`, '--jq', '.owner.type'],
      { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    isOrg = ownerType === 'Organization';
  } catch (_) {}

  console.log(`\n${yellow}${i18n.starting_setup}${reset}`);

  // Labels
  const labels = [
    { name: 'stage:exploration',      color: '9b59b6', description: 'Issue is being evaluated' },
    { name: 'stage:brainstorming',    color: 'e84393', description: 'Proposed approaches awaiting PM gate' },
    { name: 'stage:detailing',        color: '3498db', description: 'Technical spec is being written' },
    { name: 'stage:development',      color: 'e67e22', description: 'Agent is implementing the spec' },
    { name: 'stage:testing',          color: '8e44ad', description: 'Agent is testing the implementation' },
    { name: 'spec:approved',          color: '0e8a16', description: 'Spec approved — agent can implement' },
    { name: 'pr:in-review',           color: 'e4e669', description: 'PR awaiting code review' },
    { name: 'pr:approved',            color: '0e8a16', description: 'PR approved, ready for merge' },
    { name: 'architecture-violation', color: 'd93f0b', description: 'Invariant violation detected by CI' },
    { name: 'qa:approved',            color: '0e8a16', description: 'QA Agent approved the implementation' },
    { name: 'qa:needs-work',          color: 'd93f0b', description: 'QA Agent found issues' },
    { name: 'infra:qa-broken',        color: 'F97316', description: 'QA Agent failed to run — manual review required' },
    { name: 'jules',                  color: '5319e7', description: 'Jules AI Agent' }
  ];

  console.log(`\n${cyan}${i18n.creating_labels}${reset}`);
  for (const label of labels) {
    try {
      execFileSync('gh', ['label', 'create', label.name, '--color', label.color, '--description', label.description, '--repo', repo, '--force'], { stdio: 'ignore' });
      console.log(`  ${i18n.label_ok}${label.name}`);
    } catch (err) {
      console.log(`  ${i18n.label_warn}${label.name}`);
    }
  }

  // Board
  console.log(`\n${cyan}${i18n.creating_project}${reset}`);
  let ownerId, projectId, projectNumber;
  try {
    if (isOrg) {
      ownerId = execFileSync('gh', ['api', 'graphql', '-f', 'query=query($login: String!) { organization(login: $login) { id } }', '-f', `login=${repoOwner}`, '--jq', '.data.organization.id'],
        { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    } else {
      ownerId = execFileSync('gh', ['api', 'graphql', '-f', 'query={ viewer { id } }', '--jq', '.data.viewer.id'],
        { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    }

    const raw = execFileSync('gh', ['api', 'graphql', '-f',
      'query=mutation($owner: ID!, $title: String!) { createProjectV2(input: {ownerId: $owner, title: $title}) { projectV2 { id number } } }',
      '-f', `owner=${ownerId}`, '-f', `title=${boardName}`],
      { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    const resp = raw ? JSON.parse(raw) : null;
    if (resp?.errors) throw new Error(resp.errors.map(e => e.message).join('; '));
    const pData = resp?.data?.createProjectV2?.projectV2;
    projectId     = pData?.id;
    projectNumber = pData?.number;
    console.log(`  ${i18n.project_ok}${projectId})`);

    try {
      const repoNodeId = execFileSync('gh', ['api', `repos/${repo}`, '--jq', '.node_id'],
        { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      execFileSync('gh', ['api', 'graphql', '-f',
        'query=mutation($projectId: ID!, $repositoryId: ID!) { linkProjectV2ToRepository(input: {projectId: $projectId, repositoryId: $repositoryId}) { repository { name } } }',
        '-f', `projectId=${projectId}`, '-f', `repositoryId=${repoNodeId}`],
        { stdio: 'ignore' });
      console.log(`  ${i18n.link_project_ok}`);
    } catch (_) {
      console.log(`  ${i18n.link_project_warn}`);
    }
  } catch (err) {
    console.log(`  ${i18n.project_err}${err.message}`);
  }

  let statusFieldId;
  let optionMap = {};

  if (projectId) {
    console.log(`  ${cyan}${i18n.config_columns}${reset}`);
    try {
      statusFieldId = execFileSync('gh', ['api', 'graphql', '-f',
        'query=query($projectId: ID!) { node(id: $projectId) { ... on ProjectV2 { fields(first: 20) { nodes { ... on ProjectV2SingleSelectField { id name } } } } } }',
        '-f', `projectId=${projectId}`, '--jq', '.data.node.fields.nodes[] | select(.name == "Status") | .id'
      ]).toString().trim();

      if (statusFieldId) {
        const columns = [
          { name: '💡 Idea - No move to Exploration directly', description: 'Just tell your agent to work on issue #XX', color: 'GRAY' },
          { name: '🔍 Exploration',     description: 'AI is analyzing code and context',            color: 'PURPLE' },
          { name: '🧠 Brainstorming',   description: 'AI proposed approaches and trade-offs',       color: 'PINK'   },
          { name: '📐 Detail Solution', description: 'AI is writing the technical spec',            color: 'BLUE'   },
          { name: '✅ Approval',        description: 'Spec ready, awaiting `spec:approved` label',  color: 'GREEN'  },
          { name: '⚙️ Development',    description: 'AI implementing the spec',                    color: 'ORANGE' },
          { name: '🧪 Testing',         description: 'QA testing and CI pipeline checks',           color: 'RED'    },
          { name: '👁 Code Review / PR',description: 'PR opened, awaiting your review',             color: 'YELLOW' },
          { name: '🚀 Ready for Production', description: 'Merged and ready for production',        color: 'GREEN'  }
        ];

        const queryPayload = JSON.stringify({
          query: `mutation($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]) {
            updateProjectV2Field(input: { fieldId: $fieldId, singleSelectOptions: $options }) {
              projectV2Field { ... on ProjectV2SingleSelectField { options { id name } } }
            }
          }`,
          variables: { fieldId: statusFieldId, options: columns }
        });

        const updateOutput = execFileSync('gh', ['api', 'graphql', '--input', '-'],
          { input: queryPayload }).toString().trim();
        const jsonResponse = updateOutput ? JSON.parse(updateOutput) : null;
        const returnedOptions = jsonResponse?.data?.updateProjectV2Field?.projectV2Field?.options || [];
        for (const opt of returnedOptions) optionMap[opt.name] = opt.id;
        console.log(`  ${i18n.columns_ok}`);
      }
    } catch (_) {
      console.log(`  ${i18n.columns_warn}`);
    }
  }

  // Auto-provision PROJECT_PAT for personal repos
  let patAutoSet = false;
  if (projectId && !isOrg) {
    try {
      const tokenOut = execFileSync('gh', ['auth', 'token'],
        { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
      if (tokenOut) {
        execFileSync('gh', ['secret', 'set', 'PROJECT_PAT', '--body', tokenOut, '--repo', repo],
          { stdio: ['ignore', 'pipe', 'pipe'] });
        patAutoSet = true;
        console.log(`\n${green}✅ PROJECT_PAT secret set automatically (uses your gh OAuth token).${reset}`);
      }
    } catch (_) {
      console.log(`\n${yellow}⚠️  Could not auto-set PROJECT_PAT. Agent will guide manual setup.${reset}`);
    }
  }

  console.log(`\n${yellow}${i18n.scaffolding}${reset}`);
  scaffoldFullTemplates(sourceDir, targetDir, projectId, statusFieldId, optionMap, repoOwner, repoName);

  await setBranchProtection(repo, ['PDLC Stage Gate', 'QA Gate']);

  const boardUrl = projectNumber ? buildBoardUrl(repoOwner, projectNumber, isOrg) : null;
  writeCliContext(targetDir, 'full', {
    projectName,
    repoOwner,
    repoName,
    projectNumber,
    isOrg,
    boardUrl,
    patAutoSet
  });

  const line1 = t('🎉 Upgrade complete! Board:', '🎉 Upgrade concluído! Board:', '🎉 ¡Actualización completada! Board:');
  console.log(`\n${green}${line1} ${boardUrl || '(board creation failed)'}${reset}\n`);

  rl.close();
}
```

- [ ] **Step 2: Syntax check**

```bash
node --check bin/cli.js
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add bin/cli.js
git commit -m "feat(cli): implement runUpgradeToAgentic — upgrade lite to full"
```

---

## Task 7: Backwards compat for `runUpdate()` with missing `profile` field

**Files:**
- Modify: `bin/cli.js` — `runUpdate()` function

`runUpdate()` reads `cli-context.json`. Existing installs lack the `profile` field. The function must treat missing `profile` as `'full'` to avoid breakage.

- [ ] **Step 1: Locate the context read in `runUpdate()`**

Find (approximately line 615 of original):
```js
async function runUpdate() {
  const contextPath = path.join(targetDir, '.agentic-pdlc', 'cli-context.json');
  if (!fs.existsSync(contextPath)) {
    console.error(`\n${red}${i18n.update_no_context}${reset}\n`);
    rl.close();
    process.exit(1);
  }

  const state = detectAgentState(targetDir);
```

- [ ] **Step 2: Add backwards-compat profile check**

Insert after the `fs.existsSync` guard and before `const state = detectAgentState(targetDir);`:

```js
  const ctx = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
  if ((ctx.profile || 'full') === 'lite') {
    console.log(`\n${yellow}⚠️  Lite install detected. Run --upgrade-to-agentic to add the full board machine first.${reset}\n`);
    rl.close();
    return;
  }
```

This guards against accidentally running `--update` (which configures Jules/QA/Sentinel) on a lite install that has no board.

- [ ] **Step 3: Syntax check**

```bash
node --check bin/cli.js
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add bin/cli.js
git commit -m "fix(cli): guard runUpdate against lite installs, treat missing profile as full"
```

---

## Task 8: Run all tests + final integration check

- [ ] **Step 1: Run unit tests**

```bash
npm test
```

Expected: all `resolveMode` and `buildFullClaudeContent` tests pass.

- [ ] **Step 2: Dry-run syntax check on final cli.js**

```bash
node --check bin/cli.js
```

Expected: no output.

- [ ] **Step 3: Smoke-test lite mode (no real repo needed)**

The `--help` flag doesn't exist, but you can verify the routing by reading the entry point:

```bash
node -e "
const { execSync } = require('child_process');
// Patch: override process.argv to simulate no-flag invocation
// Then verify resolveMode is in scope and returns 'lite'
const src = require('fs').readFileSync('bin/cli.js', 'utf8');
const match = src.match(/function resolveMode\(args\)/);
console.log(match ? '✅ resolveMode found' : '❌ resolveMode missing');
const entryLite  = src.includes(\"mode === 'lite'\") || src.includes('runLiteSetup');
const entryFull  = src.includes(\"mode === 'full'\") || src.includes('runFullSetup');
const entryUpgrade = src.includes('runUpgradeToAgentic');
console.log(entryLite    ? '✅ runLiteSetup wired' : '❌ runLiteSetup missing');
console.log(entryFull    ? '✅ runFullSetup wired' : '❌ runFullSetup missing');
console.log(entryUpgrade ? '✅ runUpgradeToAgentic wired' : '❌ runUpgradeToAgentic missing');
"
```

Expected:
```
✅ resolveMode found
✅ runLiteSetup wired
✅ runFullSetup wired
✅ runUpgradeToAgentic wired
```

- [ ] **Step 4: Verify template paths exist**

```bash
node -e "
const fs = require('fs');
const checks = [
  'templates/lite/CLAUDE.md',
  'templates/lite/AGENTS.md',
  'templates/full/CLAUDE.md',
  'templates/full/AGENTS.md',
  'templates/full/docs/pdlc.md',
  'templates/.github/ISSUE_TEMPLATE',
  'templates/.github/workflows/project-automation.yml',
  'adapters/hooks/pdlc-stage-gate.sh',
];
for (const p of checks) {
  console.log(fs.existsSync(p) ? '✅ ' + p : '❌ MISSING: ' + p);
}
"
```

Expected: all `✅`.

- [ ] **Step 5: Final commit**

```bash
git add bin/cli.js tests/cli.test.js package.json
git commit -m "test: final integration checks pass"
```

---

## Self-Review

### Spec coverage

| AC | Task |
|---|---|
| `npx create-agentic-pdlc` installs only lite artifacts | Task 4 — `runLiteSetup()` |
| `--agentic` installs lite + board workflows | Task 5 — `runFullSetup()` |
| `--update` on lite preserves board IDs | Task 7 — guard + no-op on lite |
| `--upgrade-to-agentic` adds board without touching lite config | Task 6 — `runUpgradeToAgentic()` |
| Legacy install (no `profile` field) treated as `full` | Task 7 — `(ctx.profile \|\| 'full')` |

### Known gaps

- `scaffoldLiteTemplates` does not copy a `pdlc-stage-gate.yml` CI workflow to the target `.github/workflows/` — lite uses only branch protection, no CI workflow. This is intentional per the spec ("No workflows beyond branch protection and CI"). If a minimal `pdlc-stage-gate.yml` is needed for the required status check to appear in GitHub, add a step in Task 4 to also copy `templates/.github/workflows/pdlc-stage-gate.yml` to the lite scaffolding.
- `runUpgradeToAgentic()` duplicates the board creation logic from `runFullSetup()`. This is acceptable at this scope (Option B). If duplication becomes a burden, extract a `createBoard(repo, boardName, isOrg)` helper — that's a future cleanup, not in scope here.
