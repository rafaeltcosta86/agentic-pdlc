# Agentic PDLC Framework

A reusable Product Development Life Cycle (PDLC) framework designed for solo developers building applications with AI agents. 

This framework standardizes how your agents interpret tasks, understand project invariants, and collaborate seamlessly across the idea-to-production journey.

## Overview

The Agentic PDLC bridges the gap between high-level roadmaps and deterministic execution. It splits the workflow into two clear scopes:

1. **Upstream (Ideas → Specs):** Conversational AI (e.g., Claude Code, Cursor chat) acts as a brainstorm partner to flesh out user stories and technical specs.
2. **Downstream (Specs → Prod):** Implementation agents (e.g., Jules, Sweep) act on approved, deterministic specs using an automated GitHub Project board flow.

## Multi-Assistant Support

The framework operates via adapters and templates tailored to specific platforms. However, the universal truth for your project lies in `AGENTS.md` and `docs/pdlc.md`.

| Assistant | Instruction File | Setup |
|---|---|---|
| **Claude Code** | `CLAUDE.md` + Claude Skill | Uses `adapters/claude-code/skill.md` (includes Setup Mode) |
| **Cursor** | `.cursor/rules/*.md` | Uses `adapters/cursor/rules.md` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Uses `templates/.github/copilot-instructions.md` |
| **Codex (OpenAI)** | `AGENTS.md` | Reads `AGENTS.md` natively |
| **Antigravity (Google)**| `AGENTS.md` | Reads `AGENTS.md` natively |

All integrations converge upon the same standardized templates to ensure context is maintained identically across any AI you decide to pair with.

## Project Structure

This repository provides all the templates you need. Once initialized in your target project, the expected structure is:

```
your-project/
  AGENTS.md                          ← The universal contract mapping rules to any AI.
  docs/
    pdlc.md                          ← The PDLC pipeline defining board columns and IDs.
  .github/
    workflows/
      project-automation.yml         ← Automates GitHub Project card movement (Reviews, Merges).
      agent-trigger.yml              ← Triggers your implementation agent upon `spec:approved`.
      ci.yml                         ← The Sentinel enforcing invariants and tests.
```

## Setup Instructions

To implement the framework in your repository, refer to the detailed manual instructions in [`SETUP.md`](SETUP.md).

> **Note for Claude Code users:** You can load the skill found in `adapters/claude-code/skill.md` in a fresh repository. The tool will detect missing artifacts and orchestrate an interactive **Setup Mode**, prompting you to automatically generate all files.

## Contributing

Please check [`CONTRIBUTING.md`](CONTRIBUTING.md) for details on how to improve this framework.
