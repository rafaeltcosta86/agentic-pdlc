# Agentic Pulse — Rework Taxonomy with Review-Actor Attribution and Stage Correlation

**Date:** 2026-05-29
**Issue:** [#142](https://github.com/rafaeltcosta86/agentic-pdlc/issues/142)
**Status:** stage:approval — awaiting spec:approved

## Problem

Current rework signal detects extra commit sessions but cannot distinguish cause. All rework produces the same generic recommendation: "incomplete specs or requirement changes."

Three distinct causes exist, each pointing to a different fix:

| Cause | Root stage | Fix |
|---|---|---|
| Code reviewer caught a defect | stage:development — DoD too weak | Tighten implementation checklist |
| QA agent caught a functional gap | stage:detailing — spec incomplete | Add acceptance criteria |
| Self-correction (pre-review) | Unknown | Not auto-determinable |

## Design Decision

**Option C selected:** Review-Actor Taxonomy + Stage Correlation
- Auto-only (zero user friction)
- Actors are configurable — not locked to any specific bot
- Stage correlation provides upstream attribution when N≥3 data points available

## Architecture

### Files Changed

- `.github/workflows/agentic-metrics.yml`
- `templates/.github/workflows/agentic-metrics.yml` (mirror)

No new files. No new dependencies.

### Configuration

```yaml
env:
  AGENTIC_PULSE_REVIEWERS: |
    code_reviewer=gemini-code-assist[bot]
    qa_agent=github-actions[bot]
```

Format: `role=login1,login2` per line. If absent/empty → taxonomy skipped, existing behavior unchanged.

## Detection Logic

### Review-Actor Rework Detection

For each merged PR in the week window (up to 10 — consistent with existing rework block):

1. Get commit timestamps (reuse existing fetch)
2. If single commit session: skip
3. `GET /repos/{owner}/{repo}/pulls/{pr}/reviews`
4. For each review where `reviewer.login` is in the actor map:
   - Record first review timestamp for that role
   - Count commits with `timestamp > first_review_at`
   - If count > 0: mark as `{role}`-triggered rework
5. If multi-session but no configured actor review found before them: `self_correction`
6. For reviewer-triggered PRs: extract `Closes #N` → store `{ pr_number, issue_number, role }` for stage correlation

A PR can count in multiple role buckets if multiple roles triggered rework. Total rework % = unique PRs with any rework / total PRs. Role breakdown counts per role (sum can exceed total %).

### Stage Correlation

Load `stage:detailing` durations from `weekKey.jsonl` → `Map<issueNumber, durationDays>`

Group:
- `reviewer_rework_group`: issues linked to reviewer-triggered rework PRs with known detailing time
- `clean_group`: issues linked to PRs with zero reviewer-triggered rework (single session OR only self-correction) with known detailing time

Emit correlation signal only if both groups have N≥3. Otherwise skip.

## Output Format

### Rework signal (taxonomy active)

```
🟡 **Rework rate: 60%** — 6 de 10 PRs tiveram commits extras
   ↳ Code reviewer: **4 PRs** → revisar DoD em stage:development
   ↳ QA Agent: **1 PR** → spec com lacunas funcionais em stage:detailing
   ↳ Self-correction: **1 PR** (causa não determinada automaticamente)
```

### Stage correlation signal (when N≥3 both groups)

```
💡 **Stage correlation:** PRs com reviewer rework tiveram Detailing médio de 0.2d vs 0.8d (N=4 vs N=6)
   → Specs rápidas correlacionam com mais rework de review
```

### Signal levels

| Condition | Level |
|---|---|
| `code_reviewer` rework ≥ 80% of total | 🔴 |
| `code_reviewer` rework ≥ 50% of total | 🟡 |
| `qa_agent` rework > 0 | 🟡 |
| Stage correlation present | 🔵 (informational) |

## Recommendations

| Trigger | Recommendation |
|---|---|
| `code_reviewer` dominant | Revisar Definition of Done em stage:development. Considere checklist de qualidade antes de abrir PR. |
| `qa_agent` > 0 | Spec tem lacunas funcionais. Revisar critérios de aceitação em stage:detailing. |
| Stage correlation fires (rework detailing < clean detailing) | Specs rápidas correlacionam com mais rework. Invista mais tempo em stage:detailing. |
| All self-correction | Configure AGENTIC_PULSE_REVIEWERS para attribution mais precisa. |

## Backward Compatibility

- `AGENTIC_PULSE_REVIEWERS` absent → taxonomy skipped, no regression
- JSONL absent → correlation skipped, taxonomy still runs
- N < 3 either group → correlation skipped
- `listReviews` API error → catch, skip PR, continue

## Out of Scope

- Manual rework classification
- Self-correction cause detection
- Changes to Stage Residence Time collection
- Changes to any other signal
