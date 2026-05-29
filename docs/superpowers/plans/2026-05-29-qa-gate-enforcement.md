# QA Gate Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block PR merges when QA Agent failed or hasn't run, by (A) making `qa-agent.yml` emit a failing exit code on infra/parse errors and (C) adding a dedicated `qa-gate.yml` status check that enforces label-based QA state — backed by branch protection configured automatically during `npx create-agentic-pdlc`.

**Architecture:** Two independent layers. Layer A: `qa-agent.yml` stops signalling success (`exit 0`) when it can't reach GitHub Models — now exits 1, making the check red. Layer C: `qa-gate.yml` is a separate required check that reads PR labels and blocks merge unless `qa:approved` is present. Branch protection wires both checks as required, enforced automatically in `cli.js` during scaffold.

**Tech Stack:** GitHub Actions YAML (bash), Node.js (cli.js)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `.github/workflows/qa-agent.yml:66-69` and `:82-84` | Change `exit 0` → `exit 1` on API error and parse error |
| Modify | `templates/.github/workflows/qa-agent.yml:63-66` and `:79-81` | Same fix in template |
| Create | `.github/workflows/qa-gate.yml` | Blocking check — reads PR labels, fails unless `qa:approved` |
| Create | `templates/.github/workflows/qa-gate.yml` | Template mirror of above |
| Modify | `bin/cli.js` | Add branch protection setup step after PAT provisioning |

---

### Task 1: Fix `qa-agent.yml` exit codes (repo + template)

**Files:**
- Modify: `.github/workflows/qa-agent.yml`
- Modify: `templates/.github/workflows/qa-agent.yml`

Currently both files call `exit 0` when the GitHub Models API is unreachable or when the response can't be parsed. This makes the CI check green, hiding the failure.

- [ ] **Step 1: Fix exit code on API_ERROR in `.github/workflows/qa-agent.yml`**

Find this block (around line 63-69):
```yaml
          if [ "$RESPONSE" = "API_ERROR" ]; then
            GH_TOKEN="$PROJECT_TOKEN" gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/labels" --method POST -f 'labels[]=infra:qa-broken'
            gh pr comment "$PR_NUMBER" --body "🤖 **QA Agent:** Could not reach GitHub Models API. Manual review required."
            exit 0
          fi
```

Change to:
```yaml
          if [ "$RESPONSE" = "API_ERROR" ]; then
            GH_TOKEN="$PROJECT_TOKEN" gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/labels" --method POST -f 'labels[]=infra:qa-broken'
            gh pr comment "$PR_NUMBER" --body "🤖 **QA Agent:** Could not reach GitHub Models API. Manual review required."
            exit 1
          fi
```

- [ ] **Step 2: Fix exit code on parse error in `.github/workflows/qa-agent.yml`**

Find this block (around line 82-84):
```yaml
          else
            GH_TOKEN="$PROJECT_TOKEN" gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/labels" --method POST -f 'labels[]=infra:qa-broken'
            gh pr comment "$PR_NUMBER" --body "🤖 **QA Agent:** Could not parse GitHub Models response. Manual review required."
          fi
```

Change to:
```yaml
          else
            GH_TOKEN="$PROJECT_TOKEN" gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/labels" --method POST -f 'labels[]=infra:qa-broken'
            gh pr comment "$PR_NUMBER" --body "🤖 **QA Agent:** Could not parse GitHub Models response. Manual review required."
            exit 1
          fi
```

- [ ] **Step 3: Apply the same two fixes to `templates/.github/workflows/qa-agent.yml`**

The template uses `PROJECT_PAT` instead of `PROJECT_TOKEN` in the `GH_TOKEN=` prefix. The exit code change is identical.

In `templates/.github/workflows/qa-agent.yml`, find API_ERROR block (around line 63-66):
```yaml
          if [ "$RESPONSE" = "API_ERROR" ]; then
            GH_TOKEN="$PROJECT_PAT" gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/labels" --method POST -f 'labels[]=infra:qa-broken'
            gh pr comment "$PR_NUMBER" --body "🤖 **QA Agent:** Could not reach GitHub Models API. Manual review required."
            exit 0
          fi
```

Change to:
```yaml
          if [ "$RESPONSE" = "API_ERROR" ]; then
            GH_TOKEN="$PROJECT_PAT" gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/labels" --method POST -f 'labels[]=infra:qa-broken'
            gh pr comment "$PR_NUMBER" --body "🤖 **QA Agent:** Could not reach GitHub Models API. Manual review required."
            exit 1
          fi
```

Find parse error block (around line 79-81):
```yaml
          else
            GH_TOKEN="$PROJECT_PAT" gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/labels" --method POST -f 'labels[]=infra:qa-broken'
            gh pr comment "$PR_NUMBER" --body "🤖 **QA Agent:** Could not parse GitHub Models response. Manual review required."
          fi
```

Change to:
```yaml
          else
            GH_TOKEN="$PROJECT_PAT" gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/labels" --method POST -f 'labels[]=infra:qa-broken'
            gh pr comment "$PR_NUMBER" --body "🤖 **QA Agent:** Could not parse GitHub Models response. Manual review required."
            exit 1
          fi
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/qa-agent.yml templates/.github/workflows/qa-agent.yml
git commit -m "fix(qa-agent): exit 1 on infra error and parse failure instead of exit 0"
```

---

### Task 2: Create `qa-gate.yml` — dedicated blocking check

**Files:**
- Create: `.github/workflows/qa-gate.yml`
- Create: `templates/.github/workflows/qa-gate.yml`

This is a new, independent status check. It triggers on PR events (including `labeled`/`unlabeled` so it re-evaluates when qa-agent adds labels). It reads PR labels and blocks merge unless `qa:approved` is present. Hotfix PRs bypass the gate (same pattern as `pdlc-stage-gate.yml`).

The GitHub Actions check name exposed to branch protection is derived from the `name:` field of the job: **`QA Gate`**.

- [ ] **Step 5: Create `.github/workflows/qa-gate.yml`**

Write this exact content:

```yaml
name: QA Gate

on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]

permissions:
  pull-requests: read

jobs:
  qa-gate:
    name: QA Gate
    runs-on: ubuntu-latest
    steps:
      - name: Check QA status label
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          set -e
          PR_NUMBER="${{ github.event.pull_request.number }}"
          REPO="${{ github.repository }}"

          PR_LABELS=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json labels --jq '[.labels[].name] | join(" ")')

          if echo "$PR_LABELS" | grep -qw "hotfix"; then
            echo "✅ QA Gate: hotfix label — bypassed."
            exit 0
          fi

          if echo "$PR_LABELS" | grep -qw "qa:approved"; then
            echo "✅ QA Gate: qa:approved — merge allowed."
            exit 0
          fi

          if echo "$PR_LABELS" | grep -qw "infra:qa-broken"; then
            echo "❌ QA Gate: infra:qa-broken — GitHub Models API unreachable. Manual QA review required before merge."
            exit 1
          fi

          if echo "$PR_LABELS" | grep -qw "qa:needs-work"; then
            echo "❌ QA Gate: qa:needs-work — acceptance criteria not fully met. Fix required before merge."
            exit 1
          fi

          echo "❌ QA Gate: no QA label found — AC Coverage Verification has not completed. Wait for the check to finish."
          exit 1
```

- [ ] **Step 6: Create `templates/.github/workflows/qa-gate.yml`**

Write the exact same content as Step 5. The template is identical — it uses `GITHUB_TOKEN` only (no extra secrets needed for the gate check).

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/qa-gate.yml templates/.github/workflows/qa-gate.yml
git commit -m "feat(qa-gate): add dedicated QA Gate blocking check for PR merges"
```

---

### Task 3: Add branch protection setup to `cli.js`

**Files:**
- Modify: `bin/cli.js`

Without branch protection, the new checks are informational only — engineers can still click "Merge". This task wires the two required checks (`PDLC Stage Gate` and `QA Gate`) automatically during `npx create-agentic-pdlc`.

The branch protection API call uses `gh api PUT repos/{repo}/branches/main/protection --input -` which reads a JSON payload from stdin. `execFileSync` with the `input` option handles this correctly. The call is non-fatal: if it fails (e.g., org policy restrictions, insufficient permissions), a warning is printed with manual instructions.

- [ ] **Step 8: Add i18n strings to `bin/cli.js`**

In the `i18n` object (around line 34), after the `update_sentinel_ask` entry, add:

```javascript
  configuring_protection: t('[3/3] Configuring branch protection...', '[3/3] Configurando proteção de branch...', '[3/3] Configurando protección de rama...'),
  protection_ok: t('✅ Branch protection set — required checks: PDLC Stage Gate, QA Gate.', '✅ Proteção de branch configurada — checks obrigatórios: PDLC Stage Gate, QA Gate.', '✅ Protección de rama configurada — checks requeridos: PDLC Stage Gate, QA Gate.'),
  protection_warn: t('⚠️  Branch protection could not be set automatically.\n     Set required checks manually: Settings → Branches → main → Required status checks.\n     Required: "PDLC Stage Gate" and "QA Gate"', '⚠️  Proteção de branch não pôde ser configurada automaticamente.\n     Configure manualmente: Settings → Branches → main → Required status checks.\n     Obrigatórios: "PDLC Stage Gate" e "QA Gate"', '⚠️  No se pudo configurar la protección de rama automáticamente.\n     Configúralo en: Settings → Branches → main → Required status checks.\n     Requeridos: "PDLC Stage Gate" y "QA Gate"'),
```

- [ ] **Step 9: Update step counters in `bin/cli.js`**

Find:
```javascript
  creating_labels: t('[1/2] Creating repository labels...', '[1/2] Criando labels no repositório...', '[1/2] Creando etiquetas (labels) en el repositorio...'),
```
Change to:
```javascript
  creating_labels: t('[1/3] Creating repository labels...', '[1/3] Criando labels no repositório...', '[1/3] Creando etiquetas (labels) en el repositorio...'),
```

Find:
```javascript
  creating_project: t('[2/2] Creating Project V2 Board...', '[2/2] Criando Project V2 Board...', '[2/2] Creando Project V2 Board...'),
```
Change to:
```javascript
  creating_project: t('[2/3] Creating Project V2 Board...', '[2/3] Criando Project V2 Board...', '[2/3] Creando Project V2 Board...'),
```

- [ ] **Step 10: Add branch protection setup block to `bin/cli.js`**

Find the block that starts with the PAT auto-provision section and ends before the scaffolding section. After the closing brace of the PAT block (around line 356, after `} else if (projectId && isOrg) { ... }`), add:

```javascript
  // Branch protection — require PDLC Stage Gate + QA Gate on main
  console.log(`\n${cyan}${i18n.configuring_protection}${reset}`);
  try {
    const protectionPayload = JSON.stringify({
      required_status_checks: {
        strict: false,
        contexts: ['PDLC Stage Gate', 'QA Gate']
      },
      enforce_admins: false,
      required_pull_request_reviews: null,
      restrictions: null
    });
    execFileSync('gh', [
      'api', `repos/${repo}/branches/main/protection`,
      '--method', 'PUT',
      '--input', '-'
    ], { input: protectionPayload, stdio: ['pipe', 'ignore', 'pipe'] });
    console.log(`  ${green}${i18n.protection_ok}${reset}`);
  } catch (_) {
    console.log(`  ${yellow}${i18n.protection_warn}${reset}`);
  }
```

- [ ] **Step 11: Verify cli.js changes compile (no syntax errors)**

```bash
node --check bin/cli.js
```

Expected: no output (exit 0).

- [ ] **Step 12: Commit**

```bash
git add bin/cli.js
git commit -m "feat(cli): auto-configure branch protection with required QA Gate + PDLC Stage Gate checks"
```

---

### Task 4: Enable branch protection on this repo (verification)

**Files:** none — GitHub API call only.

This repo was already not protected (`404 Branch not protected`). Task 3 adds the automation for new installs; this task activates it for the existing repo.

- [ ] **Step 13: Apply branch protection to this repo**

```bash
gh api repos/rafaeltcosta86/agentic-pdlc/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["PDLC Stage Gate", "QA Gate"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
```

Expected: JSON response with `url` field containing `branches/main/protection`.

- [ ] **Step 14: Verify branch protection is active**

```bash
gh api repos/rafaeltcosta86/agentic-pdlc/branches/main/protection \
  --jq '.required_status_checks.contexts'
```

Expected output:
```json
[
  "PDLC Stage Gate",
  "QA Gate"
]
```

- [ ] **Step 15: Open a test PR to verify end-to-end behavior**

Create a scratch branch, open a draft PR against main without `qa:approved` label:

```bash
git checkout -b test/qa-gate-verification
git commit --allow-empty -m "test: verify qa gate enforcement"
gh pr create --title "test: QA Gate verification" --body "Closes #136" --draft
```

Expected: `QA Gate` check appears and fails with "no QA label found". `AC Coverage Verification (GitHub Models)` check runs; if API is reachable it adds `qa:approved` automatically and QA Gate re-evaluates to pass. Merge button should be disabled until QA Gate passes.

- [ ] **Step 16: Close the test PR and delete the branch**

```bash
gh pr close --delete-branch
```

---

## Self-Review

**Spec coverage:**
- ✅ `infra:qa-broken` no longer allows silent bypass — Task 1 (exit 1) + Task 2 (qa-gate fails on that label)
- ✅ `qa:needs-work` also blocked — qa-gate checks for it explicitly
- ✅ "no QA label" state blocked — qa-gate fails if no QA label present
- ✅ Hotfix bypass preserved — same `grep -qw "hotfix"` pattern as pdlc-stage-gate
- ✅ Template updated — Tasks 1 and 2 update both repo + template files
- ✅ Enforcement mechanism (branch protection) included — Task 3 + Task 4
- ✅ New installs get protection automatically — cli.js step in Task 3

**Placeholder scan:** None found. All code blocks are complete and runnable.

**Type consistency:** No functions/types defined across tasks — all changes are self-contained YAML and JS.
