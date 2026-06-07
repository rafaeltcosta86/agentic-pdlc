#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, execFileSync } = require('child_process');

// The directory where CLI is executed
const targetDir = process.cwd();
// The directory where this script sits (globally/locally in node_modules)
const sourceDir = path.join(__dirname, '..');

const rl = require.main === module
  ? readline.createInterface({ input: process.stdin, output: process.stdout })
  : null;

function askQuestion(query) {
  if (!rl) throw new Error('askQuestion called in non-interactive context');
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
  ask_agent: t('Which AI Agent will you use for the setup? (e.g. claude, cursor, copilot, antigravity, or other): ', 'Qual Agente de IA você usará para o setup? (ex: claude, cursor, copilot, antigravity, ou outro): ', '¿Qué Agente de IA usarás para la configuración? (ej: claude, cursor, copilot, antigravity, u otro): '),
  ask_repo: t('What is your GitHub repository URL? (e.g., https://github.com/YOUR_USER/repo_name): ', 'Qual é a URL do seu repositório no GitHub? (ex: https://github.com/SEU_USUARIO/repo_name): ', '¿Cuál es la URL de tu repositorio en GitHub? (ej: https://github.com/TU_USUARIO/repo_name): '),
  invalid_repo: t('❌ Invalid repository URL. Expected format: https://github.com/OWNER/REPO', '❌ URL de repositório inválida. Formato esperado: https://github.com/OWNER/REPO', '❌ URL de repositorio inválida. Formato esperado: https://github.com/OWNER/REPO'),
  ask_org: t('Does this repository belong to a personal User account (e.g., github.com/rafaeltcosta86) or an Organization (e.g., github.com/google-labs)? (user/org): ', 'Esse repositório pertence a um Usuário pessoal (ex: github.com/rafaeltcosta86) ou a uma Organização (ex: github.com/google-labs)? (user/org): ', '¿Este repositorio pertenece a un Usuario personal (ej: github.com/rafaeltcosta86) o a una Organización (ej: github.com/google-labs)? (user/org): '),
  starting_setup: t('Starting automated repository setup...', 'Iniciando o setup automatizado do repositório...', 'Iniciando la configuración automatizada del repositorio...'),
  creating_labels: t('[1/3] Creating repository labels...', '[1/3] Criando labels no repositório...', '[1/3] Creando etiquetas (labels) en el repositorio...'),
  label_ok: t('✅ Label created: ', '✅ Label criada: ', '✅ Etiqueta creada: '),
  label_warn: t('⚠️ Failed to create label (might already exist): ', '⚠️ Falha ao criar label (talvez já exista): ', '⚠️ Fallo al crear etiqueta (quizás ya exista): '),
  creating_project: t('[2/3] Creating Project V2 Board...', '[2/3] Criando Project V2 Board...', '[2/3] Creando Project V2 Board...'),
  project_ok: t('✅ Project created (ID: ', '✅ Projeto criado (ID: ', '✅ Proyecto creado (ID: '),
  project_err: t('❌ Failed to create project. Error: ', '❌ Falha ao criar o projeto. Erro: ', '❌ Fallo al crear el proyecto. Error: '),
  link_project_ok: t('✅ Project linked to repository.', '✅ Projeto vinculado ao repositório.', '✅ Proyecto vinculado al repositorio.'),
  link_project_warn: t('⚠️ Failed to link project to repository. Link it manually in GitHub Projects settings.', '⚠️ Falha ao vincular projeto ao repositório. Faça isso manualmente nas configurações do GitHub Projects.', '⚠️ Fallo al vincular el proyecto al repositorio. Hazlo manualmente en la configuración de GitHub Projects.'),
  config_columns: t('Configuring Project Columns...', 'Configurando colunas do Projeto...', 'Configurando columnas del Proyecto...'),
  columns_ok: t('✅ Project columns configured successfully.', '✅ Colunas do projeto configuradas com sucesso.', '✅ Columnas del proyecto configuradas con éxito.'),
  columns_warn: t('⚠️ Failed to configure project columns. You may need to add them manually.', '⚠️ Falha ao configurar colunas. Você pode precisar adicioná-las manualmente.', '⚠️ Fallo al configurar columnas. Es posible que debas agregarlas manualmente.'),
  scaffolding: t('Scaffolding Agentic PDLC into your project...', 'Injetando Agentic PDLC no seu projeto...', 'Inyectando Agentic PDLC en tu proyecto...'),
  templates_copied: t('✅ Templates copied to .agentic-pdlc/templates/', '✅ Templates copiados para .agentic-pdlc/templates/', '✅ Plantillas copiadas a .agentic-pdlc/templates/'),
  pdlc_prefilled: t('✅ Pre-filled pdlc.md with Project ID, Status Field ID, and Column Option IDs.', '✅ pdlc.md preenchido com Project ID, Status Field ID, e Column Option IDs.', '✅ pdlc.md completado con Project ID, Status Field ID y Column Option IDs.'),
  setup_written: t('✅ Setup agent profile written to .agentic-setup.md\n', '✅ Perfil de setup do agente salvo em .agentic-setup.md\n', '✅ Perfil de configuración del agente guardado en .agentic-setup.md\n'),
  missing_claude: t('❌ Could not find instruction file at ', '❌ Não foi possível encontrar o arquivo de instrução em ', '❌ No se pudo encontrar el archivo de instrucción en '),
  cursor_rules_written: t('✅ Default cursor rules written to .cursorrules', '✅ Regras padrão do cursor salvas em .cursorrules', '✅ Reglas por defecto de cursor guardadas en .cursorrules'),
  setup_done: t('🎉 All set! Continue the setup with your agent:', '🎉 Aqui tá pronto! Continue o setup com o seu agente:', '🎉 ¡Listo! Continúa el setup con tu agente:'),
  setup_done_hint: t('>>> Tell it to read and execute the .agentic-setup.md file!', '>>> Diga a ele para ler e executar o arquivo .agentic-setup.md!', '>>> Dile que lea y ejecute el archivo .agentic-setup.md!'),
  upgrade_hint: t('💡 To add the full board + multi-agent automation later: npx create-agentic-pdlc --upgrade-to-agentic', '💡 Para adicionar o board completo + automação multi-agente mais tarde: npx create-agentic-pdlc --upgrade-to-agentic', '💡 Para agregar el tablero completo + automatización multi-agente más tarde: npx create-agentic-pdlc --upgrade-to-agentic'),
  update_title: t('agentic-pdlc — Agent Configuration Status', 'agentic-pdlc — Status de Configuração dos Agentes', 'agentic-pdlc — Estado de Configuración de Agentes'),
  update_no_context: t('❌ No .agentic-pdlc/cli-context.json found. Run npx create-agentic-pdlc first.', '❌ Arquivo .agentic-pdlc/cli-context.json não encontrado. Rode npx create-agentic-pdlc primeiro.', '❌ Archivo .agentic-pdlc/cli-context.json no encontrado. Ejecuta npx create-agentic-pdlc primero.'),
  update_all_ok: t('All agents configured!', 'Todos os agentes configurados!', '¡Todos los agentes configurados!'),
  update_ask_configure: t('Configure missing agents? (Y/n): ', 'Configurar agentes faltantes? (S/n): ', '¿Configurar agentes faltantes? (S/n): '),
  update_skipped: t('Skipped.', 'Pulado.', 'Omitido.'),
  update_jules_header: t('— Jules (autonomous implementation agent) —', '— Jules (agente de implementação autônomo) —', '— Jules (agente de implementación autónomo) —'),
  update_jules_ask: t('  Which agent? (a) @google-labs-jules  (b) Other  (c) Skip: ', '  Qual agente? (a) @google-labs-jules  (b) Outro  (c) Pular: ', '  ¿Qué agente? (a) @google-labs-jules  (b) Otro  (c) Omitir: '),
  update_jules_ask_handle: t('  Agent handle (e.g. @my-agent): ', '  Handle do agente (ex: @meu-agente): ', '  Handle del agente (ej: @mi-agente): '),
  update_qa_header: t('— QA Agent (AC verification via GitHub Models — zero secrets) —', '— QA Agent (verificação de ACs via GitHub Models — zero secrets) —', '— QA Agent (verificación de ACs via GitHub Models — zero secrets) —'),
  update_qa_ask: t('  Activate? Uses GITHUB_TOKEN — no extra secrets needed. (Y/n): ', '  Ativar? Usa GITHUB_TOKEN — nenhum secret extra necessário. (S/n): ', '  ¿Activar? Usa GITHUB_TOKEN — sin secrets adicionales. (S/n): '),
  update_sentinel_header: t('— Sentinel (architecture-violation label → board automation) —', '— Sentinel (label architecture-violation → automação de board) —', '— Sentinel (label architecture-violation → automatización de board) —'),
  update_sentinel_ask: t("  Activate? CodeRabbit applies 'architecture-violation' label when violations are detected. (Y/n): ", "  Ativar? CodeRabbit aplica a label 'architecture-violation' quando detecta violações. (S/n): ", "  ¿Activar? CodeRabbit aplica la etiqueta 'architecture-violation' cuando detecta violaciones. (S/n): "),
  configuring_protection: t('[3/3] Configuring branch protection...', '[3/3] Configurando proteção de branch...', '[3/3] Configurando protección de rama...'),
  protection_ok: t('✅ Branch protection set — required checks: PDLC Stage Gate, QA Gate.', '✅ Proteção de branch configurada — checks obrigatórios: PDLC Stage Gate, QA Gate.', '✅ Protección de rama configurada — checks requeridos: PDLC Stage Gate, QA Gate.'),
  protection_warn: t(
    '⚠️  Branch protection requires admin access — could not be set automatically.\n\n     What it does: prevents PRs from merging unless these CI checks pass:\n       • "PDLC Stage Gate" — blocks merge if the linked issue lacks spec:approved\n       • "QA Gate"         — blocks merge if automated QA checks failed\n\n     Without it: the workflow still runs, but PRs can be merged without approval.\n\n     To enable: Settings → Branches → main → Required status checks\n     Add: "PDLC Stage Gate" and "QA Gate"',
    '⚠️  Proteção de branch requer acesso de admin — não pôde ser configurada automaticamente.\n\n     O que faz: impede que PRs sejam mergeados sem que esses checks de CI passem:\n       • "PDLC Stage Gate" — bloqueia merge se a issue não tiver spec:approved\n       • "QA Gate"         — bloqueia merge se os checks automáticos de QA falharem\n\n     Sem ela: o workflow continua funcionando, mas PRs podem ser mergeados sem aprovação.\n\n     Para ativar: Settings → Branches → main → Required status checks\n     Adicionar: "PDLC Stage Gate" e "QA Gate"',
    '⚠️  La protección de rama requiere acceso de administrador — no se pudo configurar automáticamente.\n\n     Qué hace: impide que los PRs se fusionen sin que pasen estos checks de CI:\n       • "PDLC Stage Gate" — bloquea el merge si la issue no tiene spec:approved\n       • "QA Gate"         — bloquea el merge si los checks automáticos de QA fallaron\n\n     Sin ella: el flujo sigue funcionando, pero los PRs se pueden fusionar sin aprobación.\n\n     Para activar: Settings → Branches → main → Required status checks\n     Agregar: "PDLC Stage Gate" y "QA Gate"'
  ),
  issue_templates_copied: t(
    '✅ Issue templates copied to .github/ISSUE_TEMPLATE/',
    '✅ Issue templates copiados para .github/ISSUE_TEMPLATE/',
    '✅ Issue templates copiados a .github/ISSUE_TEMPLATE/'
  ),
  vars_project_id_ok: t(
    '✅ vars.PROJECT_ID set as Actions Variable.',
    '✅ vars.PROJECT_ID configurado como Variável do Actions.',
    '✅ vars.PROJECT_ID configurado como Variable de Actions.'
  ),
  vars_project_id_warn: t(
    '⚠️  Could not set vars.PROJECT_ID — token may lack variables:write scope.\n   Set manually: repo Settings → Secrets and variables → Variables → PROJECT_ID = ',
    '⚠️  Não foi possível configurar vars.PROJECT_ID — o token pode não ter permissão variables:write.\n   Configure manualmente: repo Settings → Secrets and variables → Variables → PROJECT_ID = ',
    '⚠️  No se pudo configurar vars.PROJECT_ID — el token puede no tener permiso variables:write.\n   Configura manualmente: repo Settings → Secrets and variables → Variables → PROJECT_ID = '
  ),
  gh_not_installed: t(
    '\n⚠️  GitHub CLI (gh) is not installed. Skipping label creation.',
    '\n⚠️  GitHub CLI (gh) não está instalado. Pulando criação de labels.',
    '\n⚠️  GitHub CLI (gh) no está instalado. Omitiendo creación de etiquetas.'
  ),
  repo_context_missing: t(
    '\n⚠️  Repository owner or name missing in cli-context.json. Automatic label creation will be skipped.',
    '\n⚠️  Dono ou nome do repositório ausente em cli-context.json. Criação automática de labels será pulada.',
    '\n⚠️  Propietario o nombre del repositorio faltante en cli-context.json. Se omitirá la creación automática de etiquetas.'
  ),
  protection_private_repo: t(
    '⚠️  GitHub allows Branch Protection only for public repos (or a paid plan).\n     👌  Don\'t worry, the workflow still runs smoothly, but PRs can be merged without approval.',
    '⚠️  O GitHub permite Branch Protection apenas para repos públicos (ou plano pago).\n     👌  Sem problemas, o workflow continua funcionando normalmente, mas PRs podem ser mergeados sem aprovação.',
    '⚠️  GitHub permite Branch Protection solo para repos públicos (o un plan de pago).\n     👌  No te preocupes, el workflow sigue funcionando normalmente, pero los PRs pueden fusionarse sin aprobación.'
  ),
};

const cyan = '\x1b[36m';
const reset = '\x1b[0m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';

const PDLC_LABELS = [
  { name: 'stage:brainstorming',    color: 'e84393', description: 'Proposed approaches awaiting PM gate' },
  { name: 'stage:detailing',        color: '3498db', description: 'Technical spec is being written' },
  { name: 'stage:development',      color: 'e67e22', description: 'Agent is implementing the spec' },
  { name: 'spec:approved',          color: '0e8a16', description: 'Spec approved — agent can implement' },
  { name: 'pr:in-review',           color: 'e4e669', description: 'PR awaiting code review' },
  { name: 'pr:approved',            color: '0e8a16', description: 'PR approved, ready for merge' },
  { name: 'architecture-violation', color: 'd93f0b', description: 'Invariant violation detected by CI' },
];

const JULES_LABELS = [
  { name: 'jules', color: '5319e7', description: 'Jules AI Agent' },
];

const QA_LABELS = [
  { name: 'qa:approved',    color: '0e8a16', description: 'QA Agent approved the implementation' },
  { name: 'qa:needs-work',  color: 'd93f0b', description: 'QA Agent found issues' },
  { name: 'infra:qa-broken',color: 'F97316', description: 'QA Agent failed to run — manual review required' },
];

function buildBoardUrl(repoOwner, projectNumber, isOrg) {
  const segment = isOrg ? 'orgs' : 'users';
  return `https://github.com/${segment}/${repoOwner}/projects/${projectNumber}/views/1?layout=board`;
}

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

function printSetupDone() {
  const line1 = i18n.setup_done;
  const line2 = i18n.setup_done_hint;
  const sep = '='.repeat(Math.max(line1.length, line2.length));
  console.log(`\n${green}${sep}${reset}`);
  console.log(`${green}${line1}${reset}`);
  console.log(`${cyan}${line2}${reset}`);
  console.log(`${green}${sep}${reset}\n`);
}

// ─── Shared helper functions ──────────────────────────────────────────────────

async function checkGhAuth() {
  console.log(`${yellow}${i18n.checking_gh}${reset}`);
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    console.log(`${green}${i18n.gh_ok}${reset}\n`);
  } catch (error) {
    console.error(`${red}${i18n.gh_error}${reset}`);
    console.error(`${i18n.gh_install}`);
    rl.close();
    process.exit(1);
  }
}

function getScopes() {
  try {
    const out = execFileSync('gh', ['api', 'user', '-i'], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    const line = out.split('\n').find(l => l.toLowerCase().startsWith('x-oauth-scopes:'));
    return line ? line.split(':').slice(1).join(':').split(',').map(s => s.trim()) : [];
  } catch (e) {
    return [];
  }
}

async function checkAndRefreshProjectScope() {
  const scopesBefore = getScopes();
  if (scopesBefore.length === 0 || scopesBefore.includes('project')) return;

  console.log(`${yellow}⚠️  Token missing 'project' scope — required for GitHub Projects board.${reset}`);
  console.log(`${yellow}   Refreshing token now (browser may open)...${reset}\n`);
  try {
    execSync('gh auth refresh -h github.com -s project', { stdio: 'inherit' });
  } catch (e) {
    console.log(`${red}❌ Token refresh failed. Run manually: gh auth refresh -h github.com -s project${reset}`);
    rl.close();
    process.exit(1);
  }
  const scopesAfter = getScopes();
  if (scopesAfter.length > 0 && !scopesAfter.includes('project')) {
    console.log(`\n${red}❌ 'project' scope still missing after refresh.${reset}`);
    console.log(`${yellow}   Active scopes: ${scopesAfter.join(', ')}${reset}`);
    console.log(`${yellow}   Try manually: gh auth refresh -h github.com -s project${reset}`);
    rl.close();
    process.exit(1);
  }
  if (scopesAfter.length > 0) {
    console.log(`\n${green}✅ Token refreshed. Active scopes: ${scopesAfter.join(', ')}${reset}\n`);
  } else {
    console.log(`\n${green}✅ Token refreshed with 'project' scope.${reset}\n`);
  }
}

function installHook(sourceDir, targetDir) {
  const hookSrc  = path.join(sourceDir, 'adapters', 'hooks', 'pdlc-stage-gate.sh');
  const hookDir  = path.join(targetDir, '.agentic-pdlc', 'hooks');
  const hookDest = path.join(hookDir, 'pdlc-stage-gate.sh');
  if (!fs.existsSync(hookSrc)) return;

  fs.mkdirSync(hookDir, { recursive: true });
  fs.copyFileSync(hookSrc, hookDest);
  fs.chmodSync(hookDest, '755');

  const settingsDir  = path.join(targetDir, '.claude');
  const settingsPath = path.join(settingsDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    fs.mkdirSync(settingsDir, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({
      hooks: {
        PreToolUse: [{
          matcher: 'Bash',
          hooks: [{ type: 'command', command: 'bash .agentic-pdlc/hooks/pdlc-stage-gate.sh' }]
        }]
      }
    }, null, 2) + '\n');
  }
}

async function setBranchProtection(repo, requiredChecks) {
  console.log(`\n${cyan}${i18n.configuring_protection}${reset}`);
  try {
    const repoInfo = JSON.parse(execFileSync(
      'gh', ['api', `repos/${repo}`, '--jq', '{private: .private, default_branch: .default_branch}'],
      { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }
    ).trim());

    if (repoInfo.private) {
      console.log(`  ${yellow}${i18n.protection_private_repo}${reset}`);
      return;
    }

    const defaultBranch = repoInfo.default_branch || 'main';

    const protectionPayload = JSON.stringify({
      required_status_checks: { strict: false, contexts: requiredChecks },
      enforce_admins: false,
      required_pull_request_reviews: null,
      restrictions: null
    });

    execFileSync(
      'gh',
      ['api', `repos/${repo}/branches/${defaultBranch}/protection`, '--method', 'PUT', '--input', '-'],
      { input: protectionPayload, stdio: ['pipe', 'ignore', 'pipe'] }
    );
    console.log(`  ${green}${i18n.protection_ok}${reset}`);
  } catch (_) {
    console.log(`  ${yellow}${i18n.protection_warn}${reset}`);
  }
}

function copyAdapterFiles(agent, sourceDir, targetDir) {
  const claudeSetupSrc = path.join(sourceDir, 'adapters', 'claude-code', 'skill.md');
  const cursorSetupSrc = path.join(sourceDir, 'adapters', 'cursor',     'rules.md');

  if (agent === 'cursor') {
    if (fs.existsSync(cursorSetupSrc)) {
      fs.copyFileSync(cursorSetupSrc, path.join(targetDir, '.cursorrules'));
      console.log(`${i18n.cursor_rules_written}`);
    }
  }
  if (fs.existsSync(claudeSetupSrc)) {
    fs.copyFileSync(claudeSetupSrc, path.join(targetDir, '.agentic-setup.md'));
    console.log(`${i18n.setup_written}`);
    printSetupDone();
  } else {
    console.error(`${i18n.missing_claude}${claudeSetupSrc}`);
  }
}

function scaffoldLiteTemplates(sourceDir, targetDir) {
  const destTemplates = path.join(targetDir, '.agentic-pdlc', 'templates');
  fs.mkdirSync(destTemplates, { recursive: true });

  // CLAUDE.md — lite version
  const liteClaudeSrc = path.join(sourceDir, 'templates', 'lite', 'CLAUDE.md');
  if (fs.existsSync(liteClaudeSrc)) {
    fs.copyFileSync(liteClaudeSrc, path.join(destTemplates, 'CLAUDE.md'));
  }

  // AGENTS.md — lite version
  const liteAgentsSrc = path.join(sourceDir, 'templates', 'lite', 'AGENTS.md');
  if (fs.existsSync(liteAgentsSrc)) {
    fs.copyFileSync(liteAgentsSrc, path.join(destTemplates, 'AGENTS.md'));
  }

  // Issue templates — shared between lite and full
  const issueTemplateSrc  = path.join(sourceDir, 'templates', '.github', 'ISSUE_TEMPLATE');
  const issueTemplateDest = path.join(destTemplates, '.github', 'ISSUE_TEMPLATE');
  if (fs.existsSync(issueTemplateSrc)) {
    copyDirSync(issueTemplateSrc, issueTemplateDest);
  }
}

function createLabelsForRepo(labels, repo) {
  for (const label of labels) {
    try {
      execFileSync('gh', ['label', 'create', label.name, '--color', label.color, '--description', label.description, '--repo', repo, '--force'], { stdio: 'ignore' });
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn(i18n.gh_not_installed);
        break;
      }
    }
  }
}

function setActionsVariable(repo, name, value, execFn = execFileSync) {
  try {
    execFn('gh', [
      'api', `repos/${repo}/actions/variables/${name}`,
      '--method', 'PATCH',
      '-f', `name=${name}`,
      '-f', `value=${value}`
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    const msg = (err.stderr?.toString() || '') + (err.message || '');
    if (msg.includes('404') || msg.includes('Not Found')) {
      execFn('gh', [
        'api', `repos/${repo}/actions/variables`,
        '--method', 'POST',
        '-f', `name=${name}`,
        '-f', `value=${value}`
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
    } else {
      throw err;
    }
  }
}

function scaffoldFullTemplates(sourceDir, targetDir, projectId, statusFieldId, optionMap, repoOwner, repoName) {
  const destTemplates = path.join(targetDir, '.agentic-pdlc', 'templates');
  fs.mkdirSync(destTemplates, { recursive: true });

  // CLAUDE.md — concatenate lite + full addon
  const liteClaudeSrc = path.join(sourceDir, 'templates', 'lite', 'CLAUDE.md');
  const fullClaudeSrc = path.join(sourceDir, 'templates', 'full', 'CLAUDE.md');
  if (fs.existsSync(liteClaudeSrc) && fs.existsSync(fullClaudeSrc)) {
    const combined = fs.readFileSync(liteClaudeSrc, 'utf8') + '\n' + fs.readFileSync(fullClaudeSrc, 'utf8');
    fs.writeFileSync(path.join(destTemplates, 'CLAUDE.md'), combined);
  } else if (fs.existsSync(liteClaudeSrc)) {
    fs.copyFileSync(liteClaudeSrc, path.join(destTemplates, 'CLAUDE.md'));
  }

  // AGENTS.md — full version
  const fullAgentsSrc = path.join(sourceDir, 'templates', 'full', 'AGENTS.md');
  if (fs.existsSync(fullAgentsSrc)) {
    fs.copyFileSync(fullAgentsSrc, path.join(destTemplates, 'AGENTS.md'));
  }

  // All of templates/.github/ (issue templates + workflows)
  const githubSrc  = path.join(sourceDir, 'templates', '.github');
  const githubDest = path.join(destTemplates, '.github');
  if (fs.existsSync(githubSrc)) {
    copyDirSync(githubSrc, githubDest);
  }

  // docs/pdlc.md — substitute board IDs
  const pdlcSrc  = path.join(sourceDir, 'templates', 'full', 'docs', 'pdlc.md');
  const pdlcDest = path.join(destTemplates, 'docs', 'pdlc.md');
  if (fs.existsSync(pdlcSrc)) {
    fs.mkdirSync(path.join(destTemplates, 'docs'), { recursive: true });
    let pdlcContent = fs.readFileSync(pdlcSrc, 'utf8');
    if (projectId)     pdlcContent = pdlcContent.replace(/\{\{PROJECT_ID\}\}/g,      () => projectId);
    if (statusFieldId) pdlcContent = pdlcContent.replace(/\{\{STATUS_FIELD_ID\}\}/g, () => statusFieldId);
    pdlcContent = pdlcContent.replace(/\{\{REPO_OWNER\}\}/g, () => repoOwner);
    pdlcContent = pdlcContent.replace(/\{\{REPO_NAME\}\}/g,  () => repoName);
    if (Object.keys(optionMap).length > 0) {
      pdlcContent = pdlcContent.replace(/\{\{ID_IDEA\}\}/g,                () => optionMap['💡 Idea - No move to Exploration directly'] || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_EXPLORATION\}\}/g,         () => optionMap['🔍 Exploration']         || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_BRAINSTORMING\}\}/g,       () => optionMap['🧠 Brainstorming']       || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_DETAIL\}\}/g,              () => optionMap['📐 Detail Solution']     || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_APPROVAL\}\}/g,            () => optionMap['✅ Approval']            || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_DEVELOPMENT\}\}/g,         () => optionMap['⚙️ Development']        || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_TESTING\}\}/g,             () => optionMap['🧪 Testing']             || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_CODE_REVIEW_PR\}\}/g,      () => optionMap['👁 Code Review / PR']   || 'MISSING_ID');
      pdlcContent = pdlcContent.replace(/\{\{ID_READY_FOR_PRODUCTION\}\}/g,() => optionMap['🚀 Ready for Production']|| 'MISSING_ID');
    }
    fs.writeFileSync(pdlcDest, pdlcContent);
    if (projectId && statusFieldId && Object.keys(optionMap).length > 0) {
      console.log(`${i18n.pdlc_prefilled}`);
    } else {
      console.log(`${yellow}⚠️  pdlc.md copied — Project IDs not filled (board creation failed). Re-run after fixing token.${reset}`);
    }
  }

  // project-automation.yml — substitute IDs
  const paPath = path.join(destTemplates, '.github', 'workflows', 'project-automation.yml');
  if (fs.existsSync(paPath) && Object.keys(optionMap).length > 0) {
    let wfContent = fs.readFileSync(paPath, 'utf8');
    if (statusFieldId) wfContent = wfContent.replace(/\{\{STATUS_FIELD_ID\}\}/g, () => statusFieldId);
    wfContent = wfContent.replace(/\{\{ID_IDEA\}\}/g,                () => optionMap['💡 Idea - No move to Exploration directly'] || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_EXPLORATION\}\}/g,         () => optionMap['🔍 Exploration']         || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_BRAINSTORMING\}\}/g,       () => optionMap['🧠 Brainstorming']       || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_DETAILING\}\}/g,           () => optionMap['📐 Detail Solution']     || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_APPROVAL\}\}/g,            () => optionMap['✅ Approval']            || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_DEVELOPMENT\}\}/g,         () => optionMap['⚙️ Development']        || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_TESTING\}\}/g,             () => optionMap['🧪 Testing']             || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_CODE_REVIEW_PR\}\}/g,      () => optionMap['👁 Code Review / PR']   || 'MISSING_ID');
    wfContent = wfContent.replace(/\{\{ID_PRODUCTION\}\}/g,          () => optionMap['🚀 Ready for Production']|| 'MISSING_ID');
    fs.writeFileSync(paPath, wfContent);
  }

  console.log(`${i18n.templates_copied}`);
}

function writeCliContext(targetDir, profile, data) {
  try {
    const contextPath = path.join(targetDir, '.agentic-pdlc', 'cli-context.json');
    fs.mkdirSync(path.join(targetDir, '.agentic-pdlc'), { recursive: true });
    fs.writeFileSync(contextPath, JSON.stringify({ profile, ...data }, null, 2));
  } catch (_) {
    // Non-fatal — agent will ask for the values instead
  }
}

// ─── runFullSetup ─────────────────────────────────────────────────────────────

async function runFullSetup() {
  await checkGhAuth();
  await checkAndRefreshProjectScope();

  const agentAnswer = await askQuestion(i18n.ask_agent);
  const agent = agentAnswer.trim().toLowerCase();
  if (!['claude', 'cursor', 'copilot'].includes(agent)) {
    console.log(t(`ℹ️ Generating Universal Setup for '${agent}' (Compatible with any Markdown-reading agent).`, `ℹ️ Gerando Setup Universal para '${agent}' (Compatível com qualquer agente que leia Markdown).`, `ℹ️ Generando Setup Universal para '${agent}' (Compatible con cualquier agente que lea Markdown).`));
  }

  let repoOwner, repoName, repo;
  while (true) {
    let repoUrl = (await askQuestion(i18n.ask_repo)).trim();
    if (repoUrl.endsWith('/')) repoUrl = repoUrl.slice(0, -1);
    if (repoUrl.endsWith('.git')) repoUrl = repoUrl.slice(0, -4);
    const repoParts = repoUrl.split('/');
    if (repoParts.length >= 2) {
      repoOwner = repoParts[repoParts.length - 2];
      repoName = repoParts[repoParts.length - 1];
      repo = `${repoOwner}/${repoName}`;
      break;
    }
    console.log(`${red}${i18n.invalid_repo}${reset}`);
  }

  const askProjectName = t(`What is the project name for the board? (default: ${repoName.toUpperCase()}): `, `Qual o nome do projeto em que o board será configurado? (padrão: ${repoName.toUpperCase()}): `, `¿Cuál es el nombre del proyecto en el que se configurará el board? (por defecto: ${repoName.toUpperCase()}): `);
  const projectNameAnswer = await askQuestion(askProjectName);
  const projectName = projectNameAnswer.trim() ? projectNameAnswer.trim().toUpperCase() : repoName.toUpperCase();
  const boardName = `BOARD - ${projectName}`;

  let isOrg = false;
  try {
    const ownerType = execFileSync('gh', ['api', `repos/${repo}`, '--jq', '.owner.type'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    isOrg = ownerType === 'Organization';
  } catch (err) {
    const accountTypeAnswer = await askQuestion(i18n.ask_org);
    isOrg = accountTypeAnswer.trim().toLowerCase() === 'org' || accountTypeAnswer.trim().toLowerCase() === 'organization';
  }

  console.log(`\n${yellow}${i18n.starting_setup}${reset}`);

  // Labels
  const labels = PDLC_LABELS;

  console.log(`\n${cyan}${i18n.creating_labels}${reset}`);
  for (const label of labels) {
    try {
      execFileSync('gh', ['label', 'create', label.name, '--color', label.color, '--description', label.description, '--repo', repo, '--force'], { stdio: 'ignore' });
      console.log(`  ${i18n.label_ok}${label.name}`);
    } catch (err) {
      console.log(`  ${i18n.label_warn}${label.name}`);
    }
  }

  const defaultLabels = [
    'bug', 'documentation', 'duplicate', 'enhancement',
    'good first issue', 'help wanted', 'invalid', 'question', 'wontfix'
  ];
  for (const label of defaultLabels) {
    try {
      execFileSync('gh', ['label', 'delete', label, '--repo', repo, '--yes'], { stdio: 'ignore' });
    } catch (_) {}
  }

  // Project V2
  console.log(`\n${cyan}${i18n.creating_project}${reset}`);
  let ownerId, projectId, projectNumber;
  try {
    if (isOrg) {
      const orgOutput = execFileSync('gh', ['api', 'graphql', '-f', 'query=query($login: String!) { organization(login: $login) { id } }', '-f', `login=${repoOwner}`, '--jq', '.data.organization.id'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
      ownerId = orgOutput;
    } else {
      const userOutput = execFileSync('gh', ['api', 'graphql', '-f', 'query={ viewer { id } }', '--jq', '.data.viewer.id'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
      ownerId = userOutput;
    }

    const projectCreateRaw = execFileSync('gh', ['api', 'graphql', '-f', 'query=mutation($owner: ID!, $title: String!) { createProjectV2(input: {ownerId: $owner, title: $title}) { projectV2 { id number } } }', '-f', `owner=${ownerId}`, '-f', `title=${boardName}`], { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    const projectCreateResponse = projectCreateRaw ? JSON.parse(projectCreateRaw) : null;
    if (projectCreateResponse?.errors) {
      throw new Error(projectCreateResponse.errors.map(e => e.message).join('; '));
    }
    const projectCreateData = projectCreateResponse?.data?.createProjectV2?.projectV2;
    projectId = projectCreateData?.id;
    projectNumber = projectCreateData?.number;

    console.log(`  ${i18n.project_ok}${projectId})`);

    try {
      const repoNodeId = execFileSync('gh', ['api', `repos/${repo}`, '--jq', '.node_id'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      execFileSync('gh', ['api', 'graphql', '-f', `query=mutation($projectId: ID!, $repositoryId: ID!) { linkProjectV2ToRepository(input: {projectId: $projectId, repositoryId: $repositoryId}) { repository { name } } }`, '-f', `projectId=${projectId}`, '-f', `repositoryId=${repoNodeId}`], { stdio: 'ignore' });
      console.log(`  ${i18n.link_project_ok}`);
    } catch (err) {
      console.log(`  ${i18n.link_project_warn}`);
    }

  } catch (err) {
    const isScopeError = (err.message || '').includes("required scopes") || (err.stderr || '').toString().includes("required scopes");
    if (isScopeError) {
      console.log(`  ${red}❌ Token missing 'project' scope.${reset}`);
      console.log(`  ${yellow}Fix: gh auth refresh -s project${reset}`);
      console.log(`  ${yellow}Then re-run: npx create-agentic-pdlc${reset}`);
    } else {
      console.log(`  ${i18n.project_err}${err.message}`);
    }
  }

  let statusFieldId;
  let optionMap = {};

  if (projectId) {
    console.log(`  ${cyan}${i18n.config_columns}${reset}`);
    try {
      const fieldsOutput = execFileSync('gh', ['api', 'graphql', '-f', 'query=query($projectId: ID!) { node(id: $projectId) { ... on ProjectV2 { fields(first: 20) { nodes { ... on ProjectV2SingleSelectField { id name } } } } } }', '-f', `projectId=${projectId}`, '--jq', '.data.node.fields.nodes[] | select(.name == "Status") | .id']).toString().trim();
      statusFieldId = fieldsOutput;

      if (statusFieldId) {
        const columns = [
          { name: "💡 Idea - No move to Exploration directly", description: "Just tell your agent to work on issue #XX", color: "GRAY" },
          { name: "🔍 Exploration", description: "AI is analyzing code and context", color: "PURPLE" },
          { name: "🧠 Brainstorming", description: "AI proposed approaches and trade-offs", color: "PINK" },
          { name: "📐 Detail Solution", description: "AI is writing the technical spec", color: "BLUE" },
          { name: "✅ Approval", description: "Spec ready, awaiting `spec:approved` label", color: "GREEN" },
          { name: "⚙️ Development", description: "AI implementing the spec", color: "ORANGE" },
          { name: "🧪 Testing", description: "QA testing and CI pipeline checks", color: "RED" },
          { name: "👁 Code Review / PR", description: "PR opened, awaiting your review", color: "YELLOW" },
          { name: "🚀 Ready for Production", description: "Merged and ready for production", color: "GREEN" }
        ];

        const updateFieldQuery = `mutation($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]) {
          updateProjectV2Field(input: {
            fieldId: $fieldId,
            singleSelectOptions: $options
          }) {
            projectV2Field {
              ... on ProjectV2SingleSelectField {
                options { id name }
              }
            }
          }
        }`;

        const queryPayload = JSON.stringify({
          query: updateFieldQuery,
          variables: {
            fieldId: statusFieldId,
            options: columns
          }
        });

        const updateOutput = execFileSync('gh', ['api', 'graphql', '--input', '-'], { input: queryPayload }).toString().trim();
        const jsonResponse = updateOutput ? JSON.parse(updateOutput) : null;
        const returnedOptions = jsonResponse?.data?.updateProjectV2Field?.projectV2Field?.options ||
                                jsonResponse?.data?.updateProjectV2SingleSelectField?.projectV2SingleSelectField?.options || [];

        for (const opt of returnedOptions) {
          optionMap[opt.name] = opt.id;
        }

        console.log(`  ${i18n.columns_ok}`);
      }
    } catch (err) {
      console.log(`  ${i18n.columns_warn}`);
    }
  }

  // Auto-provision PROJECT_TOKEN for personal repos
  let patAutoSet = false;
  if (projectId && !isOrg) {
    try {
      const tokenOut = execFileSync('gh', ['auth', 'token'], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
      if (tokenOut) {
        execFileSync('gh', ['secret', 'set', 'PROJECT_TOKEN', '--body', tokenOut, '--repo', repo], { stdio: ['ignore', 'pipe', 'pipe'] });
        patAutoSet = true;
        console.log(`\n${green}✅ PROJECT_TOKEN secret set automatically (uses your gh OAuth token).${reset}`);
      }
    } catch (err) {
      console.log(`\n${yellow}⚠️  Could not auto-set PROJECT_TOKEN. Agent will guide manual setup.${reset}`);
    }
  } else if (projectId && isOrg) {
    console.log(`\n${yellow}ℹ️  Org repo detected — PROJECT_TOKEN will require manual setup for security.${reset}`);
  }

  // Set PROJECT_ID as GitHub Actions Variable
  if (projectId) {
    try {
      setActionsVariable(repo, 'PROJECT_ID', projectId);
      console.log(`${green}${i18n.vars_project_id_ok}${reset}`);
    } catch (_) {
      console.log(`${yellow}${i18n.vars_project_id_warn}${projectId}${reset}`);
    }
  }

  await setBranchProtection(repo, ['PDLC Stage Gate', 'QA Gate']);

  console.log(`\n${yellow}${i18n.scaffolding}${reset}`);
  scaffoldFullTemplates(sourceDir, targetDir, projectId, statusFieldId, optionMap, repoOwner, repoName);

  // Write CLI context for the agent to consume in Setup Mode
  const boardUrl = projectNumber ? buildBoardUrl(repoOwner, projectNumber, isOrg) : null;
  writeCliContext(targetDir, 'full', {
    projectName,
    repoOwner,
    repoName,
    projectNumber,
    isOrg,
    boardUrl,
    patAutoSet
  });

  installHook(sourceDir, targetDir);

  copyAdapterFiles(agent, sourceDir, targetDir);

  rl.close();
}

// ─── Update Mode helpers ──────────────────────────────────────────────────────

function detectAgentState(dir) {
  const state = { jules: false, julesHandle: null, qaAgent: false, sentinel: false };

  const atPath = path.join(dir, '.github', 'workflows', 'agent-trigger.yml');
  if (fs.existsSync(atPath)) {
    const content = fs.readFileSync(atPath, 'utf8');
    if (!content.includes('{{AGENT_HANDLE}}') && !content.includes('{{IMPLEMENTATION_AGENT_LABEL}}')) {
      const match = content.match(/(@[\w-]+)/);
      if (match) { state.jules = true; state.julesHandle = match[1]; }
    }
  }

  const paPath = path.join(dir, '.github', 'workflows', 'project-automation.yml');
  if (fs.existsSync(paPath)) {
    const content = fs.readFileSync(paPath, 'utf8');
    state.qaAgent   = /^  move-card-on-qa-pass:/m.test(content);
    state.sentinel  = /^  move-violation-to-board:/m.test(content);
  }

  return state;
}

function uncommentYamlJob(content, jobCommentedLine) {
  if (!content.includes(jobCommentedLine)) return content;
  const lines = content.split('\n');
  const output = [];
  let state = 'before';

  for (const line of lines) {
    if (state === 'before') {
      if (line === jobCommentedLine) {
        state = 'in-job';
        output.push(line.replace(/^(\s{2})# ?/, '$1'));
      } else if (/^\s{2}# (OPTIONAL:|When )/.test(line)) {
        state = 'in-preamble';
      } else {
        output.push(line);
      }
    } else if (state === 'in-preamble') {
      if (line === jobCommentedLine) {
        state = 'in-job';
        output.push(line.replace(/^(\s{2})# ?/, '$1'));
      }
    } else if (state === 'in-job') {
      if (/^\s{2}#/.test(line)) {
        output.push(line.replace(/^(\s{2})# ?/, '$1'));
      } else {
        state = 'after';
        output.push(line);
      }
    } else {
      output.push(line);
    }
  }

  return output.join('\n');
}

function activateQaAgent(paPath) {
  let content = fs.readFileSync(paPath, 'utf8');
  content = uncommentYamlJob(content, '  # move-card-on-qa-pass:');

  // Change STATUS_CODE_REVIEW_PR → STATUS_TESTING in move-card-on-pr-open only
  const variantBIdx = content.indexOf('# 💡 VARIANT B');
  if (variantBIdx !== -1) {
    const before = content.slice(0, variantBIdx);
    const after = content.slice(variantBIdx).replace('process.env.STATUS_CODE_REVIEW_PR', () => 'process.env.STATUS_TESTING');
    content = before + after;
  }

  fs.writeFileSync(paPath, content, 'utf8');
}

function activateSentinel(paPath) {
  let content = fs.readFileSync(paPath, 'utf8');
  content = uncommentYamlJob(content, '  # move-violation-to-board:');
  fs.writeFileSync(paPath, content, 'utf8');
}

function configureJules(atPath, handle, label) {
  let content = fs.readFileSync(atPath, 'utf8');
  const name = handle.replace('@', '');
  content = content.replace(/\{\{IMPLEMENTATION_AGENT_NAME\}\}/g, () => name);
  content = content.replace(/\{\{IMPLEMENTATION_AGENT_LABEL\}\}/g, () => label);
  content = content.replace(/\{\{AGENT_HANDLE\}\}/g, () => handle);
  fs.writeFileSync(atPath, content, 'utf8');
}

async function runUpdate() {
  const contextPath = path.join(targetDir, '.agentic-pdlc', 'cli-context.json');
  if (!fs.existsSync(contextPath)) {
    console.error(`\n${red}${i18n.update_no_context}${reset}\n`);
    rl.close();
    process.exit(1);
  }

  const ctx = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
  if ((ctx.profile || 'full') === 'lite') {
    console.log(`\n${yellow}⚠️  Lite install detected. Run --upgrade-to-agentic to add the full board machine first.${reset}\n`);
    rl.close();
    return;
  }

  const state = detectAgentState(targetDir);
  const sep = '─'.repeat(55);

  console.log(`\n${cyan}${sep}${reset}`);
  console.log(`${cyan}  ${i18n.update_title}${reset}`);
  console.log(`${cyan}${sep}${reset}\n`);

  const julesSuffix = state.julesHandle ? ` (${state.julesHandle})` : '';
  console.log(`  ${state.jules    ? green + '✅' : red + '❌'}  Jules${julesSuffix} — ${state.jules    ? t('configured','configurado','configurado') : t('not configured','não configurado','no configurado')}${reset}`);
  console.log(`  ${state.qaAgent  ? green + '✅' : red + '❌'}  QA Agent — ${state.qaAgent  ? t('active (Variant B)','ativo (Variant B)','activo (Variant B)') : t('not active (Variant A)','não ativo (Variant A)','no activo (Variant A)')}${reset}`);
  console.log(`  ${state.sentinel ? green + '✅' : red + '❌'}  Sentinel — ${state.sentinel ? t('active','ativo','activo') : t('not configured','não configurado','no configurado')}${reset}`);

  if (state.jules && state.qaAgent && state.sentinel) {
    console.log(`\n${green}${i18n.update_all_ok}${reset}\n`);
    rl.close();
    return;
  }

  console.log(`\n${cyan}${sep}${reset}`);
  const configureAnswer = await askQuestion(i18n.update_ask_configure);
  const shouldConfigure = !['n', 'no', 'não', 'nao'].includes(configureAnswer.trim().toLowerCase());

  if (!shouldConfigure) {
    console.log(`\n${i18n.update_skipped}\n`);
    rl.close();
    return;
  }

  const repo = ctx.repoOwner && ctx.repoName ? `${ctx.repoOwner}/${ctx.repoName}` : null;
  if (!repo) {
    console.warn(`${yellow}${i18n.repo_context_missing}${reset}`);
  }
  const paPath = path.join(targetDir, '.github', 'workflows', 'project-automation.yml');
  const atPath = path.join(targetDir, '.github', 'workflows', 'agent-trigger.yml');
  const results = [];

  if (!state.jules && fs.existsSync(atPath)) {
    console.log(`\n${cyan}${i18n.update_jules_header}${reset}`);
    const choice = (await askQuestion(i18n.update_jules_ask)).trim().toLowerCase();
    if (choice === 'a' || choice === '') {
      if (repo) createLabelsForRepo(JULES_LABELS, repo);
      configureJules(atPath, '@google-labs-jules', 'jules');
      results.push(t('✅  Jules configured (@google-labs-jules)', '✅  Jules configurado (@google-labs-jules)', '✅  Jules configurado (@google-labs-jules)'));
    } else if (choice === 'b') {
      const handle = (await askQuestion(i18n.update_jules_ask_handle)).trim();
      const labelName = handle.replace('@', '').toLowerCase();
      if (repo) createLabelsForRepo([{ name: labelName, color: '5319e7', description: `${handle} AI Agent` }], repo);
      configureJules(atPath, handle, labelName);
      results.push(t(`✅  Agent configured (${handle})`, `✅  Agente configurado (${handle})`, `✅  Agente configurado (${handle})`));
    } else {
      results.push(t('⏭  Jules — skipped', '⏭  Jules — pulado', '⏭  Jules — omitido'));
    }
  }

  if (!state.qaAgent && fs.existsSync(paPath)) {
    console.log(`\n${cyan}${i18n.update_qa_header}${reset}`);
    const answer = (await askQuestion(i18n.update_qa_ask)).trim().toLowerCase();
    if (!['n', 'no', 'não', 'nao'].includes(answer)) {
      if (repo) createLabelsForRepo(QA_LABELS, repo);
      activateQaAgent(paPath);
      results.push(t(
        '✅  QA Agent configured — Variant B activated (uses GITHUB_TOKEN, no extra secrets needed)',
        '✅  QA Agent configurado — Variant B ativado (usa GITHUB_TOKEN, nenhum secret extra necessário)',
        '✅  QA Agent configurado — Variant B activado (usa GITHUB_TOKEN, sin secrets adicionales)'
      ));
    } else {
      results.push(t('⏭  QA Agent — skipped', '⏭  QA Agent — pulado', '⏭  QA Agent — omitido'));
    }
  }

  if (!state.sentinel && fs.existsSync(paPath)) {
    console.log(`\n${cyan}${i18n.update_sentinel_header}${reset}`);
    const answer = (await askQuestion(i18n.update_sentinel_ask)).trim().toLowerCase();
    if (!['n', 'no', 'não', 'nao'].includes(answer)) {
      activateSentinel(paPath);
      results.push(t('✅  Sentinel configured', '✅  Sentinel configurado', '✅  Sentinel configurado'));
    } else {
      results.push(t('⏭  Sentinel — skipped', '⏭  Sentinel — pulado', '⏭  Sentinel — omitido'));
    }
  }

  // Upgrade lite → full agentic profile (extend CLAUDE.md, do not replace)
  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  const fullClaudeSrc = path.join(sourceDir, 'templates', 'full', 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath) && fs.existsSync(fullClaudeSrc)) {
    const existing = fs.readFileSync(claudeMdPath, 'utf8');
    if (!existing.includes('<!-- agentic-full -->')) {
      console.log(`\n${cyan}— Agentic Profile Upgrade —${reset}`);
      const upgradeAnswer = (await askQuestion('  Extend CLAUDE.md with the full multi-agent pipeline rulebook? (Y/n): ')).trim().toLowerCase();
      if (!['n', 'no', 'não', 'nao'].includes(upgradeAnswer)) {
        const extension = fs.readFileSync(fullClaudeSrc, 'utf8');
        fs.writeFileSync(claudeMdPath, existing.trimEnd() + '\n\n' + extension + '\n');
        results.push('✅  CLAUDE.md extended with full agentic profile');
      } else {
        results.push('⏭  Agentic profile upgrade — skipped');
      }
    }
  }

  console.log(`\n${cyan}${sep}${reset}`);
  for (const r of results) console.log(`  ${r}`);
  console.log(`${cyan}${sep}${reset}\n`);

  rl.close();
}

// ─── resolveMode ──────────────────────────────────────────────────────────────

function resolveMode(args) {
  if (args.includes('--update'))             return 'update';
  if (args.includes('--upgrade-to-agentic')) return 'upgrade';
  if (args.includes('--agentic'))            return 'full';
  return 'lite';
}

// Export for testing
if (typeof module !== 'undefined') module.exports = { resolveMode, setActionsVariable, scaffoldLiteTemplates, scaffoldFullTemplates };

// ─── runLiteSetup ─────────────────────────────────────────────────────────────

async function runLiteSetup() {
  await checkGhAuth();

  const agentAnswer = await askQuestion(i18n.ask_agent);
  const agent = agentAnswer.trim().toLowerCase();
  if (!['claude', 'cursor', 'copilot'].includes(agent)) {
    console.log(t(
      `ℹ️ Generating Universal Setup for '${agent}' (Compatible with any Markdown-reading agent).`,
      `ℹ️ Gerando Setup Universal para '${agent}' (Compatível com qualquer agente que leia Markdown).`,
      `ℹ️ Generando Setup Universal para '${agent}' (Compatible con cualquier agente que lea Markdown).`
    ));
  }

  let repoOwner, repoName, repo;
  while (true) {
    let repoUrl = (await askQuestion(i18n.ask_repo)).trim();
    if (repoUrl.endsWith('/'))    repoUrl = repoUrl.slice(0, -1);
    if (repoUrl.endsWith('.git')) repoUrl = repoUrl.slice(0, -4);
    const repoParts = repoUrl.split('/');
    if (repoParts.length >= 2) {
      repoOwner = repoParts[repoParts.length - 2];
      repoName  = repoParts[repoParts.length - 1];
      repo      = `${repoOwner}/${repoName}`;
      break;
    }
    console.log(`${red}${i18n.invalid_repo}${reset}`);
  }

  let isOrg = false;
  try {
    const ownerType = execFileSync('gh', ['api', `repos/${repo}`, '--jq', '.owner.type'],
      { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    isOrg = ownerType === 'Organization';
  } catch (_) {}

  console.log(`\n${yellow}${i18n.starting_setup}${reset}`);

  installHook(sourceDir, targetDir);

  console.log(`\n${yellow}${i18n.scaffolding}${reset}`);
  scaffoldLiteTemplates(sourceDir, targetDir);
  console.log(`${i18n.templates_copied}`);

  await setBranchProtection(repo, ['PDLC Stage Gate']);

  writeCliContext(targetDir, 'lite', {
    repoOwner,
    repoName,
    projectNumber: null,
    isOrg,
    boardUrl: null,
    patAutoSet: false
  });

  copyAdapterFiles(agent, sourceDir, targetDir);
  console.log(`${cyan}${i18n.upgrade_hint}${reset}`);

  rl.close();
}

async function runUpgradeToAgentic() {
  const contextPath = path.join(targetDir, '.agentic-pdlc', 'cli-context.json');
  if (!fs.existsSync(contextPath)) {
    console.error(`\n${red}${i18n.update_no_context}${reset}\n`);
    rl.close();
    process.exit(1);
  }

  const ctx = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
  if ((ctx.profile || 'full') === 'full') {
    console.log(`\n${green}✅ Already running full profile. Nothing to upgrade.${reset}\n`);
    rl.close();
    return;
  }

  await checkGhAuth();
  await checkAndRefreshProjectScope();

  const { repoOwner, repoName } = ctx;
  const repo = `${repoOwner}/${repoName}`;

  const askProjectName = t(
    `What is the project name for the board? (default: ${repoName.toUpperCase()}): `,
    `Qual o nome do projeto em que o board será configurado? (padrão: ${repoName.toUpperCase()}): `,
    `¿Cuál es el nombre del proyecto en el que se configurará el board? (por defecto: ${repoName.toUpperCase()}): `
  );
  const projectNameAnswer = await askQuestion(askProjectName);
  const projectName = projectNameAnswer.trim() ? projectNameAnswer.trim().toUpperCase() : repoName.toUpperCase();
  const boardName   = `BOARD - ${projectName}`;

  let isOrg = ctx.isOrg || false;
  try {
    const ownerType = execFileSync('gh', ['api', `repos/${repo}`, '--jq', '.owner.type'],
      { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    isOrg = ownerType === 'Organization';
  } catch (_) {}

  console.log(`\n${yellow}${i18n.starting_setup}${reset}`);

  // Labels
  const labels = PDLC_LABELS;

  console.log(`\n${cyan}${i18n.creating_labels}${reset}`);
  for (const label of labels) {
    try {
      execFileSync('gh', ['label', 'create', label.name, '--color', label.color, '--description', label.description, '--repo', repo, '--force'], { stdio: 'ignore' });
      console.log(`  ${i18n.label_ok}${label.name}`);
    } catch (err) {
      console.log(`  ${i18n.label_warn}${label.name}`);
    }
  }

  // Board
  console.log(`\n${cyan}${i18n.creating_project}${reset}`);
  let ownerId, projectId, projectNumber;
  try {
    if (isOrg) {
      ownerId = execFileSync('gh', ['api', 'graphql', '-f', 'query=query($login: String!) { organization(login: $login) { id } }', '-f', `login=${repoOwner}`, '--jq', '.data.organization.id'],
        { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    } else {
      ownerId = execFileSync('gh', ['api', 'graphql', '-f', 'query={ viewer { id } }', '--jq', '.data.viewer.id'],
        { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    }

    const raw = execFileSync('gh', ['api', 'graphql', '-f',
      'query=mutation($owner: ID!, $title: String!) { createProjectV2(input: {ownerId: $owner, title: $title}) { projectV2 { id number } } }',
      '-f', `owner=${ownerId}`, '-f', `title=${boardName}`],
      { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    const resp = raw ? JSON.parse(raw) : null;
    if (resp?.errors) throw new Error(resp.errors.map(e => e.message).join('; '));
    const pData = resp?.data?.createProjectV2?.projectV2;
    projectId     = pData?.id;
    projectNumber = pData?.number;
    console.log(`  ${i18n.project_ok}${projectId})`);

    try {
      const repoNodeId = execFileSync('gh', ['api', `repos/${repo}`, '--jq', '.node_id'],
        { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      execFileSync('gh', ['api', 'graphql', '-f',
        'query=mutation($projectId: ID!, $repositoryId: ID!) { linkProjectV2ToRepository(input: {projectId: $projectId, repositoryId: $repositoryId}) { repository { name } } }',
        '-f', `projectId=${projectId}`, '-f', `repositoryId=${repoNodeId}`],
        { stdio: 'ignore' });
      console.log(`  ${i18n.link_project_ok}`);
    } catch (_) {
      console.log(`  ${i18n.link_project_warn}`);
    }
  } catch (err) {
    console.log(`  ${i18n.project_err}${err.message}`);
  }

  let statusFieldId;
  let optionMap = {};

  if (projectId) {
    console.log(`  ${cyan}${i18n.config_columns}${reset}`);
    try {
      statusFieldId = execFileSync('gh', ['api', 'graphql', '-f',
        'query=query($projectId: ID!) { node(id: $projectId) { ... on ProjectV2 { fields(first: 20) { nodes { ... on ProjectV2SingleSelectField { id name } } } } } }',
        '-f', `projectId=${projectId}`, '--jq', '.data.node.fields.nodes[] | select(.name == "Status") | .id'
      ]).toString().trim();

      if (statusFieldId) {
        const columns = [
          { name: '💡 Idea - No move to Exploration directly', description: 'Just tell your agent to work on issue #XX', color: 'GRAY' },
          { name: '🔍 Exploration',     description: 'AI is analyzing code and context',            color: 'PURPLE' },
          { name: '🧠 Brainstorming',   description: 'AI proposed approaches and trade-offs',       color: 'PINK'   },
          { name: '📐 Detail Solution', description: 'AI is writing the technical spec',            color: 'BLUE'   },
          { name: '✅ Approval',        description: 'Spec ready, awaiting `spec:approved` label',  color: 'GREEN'  },
          { name: '⚙️ Development',    description: 'AI implementing the spec',                    color: 'ORANGE' },
          { name: '🧪 Testing',         description: 'QA testing and CI pipeline checks',           color: 'RED'    },
          { name: '👁 Code Review / PR',description: 'PR opened, awaiting your review',             color: 'YELLOW' },
          { name: '🚀 Ready for Production', description: 'Merged and ready for production',        color: 'GREEN'  }
        ];

        const queryPayload = JSON.stringify({
          query: `mutation($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]) {
            updateProjectV2Field(input: { fieldId: $fieldId, singleSelectOptions: $options }) {
              projectV2Field { ... on ProjectV2SingleSelectField { options { id name } } }
            }
          }`,
          variables: { fieldId: statusFieldId, options: columns }
        });

        const updateOutput = execFileSync('gh', ['api', 'graphql', '--input', '-'],
          { input: queryPayload }).toString().trim();
        const jsonResponse = updateOutput ? JSON.parse(updateOutput) : null;
        const returnedOptions = jsonResponse?.data?.updateProjectV2Field?.projectV2Field?.options || [];
        for (const opt of returnedOptions) optionMap[opt.name] = opt.id;
        console.log(`  ${i18n.columns_ok}`);
      }
    } catch (_) {
      console.log(`  ${i18n.columns_warn}`);
    }
  }

  // Auto-provision PROJECT_TOKEN for personal repos
  let patAutoSet = false;
  if (projectId && !isOrg) {
    try {
      const tokenOut = execFileSync('gh', ['auth', 'token'],
        { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
      if (tokenOut) {
        execFileSync('gh', ['secret', 'set', 'PROJECT_TOKEN', '--body', tokenOut, '--repo', repo],
          { stdio: ['ignore', 'pipe', 'pipe'] });
        patAutoSet = true;
        console.log(`\n${green}✅ PROJECT_TOKEN secret set automatically (uses your gh OAuth token).${reset}`);
      }
    } catch (_) {
      console.log(`\n${yellow}⚠️  Could not auto-set PROJECT_TOKEN. Agent will guide manual setup.${reset}`);
    }
  }

  // Set PROJECT_ID as GitHub Actions Variable
  if (projectId) {
    try {
      setActionsVariable(repo, 'PROJECT_ID', projectId);
      console.log(`${green}${i18n.vars_project_id_ok}${reset}`);
    } catch (_) {
      console.log(`${yellow}${i18n.vars_project_id_warn}${projectId}${reset}`);
    }
  }

  console.log(`\n${yellow}${i18n.scaffolding}${reset}`);
  scaffoldFullTemplates(sourceDir, targetDir, projectId, statusFieldId, optionMap, repoOwner, repoName);

  await setBranchProtection(repo, ['PDLC Stage Gate', 'QA Gate']);

  const boardUrl = projectNumber ? buildBoardUrl(repoOwner, projectNumber, isOrg) : null;
  writeCliContext(targetDir, 'full', {
    projectName,
    repoOwner,
    repoName,
    projectNumber,
    isOrg,
    boardUrl,
    patAutoSet
  });

  const line1 = t('🎉 Upgrade complete! Board:', '🎉 Upgrade concluído! Board:', '🎉 ¡Actualización completada! Board:');
  console.log(`\n${green}${line1} ${boardUrl || '(board creation failed)'}${reset}\n`);

  rl.close();
}

// ─── Entry point ──────────────────────────────────────────────────────────────

if (require.main === module) {
  console.log(`${cyan}================================================================${reset}`);
  console.log(`${cyan}${i18n.welcome}${reset}`);
  console.log(`${cyan}================================================================${reset}\n`);

  const args = process.argv.slice(2);
  const mode = resolveMode(args);

  const handler =
    mode === 'update'  ? runUpdate :
    mode === 'upgrade' ? runUpgradeToAgentic :
    mode === 'full'    ? runFullSetup :
                         runLiteSetup;

  handler().catch(err => { console.error(err.message); rl.close(); process.exit(1); });
}
