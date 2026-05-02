#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// The directory where CLI is executed
const targetDir = process.cwd();
// The directory where this script sits (globally/locally in node_modules)
const sourceDir = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const cyan = '\x1b[36m';
const reset = '\x1b[0m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';

console.log(`${cyan}================================================================${reset}`);
console.log(`${cyan}🤖 Welcome to Agentic PDLC Boilerplate Bootstrap! 🤖${reset}`);
console.log(`${cyan}================================================================${reset}\n`);

// Helper function to recursively copy directories
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

rl.question('Which AI Agent will you use for the setup? (e.g. claude, cursor, copilot, or other): ', (answer) => {
  const agent = answer.trim().toLowerCase();
  
  console.log(`\n${yellow}Scaffolding Agentic PDLC into your project...${reset}`);

  // We copy the templates folder so the agent has the real text logic to replace and rename
  const sourceTemplates = path.join(sourceDir, 'templates');
  const targetTemplates = path.join(targetDir, '.agentic-pdlc', 'templates');
  
  if (fs.existsSync(sourceTemplates)) {
    copyDirSync(sourceTemplates, targetTemplates);
    console.log(`✅ Templates copied to .agentic-pdlc/templates/`);
  }

  // Handle the specific setup instructions target
  const claudeSetupSrc = path.join(sourceDir, 'adapters', 'claude-code', 'skill.md');
  const cursorSetupSrc = path.join(sourceDir, 'adapters', 'cursor', 'rules.md');

  if (agent === 'claude') {
    if (fs.existsSync(claudeSetupSrc)) {
      const dest = path.join(targetDir, '.agentic-setup.md');
      fs.copyFileSync(claudeSetupSrc, dest);
      console.log(`✅ Setup agent profile written to .agentic-setup.md\n`);
      console.log(`${green}============================================================${reset}`);
      console.log(`${green}🎉 Framework files scaffolded to .agentic-pdlc/templates/${reset}`);
      console.log(`${green}============================================================${reset}\n`);
      console.log(`${yellow}👉 NEXT STEPS:${reset}`);
      console.log(`${cyan}1. Open your AI Assistant (Claude, Cursor, Copilot, etc).${reset}`);
      console.log(`${cyan}2. Ask it to read the .agentic-setup.md and start Setup Mode in any language you prefer. Example 👇${reset}`);
      console.log(`${cyan}>>> English: "Read .agentic-setup.md and guide me through the setup."${reset}`);
      console.log(`${cyan}>>> Español: "Lea el archivo .agentic-setup.md e inicie el Setup Mode"${reset}`);
      console.log(`${cyan}>>> Português: "Leia o arquivo .agentic-setup.md e inicie o Setup Mode."${reset}\n`);
      console.log(`Note: The agent will clean up the .agentic-setup.md file automatically when finished.\n`);
    } else {
      console.error(`❌ Could not find claude instruction file at ${claudeSetupSrc}`);
    }
  } else if (agent === 'cursor') {
    if (fs.existsSync(cursorSetupSrc)) {
      // Create .cursorrules which has the general invariants
      const dest = path.join(targetDir, '.cursorrules');
      fs.copyFileSync(cursorSetupSrc, dest);
      
      // Also copy skill.md as a setup prompt for cursor composer
      const setupPromptDest = path.join(targetDir, '.agentic-pdlc', 'SETUP_PROMPT.md');
      if (fs.existsSync(claudeSetupSrc)) fs.copyFileSync(claudeSetupSrc, setupPromptDest);

      console.log(`✅ Default cursor rules written to .cursorrules`);
      console.log(`✅ Framework Setup Instructions written to .agentic-pdlc/SETUP_PROMPT.md`);
      console.log(`\n${green}🎉 Done! To start the conversational setup:${reset}`);
      console.log(`${cyan}\t1. Open Cursor${reset}`);
      console.log(`${cyan}\t2. Open Composer (Cmd+I or Cmd+L) and type: "@.agentic-pdlc/SETUP_PROMPT.md execute Setup Mode"${reset}\n`);
    } else {
      console.error(`❌ Could not find cursor instruction file at ${cursorSetupSrc}`);
    }
  } else {
    // Generic fallback mapping
    const dest = path.join(targetDir, '.agentic-setup-prompt.md');
    fs.copyFileSync(claudeSetupSrc, dest);
    console.log(`✅ Agent generic setup instructions written to .agentic-setup-prompt.md`);
    console.log(`\n${green}🎉 Done! To start the conversational setup:${reset}`);
    console.log(`${cyan}Provide the .agentic-setup-prompt.md file to your AI agent and ask it to execute Setup Mode!${reset}\n`);
  }

  rl.close();
});
