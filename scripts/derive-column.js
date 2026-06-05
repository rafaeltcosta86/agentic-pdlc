// Single source of truth for label → board column classification.
// Used by the event dispatcher (project-automation.yml) and the reconciliation cron (board-reconciliation.yml).
// pr:* beats stage:* — a live PR is higher-confidence signal than a stage label that may not have been cleaned up.
const LABEL_PRIORITY = [
  { label: 'pr:in-review',        column: 'code_review_pr' },
  { label: 'pr:approved',         column: 'code_review_pr' },
  { label: 'stage:development',   column: 'development' },
  { label: 'stage:approval',      column: 'approval' },
  { label: 'stage:detailing',     column: 'detailing' },
  { label: 'stage:brainstorming', column: 'brainstorming' },
];

function classifyItem(labelNames) {
  for (const { label, column } of LABEL_PRIORITY) {
    if (labelNames.includes(label)) return column;
  }
  return null;
}

module.exports = { classifyItem, LABEL_PRIORITY };
