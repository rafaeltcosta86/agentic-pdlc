# Design: ship spec-format issue template (lite)

**Issue:** #157
**Date:** 2026-06-04
**Status:** approved

## Problem

`npx create-agentic-pdlc` copies templates to `.agentic-pdlc/templates/` — a path GitHub ignores entirely. Users who open "New Issue" after setup see a blank text box instead of the spec format template.

## Decision

Copy `templates/.github/ISSUE_TEMPLATE/` directly to `targetDir/.github/ISSUE_TEMPLATE/` during `runSetup()` in `bin/cli.js`. No agent involvement — templates have no `{{PLACEHOLDER}}` substitution, so the CLI can write them directly.

## Change

**File:** `bin/cli.js`

After the existing `copyDirSync(sourceTemplates, targetTemplates)` block (around line 386):

```js
// i18n string (add to i18n object)
issue_templates_copied: t(
  '✅ Issue templates copied to .github/ISSUE_TEMPLATE/',
  '✅ Issue templates copiados para .github/ISSUE_TEMPLATE/',
  '✅ Issue templates copiados a .github/ISSUE_TEMPLATE/'
),

// Copy block (add inside runSetup(), after template copy)
const sourceIssueTemplates = path.join(sourceDir, 'templates', '.github', 'ISSUE_TEMPLATE');
const targetIssueTemplates = path.join(targetDir, '.github', 'ISSUE_TEMPLATE');
if (fs.existsSync(sourceIssueTemplates)) {
  copyDirSync(sourceIssueTemplates, targetIssueTemplates);
  console.log(i18n.issue_templates_copied);
}
```

## Edge Cases

- `.github/ISSUE_TEMPLATE/` already exists → `copyDirSync` overwrites. Correct — boilerplate, not user customizations.
- Source dir missing (corrupt install) → guarded by `if (fs.existsSync(...))`, skips silently.

## Out of Scope

- Changes to template content — existing `feature.md`, `bug.md`, `task.md` already have all required sections.
- Changes to `adapters/claude-code/skill.md` — agent setup not involved.
