# Spec-Format Issue Template Installation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `npx create-agentic-pdlc` install `.github/ISSUE_TEMPLATE/` directly into the target project so GitHub shows the spec-format template when users create issues.

**Architecture:** Single change in `bin/cli.js` — inside `runSetup()`, after the existing template copy block, add a `copyDirSync` call that copies `templates/.github/ISSUE_TEMPLATE/` directly to `targetDir/.github/ISSUE_TEMPLATE/`. No placeholder substitution needed.

**Tech Stack:** Node.js, `fs`, `path` — all already imported. No new dependencies.

---

### Task 1: Add i18n string

**Files:**
- Modify: `bin/cli.js:77` (inside `i18n` object, before the closing `}`)

No test infrastructure exists in this project — verification is manual (Task 2).

- [ ] **Step 1: Add the i18n string**

In [bin/cli.js](bin/cli.js), on line 77 (right before the closing `};` of the `i18n` object), add:

```js
  protection_warn: t('⚠️  Branch protection could not be set automatically.\n     Set required checks manually: Settings → Branches → main → Required status checks.\n     Required: "PDLC Stage Gate" and "QA Gate"', '⚠️  Proteção de branch não pôde ser configurada automaticamente.\n     Configure manualmente: Settings → Branches → main → Required status checks.\n     Obrigatórios: "PDLC Stage Gate" e "QA Gate"', '⚠️  No se pudo configurar la protección de rama automáticamente.\n     Configúralo en: Settings → Branches → main → Required status checks.\n     Requeridos: "PDLC Stage Gate" y "QA Gate"'),
  issue_templates_copied: t(
    '✅ Issue templates copied to .github/ISSUE_TEMPLATE/',
    '✅ Issue templates copiados para .github/ISSUE_TEMPLATE/',
    '✅ Issue templates copiados a .github/ISSUE_TEMPLATE/'
  ),
};
```

(Replace the existing `protection_warn` line + closing `};` with the block above — adds the new key before `};`.)

---

### Task 2: Add copyDirSync call in runSetup()

**Files:**
- Modify: `bin/cli.js:387` (inside `if (fs.existsSync(sourceTemplates))` block, after the `templates_copied` log line)

- [ ] **Step 1: Add the copy block**

In [bin/cli.js](bin/cli.js), after line 387 (`console.log(`${i18n.templates_copied}`)`), insert:

```js
    // Copy issue templates directly to .github/ISSUE_TEMPLATE/ so GitHub picks them up
    const sourceIssueTemplates = path.join(sourceDir, 'templates', '.github', 'ISSUE_TEMPLATE');
    const targetIssueTemplates = path.join(targetDir, '.github', 'ISSUE_TEMPLATE');
    if (fs.existsSync(sourceIssueTemplates)) {
      copyDirSync(sourceIssueTemplates, targetIssueTemplates);
      console.log(i18n.issue_templates_copied);
    }
```

The result in context should look like:

```js
  if (fs.existsSync(sourceTemplates)) {
    copyDirSync(sourceTemplates, targetTemplates);
    console.log(`${i18n.templates_copied}`);

    // Copy issue templates directly to .github/ISSUE_TEMPLATE/ so GitHub picks them up
    const sourceIssueTemplates = path.join(sourceDir, 'templates', '.github', 'ISSUE_TEMPLATE');
    const targetIssueTemplates = path.join(targetDir, '.github', 'ISSUE_TEMPLATE');
    if (fs.existsSync(sourceIssueTemplates)) {
      copyDirSync(sourceIssueTemplates, targetIssueTemplates);
      console.log(i18n.issue_templates_copied);
    }

    // Substitute values in docs/pdlc.md automatically
    const pdlcDest = path.join(targetTemplates, 'docs', 'pdlc.md');
```

- [ ] **Step 2: Verify syntax is valid**

```bash
node --check bin/cli.js
```

Expected: no output (exit code 0). Any output means a syntax error — fix before continuing.

---

### Task 3: Manual verification

- [ ] **Step 1: Create a temp target directory and run the copy logic in isolation**

```bash
node -e "
const fs = require('fs');
const path = require('path');
const sourceDir = '.';
const targetDir = '/tmp/pdlc-test-157';

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d);
  }
}

const sourceIssueTemplates = path.join(sourceDir, 'templates', '.github', 'ISSUE_TEMPLATE');
const targetIssueTemplates = path.join(targetDir, '.github', 'ISSUE_TEMPLATE');
if (fs.existsSync(sourceIssueTemplates)) {
  copyDirSync(sourceIssueTemplates, targetIssueTemplates);
  console.log('copied');
} else {
  console.log('source not found');
}
"
```

Expected output: `copied`

- [ ] **Step 2: Verify files are in the right place**

```bash
ls /tmp/pdlc-test-157/.github/ISSUE_TEMPLATE/
```

Expected output:
```
bug.md
feature.md
task.md
```

- [ ] **Step 3: Verify .github/ was created recursively (didn't exist before)**

```bash
ls /tmp/pdlc-test-157/.github/
```

Expected output:
```
ISSUE_TEMPLATE
```

- [ ] **Step 4: Clean up**

```bash
rm -rf /tmp/pdlc-test-157
```

---

### Task 4: Commit

- [ ] **Step 1: Stage and commit**

```bash
git add bin/cli.js
git commit -m "feat(cli): install issue templates to .github/ISSUE_TEMPLATE/ during setup

Closes #157"
```
