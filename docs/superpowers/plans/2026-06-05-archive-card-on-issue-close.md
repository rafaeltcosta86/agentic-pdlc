# Archive Board Card on Issue Close Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Archive the GitHub Project board card when an issue is closed, preventing stale cards from accumulating in active columns.

**Architecture:** Single new job appended to `project-automation.yml` template. Triggers on the already-present `issues: closed` event. Uses `addProjectV2ItemById` (idempotent) then `archiveProjectV2Item` — handles both issues closed without a PR and issues closed via PR merge safely.

**Tech Stack:** GitHub Actions, `actions/github-script@v8`, GitHub GraphQL API (`addProjectV2ItemById`, `archiveProjectV2Item`).

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `templates/.github/workflows/project-automation.yml` | Add `move-card-on-issue-close` job at end of file |

No unit tests — YAML workflow template; correctness verified by grep and manual inspection.

---

### Task 1: Add `move-card-on-issue-close` job

**Files:**
- Modify: `templates/.github/workflows/project-automation.yml` (append after `cleanup-labels-on-close`)

- [ ] **Step 1: Verify the insertion point**

Run:
```bash
tail -5 templates/.github/workflows/project-automation.yml
```

Expected: last line is `console.log(\`Issue #\${issue_number} labels cleaned up\`);` followed by closing braces. The file ends after `cleanup-labels-on-close`.

- [ ] **Step 2: Append the new job**

At the end of `templates/.github/workflows/project-automation.yml`, add:

```yaml

  move-card-on-issue-close:
    name: Closed issue → Archive from board
    if: github.event_name == 'issues' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    env:
      PROJECT_TOKEN: ${{ secrets.PROJECT_TOKEN }}
    steps:
      - name: Archive board card
        if: ${{ env.PROJECT_TOKEN != '' && env.PROJECT_ID != '' }}
        uses: actions/github-script@v8
        with:
          github-token: ${{ env.PROJECT_TOKEN }}
          script: |
            const nodeId = context.payload.issue.node_id;
            let itemId;
            try {
              const added = await github.graphql(`
                mutation($p: ID!, $c: ID!) {
                  addProjectV2ItemById(input: {projectId: $p, contentId: $c}) { item { id } }
                }`, { p: process.env.PROJECT_ID, c: nodeId });
              itemId = added.addProjectV2ItemById.item.id;
            } catch (e) {
              console.log(`Could not add issue to project: ${e.message}`);
              return;
            }
            await github.graphql(`
              mutation($p: ID!, $i: ID!) {
                archiveProjectV2Item(input: {projectId: $p, itemId: $i}) { item { id } }
              }`, { p: process.env.PROJECT_ID, i: itemId });
            console.log(`Issue #${context.payload.issue.number} archived from board`);
```

- [ ] **Step 3: Verify job was added and file is syntactically correct**

Run:
```bash
grep -n "move-card-on-issue-close\|archiveProjectV2Item" templates/.github/workflows/project-automation.yml
```

Expected: two matches — the job name line and the mutation name.

Run:
```bash
python3 -c "import yaml, sys; yaml.safe_load(open('templates/.github/workflows/project-automation.yml'))" 2>&1
```

Expected: no output (valid YAML).

- [ ] **Step 4: Verify guard condition matches existing pattern**

Run:
```bash
grep "PROJECT_TOKEN != ''" templates/.github/workflows/project-automation.yml
```

Expected: multiple lines including the new job — confirms guard is consistent with other jobs.

- [ ] **Step 5: Commit**

```bash
git add templates/.github/workflows/project-automation.yml
git commit -m "feat(templates): archive board card when issue is closed"
```
