import { describe, it, expect } from 'vitest';
import { balanceTeams } from '../balance';
import { Player } from '../../types';

describe('balanceTeams', () => {
  it('returns empty array if numTeams <= 0', () => {
    const players: Player[] = [{ id: '1', name: 'Alice', rating: 5 }];
    expect(balanceTeams(players, 0)).toEqual([]);
    expect(balanceTeams(players, -1)).toEqual([]);
  });

  it('creates requested number of teams even if players array is empty', () => {
    const teams = balanceTeams([], 3);
    expect(teams).toHaveLength(3);
    expect(teams[0].players).toHaveLength(0);
    expect(teams[0].totalRating).toBe(0);
  });

  it('balances teams by rating accurately', () => {
    // Ratings sum to 55: (10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
    // Distributed between 2 teams, total ratings should be very close (e.g., 28 and 27)
    const players: Player[] = [
      { id: '1', name: 'P1', rating: 10 },
      { id: '2', name: 'P2', rating: 9 },
      { id: '3', name: 'P3', rating: 8 },
      { id: '4', name: 'P4', rating: 7 },
      { id: '5', name: 'P5', rating: 6 },
      { id: '6', name: 'P6', rating: 5 },
      { id: '7', name: 'P7', rating: 4 },
      { id: '8', name: 'P8', rating: 3 },
      { id: '9', name: 'P9', rating: 2 },
      { id: '10', name: 'P10', rating: 1 },
    ];

    const teams = balanceTeams(players, 2);
    expect(teams).toHaveLength(2);

    const totalRatings = teams.map((t) => t.totalRating ?? 0);
    const diff = Math.abs(totalRatings[0] - totalRatings[1]);

    // Difference between team ratings should be minimized (<= 3)
    expect(diff).toBeLessThanOrEqual(3);
    // Both teams should have 5 players each
    expect(teams[0].players.length).toBe(5);
    expect(teams[1].players.length).toBe(5);
  });

  it('handles players without ratings gracefully (defaults to 0)', () => {
    const players: Player[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
      { id: '4', name: 'Diana' },
    ];

    const teams = balanceTeams(players, 2);
    expect(teams).toHaveLength(2);
    expect(teams[0].players.length).toBe(2);
    expect(teams[1].players.length).toBe(2);
    expect(teams[0].totalRating).toBe(0);
    expect(teams[1].totalRating).toBe(0);
  });

  it('assigns all players and preserves unique IDs', () => {
    const players: Player[] = [
      { id: 'p1', name: 'Player 1', rating: 5 },
      { id: 'p2', name: 'Player 2', rating: 4 },
      { id: 'p3', name: 'Player 3', rating: 3 },
    ];

    const teams = balanceTeams(players, 2);
    const allAssigned = teams.flatMap((t) => t.players);

    expect(allAssigned).toHaveLength(3);
    expect(new Set(allAssigned.map((p) => p.id)).size).toBe(3);
  });
});
