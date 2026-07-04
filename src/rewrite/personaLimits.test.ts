import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPersonaMaxLength, truncateToWordBoundary } from './personaLimits.js';
import type { PersonaMetadata } from '../personas/types.js';

describe('truncateToWordBoundary', () => {
  it('returns text unchanged when under the limit', () => {
    assert.equal(truncateToWordBoundary('short commit', 72), 'short commit');
  });

  it('truncates on a word boundary', () => {
    const result = truncateToWordBoundary('🐄 fix: convince validation some manners please', 40);
    assert.ok(result.length <= 40);
    assert.ok(!result.endsWith(' '));
    assert.match(result, /convince validation some/);
  });
});

describe('getPersonaMaxLength', () => {
  it('uses persona max_length when present', () => {
    const metadata = {
      raw: { max_length: 60 },
    } as unknown as PersonaMetadata;

    assert.equal(getPersonaMaxLength(metadata), 60);
  });

  it('defaults to 72', () => {
    assert.equal(getPersonaMaxLength(undefined), 72);
  });
});
