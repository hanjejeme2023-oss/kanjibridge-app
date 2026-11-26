import { describe, expect, it } from 'vitest';
import { cleanFFStats, cleanTestResults, resultValue } from '../../src/app/lib/results.js';

describe('stored result cleaning', () => {
  it('keeps only binary table results for known keys', () => {
    expect(resultValue(1)).toBe(1);
    expect(resultValue('1')).toBeNull();
    expect(cleanTestResults({ a: { zh: 1, vi: 2 }, b: { vi: 0 }, c: null }, new Set(['a', 'b'])))
      .toEqual({ a: { zh: 1 }, b: { vi: 0 } });
  });

  it('normalizes false-friend statistics', () => {
    expect(cleanFFStats({ a: { miss: 2, ok: 1 }, b: { miss: -1, ok: 'x' }, c: null }))
      .toEqual({ a: { miss: 2, ok: 1 }, b: { miss: 0, ok: 0 } });
    expect(cleanFFStats([])).toEqual({});
  });
});
