# Setup Guide — Agentic PDLC Framework

Step-by-step guide to applying the framework to a new project.
Estimated time: 2-3 hours (including GitHub Projects setup).

---

## Prerequisites

- Target repository on GitHub (Public or GitHub Pro for branch protection)
- `gh` CLI installed and authenticated
- GitHub Projects enabled on your account/organization
- Implementation agent connected to the repository (e.g., Jules: github.com/google-labs/jules)

---

## Step 1 — Create the GitHub Project Board

```bash
# Create the project
gh api graphql -f query='
mutation($owner: ID!, $title: String!) {
  createProjectV2(input: {ownerId: $owner, title: $title}) {
    projectV2 { id }
  }
}' -f owner="YOUR_USER_NODE_ID" -f title="PDLC — Project Name"
```

To get your user node ID:
```bash
gh api graphql -f query='{ viewer { id } }' --jq '.data.viewer.id'
```

After creation, **add the 10 columns** via the GitHub Projects UI or API.
Note down the `PROJECT_ID` and the `STATUS_FIELD_ID` for future steps.

---

## Step 2 — Create the Repository Labels

```bash
REPO="owner/repo"
gh label create "spec:approved"          --repo $REPO --color "0e8a16" --description "Spec approved — agent can implement"
gh label create "pr:review"              --repo $REPO --color "e4e669" --description "PR awaiting code review"
gh label create "pr:approved"            --repo $REPO --color "0e8a16" --description "PR approved, ready for merge"
gh label create "architecture-violation" --repo $REPO --color "d93f0b" --description "Invariant violation detected by CI"
```

---

## Step 3 — Scaffold the Framework Files

Instead of manually copying templates around, you can interactively inject the framework into your project using our open-source NPM tool.

Run the following command in the root of your project:

```bash
npx create-agentic-pdlc
```

The CLI will:
1. Ask you which AI Agent you use (Claude Code, Cursor, etc.).
2. Copy the system instructions pointing to our interactive Setup Mode.
3. Automatically download the base templates to `.agentic-pdlc/templates/`.

Once the CLI finishes, it will instruct you to open your AI agent and run the **Setup Mode**. Your AI agent will then ask you the required project variables interactively and generate `AGENTS.md`, `docs/pdlc.md`, and the GitHub Actions for you!

---

## Step 4 — Configure GitHub Secrets

In the target repository: Settings → Secrets → Actions

| Secret | Description |
|---|---|
| `PROJECT_TOKEN` | GitHub PAT with `repo` + `project` scopes |

---

## Step 5 — Activate Branch Protection on `main`

Requires a public repository or GitHub Pro:

```bash
gh api repos/OWNER/REPO/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "checks": [{"context": "Sentinel / CI"}]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

---

## Step 6 — Commit Artifacts

```bash
git add AGENTS.md docs/pdlc.md .github/workflows/
git commit -m "chore: setup agentic-pdlc framework"
git push
```

---

## Step 7 — Populate the Initial Backlog

For each known idea or feature, create an issue using the convention:

```bash
gh issue create \
  --repo owner/repo \
  --title "👤 US: [short description]" \
  --body "**As** [user],
**I want** [action],
**so that** [benefit].

---

Initial idea issue. Spec to be detailed."
```

Move the issues to the `Idea` column on the board matching your setup.

---

## (Optional) Architecture Violation Integration

If your project uses an automated architecture auditing tool (e.g., a CI job that creates issues with an `architecture-violation` label), the Setup Mode can automatically add a GitHub Actions job to `project-automation.yml` that moves these issues to the `Idea` column.

If you skipped this during setup but want to add it later, you can append the following job to `.github/workflows/project-automation.yml` under the `jobs` section:

```yaml
  move-violation-to-board:
    name: architecture-violation → 💡 Idea
    if: github.event_name == 'issues' && github.event.label.name == 'architecture-violation'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.PROJECT_TOKEN }}
          script: |
            const issueNodeId = context.payload.issue.node_id;
            const addResult = await github.graphql(`
              mutation($p: ID!, $c: ID!) {
                addProjectV2ItemById(input: {projectId: $p, contentId: $c}) { item { id } }
              }`, { p: process.env.PROJECT_ID, c: issueNodeId });
            const itemId = addResult.addProjectV2ItemById.item.id;
            await github.graphql(`
              mutation($p: ID!, $i: ID!, $f: ID!, $v: ProjectV2FieldValue!) {
                updateProjectV2ItemFieldValue(input: {projectId: $p, itemId: $i, fieldId: $f, value: $v}) {
                  projectV2Item { id }
                }
              }`, { p: process.env.PROJECT_ID, i: itemId, f: process.env.STATUS_FIELD_ID,
                    v: { singleSelectOptionId: process.env.STATUS_IDEA } });
```

---

## Final Verification Checklist

- [ ] Board has 10 columns fully configured
- [ ] Labels created in the repository
- [ ] `AGENTS.md` is present at the root, completely devoid of placeholders
- [ ] `docs/pdlc.md` has the correct IDs
- [ ] `project-automation.yml` is active (test with a dummy PR)
- [ ] `agent-trigger.yml` is active (test by adding `spec:approved` to an issue)
- [ ] `ci.yml` correctly runs tests and linters
- [ ] Branch protection active on `main`
- [ ] Implementation agent correctly connected to the repo
