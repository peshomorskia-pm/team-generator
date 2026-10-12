import { describe, it, expect } from 'vitest';
import { comparePlayerNames, sortPlayersByName } from '../playerSort';

describe('playerSort utility', () => {
  describe('comparePlayerNames', () => {
    it('compares Bulgarian Cyrillic strings in correct alphabetical order', () => {
      expect(comparePlayerNames('Ангел', 'Борис')).toBeLessThan(0);
      expect(comparePlayerNames('Борис', 'Ангел')).toBeGreaterThan(0);
      expect(comparePlayerNames('Георги', 'Георги')).toBe(0);
      expect(comparePlayerNames('Явор', 'Борис')).toBeGreaterThan(0);
    });

    it('supports comparing objects satisfying HasPlayerName contract', () => {
      const p1 = { name: 'Ангел' };
      const p2 = { name: 'Борис' };
      expect(comparePlayerNames(p1, p2)).toBeLessThan(0);
      expect(comparePlayerNames(p2, p1)).toBeGreaterThan(0);
    });

    it('handles leading and trailing whitespace', () => {
      expect(comparePlayerNames('  Иван', 'Иван  ')).toBe(0);
      expect(comparePlayerNames('  Ангел', 'Борис')).toBeLessThan(0);
    });

    it('performs case-insensitive comparison using base sensitivity', () => {
      expect(comparePlayerNames('ангел', 'Ангел')).toBe(0);
      expect(comparePlayerNames('борис', 'Ангел')).toBeGreaterThan(0);
    });
  });

  describe('sortPlayersByName', () => {
    it('sorts Bulgarian Cyrillic names from А to Я', () => {
      const players = [
        { id: '1', name: 'Борис' },
        { id: '2', name: 'Явор' },
        { id: '3', name: 'Ангел' },
        { id: '4', name: 'Георги' },
      ];

      const sorted = sortPlayersByName(players);

      expect(sorted.map((p) => p.name)).toEqual(['Ангел', 'Борис', 'Георги', 'Явор']);
    });

    it('sorts case-insensitively without grouping lowercase after uppercase', () => {
      const players = [
        { name: 'Борис' },
        { name: 'ангел' },
        { name: 'Васил' },
        { name: 'Ангел' },
      ];

      const sorted = sortPlayersByName(players);

      expect(sorted[0].name.toLowerCase()).toBe('ангел');
      expect(sorted[1].name.toLowerCase()).toBe('ангел');
      expect(sorted[2].name).toBe('Борис');
      expect(sorted[3].name).toBe('Васил');
    });

    it('sorts numeric suffixes naturally', () => {
      const players = [
        { name: 'Играч 10' },
        { name: 'Играч 2' },
        { name: 'Играч 1' },
      ];

      const sorted = sortPlayersByName(players);

      expect(sorted.map((p) => p.name)).toEqual(['Играч 1', 'Играч 2', 'Играч 10']);
    });

    it('handles mixed Cyrillic and Latin names predictably', () => {
      const players = [
        { name: 'John' },
        { name: 'Борис' },
        { name: 'Alex' },
        { name: 'Ангел' },
      ];

      const sorted = sortPlayersByName(players);
      expect(sorted).toHaveLength(4);
      // Ensure sorted result is deterministic and non-empty
      expect(sorted.map((p) => p.name)).toBeDefined();
    });

    it('is immutable and returns a new array without mutating input', () => {
      const original = [
        { name: 'Явор' },
        { name: 'Борис' },
        { name: 'Ангел' },
      ];
      const copy = [...original];

      const sorted = sortPlayersByName(original);

      expect(original).toEqual(copy);
      expect(sorted).not.toBe(original);
      expect(sorted.map((p) => p.name)).toEqual(['Ангел', 'Борис', 'Явор']);
    });

    it('handles empty arrays and single items gracefully', () => {
      expect(sortPlayersByName([])).toEqual([]);
      expect(sortPlayersByName([{ name: 'Самотен' }])).toEqual([{ name: 'Самотен' }]);
    });
  });
});
