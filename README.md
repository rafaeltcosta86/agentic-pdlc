# 🤖 Agentic PDLC

> Does your AI agent add code you didn't ask for?
> Does it skip the spec and jump straight to a PR?
> Does it ignore the rules in your CLAUDE.md?

**Agentic PDLC** gives your agent a brake it can't ignore — a hook that makes it write the spec first, keep changes small, and stop at each gate. One `npx` to install.

<div align="center">
  <img src=".github/assets/agentic-pdlc-flow.svg" alt="Agentic PDLC: Upstream idea-to-spec, gated by spec:approved, into Downstream spec-to-production" width="100%">
</div>

---

## Two modes — pick yours

**`lite` (default) — the brake**
Your agent writes the spec, waits for your approval, then implements it. It won't add code you didn't ask for. It won't open a PR before the spec is approved. It won't skip your `CLAUDE.md` rules — because the gate is a hook, not text the agent can ignore. Value on your first PR.

**`--agentic` — see your whole pipeline**
Everything in `lite`, plus a self-moving kanban board that shows your full product lifecycle, from **Idea → Production**. It makes transparent what needs your attention/approval, what's been done by the agent, and what's ready to merge. It supports as many agents as you need.

---

## ⚡ Why it works

- 🛑 **A brake the agent can't ignore** — the gate is a hook, not text in CLAUDE.md. Text gets ignored; a hook does not.
- 📋 **Spec before code** — the agent can't open a PR until the spec is approved, with acceptance criteria, edge cases, and files to change.
- 🗺️ **See your whole pipeline** *(`--agentic` only)* — a board tracks every task from idea to production, and the gate between spec and code stays yours. You approve before anything ships.

---

## 🚀 Quick Start

```bash
npx create-agentic-pdlc
```

Installs `lite` by default — your AGENTS.md, CLAUDE.md, and the gate hook. Your AI assistant finishes the setup with you; no YAML to edit.

**Want the full board and pipeline view?**

```bash
npx create-agentic-pdlc --agentic
```

**Already set up? Add or change things any time:**

```bash
npx create-agentic-pdlc --update
```

---

## 🤝 Works with every AI assistant

One shared brief (`AGENTS.md`). Every agent reads it.

| AI Assistant | Instruction File | How it Integrates |
|:---|:---|:---|
| **Claude Code** | `CLAUDE.md` + Claude Skill | Uses `adapters/claude-code/skill.md` *(Includes Auto-Setup Mode)* |
| **Gemini CLI** | `AGENTS.md` | Reads the rulebook natively |
| **Cursor** | `.cursor/rules/*.md` | Uses `adapters/cursor/rules.md` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Uses `templates/.github/copilot-instructions.md` |
| **Codex / Antigravity** | `AGENTS.md` | Reads the rulebook natively |

---

## 📦 What you get

**`lite` (default)**
- **`AGENTS.md`** — the shared brief every agent reads; your rules, once
- **`CLAUDE.md`** — keep-changes-small rule + the stage gates
- **`.agentic-pdlc/hooks/pdlc-stage-gate.sh`** — the hook; the agent can't open a PR until the spec is approved

**`--agentic` (opt-in)**
Everything in lite, plus:
- **`docs/pdlc.md`** — your pipeline map: board columns and who does what
- **`.github/workflows/`** — board automation: moves cards on spec approval, PR open, and CI pass

---

## ❤️ Contributing

We welcome improvements from solo founders and AI engineers! Please check our **[Contributing Guidelines](CONTRIBUTING.md)** on how to submit PRs, add new AI platform adapters, or improve the documentation.

---

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
