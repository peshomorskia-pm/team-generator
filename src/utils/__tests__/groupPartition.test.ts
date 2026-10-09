import { describe, it, expect } from 'vitest';
import {
  calculateGroupSizes,
  getBulgarianGroupLabel,
  partitionIntoGroups,
  drawTournamentGroups,
} from '../groupPartition';
import type { Team } from '../../types';

function createDummyTeams(count: number): Team[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Отбор ${i + 1}`,
    players: [
      { id: `p-${i * 2 + 1}`, name: `Играч ${i * 2 + 1}`, rating: 1500 },
      { id: `p-${i * 2 + 2}`, name: `Играч ${i * 2 + 2}`, rating: 1500 },
    ],
    totalRating: 3000,
  }));
}

describe('groupPartition utility', () => {
  describe('calculateGroupSizes', () => {
    it('returns empty array for N < 3', () => {
      expect(calculateGroupSizes(0)).toEqual([]);
      expect(calculateGroupSizes(1)).toEqual([]);
      expect(calculateGroupSizes(2)).toEqual([]);
      expect(calculateGroupSizes(-5)).toEqual([]);
    });

    it('returns single group of N for N = 3, 4, 5', () => {
      expect(calculateGroupSizes(3)).toEqual([3]);
      expect(calculateGroupSizes(4)).toEqual([4]);
      expect(calculateGroupSizes(5)).toEqual([5]);
    });

    it('calculates exact sizes for N = 6 (2 groups of 3)', () => {
      expect(calculateGroupSizes(6)).toEqual([3, 3]);
    });

    it('calculates exact sizes for N = 7 (2 groups: 4 and 3)', () => {
      expect(calculateGroupSizes(7)).toEqual([4, 3]);
    });

    it('calculates exact sizes for N = 8 (2 groups of 4)', () => {
      expect(calculateGroupSizes(8)).toEqual([4, 4]);
    });

    it('calculates exact sizes for N = 9 (3 groups of 3)', () => {
      expect(calculateGroupSizes(9)).toEqual([3, 3, 3]);
    });

    it('calculates exact sizes for N = 10 (3 groups: 4, 3, 3)', () => {
      expect(calculateGroupSizes(10)).toEqual([4, 3, 3]);
    });

    it('calculates exact sizes for N = 11 (3 groups: 4, 4, 3)', () => {
      expect(calculateGroupSizes(11)).toEqual([4, 4, 3]);
    });

    it('calculates exact sizes for N = 12 (3 groups of 4)', () => {
      expect(calculateGroupSizes(12)).toEqual([4, 4, 4]);
    });

    it('preserves group size bounds between 3 and 4 for all N >= 6 up to 32', () => {
      for (let n = 6; n <= 32; n++) {
        const sizes = calculateGroupSizes(n);
        const sum = sizes.reduce((acc, val) => acc + val, 0);
        expect(sum).toBe(n);
        expect(sizes.every((s) => s === 3 || s === 4)).toBe(true);
      }
    });
  });

  describe('getBulgarianGroupLabel', () => {
    it('generates sequential Cyrillic names for groups', () => {
      expect(getBulgarianGroupLabel(0)).toBe('Група А');
      expect(getBulgarianGroupLabel(1)).toBe('Група Б');
      expect(getBulgarianGroupLabel(2)).toBe('Група В');
      expect(getBulgarianGroupLabel(3)).toBe('Група Г');
      expect(getBulgarianGroupLabel(4)).toBe('Група Д');
      expect(getBulgarianGroupLabel(5)).toBe('Група Е');
      expect(getBulgarianGroupLabel(6)).toBe('Група Ж');
      expect(getBulgarianGroupLabel(7)).toBe('Група З');
    });

    it('falls back gracefully beyond predefined Cyrillic alphabet', () => {
      expect(getBulgarianGroupLabel(30)).toBe('Група 31');
    });
  });

  describe('partitionIntoGroups', () => {
    it('returns empty array when teams count is less than 3', () => {
      expect(partitionIntoGroups([])).toEqual([]);
      expect(partitionIntoGroups(createDummyTeams(1))).toEqual([]);
      expect(partitionIntoGroups(createDummyTeams(2))).toEqual([]);
    });

    it('partitions without mutating input array', () => {
      const teams = createDummyTeams(6);
      const originalCopy = [...teams];
      const groups = partitionIntoGroups(teams);

      expect(teams).toEqual(originalCopy);
      expect(groups).toHaveLength(2);
      expect(groups[0].name).toBe('Група А');
      expect(groups[1].name).toBe('Група Б');
      expect(groups[0].teams).toHaveLength(3);
      expect(groups[1].teams).toHaveLength(3);
    });

    it('assigns unique group ids and labels', () => {
      const teams = createDummyTeams(10);
      const groups = partitionIntoGroups(teams);

      expect(groups).toHaveLength(3);
      expect(groups[0].id).toBe('group-0');
      expect(groups[1].id).toBe('group-1');
      expect(groups[2].id).toBe('group-2');
      expect(groups[0].name).toBe('Група А');
      expect(groups[1].name).toBe('Група Б');
      expect(groups[2].name).toBe('Група В');
      expect(groups.map((g) => g.teams.length)).toEqual([4, 3, 3]);
    });
  });

  describe('drawTournamentGroups', () => {
    it('returns empty array when teams count is less than 3', () => {
      expect(drawTournamentGroups([])).toEqual([]);
      expect(drawTournamentGroups(createDummyTeams(2))).toEqual([]);
    });

    it('distributes all teams across groups without losses or duplicates', () => {
      const teams = createDummyTeams(8);
      const groups = drawTournamentGroups(teams);

      const drawnTeamIds = groups.flatMap((g) => g.teams.map((t) => t.id));
      expect(drawnTeamIds).toHaveLength(8);
      expect(new Set(drawnTeamIds).size).toBe(8);
      expect(groups.map((g) => g.teams.length)).toEqual([4, 4]);
    });

    it('produces shuffled/randomized distributions across multiple draws', () => {
      const teams = createDummyTeams(12);
      const draw1 = drawTournamentGroups(teams);
      const draw2 = drawTournamentGroups(teams);
      const draw3 = drawTournamentGroups(teams);

      const signature1 = draw1.flatMap((g) => g.teams.map((t) => t.id)).join(',');
      const signature2 = draw2.flatMap((g) => g.teams.map((t) => t.id)).join(',');
      const signature3 = draw3.flatMap((g) => g.teams.map((t) => t.id)).join(',');

      // In 12! permutations, at least one of draw1, draw2, draw3 will differ
      const isRandomized = signature1 !== signature2 || signature2 !== signature3;
      expect(isRandomized).toBe(true);
    });
  });
});
