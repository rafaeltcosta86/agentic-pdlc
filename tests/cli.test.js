const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

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
    const execFn = (cmd, args) => { calls.push(args); };
    const { setActionsVariable } = require('../bin/cli.js');
    setActionsVariable('owner/repo', 'PROJECT_ID', 'PVT_abc', execFn);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].includes('--method'));
    assert.ok(calls[0].includes('PATCH'));
    assert.ok(calls[0].some(a => a.includes('PROJECT_ID')));
  });

  it('falls back to POST on 404', () => {
    const calls = [];
    let callCount = 0;
    const execFn = (cmd, args) => {
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
    assert.ok(calls[1].includes('POST'));
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
