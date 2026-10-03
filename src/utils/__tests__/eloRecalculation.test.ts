import { describe, it, expect } from 'vitest';
import { recalculateRatings, resolveMatchFormat } from '../eloRecalculation';
import type { PlayerRow } from '../../types/database.types';
import type { MatchDetail } from '../../types/matches';

describe('ELO Recalculation Engine (eloRecalculation.ts)', () => {
  const basePlayers: PlayerRow[] = [
    {
      id: 'p-1',
      name: 'Иван',
      rating: 1200,
      singles_rating: 1200,
      doubles_rating: 1200,
      singles_matches_played: 0,
      singles_wins: 0,
      singles_losses: 0,
      doubles_matches_played: 0,
      doubles_wins: 0,
      doubles_losses: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p-2',
      name: 'Георги',
      rating: 1200,
      singles_rating: 1200,
      doubles_rating: 1200,
      singles_matches_played: 0,
      singles_wins: 0,
      singles_losses: 0,
      doubles_matches_played: 0,
      doubles_wins: 0,
      doubles_losses: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p-3',
      name: 'Димитър',
      rating: 1200,
      singles_rating: 1200,
      doubles_rating: 1200,
      singles_matches_played: 0,
      singles_wins: 0,
      singles_losses: 0,
      doubles_matches_played: 0,
      doubles_wins: 0,
      doubles_losses: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p-4',
      name: 'Петър',
      rating: 1200,
      singles_rating: 1200,
      doubles_rating: 1200,
      singles_matches_played: 0,
      singles_wins: 0,
      singles_losses: 0,
      doubles_matches_played: 0,
      doubles_wins: 0,
      doubles_losses: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  describe('resolveMatchFormat', () => {
    it('returns doubles if either team has more than 1 participant', () => {
      expect(
        resolveMatchFormat({
          match_format: 'singles',
          match_players: [
            { team_side: 'team_1' },
            { team_side: 'team_1' },
            { team_side: 'team_2' },
          ],
        })
      ).toBe('doubles');
    });

    it('returns doubles if match_format is explicitly doubles', () => {
      expect(
        resolveMatchFormat({
          match_format: 'doubles',
          match_players: [{ team_side: 'team_1' }, { team_side: 'team_2' }],
        })
      ).toBe('doubles');
    });

    it('returns singles if format is missing and teams have 1 participant', () => {
      expect(
        resolveMatchFormat({
          match_format: null,
          match_players: [{ team_side: 'team_1' }, { team_side: 'team_2' }],
        })
      ).toBe('singles');
    });
  });

  describe('recalculateRatings pure engine', () => {
    it('chronologically replays 5 mixed singles/doubles matches and calculates exact stats', () => {
      const matches: MatchDetail[] = [
        // Match 1: 2026-10-01 Singles p1 vs p2 (6-4)
        {
          id: 'm-1',
          match_format: 'singles',
          team_1_score: 6,
          team_2_score: 4,
          played_at: '2026-10-01T10:00:00Z',
          created_at: '2026-10-01T10:00:00Z',
          updated_at: '2026-10-01T10:00:00Z',
          match_players: [
            { id: 'mp-1', match_id: 'm-1', player_id: 'p-1', guest_name: null, team_side: 'team_1', rating_before: null, rating_after: null },
            { id: 'mp-2', match_id: 'm-1', player_id: 'p-2', guest_name: null, team_side: 'team_2', rating_before: null, rating_after: null },
          ],
        },
        // Match 2: 2026-10-02 Singles p3 vs p4 (4-6)
        {
          id: 'm-2',
          match_format: 'singles',
          team_1_score: 4,
          team_2_score: 6,
          played_at: '2026-10-02T10:00:00Z',
          created_at: '2026-10-02T10:00:00Z',
          updated_at: '2026-10-02T10:00:00Z',
          match_players: [
            { id: 'mp-3', match_id: 'm-2', player_id: 'p-3', guest_name: null, team_side: 'team_1', rating_before: null, rating_after: null },
            { id: 'mp-4', match_id: 'm-2', player_id: 'p-4', guest_name: null, team_side: 'team_2', rating_before: null, rating_after: null },
          ],
        },
        // Match 3: 2026-10-03 Doubles (p1 & p3) vs (p2 & p4) (6-3)
        {
          id: 'm-3',
          match_format: 'doubles',
          team_1_score: 6,
          team_2_score: 3,
          played_at: '2026-10-03T10:00:00Z',
          created_at: '2026-10-03T10:00:00Z',
          updated_at: '2026-10-03T10:00:00Z',
          match_players: [
            { id: 'mp-5', match_id: 'm-3', player_id: 'p-1', guest_name: null, team_side: 'team_1', rating_before: null, rating_after: null },
            { id: 'mp-6', match_id: 'm-3', player_id: 'p-3', guest_name: null, team_side: 'team_1', rating_before: null, rating_after: null },
            { id: 'mp-7', match_id: 'm-3', player_id: 'p-2', guest_name: null, team_side: 'team_2', rating_before: null, rating_after: null },
            { id: 'mp-8', match_id: 'm-3', player_id: 'p-4', guest_name: null, team_side: 'team_2', rating_before: null, rating_after: null },
          ],
        },
        // Match 4: 2026-10-04 Singles p1 vs p4 (5-5 Draw)
        {
          id: 'm-4',
          match_format: 'singles',
          team_1_score: 5,
          team_2_score: 5,
          played_at: '2026-10-04T10:00:00Z',
          created_at: '2026-10-04T10:00:00Z',
          updated_at: '2026-10-04T10:00:00Z',
          match_players: [
            { id: 'mp-9', match_id: 'm-4', player_id: 'p-1', guest_name: null, team_side: 'team_1', rating_before: null, rating_after: null },
            { id: 'mp-10', match_id: 'm-4', player_id: 'p-4', guest_name: null, team_side: 'team_2', rating_before: null, rating_after: null },
          ],
        },
        // Match 5: 2026-10-05 Doubles (p1 & guest) vs (p2 & p3) (4-6)
        {
          id: 'm-5',
          match_format: 'doubles',
          team_1_score: 4,
          team_2_score: 6,
          played_at: '2026-10-05T10:00:00Z',
          created_at: '2026-10-05T10:00:00Z',
          updated_at: '2026-10-05T10:00:00Z',
          match_players: [
            { id: 'mp-11', match_id: 'm-5', player_id: 'p-1', guest_name: null, team_side: 'team_1', rating_before: null, rating_after: null },
            { id: 'mp-12', match_id: 'm-5', player_id: null, guest_name: 'Гост Николай', team_side: 'team_1', rating_before: null, rating_after: null },
            { id: 'mp-13', match_id: 'm-5', player_id: 'p-2', guest_name: null, team_side: 'team_2', rating_before: null, rating_after: null },
            { id: 'mp-14', match_id: 'm-5', player_id: 'p-3', guest_name: null, team_side: 'team_2', rating_before: null, rating_after: null },
          ],
        },
      ];

      const result = recalculateRatings(matches, basePlayers);
      const players = new Map(result.updatedPlayers.map((p) => [p.id, p]));

      const p1 = players.get('p-1')!;
      const p2 = players.get('p-2')!;
      const p3 = players.get('p-3')!;
      const p4 = players.get('p-4')!;

      // p1:
      // Singles: played m-1 (win +16 -> 1216), m-4 (draw +0 -> 1216).
      // Doubles: played m-3 (win +16 -> 1216), m-5 (loss -16 -> 1200).
      expect(p1.singles_rating).toBe(1216);
      expect(p1.singles_matches_played).toBe(2);
      expect(p1.singles_wins).toBe(1);
      expect(p1.singles_losses).toBe(0);

      expect(p1.doubles_rating).toBe(1200);
      expect(p1.doubles_matches_played).toBe(2);
      expect(p1.doubles_wins).toBe(1);
      expect(p1.doubles_losses).toBe(1);

      // p2:
      // Singles: played m-1 (loss -16 -> 1184).
      // Doubles: played m-3 (loss -16 -> 1184), m-5 (win +16 -> 1200).
      expect(p2.singles_rating).toBe(1184);
      expect(p2.singles_matches_played).toBe(1);
      expect(p2.singles_wins).toBe(0);
      expect(p2.singles_losses).toBe(1);

      expect(p2.doubles_rating).toBe(1200);
      expect(p2.doubles_matches_played).toBe(2);
      expect(p2.doubles_wins).toBe(1);
      expect(p2.doubles_losses).toBe(1);

      // p3:
      // Singles: played m-2 (loss -16 -> 1184).
      // Doubles: played m-3 (win +16 -> 1216), m-5 (win +16 -> 1232).
      expect(p3.singles_rating).toBe(1184);
      expect(p3.doubles_rating).toBe(1232);
      expect(p3.doubles_matches_played).toBe(2);
      expect(p3.doubles_wins).toBe(2);
      expect(p3.doubles_losses).toBe(0);

      // p4:
      // Singles: played m-2 (win +16 -> 1216), m-4 (draw +0 -> 1216).
      // Doubles: played m-3 (loss -16 -> 1184).
      expect(p4.singles_rating).toBe(1216);
      expect(p4.doubles_rating).toBe(1184);
      expect(p4.singles_matches_played).toBe(2);
      expect(p4.doubles_matches_played).toBe(1);
    });

    it('correctly handles score edits without rating inflation', () => {
      const match1: MatchDetail = {
        id: 'm-edit-1',
        match_format: 'singles',
        team_1_score: 6,
        team_2_score: 4,
        played_at: '2026-10-01T10:00:00Z',
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
        match_players: [
          { id: 'mp-e1', match_id: 'm-edit-1', player_id: 'p-1', guest_name: null, team_side: 'team_1', rating_before: null, rating_after: null },
          { id: 'mp-e2', match_id: 'm-edit-1', player_id: 'p-2', guest_name: null, team_side: 'team_2', rating_before: null, rating_after: null },
        ],
      };

      const result1 = recalculateRatings([match1], basePlayers);
      const p1First = result1.updatedPlayers.find((p) => p.id === 'p-1')!;
      expect(p1First.singles_rating).toBe(1216);
      expect(p1First.singles_matches_played).toBe(1);

      // Same match updated to team 2 winning (4-6)
      const editedMatch: MatchDetail = {
        ...match1,
        team_1_score: 4,
        team_2_score: 6,
      };

      const resultEdited = recalculateRatings([editedMatch], basePlayers);
      const p1Edited = resultEdited.updatedPlayers.find((p) => p.id === 'p-1')!;
      const p2Edited = resultEdited.updatedPlayers.find((p) => p.id === 'p-2')!;

      expect(p1Edited.singles_rating).toBe(1184);
      expect(p1Edited.singles_matches_played).toBe(1);
      expect(p1Edited.singles_wins).toBe(0);
      expect(p1Edited.singles_losses).toBe(1);

      expect(p2Edited.singles_rating).toBe(1216);
      expect(p2Edited.singles_matches_played).toBe(1);
      expect(p2Edited.singles_wins).toBe(1);
      expect(p2Edited.singles_losses).toBe(0);
    });

    it('leaves upcoming matches with null snapshot ratings', () => {
      const upcomingMatch: MatchDetail = {
        id: 'm-up',
        match_format: 'singles',
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-10-10T10:00:00Z',
        created_at: '2026-10-10T10:00:00Z',
        updated_at: '2026-10-10T10:00:00Z',
        match_players: [
          { id: 'mp-u1', match_id: 'm-up', player_id: 'p-1', guest_name: null, team_side: 'team_1', rating_before: null, rating_after: null },
          { id: 'mp-u2', match_id: 'm-up', player_id: 'p-2', guest_name: null, team_side: 'team_2', rating_before: null, rating_after: null },
        ],
      };

      const result = recalculateRatings([upcomingMatch], basePlayers);
      const p1 = result.updatedPlayers.find((p) => p.id === 'p-1')!;
      expect(p1.singles_matches_played).toBe(0);
      expect(p1.singles_rating).toBe(1200);

      const mPlayers = result.updatedMatches[0].match_players;
      expect(mPlayers[0].rating_before).toBeNull();
      expect(mPlayers[0].rating_after).toBeNull();
    });
  });
});
