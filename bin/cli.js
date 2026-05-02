#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// The directory where CLI is executed
const targetDir = process.cwd();
// The directory where this script sits (globally/locally in node_modules)
const sourceDir = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Detect language
const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
const isPt = locale.toLowerCase().startsWith('pt');
const isEs = locale.toLowerCase().startsWith('es');

function t(en, pt, es) {
  if (isPt) return pt;
  if (isEs) return es || en; // Fallback para inglês se faltar espanhol
  return en;
}

const i18n = {
  welcome: t('🤖 Welcome to Agentic PDLC Boilerplate Bootstrap! 🤖', '🤖 Bem-vindo ao Agentic PDLC Boilerplate Bootstrap! 🤖', '🤖 ¡Bienvenido a Agentic PDLC Boilerplate Bootstrap! 🤖'),
  checking_gh: t('Checking GitHub CLI (gh) installation...', 'Verificando instalação do GitHub CLI (gh)...', 'Verificando la instalación de GitHub CLI (gh)...'),
  gh_ok: t('✅ GitHub CLI is authenticated.', '✅ GitHub CLI está autenticado.', '✅ GitHub CLI está autenticado.'),
  gh_error: t('❌ GitHub CLI (gh) is not installed or not authenticated.', '❌ GitHub CLI (gh) não está instalado ou não autenticado.', '❌ GitHub CLI (gh) no está instalado o no está autenticado.'),
  gh_install: t('Please install it from https://cli.github.com/ and run "gh auth login" before continuing.\n', 'Por favor, instale em https://cli.github.com/ e rode "gh auth login" antes de continuar.\n', 'Por favor, instálalo desde https://cli.github.com/ y ejecuta "gh auth login" antes de continuar.\n'),
  ask_agent: t('Which AI Agent will you use for the setup? (e.g. claude, cursor, copilot, or other): ', 'Qual Agente de IA você usará para o setup? (ex: claude, cursor, copilot, ou outro): ', '¿Qué Agente de IA usarás para la configuración? (ej: claude, cursor, copilot, u otro): '),
  ask_repo: t('What is your GitHub repository URL? (e.g., https://github.com/YOUR_USER/repo_name): ', 'Qual é a URL do seu repositório no GitHub? (ex: https://github.com/SEU_USUARIO/repo_name): ', '¿Cuál es la URL de tu repositorio en GitHub? (ej: https://github.com/TU_USUARIO/repo_name): '),
  invalid_repo: t('❌ Invalid repository URL. Expected format: https://github.com/OWNER/REPO', '❌ URL de repositório inválida. Formato esperado: https://github.com/OWNER/REPO', '❌ URL de repositorio inválida. Formato esperado: https://github.com/OWNER/REPO'),
  ask_org: t('Does this repository belong to a personal User account (e.g., github.com/rafaeltcosta86) or an Organization (e.g., github.com/google-labs)? (user/org): ', 'Esse repositório pertence a um Usuário pessoal (ex: github.com/rafaeltcosta86) ou a uma Organização (ex: github.com/google-labs)? (user/org): ', '¿Este repositorio pertenece a un Usuario personal (ej: github.com/rafaeltcosta86) o a una Organización (ej: github.com/google-labs)? (user/org): '),
  ask_branch: t('What is your main branch name? (default: main): ', 'Qual o nome da sua branch principal? (padrão: main): ', '¿Cuál es el nombre de tu rama principal? (por defecto: main): '),
  starting_setup: t('Starting automated repository setup...', 'Iniciando o setup automatizado do repositório...', 'Iniciando la configuración automatizada del repositorio...'),
  creating_labels: t('[1/3] Creating repository labels...', '[1/3] Criando labels no repositório...', '[1/3] Creando etiquetas (labels) en el repositorio...'),
  label_ok: t('✅ Label created: ', '✅ Label criada: ', '✅ Etiqueta creada: '),
  label_warn: t('⚠️ Failed to create label (might already exist): ', '⚠️ Falha ao criar label (talvez já exista): ', '⚠️ Fallo al crear etiqueta (quizás ya exista): '),
  applying_protection: t('[2/3] Applying branch protection on ', '[2/3] Aplicando proteção de branch em ', '[2/3] Aplicando protección de rama en '),
  protection_ok: t('✅ Branch protection applied to ', '✅ Proteção de branch aplicada em ', '✅ Protección de rama aplicada a '),
  protection_warn: t('⚠️ Failed to apply branch protection. (Do you have GitHub Pro or is the repo Public?)', '⚠️ Falha ao aplicar proteção de branch. (Você tem GitHub Pro ou o repo é Público?)', '⚠️ Fallo al aplicar protección de rama. (¿Tienes GitHub Pro o el repositorio es Público?)'),
  creating_project: t('[3/3] Creating Project V2 Board...', '[3/3] Criando Project V2 Board...', '[3/3] Creando Project V2 Board...'),
  project_ok: t('✅ Project created (ID: ', '✅ Projeto criado (ID: ', '✅ Proyecto creado (ID: '),
  project_err: t('❌ Failed to create project. Error: ', '❌ Falha ao criar o projeto. Erro: ', '❌ Fallo al crear el proyecto. Error: '),
  config_columns: t('Configuring Project Columns...', 'Configurando colunas do Projeto...', 'Configurando columnas del Proyecto...'),
  columns_ok: t('✅ Project columns configured successfully.', '✅ Colunas do projeto configuradas com sucesso.', '✅ Columnas del proyecto configuradas con éxito.'),
  columns_warn: t('⚠️ Failed to configure project columns. You may need to add them manually.', '⚠️ Falha ao configurar colunas. Você pode precisar adicioná-las manualmente.', '⚠️ Fallo al configurar columnas. Es posible que debas agregarlas manualmente.'),
  scaffolding: t('Scaffolding Agentic PDLC into your project...', 'Injetando Agentic PDLC no seu projeto...', 'Inyectando Agentic PDLC en tu proyecto...'),
  templates_copied: t('✅ Templates copied to .agentic-pdlc/templates/', '✅ Templates copiados para .agentic-pdlc/templates/', '✅ Plantillas copiadas a .agentic-pdlc/templates/'),
  pdlc_prefilled: t('✅ Pre-filled pdlc.md with Project ID, Status Field ID, and Column Option IDs.', '✅ pdlc.md preenchido com Project ID, Status Field ID, e Column Option IDs.', '✅ pdlc.md completado con Project ID, Status Field ID y Column Option IDs.'),
  setup_written: t('✅ Setup agent profile written to .agentic-setup.md\n', '✅ Perfil de setup do agente salvo em .agentic-setup.md\n', '✅ Perfil de configuración del agente guardado en .agentic-setup.md\n'),
  framework_scaffolded: t('🎉 Framework files scaffolded to .agentic-pdlc/templates/', '🎉 Arquivos do framework injetados em .agentic-pdlc/templates/', '🎉 Archivos del framework inyectados en .agentic-pdlc/templates/'),
  next_steps: t('👉 NEXT STEPS:', '👉 PRÓXIMOS PASSOS:', '👉 PRÓXIMOS PASOS:'),
  step_1: t('1. Open your AI Assistant (Claude, Cursor, Copilot, etc).', '1. Abra o seu Assistente de IA (Claude, Cursor, Copilot, etc).', '1. Abre tu Asistente de IA (Claude, Cursor, Copilot, etc).'),
  step_2: t('2. Ask it to read the .agentic-setup.md and start Setup Mode in any language you prefer. Example 👇', '2. Peça para ele ler o .agentic-setup.md e iniciar o Setup Mode. Exemplo 👇', '2. Pídele que lea .agentic-setup.md e inicie el Setup Mode. Ejemplo 👇'),
  note_cleanup: t('Note: The agent will clean up the .agentic-setup.md file automatically when finished.\n', 'Nota: O agente irá limpar o arquivo .agentic-setup.md automaticamente quando terminar.\n', 'Nota: El agente limpiará el archivo .agentic-setup.md automáticamente cuando termine.\n'),
  missing_claude: t('❌ Could not find claude instruction file at ', '❌ Não foi possível encontrar o arquivo de instrução em ', '❌ No se pudo encontrar el archivo de instrucción en '),
  cursor_rules_written: t('✅ Default cursor rules written to .cursorrules', '✅ Regras padrão do cursor salvas em .cursorrules', '✅ Reglas por defecto de cursor guardadas en .cursorrules'),
  cursor_setup_written: t('✅ Framework Setup Instructions written to .agentic-pdlc/SETUP_PROMPT.md', '✅ Instruções de Setup do Framework salvas em .agentic-pdlc/SETUP_PROMPT.md', '✅ Instrucciones de Setup del Framework guardadas en .agentic-pdlc/SETUP_PROMPT.md'),
  cursor_done: t('🎉 Done! To start the conversational setup:', '🎉 Pronto! Para iniciar o setup conversacional:', '🎉 ¡Listo! Para iniciar la configuración conversacional:'),
  cursor_step_1: t('\t1. Open Cursor', '\t1. Abra o Cursor', '\t1. Abre Cursor'),
  cursor_step_2: t('\t2. Open Composer (Cmd+I or Cmd+L) and type: "@.agentic-pdlc/SETUP_PROMPT.md execute Setup Mode"\n', '\t2. Abra o Composer (Cmd+I ou Cmd+L) e digite: "@.agentic-pdlc/SETUP_PROMPT.md execute Setup Mode"\n', '\t2. Abre Composer (Cmd+I o Cmd+L) y escribe: "@.agentic-pdlc/SETUP_PROMPT.md execute Setup Mode"\n'),
  generic_written: t('✅ Agent generic setup instructions written to .agentic-setup-prompt.md', '✅ Instruções genéricas salvas em .agentic-setup-prompt.md', '✅ Instrucciones genéricas guardadas en .agentic-setup-prompt.md'),
  generic_done: t('Provide the .agentic-setup-prompt.md file to your AI agent and ask it to execute Setup Mode!\n', 'Forneça o arquivo .agentic-setup-prompt.md para o seu agente e peça para executar o Setup Mode!\n', '¡Proporciona el archivo .agentic-setup-prompt.md a tu agente de IA y pídele que ejecute el Setup Mode!\n')
};

const cyan = '\x1b[36m';
const reset = '\x1b[0m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';

console.log(`${cyan}================================================================${reset}`);
console.log(`${cyan}${i18n.welcome}${reset}`);
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

async function runSetup() {
  console.log(`${yellow}${i18n.checking_gh}${reset}`);
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    console.log(`${green}${i18n.gh_ok}${reset}\n`);
  } catch (error) {
    console.error(`${red}${i18n.gh_error}${reset}`);
    console.error(`${i18n.gh_install}`);
    process.exit(1);
  }

  const agentAnswer = await askQuestion(i18n.ask_agent);
  const agent = agentAnswer.trim().toLowerCase();

  const repoUrlAnswer = await askQuestion(i18n.ask_repo);
  let repoUrl = repoUrlAnswer.trim();
  if (repoUrl.endsWith('/')) repoUrl = repoUrl.slice(0, -1);
  const repoParts = repoUrl.split('/');
  if (repoParts.length < 2) {
    console.error(`${red}${i18n.invalid_repo}${reset}`);
    process.exit(1);
  }
  const repoOwner = repoParts[repoParts.length - 2];
  const repoName = repoParts[repoParts.length - 1];
  const repo = `${repoOwner}/${repoName}`;

  const accountTypeAnswer = await askQuestion(i18n.ask_org);
  const isOrg = accountTypeAnswer.trim().toLowerCase() === 'org' || accountTypeAnswer.trim().toLowerCase() === 'organization';

  const branchAnswer = await askQuestion(i18n.ask_branch);
  const branchName = branchAnswer.trim() || 'main';

  console.log(`\n${yellow}${i18n.starting_setup}${reset}`);

  // Labels
  const labels = [
    { name: 'stage:exploration', color: '9b59b6', description: 'Issue is being evaluated' },
    { name: 'stage:brainstorming', color: 'e84393', description: 'Proposed approaches awaiting PM gate' },
    { name: 'stage:detailing', color: '3498db', description: 'Technical spec is being written' },
    { name: 'stage:development', color: 'e67e22', description: 'Agent is implementing the spec' },
    { name: 'stage:testing', color: '8e44ad', description: 'Agent is testing the implementation' },
    { name: 'spec:approved', color: '0e8a16', description: 'Spec approved — agent can implement' },
    { name: 'pr:in-review', color: 'e4e669', description: 'PR awaiting code review' },
    { name: 'pr:approved', color: '0e8a16', description: 'PR approved, ready for merge' },
    { name: 'architecture-violation', color: 'd93f0b', description: 'Invariant violation detected by CI' },
    { name: 'qa:approved', color: '0e8a16', description: 'QA Agent approved the implementation' },
    { name: 'qa:needs-work', color: 'd93f0b', description: 'QA Agent found issues' },
    { name: 'jules', color: '5319e7', description: 'Jules AI Agent' }
  ];

  console.log(`\n${cyan}${i18n.creating_labels}${reset}`);
  for (const label of labels) {
    try {
      execSync(`gh label create "${label.name}" --color "${label.color}" --description "${label.description}" --repo ${repo} --force`, { stdio: 'ignore' });
      console.log(`  ${i18n.label_ok}${label.name}`);
    } catch (err) {
      console.log(`  ${i18n.label_warn}${label.name}`);
    }
  }

  // Branch Protection
  console.log(`\n${cyan}${i18n.applying_protection}'${branchName}'...${reset}`);
  const protectionPayload = {
    required_status_checks: { strict: true, checks: [{ context: "Sentinel / CI" }] },
    enforce_admins: false,
    required_pull_request_reviews: { required_approving_review_count: 1, dismiss_stale_reviews: true },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false
  };

  try {
    execSync(`gh api repos/${repo}/branches/${branchName}/protection --method PUT --input -`, {
      input: JSON.stringify(protectionPayload),
      stdio: 'ignore'
    });
    console.log(`  ${i18n.protection_ok}${branchName}`);
  } catch (err) {
    console.log(`  ${i18n.protection_warn}`);
  }

  // Project V2
  console.log(`\n${cyan}${i18n.creating_project}${reset}`);
  let ownerId, projectId;
  try {
    if (isOrg) {
      const orgOutput = execSync(`gh api graphql -f query='query($login: String!) { organization(login: $login) { id } }' -f login="${repoOwner}" --jq '.data.organization.id'`).toString().trim();
      ownerId = orgOutput;
    } else {
      const userOutput = execSync(`gh api graphql -f query='{ viewer { id } }' --jq '.data.viewer.id'`).toString().trim();
      ownerId = userOutput;
    }

    const projectCreateOutput = execSync(`gh api graphql -f query='mutation($owner: ID!, $title: String!) { createProjectV2(input: {ownerId: $owner, title: $title}) { projectV2 { id } } }' -f owner="${ownerId}" -f title="PDLC - ${repoName}" --jq '.data.createProjectV2.projectV2.id'`).toString().trim();
    projectId = projectCreateOutput;

    console.log(`  ${i18n.project_ok}${projectId})`);
  } catch (err) {
    console.log(`  ${i18n.project_err}${err.message}`);
  }

  let statusFieldId;
  let optionMap = {};

  if (projectId) {
    console.log(`  ${cyan}${i18n.config_columns}${reset}`);
    try {
      const fieldsOutput = execSync(`gh api graphql -f query='query($projectId: ID!) { node(id: $projectId) { ... on ProjectV2 { fields(first: 20) { nodes { ... on ProjectV2SingleSelectField { id name } } } } } }' -f projectId="${projectId}" --jq '.data.node.fields.nodes[] | select(.name == "Status") | .id'`).toString().trim();
      statusFieldId = fieldsOutput;

      if (statusFieldId) {
        const columns = [
          { name: "💡 Idea", description: "Backlog", color: "GRAY" },
          { name: "🔍 Exploration", description: "Claude is analyzing", color: "PURPLE" },
          { name: "🧠 Brainstorming", description: "Awaiting PM gate", color: "PINK" },
          { name: "📐 Detail Solution", description: "Technical spec", color: "BLUE" },
          { name: "✅ Approval", description: "Spec ready", color: "GREEN" },
          { name: "⚙️ Development", description: "Agent implementing", color: "ORANGE" },
          { name: "🧪 Testing", description: "QA testing", color: "RED" },
          { name: "👁 Code Review / PR", description: "PR opened", color: "YELLOW" },
          { name: "🚀 Production", description: "Merged", color: "GREEN" }
        ];

        const updateFieldQuery = `mutation($projectId: ID!, $fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]) {
          updateProjectV2SingleSelectField(input: {
            projectId: $projectId,
            fieldId: $fieldId,
            options: $options
          }) { 
            projectV2SingleSelectField { 
              options { id name } 
            } 
          }
        }`;

        const queryPayload = JSON.stringify({
          query: updateFieldQuery,
          variables: {
            projectId: projectId,
            fieldId: statusFieldId,
            options: columns
          }
        });

        const updateOutput = execSync(`gh api graphql --input -`, { input: queryPayload }).toString().trim();
        const jsonResponse = JSON.parse(updateOutput);
        const returnedOptions = jsonResponse.data.updateProjectV2SingleSelectField.projectV2SingleSelectField.options;
        
        for (const opt of returnedOptions) {
          optionMap[opt.name] = opt.id;
        }

        console.log(`  ${i18n.columns_ok}`);
      }
    } catch (err) {
      console.log(`  ${i18n.columns_warn}`);
    }
  }

  console.log(`\n${yellow}${i18n.scaffolding}${reset}`);

  // We copy the templates folder so the agent has the real text logic to replace and rename
  const sourceTemplates = path.join(sourceDir, 'templates');
  const targetTemplates = path.join(targetDir, '.agentic-pdlc', 'templates');
  
  if (fs.existsSync(sourceTemplates)) {
    copyDirSync(sourceTemplates, targetTemplates);
    console.log(`${i18n.templates_copied}`);

    // Substitute values in docs/pdlc.md automatically
    const pdlcDest = path.join(targetTemplates, 'docs', 'pdlc.md');
    if (fs.existsSync(pdlcDest)) {
      let pdlcContent = fs.readFileSync(pdlcDest, 'utf8');
      
      if (projectId) pdlcContent = pdlcContent.replace(/\{\{PROJECT_ID\}\}/g, projectId);
      if (statusFieldId) pdlcContent = pdlcContent.replace(/\{\{STATUS_FIELD_ID\}\}/g, statusFieldId);
      pdlcContent = pdlcContent.replace(/\{\{REPO_OWNER\}\}/g, repoOwner);
      pdlcContent = pdlcContent.replace(/\{\{REPO_NAME\}\}/g, repoName);

      if (Object.keys(optionMap).length > 0) {
        pdlcContent = pdlcContent.replace(/\{\{ID_IDEA\}\}/g, optionMap["💡 Idea"] || 'MISSING_ID');
        pdlcContent = pdlcContent.replace(/\{\{ID_EXPLORATION\}\}/g, optionMap["🔍 Exploration"] || 'MISSING_ID');
        pdlcContent = pdlcContent.replace(/\{\{ID_BRAINSTORMING\}\}/g, optionMap["🧠 Brainstorming"] || 'MISSING_ID');
        pdlcContent = pdlcContent.replace(/\{\{ID_DETAIL\}\}/g, optionMap["📐 Detail Solution"] || 'MISSING_ID');
        pdlcContent = pdlcContent.replace(/\{\{ID_APPROVAL\}\}/g, optionMap["✅ Approval"] || 'MISSING_ID');
        pdlcContent = pdlcContent.replace(/\{\{ID_DEVELOPMENT\}\}/g, optionMap["⚙️ Development"] || 'MISSING_ID');
        pdlcContent = pdlcContent.replace(/\{\{ID_TESTING\}\}/g, optionMap["🧪 Testing"] || 'MISSING_ID');
        pdlcContent = pdlcContent.replace(/\{\{ID_CODE_REVIEW_PR\}\}/g, optionMap["👁 Code Review / PR"] || 'MISSING_ID');
        pdlcContent = pdlcContent.replace(/\{\{ID_PRODUCTION\}\}/g, optionMap["🚀 Production"] || 'MISSING_ID');
      }

      fs.writeFileSync(pdlcDest, pdlcContent);
      console.log(`${i18n.pdlc_prefilled}`);
    }
  }

  // Handle the specific setup instructions target
  const claudeSetupSrc = path.join(sourceDir, 'adapters', 'claude-code', 'skill.md');
  const cursorSetupSrc = path.join(sourceDir, 'adapters', 'cursor', 'rules.md');

  if (agent === 'claude') {
    if (fs.existsSync(claudeSetupSrc)) {
      const dest = path.join(targetDir, '.agentic-setup.md');
      fs.copyFileSync(claudeSetupSrc, dest);
      console.log(`${i18n.setup_written}`);
      console.log(`${green}============================================================${reset}`);
      console.log(`${green}${i18n.framework_scaffolded}${reset}`);
      console.log(`${green}============================================================${reset}\n`);
      console.log(`${yellow}${i18n.next_steps}${reset}`);
      console.log(`${cyan}${i18n.step_1}${reset}`);
      console.log(`${cyan}${i18n.step_2}${reset}`);
      console.log(`${cyan}>>> English: "Read .agentic-setup.md and guide me through the setup."${reset}`);
      console.log(`${cyan}>>> Español: "Lea el arquivo .agentic-setup.md e inicie el Setup Mode"${reset}`);
      console.log(`${cyan}>>> Português: "Leia o arquivo .agentic-setup.md e inicie o Setup Mode."${reset}\n`);
      console.log(`${i18n.note_cleanup}`);
    } else {
      console.error(`${i18n.missing_claude}${claudeSetupSrc}`);
    }
  } else if (agent === 'cursor') {
    if (fs.existsSync(cursorSetupSrc)) {
      // Create .cursorrules which has the general invariants
      const dest = path.join(targetDir, '.cursorrules');
      fs.copyFileSync(cursorSetupSrc, dest);
      
      // Also copy skill.md as a setup prompt for cursor composer
      const setupPromptDest = path.join(targetDir, '.agentic-pdlc', 'SETUP_PROMPT.md');
      if (fs.existsSync(claudeSetupSrc)) fs.copyFileSync(claudeSetupSrc, setupPromptDest);

      console.log(`${i18n.cursor_rules_written}`);
      console.log(`${i18n.cursor_setup_written}`);
      console.log(`\n${green}${i18n.cursor_done}${reset}`);
      console.log(`${cyan}${i18n.cursor_step_1}${reset}`);
      console.log(`${cyan}${i18n.cursor_step_2}${reset}`);
    } else {
      console.error(`${i18n.missing_claude}${cursorSetupSrc}`);
    }
  } else {
    // Generic fallback mapping
    const dest = path.join(targetDir, '.agentic-setup-prompt.md');
    fs.copyFileSync(claudeSetupSrc, dest);
    console.log(`${i18n.generic_written}`);
    console.log(`\n${green}${i18n.cursor_done}${reset}`);
    console.log(`${cyan}${i18n.generic_done}${reset}`);
  }

  rl.close();
}

runSetup();
