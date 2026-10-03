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

  describe('Dual ELO format-aware balancing', () => {
    const players: Player[] = [
      { id: '1', name: 'P1', rating: 1200, singles_rating: 2000, doubles_rating: 1000 },
      { id: '2', name: 'P2', rating: 1200, singles_rating: 1900, doubles_rating: 1100 },
      { id: '3', name: 'P3', rating: 1200, singles_rating: 1000, doubles_rating: 2000 },
      { id: '4', name: 'P4', rating: 1200, singles_rating: 1100, doubles_rating: 1900 },
    ];

    it('balances accurately by singles_rating when format is "singles"', () => {
      const teams = balanceTeams(players, 2, 'singles');
      expect(teams).toHaveLength(2);
      expect(teams[0].players).toHaveLength(2);
      expect(teams[1].players).toHaveLength(2);

      // In singles, P1(2000) and P2(1900) should be split across teams
      const totalRatings = teams.map((t) => t.totalRating ?? 0);
      const diff = Math.abs(totalRatings[0] - totalRatings[1]);
      // (2000 + 1000 = 3000) vs (1900 + 1100 = 3000) -> diff 0
      expect(diff).toBeLessThanOrEqual(100);
      expect(totalRatings[0] + totalRatings[1]).toBe(6000);
    });

    it('balances accurately by doubles_rating when format is "doubles"', () => {
      const teams = balanceTeams(players, 2, 'doubles');
      expect(teams).toHaveLength(2);
      expect(teams[0].players).toHaveLength(2);
      expect(teams[1].players).toHaveLength(2);

      // In doubles, P3(2000) and P4(1900) should be split across teams
      const totalRatings = teams.map((t) => t.totalRating ?? 0);
      const diff = Math.abs(totalRatings[0] - totalRatings[1]);
      expect(diff).toBeLessThanOrEqual(100);
      expect(totalRatings[0] + totalRatings[1]).toBe(6000);
    });

    it('falls back gracefully to general rating or 0 if format rating is missing', () => {
      const mixedPlayers: Player[] = [
        { id: '1', name: 'M1', rating: 1500 }, // missing singles_rating
        { id: '2', name: 'M2', singles_rating: 1500 },
        { id: '3', name: 'M3' }, // missing all ratings -> 0
        { id: '4', name: 'M4', rating: 0 },
      ];

      const teams = balanceTeams(mixedPlayers, 2, 'singles');
      expect(teams).toHaveLength(2);
      expect(teams[0].players).toHaveLength(2);
      expect(teams[1].players).toHaveLength(2);
      const totalRatings = teams.map((t) => t.totalRating ?? 0);
      // M1 falls back to 1500, M2 is 1500, M3 is 0, M4 is 0 -> sum 3000, 1500 per team
      expect(totalRatings[0]).toBe(1500);
      expect(totalRatings[1]).toBe(1500);
    });
  });
});
