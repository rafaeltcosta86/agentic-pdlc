#!/usr/bin/env bash
# Run from the root of a test project to undo everything npx create-agentic-pdlc creates.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Resetting agentic-pdlc artifacts in: $(pwd)${NC}\n"

remove() {
  local target="$1"
  if [ -e "$target" ] || [ -L "$target" ]; then
    rm -rf "$target"
    echo -e "  ${GREEN}removed${NC}  $target"
  else
    echo -e "           skipped  $target (not found)"
  fi
}

# --- CLI phase ---
remove .agentic-pdlc
remove .agentic-setup.md
remove .cursorrules

# --- Setup Mode phase (agent-generated) ---
remove AGENTS.md
remove docs/pdlc.md
remove .github/workflows/project-automation.yml
remove .github/workflows/agent-trigger.yml
remove .github/workflows/ci.yml
remove .github/workflows/qa-agent.yml

# Clean up empty dirs left behind
rmdir --ignore-fail-on-non-empty docs 2>/dev/null || true
rmdir --ignore-fail-on-non-empty .github/workflows 2>/dev/null || true
rmdir --ignore-fail-on-non-empty .github 2>/dev/null || true

echo -e "\n${GREEN}Done. Run 'npx create-agentic-pdlc' to start fresh.${NC}"
