import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildMockRewriteMessage,
  buildSubject,
  parseConventionalCommit,
  pickVerb,
} from './mockRewriteLogic.js';

describe('parseConventionalCommit', () => {
  it('parses scoped conventional commits', () => {
    const parsed = parseConventionalCommit('feat(auth): add login');

    assert.deepEqual(parsed, {
      type: 'feat',
      scope: 'auth',
      breaking: undefined,
      subject: 'add login',
    });
  });
});

describe('buildSubject', () => {
  it('prefixes verb when missing', () => {
    assert.equal(buildSubject('validation', 'convince'), 'convince validation');
  });

  it('does not duplicate an existing verb prefix', () => {
    assert.equal(buildSubject('convince validation', 'convince'), 'convince validation');
  });
});

describe('pickVerb', () => {
  it('is deterministic for the same input', () => {
    const verbs = ['feed', 'convince', 'calm'];
    assert.equal(pickVerb(verbs, 'fix validation'), pickVerb(verbs, 'fix validation'));
  });
});

describe('buildMockRewriteMessage', () => {
  it('builds a persona-styled conventional commit', () => {
    const message = buildMockRewriteMessage(
      'fix: validation',
      '🐄',
      ['convince', 'feed'],
      72,
      (value) => value,
    );

    assert.match(message, /^🐄 fix: /);
    assert.ok(message.includes('validation'));
  });
});
