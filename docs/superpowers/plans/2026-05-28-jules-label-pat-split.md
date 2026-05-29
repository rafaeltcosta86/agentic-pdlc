# Jules Label PAT Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the `Update Labels` step in both template `agent-trigger.yml` files so stage labels use `GITHUB_TOKEN` and the agent label (`jules`) uses `PROJECT_PAT`, ensuring external GitHub App webhooks fire.

**Architecture:** Two YAML edits — one per template file (they are identical in content). The existing single step that adds all labels via `GITHUB_TOKEN` is replaced by two sequential steps: first adds stage labels via `GITHUB_TOKEN`, second adds the agent label via `PROJECT_PAT` with a guard condition. No new files, no script changes.

**Tech Stack:** GitHub Actions YAML, `actions/github-script@v7`

---

## File Map

| Action | File |
|---|---|
| Modify | `templates/.github/workflows/agent-trigger.yml` |
| Modify | `.agentic-pdlc/templates/.github/workflows/agent-trigger.yml` |

Both files are identical — apply the same change to each.

---

### Task 1: Fix `templates/.github/workflows/agent-trigger.yml`

**Files:**
- Modify: `templates/.github/workflows/agent-trigger.yml`

Current `Update Labels` step (lines 25–53):

```yaml
      - name: Update Labels
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const { owner, repo } = context.repo;
            const issue_number = context.payload.issue.number;

            try {
              await github.rest.issues.removeLabel({
                owner,
                repo,
                issue_number,
                name: 'stage:approval'
              });
            } catch (error) {
              console.log('Label stage:approval not found or could not be removed');
            }

            const agentLabel = '{{IMPLEMENTATION_AGENT_LABEL}}';
            const labelsToAdd = ['stage:development'];
            if (!agentLabel.includes('{{')) labelsToAdd.push(agentLabel, 'agent:working');

            await github.rest.issues.addLabels({
              owner,
              repo,
              issue_number,
              labels: labelsToAdd
            });
```

- [ ] **Step 1: Replace `Update Labels` step with two steps**

Replace the step above with:

```yaml
      - name: Update stage labels
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const { owner, repo } = context.repo;
            const issue_number = context.payload.issue.number;

            try {
              await github.rest.issues.removeLabel({
                owner,
                repo,
                issue_number,
                name: 'stage:approval'
              });
            } catch (error) {
              console.log('Label stage:approval not found or could not be removed');
            }

            await github.rest.issues.addLabels({
              owner,
              repo,
              issue_number,
              labels: ['stage:development', 'agent:working']
            });

      - name: Add agent label via PAT
        if: ${{ env.PROJECT_PAT != '' && !contains('{{IMPLEMENTATION_AGENT_LABEL}}', '{{') }}
        uses: actions/github-script@v7
        with:
          github-token: ${{ env.PROJECT_PAT }}
          script: |
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.issue.number,
              labels: ['{{IMPLEMENTATION_AGENT_LABEL}}']
            });
```

- [ ] **Step 2: Verify file looks correct**

Run:
```bash
grep -n "name:\|github-token:" templates/.github/workflows/agent-trigger.yml
```

Expected output (step names and tokens in order):
```
25:      - name: Update stage labels
28:          github-token: ${{ secrets.GITHUB_TOKEN }}
55:      - name: Add agent label via PAT
59:          github-token: ${{ env.PROJECT_PAT }}
65:      - name: Move board card to Development
```

- [ ] **Step 3: Commit**

```bash
git add templates/.github/workflows/agent-trigger.yml
git commit -m "fix(templates): split jules label into PAT step to fire external App webhook"
```

---

### Task 2: Fix `.agentic-pdlc/templates/.github/workflows/agent-trigger.yml`

**Files:**
- Modify: `.agentic-pdlc/templates/.github/workflows/agent-trigger.yml`

Same change as Task 1 — the two files are identical.

- [ ] **Step 1: Replace `Update Labels` step with two steps**

Replace the same `Update Labels` block with:

```yaml
      - name: Update stage labels
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const { owner, repo } = context.repo;
            const issue_number = context.payload.issue.number;

            try {
              await github.rest.issues.removeLabel({
                owner,
                repo,
                issue_number,
                name: 'stage:approval'
              });
            } catch (error) {
              console.log('Label stage:approval not found or could not be removed');
            }

            await github.rest.issues.addLabels({
              owner,
              repo,
              issue_number,
              labels: ['stage:development', 'agent:working']
            });

      - name: Add agent label via PAT
        if: ${{ env.PROJECT_PAT != '' && !contains('{{IMPLEMENTATION_AGENT_LABEL}}', '{{') }}
        uses: actions/github-script@v7
        with:
          github-token: ${{ env.PROJECT_PAT }}
          script: |
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.issue.number,
              labels: ['{{IMPLEMENTATION_AGENT_LABEL}}']
            });
```

- [ ] **Step 2: Verify both files are identical**

Run:
```bash
diff templates/.github/workflows/agent-trigger.yml .agentic-pdlc/templates/.github/workflows/agent-trigger.yml
```

Expected: no output (files identical).

- [ ] **Step 3: Commit**

```bash
git add .agentic-pdlc/templates/.github/workflows/agent-trigger.yml
git commit -m "fix(templates): mirror jules label PAT split in .agentic-pdlc/templates"
```

---

### Task 3: Open PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/125-jules-label-pat-split
```

- [ ] **Step 2: Create PR**

```bash
gh pr create \
  --title "fix(templates): split jules label into PAT step — fix external App webhook" \
  --body "$(cat <<'EOF'
## Summary

- Splits `Update Labels` step in both template `agent-trigger.yml` files into two steps
- Stage labels (`stage:development`, `agent:working`) remain on `GITHUB_TOKEN`
- Agent label (`{{IMPLEMENTATION_AGENT_LABEL}}`, e.g. `jules`) moved to new step using `PROJECT_PAT`
- New step guarded by `PROJECT_PAT != ''` and placeholder check — graceful degradation when PAT not configured

## Why

GitHub's anti-loop protection suppresses external App webhooks for events generated by `GITHUB_TOKEN`. Jules (external GitHub App) watches the `jules` label event — if generated by `GITHUB_TOKEN`, Jules never fires. Fix confirmed in context-optimizer PR#12.

## Test plan

- [ ] Scaffold new project with `npx create-agentic-pdlc`
- [ ] Configure `PROJECT_PAT` secret
- [ ] Add `spec:approved` to an issue
- [ ] Verify `stage:development` + `agent:working` added first (GITHUB_TOKEN), then `jules` added as separate event (PAT) → Jules activates automatically

Closes #125

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
