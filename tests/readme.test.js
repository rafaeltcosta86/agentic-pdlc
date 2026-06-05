const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const readmePath = path.join(__dirname, '..', 'README.md');
const readme = fs.readFileSync(readmePath, 'utf8');

describe('README.md title', () => {
  it('uses "Agentic PDLC" as the top-level heading', () => {
    assert.ok(readme.includes('# 🤖 Agentic PDLC'), 'Expected heading "# 🤖 Agentic PDLC"');
  });

  it('does not use old title "Agentic PDLC Framework"', () => {
    assert.ok(
      !readme.includes('# 🤖 Agentic PDLC Framework'),
      'Old title "Agentic PDLC Framework" must not appear'
    );
  });
});

describe('README.md taglines', () => {
  it('contains the "add code you didn\'t ask for" tagline', () => {
    assert.ok(
      readme.includes("Does your AI agent add code you didn't ask for?"),
      'Expected new tagline about adding unwanted code'
    );
  });

  it('contains the "skip the spec and jump straight to a PR" tagline', () => {
    assert.ok(
      readme.includes('Does it skip the spec and jump straight to a PR?'),
      'Expected new tagline about skipping the spec'
    );
  });

  it('contains the "ignore the rules in your CLAUDE.md" tagline', () => {
    assert.ok(
      readme.includes('Does it ignore the rules in your CLAUDE.md?'),
      'Expected new tagline about ignoring CLAUDE.md rules'
    );
  });

  it('does not contain old tagline about shared rulebook', () => {
    assert.ok(
      !readme.includes("Do your AI agents build features that don't match the spec?"),
      'Old tagline must not appear'
    );
  });
});

describe('README.md "Two modes" section', () => {
  it('contains the "Two modes — pick yours" heading', () => {
    assert.ok(
      readme.includes('## Two modes — pick yours'),
      'Expected "Two modes — pick yours" section heading'
    );
  });

  it('describes lite mode as the default brake', () => {
    assert.ok(
      readme.includes('`lite` (default) — the brake'),
      'Expected lite mode described as "the brake"'
    );
  });

  it('describes --agentic mode as "see your whole pipeline"', () => {
    assert.ok(
      readme.includes('`--agentic` — see your whole pipeline'),
      'Expected --agentic mode described as "see your whole pipeline"'
    );
  });

  it('lite mode description mentions spec approval before PR', () => {
    assert.ok(
      readme.includes("It won't open a PR before the spec is approved"),
      'Expected mention that PR cannot be opened before spec approval'
    );
  });

  it('--agentic mode description mentions Idea to Production pipeline', () => {
    assert.ok(
      readme.includes('Idea → Production'),
      'Expected Idea → Production pipeline reference in --agentic description'
    );
  });
});

describe('README.md "Why it works" section', () => {
  it('contains "A brake the agent can\'t ignore" bullet', () => {
    assert.ok(
      readme.includes("A brake the agent can't ignore"),
      'Expected "A brake the agent can\'t ignore" bullet point'
    );
  });

  it('contains "Spec before code" bullet', () => {
    assert.ok(
      readme.includes('Spec before code'),
      'Expected "Spec before code" bullet point'
    );
  });

  it('contains "See your whole pipeline" bullet scoped to --agentic', () => {
    assert.ok(
      readme.includes('See your whole pipeline'),
      'Expected "See your whole pipeline" bullet point'
    );
    assert.ok(
      readme.includes("(`--agentic` only)"),
      'Expected the pipeline bullet to be scoped to --agentic only'
    );
  });

  it('does not contain old "A transparent lifecycle" bullet', () => {
    assert.ok(
      !readme.includes('A transparent lifecycle'),
      'Old "A transparent lifecycle" bullet must not appear'
    );
  });

  it('does not contain old "A board that moves itself" bullet', () => {
    assert.ok(
      !readme.includes('A board that moves itself'),
      'Old "A board that moves itself" bullet must not appear'
    );
  });
});

describe('README.md Quick Start section', () => {
  it('contains base npx command', () => {
    assert.ok(
      readme.includes('npx create-agentic-pdlc'),
      'Expected base npx command in Quick Start'
    );
  });

  it('contains --agentic flag command', () => {
    assert.ok(
      readme.includes('npx create-agentic-pdlc --agentic'),
      'Expected --agentic flag command in Quick Start'
    );
  });

  it('contains --update flag command', () => {
    assert.ok(
      readme.includes('npx create-agentic-pdlc --update'),
      'Expected --update flag command in Quick Start'
    );
  });

  it('describes lite as the default install', () => {
    assert.ok(
      readme.includes('Installs `lite` by default'),
      'Expected mention that lite is installed by default'
    );
  });

  it('does not contain old --update description about board IDs', () => {
    assert.ok(
      !readme.includes('Your existing board IDs and customizations are never touched'),
      'Old --update description must not appear'
    );
  });
});

describe('README.md "What you get" section', () => {
  it('has a lite subsection header', () => {
    assert.ok(
      readme.includes('**`lite` (default)**'),
      'Expected "lite (default)" subsection header'
    );
  });

  it('has an --agentic subsection header', () => {
    assert.ok(
      readme.includes('**`--agentic` (opt-in)**'),
      'Expected "--agentic (opt-in)" subsection header'
    );
  });

  it('lists AGENTS.md in lite deliverables', () => {
    assert.ok(
      readme.includes('**`AGENTS.md`**'),
      'Expected AGENTS.md listed in lite deliverables'
    );
  });

  it('lists CLAUDE.md in lite deliverables', () => {
    assert.ok(
      readme.includes('**`CLAUDE.md`**'),
      'Expected CLAUDE.md listed in lite deliverables'
    );
  });

  it('lists the stage gate hook in lite deliverables', () => {
    assert.ok(
      readme.includes('**`.agentic-pdlc/hooks/pdlc-stage-gate.sh`**'),
      'Expected pdlc-stage-gate.sh listed in lite deliverables'
    );
  });

  it('lists docs/pdlc.md in --agentic deliverables', () => {
    assert.ok(
      readme.includes('**`docs/pdlc.md`**'),
      'Expected docs/pdlc.md listed in --agentic deliverables'
    );
  });

  it('lists .github/workflows/ in --agentic deliverables', () => {
    assert.ok(
      readme.includes('**`.github/workflows/`**'),
      'Expected .github/workflows/ listed in --agentic deliverables'
    );
  });

  it('does not list the old docs/pdlc.md as a standalone top-level item', () => {
    // In the old README, docs/pdlc.md and .github/workflows/ were listed
    // without any mode grouping. Now they belong only to --agentic.
    const agenticIdx = readme.indexOf('**`--agentic` (opt-in)**');
    const pdlcIdx = readme.indexOf('**`docs/pdlc.md`**');
    assert.ok(agenticIdx !== -1, '--agentic section must exist');
    assert.ok(pdlcIdx > agenticIdx, 'docs/pdlc.md must appear after --agentic section header');
  });
});

describe('README.md image alt text', () => {
  it('uses updated alt text describing the upstream/downstream flow', () => {
    assert.ok(
      readme.includes(
        'alt="Agentic PDLC: Upstream idea-to-spec, gated by spec:approved, into Downstream spec-to-production"'
      ),
      'Expected updated image alt text'
    );
  });

  it('does not use old generic alt text', () => {
    assert.ok(
      !readme.includes('alt="Agentic PDLC Architecture Flow"'),
      'Old generic alt text must not appear'
    );
  });
});

describe('README.md removed sections', () => {
  it('does not contain the "How It Works" section', () => {
    assert.ok(
      !readme.includes('## 🏗️ How It Works'),
      'Old "How It Works" section must not appear'
    );
  });

  it('does not mention "You + AI: Idea → Spec" phase label', () => {
    assert.ok(
      !readme.includes('1. You + AI: Idea → Spec'),
      'Old phase label must not appear'
    );
  });

  it('does not mention "Your agents: Spec → Production" phase label', () => {
    assert.ok(
      !readme.includes('2. Your agents: Spec → Production'),
      'Old phase label must not appear'
    );
  });
});
