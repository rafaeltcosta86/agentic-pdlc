# 🤖 Agentic PDLC Framework

> Do your AI agents build features that don't match the spec?
> Do you find bugs and architecture violations only at the end of the lifecycle?
> Are you the one manually moving cards across your board — every single time?

**Agentic PDLC** gives your agents a shared rulebook, a self-moving board, and a CI that won't let broken code reach production. One `npx` command to set up.

<div align="center">
  <img src=".github/assets/agentic-pdlc-flow.svg" alt="Agentic PDLC Architecture Flow" width="100%">
</div>

Solo devs and small teams hit the same wall: one agent writes the spec, another implements it differently, a third reviews without knowing either. Agentic PDLC gives all of them a shared brief, automates the board, and puts a CI guard between your agents and production.

---

## ⚡ Why it works

- 🗺️ **A transparent lifecycle** — Every feature travels a Kanban board from Idea to Production. You always know where things are.
- 🤖 **A board that moves itself** — When you approve a spec, the card moves. When an agent opens a PR, the card moves. You just approve or reject.
- 🧠 **Agents that agree with each other** — One briefing (`AGENTS.md`), read by every agent. Claude, Jules, Gemini — all pulling in the same direction, without you copy-pasting context between tabs.
- 🛡️ **Code that can't silently break production** — A CI auditor checks every PR for architecture violations before anything reaches your main branch. *(Maturity Model — coming soon)*

---

## 🚀 Quick Start

Run this in the root of your project:

```bash
npx create-agentic-pdlc
```

The CLI sets up your GitHub board, labels, and workflows, then hands over to your AI assistant to finish the configuration interactively. No YAML editing. No manual config.

**Already set up? Add or reconfigure optional agents at any time:**

```bash
npx create-agentic-pdlc --update
```

Detects what is already configured (Jules, QA Agent, Sentinel) and interactively sets up what is missing. Your existing board IDs and customizations are never touched.

---

## 🏗️ How It Works

The framework splits work into two phases:

### 1. You + AI: Idea → Spec
Use conversational AI (e.g., **Claude Code**, **Gemini CLI**) as your brainstorming partner. Together, you flesh out user stories, acceptance criteria, and technical specifications until they are solid.

### 2. Your agents: Spec → Production
Once you approve the spec, autonomous implementation agents (e.g., **Jules**, **Sweep**, **Copilot Workspace**) pick up the task. The board moves automatically; the CI auditor guards the main branch.

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

After setup, your project has:

- **`AGENTS.md`** — The shared brief every agent reads. Your rules, once.
- **`docs/pdlc.md`** — Your pipeline map: board columns, IDs, and who does what.
- **`.github/workflows/`** — Three automations: board moves itself, agent wakes on spec approval, CI audits every PR.

---

## ❤️ Contributing

We welcome improvements from solo founders and AI engineers! Please check our **[Contributing Guidelines](CONTRIBUTING.md)** on how to submit PRs, add new AI platform adapters, or improve the documentation.

---

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
