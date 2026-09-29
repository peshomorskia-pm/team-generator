import { describe, it, expect } from 'vitest';
import { fisherYatesShuffle } from '../shuffle';

describe('fisherYatesShuffle', () => {
  it('returns a new array and does not mutate the source array', () => {
    const original = [1, 2, 3, 4, 5];
    const originalCopy = [...original];
    const shuffled = fisherYatesShuffle(original);

    expect(shuffled).not.toBe(original);
    expect(original).toEqual(originalCopy);
    expect(shuffled.sort()).toEqual(original.sort());
  });

  it('handles empty and single-element arrays', () => {
    expect(fisherYatesShuffle([])).toEqual([]);
    expect(fisherYatesShuffle(['Alice'])).toEqual(['Alice']);
  });

  it('preserves all items without adding or losing elements', () => {
    const items = ['Alice', 'Bob', 'Charlie', 'David', 'Eva'];
    const result = fisherYatesShuffle(items);

    expect(result).toHaveLength(items.length);
    expect([...result].sort()).toEqual([...items].sort());
  });

  it('produces permutations across multiple runs', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set<string>();

    for (let i = 0; i < 20; i++) {
      results.add(fisherYatesShuffle(items).join(','));
    }

    // With 10 elements, 20 runs should yield more than 1 distinct permutation
    expect(results.size).toBeGreaterThan(1);
  });
});
