#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - y) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function prevKey(key) {
  const [yr, wStr] = key.split('-W');
  const w = parseInt(wStr, 10);
  return w > 1 ? `${yr}-W${String(w - 1).padStart(2, '0')}` : `${parseInt(yr, 10) - 1}-W52`;
}

function avg(arr) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
}

function groupByStage(records) {
  const map = {};
  for (const r of records) {
    if (!map[r.stage]) map[r.stage] = [];
    map[r.stage].push(r.durationDays);
  }
  return map;
}

const weekKey = process.env.WEEK_KEY || isoWeekKey(new Date());
const metricsDir = path.join(process.cwd(), '.agentic-pdlc', 'metrics');
const rawDir = path.join(metricsDir, 'raw');

const current = groupByStage(readJsonl(path.join(rawDir, `${weekKey}.jsonl`)));
const previous = groupByStage(readJsonl(path.join(rawDir, `${prevKey(weekKey)}.jsonl`)));

const STAGES = [
  ['stage:exploration',   'Exploration'],
  ['stage:brainstorming', 'Brainstorming'],
  ['stage:detailing',     'Detailing'],
  ['stage:approval',      'Approval'],
  ['stage:development',   'Development'],
  ['stage:testing',       'Testing'],
];

const rows = [];
let bottleneck = null;
let bottleneckDays = 0;

for (const [stage, label] of STAGES) {
  const a = avg(current[stage] || []);
  if (a === null) continue;
  const p = avg(previous[stage] || []);
  const n = (current[stage] || []).length;
  const trend = p == null ? '—'
    : a > p  ? `⬆ +${Math.round((a - p) * 10) / 10}d`
    : a < p  ? `⬇ ${Math.round((a - p) * 10) / 10}d`
    : '→ igual';
  rows.push(`| **${label}** | ${a}d | ${n} issue${n !== 1 ? 's' : ''} | ${trend} |`);
  if (a > bottleneckDays) { bottleneck = label; bottleneckDays = a; }
}

const tableBody = rows.length
  ? rows.join('\n')
  : '| — | N/A — sem dados esta semana | — | — |';

const insight = bottleneck
  ? `> **Insight:** \`${bottleneck}\` é o maior gargalo (${bottleneckDays}d avg). Issues acumulam aqui. Considere quebrar specs ou aumentar cadência de revisão nessa fase.`
  : '> **Insight:** Sem transições de stage registradas esta semana.';

const md = `# Agentic Metrics — ${weekKey}

> Métricas agentic-specific geradas automaticamente pelo [agentic-pdlc](https://github.com/rafaeltcosta86/agentic-pdlc).

## 🔄 Stage Residence Time

Tempo médio que issues passaram em cada fase do PDLC esta semana (transições completas).

| Stage | Avg | N | vs semana passada |
|---|---|---|---|
${tableBody}

${insight}

---
*Gerado em ${new Date().toISOString().split('T')[0]} · [Ver histórico](.)*
`;

fs.mkdirSync(metricsDir, { recursive: true });
const outputFile = path.join(metricsDir, `${weekKey}.md`);
fs.writeFileSync(outputFile, md);
console.log(`✅ Report: ${outputFile}`);
