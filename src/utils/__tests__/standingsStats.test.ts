import { describe, it, expect } from 'vitest';
import {
  calculateGameDifference,
  computePlayerSportsStats,
  sortPlayerSportsStats,
  type PlayerSportsStats,
} from '../standingsStats';
import type { MatchDetail } from '../../types/matches';
import type { PlayerRow } from '../../types/database.types';

describe('standingsStats utility', () => {
  describe('calculateGameDifference', () => {
    it('calculates game difference for multi-set match', () => {
      const match = {
        sets: [
          { set_number: 1, team_1_score: 6, team_2_score: 4 },
          { set_number: 2, team_1_score: 3, team_2_score: 6 },
          { set_number: 3, team_1_score: 7, team_2_score: 5 },
        ],
      };

      const team1Diff = calculateGameDifference(match, 'team_1');
      expect(team1Diff).toEqual({
        gamesWon: 16,
        gamesLost: 15,
        gameDifference: 1,
      });

      const team2Diff = calculateGameDifference(match, 'team_2');
      expect(team2Diff).toEqual({
        gamesWon: 15,
        gamesLost: 16,
        gameDifference: -1,
      });

      // Also supports numeric 1 and 2
      expect(calculateGameDifference(match, 1)).toEqual(team1Diff);
      expect(calculateGameDifference(match, 2)).toEqual(team2Diff);
    });

    it('calculates game difference for casual single-set score', () => {
      const match = {
        team_1_score: 9,
        team_2_score: 4,
      };

      const team1Diff = calculateGameDifference(match, 'team_1');
      expect(team1Diff).toEqual({
        gamesWon: 9,
        gamesLost: 4,
        gameDifference: 5,
      });

      const team2Diff = calculateGameDifference(match, 'team_2');
      expect(team2Diff).toEqual({
        gamesWon: 4,
        gamesLost: 9,
        gameDifference: -5,
      });
    });

    it('returns zero for unplayed match with null scores', () => {
      const match = {
        team_1_score: null,
        team_2_score: null,
        sets: null,
      };

      expect(calculateGameDifference(match, 'team_1')).toEqual({
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
      });
      expect(calculateGameDifference(match, 'team_2')).toEqual({
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
      });
    });
  });

  describe('sortPlayerSportsStats (6-tier sports tie-breaking)', () => {
    it('ranks active player above unplayed player regardless of negative game difference (Gate 1)', () => {
      const activePlayer: PlayerSportsStats = {
        playerId: 'p-active',
        name: 'Player Active',
        matchesPlayed: 1,
        wins: 0,
        losses: 1,
        winRate: 0,
        gamesWon: 2,
        gamesLost: 6,
        gameDifference: -4,
        form: ['L'],
        rank: 0,
      };
      const inactivePlayer: PlayerSportsStats = {
        playerId: 'p-inactive',
        name: 'Player Inactive',
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        form: [],
        rank: 0,
      };

      const sorted = sortPlayerSportsStats([inactivePlayer, activePlayer]);
      expect(sorted[0].playerId).toBe('p-active');
      expect(sorted[0].rank).toBe(1);
      expect(sorted[1].playerId).toBe('p-inactive');
      expect(sorted[1].rank).toBe(2);
    });

    it('ranks player with more wins higher regardless of win rate (Tier 1)', () => {
      const playerA: PlayerSportsStats = {
        playerId: 'p-a',
        name: 'Player A',
        matchesPlayed: 20,
        wins: 12,
        losses: 8,
        winRate: 60.0,
        gamesWon: 100,
        gamesLost: 80,
        gameDifference: 20,
        form: ['W'],
        rank: 0,
      };
      const playerB: PlayerSportsStats = {
        playerId: 'p-b',
        name: 'Player B',
        matchesPlayed: 10,
        wins: 10,
        losses: 0,
        winRate: 100.0,
        gamesWon: 80,
        gamesLost: 20,
        gameDifference: 60,
        form: ['W'],
        rank: 0,
      };

      const sorted = sortPlayerSportsStats([playerB, playerA]);
      expect(sorted[0].playerId).toBe('p-a');
      expect(sorted[0].rank).toBe(1);
      expect(sorted[1].playerId).toBe('p-b');
      expect(sorted[1].rank).toBe(2);
    });

    it('breaks ties on wins using winRate (Tier 2)', () => {
      const playerA: PlayerSportsStats = {
        playerId: 'p-a',
        name: 'Player A',
        matchesPlayed: 12,
        wins: 10,
        losses: 2,
        winRate: 83.3,
        gamesWon: 70,
        gamesLost: 40,
        gameDifference: 30,
        form: [],
        rank: 0,
      };
      const playerB: PlayerSportsStats = {
        playerId: 'p-b',
        name: 'Player B',
        matchesPlayed: 14,
        wins: 10,
        losses: 4,
        winRate: 71.4,
        gamesWon: 80,
        gamesLost: 40,
        gameDifference: 40,
        form: [],
        rank: 0,
      };

      const sorted = sortPlayerSportsStats([playerB, playerA]);
      expect(sorted[0].playerId).toBe('p-a');
      expect(sorted[1].playerId).toBe('p-b');
    });

    it('breaks ties on wins and winRate using net gameDifference (Tier 3)', () => {
      const playerA: PlayerSportsStats = {
        playerId: 'p-a',
        name: 'Player A',
        matchesPlayed: 10,
        wins: 8,
        losses: 2,
        winRate: 80.0,
        gamesWon: 68,
        gamesLost: 50,
        gameDifference: 18,
        form: [],
        rank: 0,
      };
      const playerB: PlayerSportsStats = {
        playerId: 'p-b',
        name: 'Player B',
        matchesPlayed: 10,
        wins: 8,
        losses: 2,
        winRate: 80.0,
        gamesWon: 60,
        gamesLost: 50,
        gameDifference: 10,
        form: [],
        rank: 0,
      };

      const sorted = sortPlayerSportsStats([playerB, playerA]);
      expect(sorted[0].playerId).toBe('p-a');
      expect(sorted[1].playerId).toBe('p-b');
    });

    it('breaks ties on wins, winRate, and gameDifference using matchesPlayed (Tier 4)', () => {
      const playerA: PlayerSportsStats = {
        playerId: 'p-a',
        name: 'Player A',
        matchesPlayed: 15,
        wins: 10,
        losses: 5,
        winRate: 66.7,
        gamesWon: 80,
        gamesLost: 70,
        gameDifference: 10,
        form: [],
        rank: 0,
      };
      const playerB: PlayerSportsStats = {
        playerId: 'p-b',
        name: 'Player B',
        matchesPlayed: 12,
        wins: 10,
        losses: 2,
        winRate: 66.7,
        gamesWon: 80,
        gamesLost: 70,
        gameDifference: 10,
        form: [],
        rank: 0,
      };

      const sorted = sortPlayerSportsStats([playerB, playerA]);
      expect(sorted[0].playerId).toBe('p-a');
      expect(sorted[1].playerId).toBe('p-b');
    });

    it('breaks ties on all numeric stats using Bulgarian alphabetical collation (Tier 5)', () => {
      const angel: PlayerSportsStats = {
        playerId: 'p-angel',
        name: 'Ангел',
        matchesPlayed: 5,
        wins: 3,
        losses: 2,
        winRate: 60.0,
        gamesWon: 25,
        gamesLost: 20,
        gameDifference: 5,
        form: [],
        rank: 0,
      };
      const boris: PlayerSportsStats = {
        playerId: 'p-boris',
        name: 'Борис',
        matchesPlayed: 5,
        wins: 3,
        losses: 2,
        winRate: 60.0,
        gamesWon: 25,
        gamesLost: 20,
        gameDifference: 5,
        form: [],
        rank: 0,
      };

      const sorted = sortPlayerSportsStats([boris, angel]);
      expect(sorted[0].name).toBe('Ангел');
      expect(sorted[0].rank).toBe(1);
      expect(sorted[1].name).toBe('Борис');
      expect(sorted[1].rank).toBe(2);
    });

    it('collates inactive players with 0 matches alphabetically using Bulgarian collation', () => {
      const angel: PlayerSportsStats = {
        playerId: 'p-angel',
        name: 'Ангел',
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        form: [],
        rank: 0,
      };
      const boris: PlayerSportsStats = {
        playerId: 'p-boris',
        name: 'Борис',
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        form: [],
        rank: 0,
      };

      const sorted = sortPlayerSportsStats([boris, angel]);
      expect(sorted[0].name).toBe('Ангел');
      expect(sorted[0].rank).toBe(1);
      expect(sorted[1].name).toBe('Борис');
      expect(sorted[1].rank).toBe(2);
    });
  });

  describe('computePlayerSportsStats', () => {
    const p1: PlayerRow = {
      id: 'p1',
      name: 'Григор Димитров',
      singles_rating: 1200,
      doubles_rating: 1200,
      rating: 1200,
      singles_matches_played: 0,
      singles_wins: 0,
      singles_losses: 0,
      doubles_matches_played: 0,
      doubles_wins: 0,
      doubles_losses: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const p2: PlayerRow = {
      id: 'p2',
      name: 'Димитър Кузманов',
      singles_rating: 1200,
      doubles_rating: 1200,
      rating: 1200,
      singles_matches_played: 0,
      singles_wins: 0,
      singles_losses: 0,
      doubles_matches_played: 0,
      doubles_wins: 0,
      doubles_losses: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    it('aggregates stats and rounds winRate to 1 decimal place', () => {
      // 13 wins and 3 losses in 16 matches = 81.25% -> 81.3%
      const matches: MatchDetail[] = [];
      for (let i = 1; i <= 16; i++) {
        const isWin = i <= 13;
        matches.push({
          id: `m-${i}`,
          match_format: 'singles',
          team_1_score: isWin ? 6 : 4,
          team_2_score: isWin ? 4 : 6,
          played_at: `2026-01-${String(i).padStart(2, '0')}T10:00:00Z`,
          team_1_name: 'Григор',
          team_2_name: 'Опонент',
          created_at: `2026-01-${String(i).padStart(2, '0')}T10:00:00Z`,
          updated_at: `2026-01-${String(i).padStart(2, '0')}T10:00:00Z`,
          match_players: [
            {
              id: `mp-${i}-1`,
              match_id: `m-${i}`,
              player_id: 'p1',
              team_side: 'team_1',
              rating_before: null,
              rating_after: null,
              guest_name: null,
            },
          ],
        });
      }

      const stats = computePlayerSportsStats([p1], matches, 'singles');
      expect(stats).toHaveLength(1);
      expect(stats[0].matchesPlayed).toBe(16);
      expect(stats[0].wins).toBe(13);
      expect(stats[0].losses).toBe(3);
      expect(stats[0].winRate).toBe(81.3);
      expect(stats[0].gamesWon).toBe(13 * 6 + 3 * 4);
      expect(stats[0].gamesLost).toBe(13 * 4 + 3 * 6);
    });

    it('correctly extracts chronological last 5 form outcomes', () => {
      // 8 matches with specific sequence: W, L, W, W, L, W, L, W
      // Last 5 outcomes should be: W, L, W, L, W
      const outcomes = ['W', 'L', 'W', 'W', 'L', 'W', 'L', 'W'];
      const matches: MatchDetail[] = outcomes.map((res, idx) => ({
        id: `m-${idx + 1}`,
        match_format: 'singles',
        team_1_score: res === 'W' ? 6 : 2,
        team_2_score: res === 'W' ? 2 : 6,
        played_at: `2026-02-0${idx + 1}T12:00:00Z`,
        created_at: `2026-02-0${idx + 1}T12:00:00Z`,
        updated_at: `2026-02-0${idx + 1}T12:00:00Z`,
        match_players: [
          {
            id: `mp-${idx + 1}`,
            match_id: `m-${idx + 1}`,
            player_id: 'p1',
            team_side: 'team_1',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
        ],
      }));

      const stats = computePlayerSportsStats([p1], matches, 'singles');
      expect(stats[0].form).toEqual(['W', 'L', 'W', 'L', 'W']);
    });

    it('returns zeroed stats for player with 0 matches', () => {
      const stats = computePlayerSportsStats([p1], [], 'singles');
      expect(stats[0]).toEqual({
        playerId: 'p1',
        name: 'Григор Димитров',
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        form: [],
        rank: 1,
      });
    });

    it('returns strictly zeroed stats even if legacy player row fields are populated', () => {
      const legacyPlayer: PlayerRow = {
        ...p2,
        singles_matches_played: 10,
        singles_wins: 8,
        singles_losses: 2,
      };

      const stats = computePlayerSportsStats([legacyPlayer], [], 'singles');
      expect(stats[0]).toEqual({
        playerId: 'p2',
        name: 'Димитър Кузманов',
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        form: [],
        rank: 1,
      });
    });

    it('filters matches according to format (singles vs doubles)', () => {
      const singlesMatch: MatchDetail = {
        id: 'm-s',
        match_format: 'singles',
        team_1_score: 6,
        team_2_score: 4,
        played_at: '2026-03-01T12:00:00Z',
        created_at: '2026-03-01T12:00:00Z',
        updated_at: '2026-03-01T12:00:00Z',
        match_players: [
          {
            id: 'mp-s-1',
            match_id: 'm-s',
            player_id: 'p1',
            team_side: 'team_1',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
        ],
      };

      const doublesMatch: MatchDetail = {
        id: 'm-d',
        match_format: 'doubles',
        team_1_score: 1,
        team_2_score: 6,
        played_at: '2026-03-02T12:00:00Z',
        created_at: '2026-03-02T12:00:00Z',
        updated_at: '2026-03-02T12:00:00Z',
        match_players: [
          {
            id: 'mp-d-1',
            match_id: 'm-d',
            player_id: 'p1',
            team_side: 'team_1',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
        ],
      };

      const singlesStats = computePlayerSportsStats([p1], [singlesMatch, doublesMatch], 'singles');
      expect(singlesStats[0].matchesPlayed).toBe(1);
      expect(singlesStats[0].wins).toBe(1);

      const doublesStats = computePlayerSportsStats([p1], [singlesMatch, doublesMatch], 'doubles');
      expect(doublesStats[0].matchesPlayed).toBe(1);
      expect(doublesStats[0].losses).toBe(1);
    });
  });
});
