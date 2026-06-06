const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { resolveMode } = require('../bin/cli.js');

describe('resolveMode', () => {
  it('returns lite when no flags', () => {
    assert.equal(resolveMode([]), 'lite');
  });
  it('returns full for --agentic', () => {
    assert.equal(resolveMode(['--agentic']), 'full');
  });
  it('returns update for --update', () => {
    assert.equal(resolveMode(['--update']), 'update');
  });
  it('returns upgrade for --upgrade-to-agentic', () => {
    assert.equal(resolveMode(['--upgrade-to-agentic']), 'upgrade');
  });
  it('--update takes precedence over --agentic', () => {
    assert.equal(resolveMode(['--update', '--agentic']), 'update');
  });
});

describe('buildFullClaudeContent', () => {
  it('concatenates lite and full with a newline separator', () => {
    const lite = '# Lite\ncontent';
    const full = '## Extra\nmore';
    const result = lite + '\n' + full;
    assert.ok(result.startsWith('# Lite'));
    assert.ok(result.includes('## Extra'));
  });
});

describe('setActionsVariable', () => {
  it('calls PATCH first', () => {
    const calls = [];
    const execFn = (cmd, args, _opts) => { calls.push([...args]); };
    const { setActionsVariable } = require('../bin/cli.js');
    setActionsVariable('owner/repo', 'PROJECT_ID', 'PVT_abc', execFn);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].includes('--method'));
    assert.ok(calls[0].includes('PATCH'));
    assert.ok(calls[0].some(a => a.includes('PROJECT_ID')));
    assert.ok(calls[0].some(a => a.includes('PVT_abc')));
  });

  it('falls back to POST on 404', () => {
    const calls = [];
    let callCount = 0;
    const execFn = (cmd, args, _opts) => {
      calls.push([...args]);
      callCount++;
      if (callCount === 1) {
        const err = new Error('Not Found');
        err.stderr = Buffer.from('Not Found');
        throw err;
      }
    };
    const { setActionsVariable } = require('../bin/cli.js');
    setActionsVariable('owner/repo', 'PROJECT_ID', 'PVT_abc', execFn);
    assert.equal(calls.length, 2);
    assert.ok(calls[0].includes('PATCH'));
    assert.ok(calls[0].some(a => a.includes('PVT_abc')));
    assert.ok(calls[1].includes('POST'));
    assert.ok(calls[1].some(a => a.includes('PVT_abc')));
  });

  it('throws on 403', () => {
    const execFn = () => {
      const err = new Error('Forbidden');
      err.stderr = Buffer.from('Forbidden');
      throw err;
    };
    const { setActionsVariable } = require('../bin/cli.js');
    assert.throws(
      () => setActionsVariable('owner/repo', 'PROJECT_ID', 'PVT_abc', execFn),
      /Forbidden/
    );
  });
});

describe('scaffoldLiteTemplates', () => {
  it('copies CLAUDE.md and AGENTS.md but excludes .github/workflows', () => {
    const { scaffoldLiteTemplates } = require('../bin/cli.js');
    const src = path.join(__dirname, '..');
    const tmp = path.join(os.tmpdir(), `pdlc-lite-${crypto.randomBytes(4).toString('hex')}`);
    try {
      scaffoldLiteTemplates(src, tmp);
      const base = path.join(tmp, '.agentic-pdlc', 'templates');
      assert.ok(fs.existsSync(path.join(base, 'CLAUDE.md')), 'CLAUDE.md should exist');
      assert.ok(fs.existsSync(path.join(base, 'AGENTS.md')), 'AGENTS.md should exist');
      assert.ok(!fs.existsSync(path.join(base, '.github', 'workflows')), '.github/workflows must not exist in lite');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('scaffoldFullTemplates', () => {
  it('copies .github/workflows with at least one yml file', () => {
    const { scaffoldFullTemplates } = require('../bin/cli.js');
    const src = path.join(__dirname, '..');
    const tmp = path.join(os.tmpdir(), `pdlc-full-${crypto.randomBytes(4).toString('hex')}`);
    try {
      scaffoldFullTemplates(src, tmp, null, null, {}, 'owner', 'repo');
      const wfDir = path.join(tmp, '.agentic-pdlc', 'templates', '.github', 'workflows');
      assert.ok(fs.existsSync(wfDir), '.github/workflows should exist in full');
      const ymls = fs.readdirSync(wfDir).filter(f => f.endsWith('.yml'));
      assert.ok(ymls.length > 0, 'should contain at least one .yml file');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
