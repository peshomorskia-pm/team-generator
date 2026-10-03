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

  it('produces non-deterministic player distributions across multiple calls while preserving rating bounds', () => {
    const players: Player[] = [
      { id: '1', name: 'P1', rating: 10 },
      { id: '2', name: 'P2', rating: 10 },
      { id: '3', name: 'P3', rating: 8 },
      { id: '4', name: 'P4', rating: 8 },
      { id: '5', name: 'P5', rating: 6 },
      { id: '6', name: 'P6', rating: 6 },
    ];

    const observedDistributions = new Set<string>();

    for (let run = 0; run < 30; run++) {
      const teams = balanceTeams(players, 2);
      expect(teams).toHaveLength(2);

      // Verify rating delta optimality: total ratings should be within bounds (delta <= 2)
      const diff = Math.abs((teams[0].totalRating ?? 0) - (teams[1].totalRating ?? 0));
      expect(diff).toBeLessThanOrEqual(2);

      // Verify player count balance
      expect(teams[0].players).toHaveLength(3);
      expect(teams[1].players).toHaveLength(3);

      // Track distribution
      const team1Names = teams[0].players.map((p) => p.name).sort().join(',');
      const team2Names = teams[1].players.map((p) => p.name).sort().join(',');
      observedDistributions.add([team1Names, team2Names].sort().join(' vs '));
    }

    // Randomized tie-breaking should yield multiple distinct valid balanced partitions
    expect(observedDistributions.size).toBeGreaterThan(1);
  });

  it('shuffles final team assignments so the first team is not predictable and maintains sequential IDs/names', () => {
    const players: Player[] = [
      { id: '1', name: 'SuperStar', rating: 100 },
      { id: '2', name: 'AveragePlayer', rating: 50 },
      { id: '3', name: 'Rookie', rating: 10 },
    ];

    let superstarOnTeam1 = 0;
    let superstarOnTeam2 = 0;

    for (let run = 0; run < 40; run++) {
      const teams = balanceTeams(players, 2);
      expect(teams).toHaveLength(2);
      expect(teams[0].id).toBe('team-1');
      expect(teams[0].name).toBe('Отбор 1');
      expect(teams[1].id).toBe('team-2');
      expect(teams[1].name).toBe('Отбор 2');

      const isSuperstarOnTeam1 = teams[0].players.some((p) => p.name === 'SuperStar');
      if (isSuperstarOnTeam1) {
        superstarOnTeam1++;
      } else {
        superstarOnTeam2++;
      }
    }

    // Shuffling guarantees SuperStar is placed on Team 1 sometimes and Team 2 sometimes
    expect(superstarOnTeam1).toBeGreaterThan(0);
    expect(superstarOnTeam2).toBeGreaterThan(0);
  });
});
