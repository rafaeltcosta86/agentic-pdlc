# Agentic Pulse — Rework Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `agentic-metrics.yml` to classify rework by review actor (code_reviewer, qa_agent, self_correction) and optionally surface a stage correlation signal when N≥3 data points exist.

**Architecture:** All logic is inline JavaScript inside an existing `actions/github-script@v7` step. Add an `env:` block for actor configuration, preload JSONL detailing data at step start, extend the rework detection loop to fetch PR reviews and classify by configured actor, then replace the rework signal output with a taxonomy breakdown plus an optional stage correlation line.

**Tech Stack:** GitHub Actions YAML, `actions/github-script@v7` (Node.js 20), GitHub REST API (`pulls.listReviews`), existing `.agentic-pdlc/metrics/raw/WEEK.jsonl` files.

---

### Task 1: Add `env` block with `AGENTIC_PULSE_REVIEWERS`

**Files:**
- Modify: `.github/workflows/agentic-metrics.yml:10` (after `issues: write`)

- [ ] **Step 1: Open the file and locate the `permissions` block**

  In `.github/workflows/agentic-metrics.yml`, find:
  ```yaml
  permissions:
    contents: write
    issues: write
  
  jobs:
  ```

- [ ] **Step 2: Insert `env:` block between `permissions` and `jobs`**

  Replace:
  ```yaml
  permissions:
    contents: write
    issues: write

  jobs:
  ```

  With:
  ```yaml
  permissions:
    contents: write
    issues: write

  env:
    AGENTIC_PULSE_REVIEWERS: |
      code_reviewer=gemini-code-assist[bot]
      qa_agent=github-actions[bot]

  jobs:
  ```

- [ ] **Step 3: Verify YAML is valid**

  ```bash
  python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/agentic-metrics.yml'))" && echo "YAML OK"
  ```
  Expected: `YAML OK`

- [ ] **Step 4: Commit**

  ```bash
  git add .github/workflows/agentic-metrics.yml
  git commit -m "feat(pulse): add AGENTIC_PULSE_REVIEWERS env configuration"
  ```

---

### Task 2: Preload JSONL detailing data at step start

**Files:**
- Modify: `.github/workflows/agentic-metrics.yml:112` (after `const weekKey = process.env.WEEK_KEY;`)

The stage correlation needs `detailingByIssue` (issue number → detailing days). Currently the JSONL is only read inside the `stageSection` block at the bottom. We preload it here so the rework block can use it without a second read.

- [ ] **Step 1: Locate insertion point**

  In `.github/workflows/agentic-metrics.yml`, find this line (around line 112):
  ```javascript
            const weekKey = process.env.WEEK_KEY;

            // ── Helper ──────────────────────────────────────────────────────
  ```

- [ ] **Step 2: Insert detailing preload between `weekKey` and helpers**

  Replace:
  ```javascript
            const weekKey = process.env.WEEK_KEY;

            // ── Helper ──────────────────────────────────────────────────────
  ```

  With:
  ```javascript
            const weekKey = process.env.WEEK_KEY;

            // ── Preload stage:detailing times for stage correlation ──────────
            const detailingByIssue = {};
            const jsonlPath = `.agentic-pdlc/metrics/raw/${weekKey}.jsonl`;
            if (fs.existsSync(jsonlPath)) {
              const rawLines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n').filter(Boolean);
              for (const line of rawLines) {
                const r = JSON.parse(line);
                if (r.stage === 'stage:detailing') {
                  if (detailingByIssue[r.issueNumber] === undefined || r.durationDays > detailingByIssue[r.issueNumber]) {
                    detailingByIssue[r.issueNumber] = r.durationDays;
                  }
                }
              }
            }

            // ── Helper ──────────────────────────────────────────────────────
  ```

- [ ] **Step 3: Verify YAML is valid**

  ```bash
  python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/agentic-metrics.yml'))" && echo "YAML OK"
  ```
  Expected: `YAML OK`

- [ ] **Step 4: Commit**

  ```bash
  git add .github/workflows/agentic-metrics.yml
  git commit -m "feat(pulse): preload JSONL detailing data for stage correlation"
  ```

---

### Task 3: Add actor map parsing after `const signals = []`

**Files:**
- Modify: `.github/workflows/agentic-metrics.yml:139` (after `const signals = [];`)

- [ ] **Step 1: Locate insertion point**

  In `.github/workflows/agentic-metrics.yml`, find:
  ```javascript
            // ── Signal collection ───────────────────────────────────────────
            const signals = [];

            // 1. Orphan issues: open >14 days with no linked PR
  ```

- [ ] **Step 2: Insert actor map parsing**

  Replace:
  ```javascript
            // ── Signal collection ───────────────────────────────────────────
            const signals = [];

            // 1. Orphan issues: open >14 days with no linked PR
  ```

  With:
  ```javascript
            // ── Signal collection ───────────────────────────────────────────
            const signals = [];

            // ── Review actor map (from AGENTIC_PULSE_REVIEWERS env var) ─────
            const actorMap = {}; // login → role
            const reviewersEnv = (process.env.AGENTIC_PULSE_REVIEWERS || '').trim();
            if (reviewersEnv) {
              for (const line of reviewersEnv.split('\n')) {
                const eq = line.indexOf('=');
                if (eq < 0) continue;
                const role = line.slice(0, eq).trim();
                const logins = line.slice(eq + 1).trim();
                for (const login of logins.split(',').map(l => l.trim()).filter(Boolean)) {
                  actorMap[login] = role;
                }
              }
            }
            const taxonomyEnabled = Object.keys(actorMap).length > 0;

            // 1. Orphan issues: open >14 days with no linked PR
  ```

- [ ] **Step 3: Verify YAML is valid**

  ```bash
  python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/agentic-metrics.yml'))" && echo "YAML OK"
  ```
  Expected: `YAML OK`

- [ ] **Step 4: Commit**

  ```bash
  git add .github/workflows/agentic-metrics.yml
  git commit -m "feat(pulse): parse AGENTIC_PULSE_REVIEWERS into actorMap"
  ```

---

### Task 4: Replace rework block with taxonomy + stage correlation

**Files:**
- Modify: `.github/workflows/agentic-metrics.yml:227-278` (the `// 3. Rework rate` block)

This is the main change. The existing rework block (lines 227–278) is replaced in full.

- [ ] **Step 1: Locate the block to replace**

  Find this exact comment to identify the start:
  ```javascript
            // 3. Rework rate: commits per PR — single push session = first-shot
  ```

  The block ends just before:
  ```javascript
            // 4. Unlinked PRs: merged without Closes/Fixes #N
  ```

- [ ] **Step 2: Replace the entire rework block**

  Remove everything from `// 3. Rework rate:` through the closing `}` before `// 4. Unlinked PRs:`, and replace with:

  ```javascript
            // 3. Rework rate with actor taxonomy (if AGENTIC_PULSE_REVIEWERS configured)
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const weekMerged = recentPRs.filter(pr => pr.merged_at && new Date(pr.merged_at) > weekAgo);

            if (weekMerged.length > 0) {
              let firstShots = 0;
              const reworkByRole = {};
              const reworkDetails = []; // { pr_number, issue_number } for stage correlation
              const issueRe = /(?:closes?|fixes?|resolves?)\s+#(\d+)/i;

              for (const pr of weekMerged.slice(0, 10)) {
                try {
                  const commits = await github.rest.pulls.listCommits({
                    owner, repo, pull_number: pr.number, per_page: 100
                  });
                  const times = commits.data
                    .map(c => new Date(c.commit.committer.date).getTime())
                    .sort((a, b) => a - b);

                  let sessions = 1;
                  for (let i = 1; i < times.length; i++) {
                    if (times[i] - times[i-1] > 10 * 60 * 1000) sessions++;
                  }

                  if (sessions === 1) { firstShots++; continue; }

                  if (!taxonomyEnabled) continue;

                  let reviewTriggered = false;
                  try {
                    const reviews = await github.rest.pulls.listReviews({
                      owner, repo, pull_number: pr.number, per_page: 100
                    });
                    for (const review of reviews.data) {
                      const role = actorMap[review.user.login];
                      if (!role) continue;
                      const reviewTime = new Date(review.submitted_at).getTime();
                      if (times.some(t => t > reviewTime)) {
                        reworkByRole[role] = (reworkByRole[role] || 0) + 1;
                        reviewTriggered = true;
                        const m = issueRe.exec(pr.body || '');
                        if (m) reworkDetails.push({ pr_number: pr.number, issue_number: parseInt(m[1]) });
                      }
                    }
                  } catch(e) { /* reviews not accessible — skip taxonomy for this PR */ }

                  if (!reviewTriggered) {
                    reworkByRole.self_correction = (reworkByRole.self_correction || 0) + 1;
                  }

                } catch (e) { /* skip if commits not accessible */ }
              }

              const total = Math.min(weekMerged.length, 10);
              const pct = Math.round(firstShots / total * 100);
              const reworkCount = total - firstShots;

              const agentLabels = new Set(['jules', 'sweep', 'codex', 'copilot']);
              const usesAgent = weekMerged.some(pr =>
                (pr.labels || []).some(l => agentLabels.has(l.name.toLowerCase()))
              );
              const subject = usesAgent ? 'Agent first-shot rate' : 'PRs sem rework';
              const verb = usesAgent ? 'acertaram de primeira' : 'foram mergeados sem rework';

              if (taxonomyEnabled && reworkCount > 0) {
                const lines = [];
                for (const [role, count] of Object.entries(reworkByRole)) {
                  const s = count > 1 ? 's' : '';
                  if (role === 'code_reviewer')   lines.push(`   ↳ Code reviewer: **${count} PR${s}** → revisar DoD em stage:development`);
                  else if (role === 'qa_agent')   lines.push(`   ↳ QA Agent: **${count} PR${s}** → spec com lacunas funcionais em stage:detailing`);
                  else if (role === 'self_correction') lines.push(`   ↳ Self-correction: **${count} PR${s}** (causa não determinada automaticamente)`);
                  else                            lines.push(`   ↳ ${role}: **${count} PR${s}**`);
                }

                const reviewerRework = reworkByRole.code_reviewer || 0;
                const level = reviewerRework >= Math.ceil(reworkCount * 0.8) ? 'red'
                            : (reviewerRework >= Math.ceil(reworkCount * 0.5) || (reworkByRole.qa_agent || 0) > 0) ? 'yellow'
                            : 'neutral';
                const emoji = level === 'red' ? '🔴' : level === 'yellow' ? '🟡' : '🔵';

                signals.push({
                  level,
                  emoji,
                  title: `**Rework: ${100 - pct}%** — ${reworkCount} de ${total} PRs tiveram commits extras`,
                  body: lines.join('\n')
                });

                // ── Stage correlation ────────────────────────────────────────
                if (reworkDetails.length > 0 && Object.keys(detailingByIssue).length > 0) {
                  const reworkIssueNums = new Set(reworkDetails.map(d => d.issue_number));

                  const reworkGroup = reworkDetails
                    .map(d => detailingByIssue[d.issue_number])
                    .filter(t => t !== undefined);

                  const cleanGroup = weekMerged.slice(0, 10)
                    .map(pr => { const m = issueRe.exec(pr.body || ''); return m ? parseInt(m[1]) : null; })
                    .filter(n => n !== null && !reworkIssueNums.has(n))
                    .map(n => detailingByIssue[n])
                    .filter(t => t !== undefined);

                  if (reworkGroup.length >= 3 && cleanGroup.length >= 3) {
                    const avgRework = round1(reworkGroup.reduce((a, b) => a + b, 0) / reworkGroup.length);
                    const avgClean  = round1(cleanGroup.reduce((a, b) => a + b, 0) / cleanGroup.length);
                    if (avgRework < avgClean * 0.75) {
                      signals.push({
                        level: 'neutral',
                        emoji: '💡',
                        title: `**Stage correlation:** PRs com reviewer rework tiveram Detailing médio de ${avgRework}d vs ${avgClean}d (N=${reworkGroup.length} vs ${cleanGroup.length})`,
                        body: '→ Specs rápidas correlacionam com mais rework de review'
                      });
                    }
                  }
                }

              } else {
                // Taxonomy disabled or no rework — existing signal unchanged
                if (pct >= 80) {
                  signals.push({
                    level: 'green', emoji: '🟢',
                    title: `**${subject}: ${pct}%**`,
                    body: `${firstShots} de ${total} PRs ${verb} esta semana. ✅`
                  });
                } else if (pct < 50) {
                  signals.push({
                    level: 'yellow', emoji: '🟡',
                    title: `**${subject}: ${pct}% — rework alto**`,
                    body: `Apenas ${firstShots} de ${total} PRs sem commits extras.\n→ Specs incompletas ou mudanças de requisito durante implementação.`
                  });
                } else {
                  signals.push({
                    level: 'neutral', emoji: '🔵',
                    title: `**${subject}: ${pct}%**`,
                    body: `${firstShots} de ${total} PRs sem rework commits.`
                  });
                }
              }
            }
  ```

- [ ] **Step 3: Verify YAML is valid**

  ```bash
  python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/agentic-metrics.yml'))" && echo "YAML OK"
  ```
  Expected: `YAML OK`

- [ ] **Step 4: Commit**

  ```bash
  git add .github/workflows/agentic-metrics.yml
  git commit -m "feat(pulse): rework taxonomy with review-actor attribution and stage correlation"
  ```

---

### Task 5: Mirror all changes to `templates/`

**Files:**
- Modify: `templates/.github/workflows/agentic-metrics.yml`

Note: the templates file has two pre-existing minor diffs vs the main file (lines 313 and 317–320 in the stageSection block). Do NOT touch those lines — apply only the four changes from Tasks 1–4.

- [ ] **Step 1: Apply Task 1 change (env block)**

  In `templates/.github/workflows/agentic-metrics.yml`, apply the same `env:` block insertion as Task 1 Step 2.

- [ ] **Step 2: Apply Task 2 change (JSONL preload)**

  In `templates/.github/workflows/agentic-metrics.yml`, apply the same preload insertion as Task 2 Step 2.

- [ ] **Step 3: Apply Task 3 change (actor map parsing)**

  In `templates/.github/workflows/agentic-metrics.yml`, apply the same actor map insertion as Task 3 Step 2.

- [ ] **Step 4: Apply Task 4 change (rework block replacement)**

  In `templates/.github/workflows/agentic-metrics.yml`, apply the same rework block replacement as Task 4 Step 2.

- [ ] **Step 5: Verify YAML is valid**

  ```bash
  python3 -c "import yaml, sys; yaml.safe_load(open('templates/.github/workflows/agentic-metrics.yml'))" && echo "YAML OK"
  ```
  Expected: `YAML OK`

- [ ] **Step 6: Verify only expected diffs remain between the two files**

  ```bash
  diff .github/workflows/agentic-metrics.yml templates/.github/workflows/agentic-metrics.yml
  ```
  Expected: only the two pre-existing stageSection diffs (one line around `maxDays`, three lines around the `if (!days)` block). No new diffs.

- [ ] **Step 7: Commit**

  ```bash
  git add templates/.github/workflows/agentic-metrics.yml
  git commit -m "feat(pulse): mirror rework taxonomy changes to templates"
  ```

---

### Task 6: Manual verification via workflow_dispatch

- [ ] **Step 1: Trigger the workflow manually**

  ```bash
  gh workflow run agentic-metrics.yml
  ```

- [ ] **Step 2: Watch the run**

  ```bash
  gh run list --workflow=agentic-metrics.yml --limit 1
  # Copy the run ID, then:
  gh run watch <run-id>
  ```

- [ ] **Step 3: Verify the pulse issue was created/updated**

  ```bash
  gh issue list --label "metrics:weekly" --state open --json number,title,body \
    --jq '.[0] | "## \(.title)\n\(.body)"'
  ```

  Check that:
  - Rework signal shows taxonomy breakdown (↳ Code reviewer / QA Agent / Self-correction lines)
  - OR falls back to old format if no rework PRs were found this week
  - Stage correlation line appears IF N≥3 in both groups (may not appear if data is thin)
  - All other signals (orphans, merge time, unlinked PRs, Stage Residence Time) are unchanged

- [ ] **Step 4: Verify backward compatibility**

  Temporarily set `AGENTIC_PULSE_REVIEWERS: ""` in the env block, re-run via `workflow_dispatch`, confirm the pulse issue shows the old-style rework signal (no taxonomy lines). Restore the env var after verification.

- [ ] **Step 5: Close issue and open PR**

  ```bash
  gh pr create \
    --title "feat(pulse): rework taxonomy with review-actor attribution and stage correlation" \
    --body "Closes #142

  ## What changed
  - Added \`AGENTIC_PULSE_REVIEWERS\` env var to configure review actors
  - Extended rework detection to classify commits-after-review by actor role
  - Added stage correlation signal when N≥3 data points in both groups
  - Backward compatible: env var absent → existing rework signal unchanged
  - Mirrored to \`templates/\`

  ## Test
  - Triggered workflow_dispatch, verified pulse issue output
  - Verified backward compatibility with empty env var"
  ```
