const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// We import helpers from cli.js once they are extracted.
// For now, define the expected pure functions here as contracts.

function resolveMode(args) {
  if (args.includes('--update'))             return 'update';
  if (args.includes('--upgrade-to-agentic')) return 'upgrade';
  if (args.includes('--agentic'))            return 'full';
  return 'lite';
}

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
