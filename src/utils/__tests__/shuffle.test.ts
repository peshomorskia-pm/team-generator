import { describe, it, expect } from 'vitest';
import { fisherYatesShuffle, shuffleTeamsBalanced } from '../shuffle';
import { Player } from '../../types';

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

describe('shuffleTeamsBalanced', () => {
  const players: Player[] = [
    { id: '1', name: 'P1', winRate: 90.0, doubles_matches_played: 10, doubles_wins: 9 },
    { id: '2', name: 'P2', winRate: 80.0, doubles_matches_played: 10, doubles_wins: 8 },
    { id: '3', name: 'P3', winRate: 40.0, doubles_matches_played: 10, doubles_wins: 4 },
    { id: '4', name: 'P4', winRate: 30.0, doubles_matches_played: 10, doubles_wins: 3 },
  ];

  it('takes array of 4 players and returns 2 teams of 2 players', () => {
    const teams = shuffleTeamsBalanced(players, 2, 'doubles');
    expect(teams).toHaveLength(2);
    expect(teams[0].players).toHaveLength(2);
    expect(teams[1].players).toHaveLength(2);
  });

  it('preserves all player assignments and balances win rates', () => {
    const teams = shuffleTeamsBalanced(players, 2, 'doubles');
    const allAssignedIds = teams.flatMap((t) => t.players.map((p) => p.id));
    expect(allAssignedIds.sort()).toEqual(['1', '2', '3', '4']);

    // Balanced sum: {90, 30} = 120 and {80, 40} = 120
    expect(teams[0].totalRating).toBe(120);
    expect(teams[1].totalRating).toBe(120);
  });

  it('repeated runs exhibit non-deterministic team ordering while maintaining balanced sums', () => {
    let p1OnTeam1 = 0;
    let p1OnTeam2 = 0;

    for (let i = 0; i < 30; i++) {
      const teams = shuffleTeamsBalanced(players, 2, 'doubles');
      expect(teams[0].totalRating).toBe(120);
      expect(teams[1].totalRating).toBe(120);

      if (teams[0].players.some((p) => p.id === '1')) {
        p1OnTeam1++;
      } else {
        p1OnTeam2++;
      }
    }

    expect(p1OnTeam1).toBeGreaterThan(0);
    expect(p1OnTeam2).toBeGreaterThan(0);
  });
});
