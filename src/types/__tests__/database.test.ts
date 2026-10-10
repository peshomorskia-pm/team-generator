import { describe, it, expect } from 'vitest';
import type {
  PlayerRow,
  PlayerInsert,
  PlayerUpdate,
  MatchRow,
  MatchInsert,
  MatchUpdate,
  MatchPlayerRow,
  MatchPlayerInsert,
  TournamentRow,
  TournamentInsert,
  TournamentUpdate,
} from '../database.types';
import type { Player, MatchDetail, Tournament } from '../index';
import { supabase } from '../../lib/supabase';

describe('Database Types Contract Tests', () => {
  describe('PlayerRow type shape and contract', () => {
    it('accepts a fully compliant PlayerRow record', () => {
      const mockPlayerRow: PlayerRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Димитър Иванов',
        rating: 1350.5,
        created_at: '2026-10-02T10:00:00.000Z',
        updated_at: '2026-10-02T10:00:00.000Z',
      };

      expect(mockPlayerRow.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockPlayerRow.name).toBe('Димитър Иванов');
      expect(mockPlayerRow.rating).toBe(1350.5);
      expect(mockPlayerRow.created_at).toBe('2026-10-02T10:00:00.000Z');
      expect(mockPlayerRow.updated_at).toBe('2026-10-02T10:00:00.000Z');
    });

    it('maps correctly to the application domain Player model', () => {
      const dbRow: PlayerRow = {
        id: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
        name: 'Георги Димитров',
        rating: 1420.75,
        created_at: '2026-10-02T12:00:00.000Z',
        updated_at: '2026-10-02T12:00:00.000Z',
      };

      const domainPlayer: Player = {
        id: dbRow.id,
        name: dbRow.name,
        rating: dbRow.rating,
      };

      expect(domainPlayer).toEqual({
        id: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
        name: 'Георги Димитров',
        rating: 1420.75,
      });
    });
  });

  describe('PlayerInsert type contract', () => {
    it('accepts minimal required fields (name only)', () => {
      const minimalInsert: PlayerInsert = {
        name: 'Иван Петров',
      };

      expect(minimalInsert.name).toBe('Иван Петров');
      expect(minimalInsert.id).toBeUndefined();
      expect(minimalInsert.rating).toBeUndefined();
    });

    it('accepts full fields for insert', () => {
      const fullInsert: PlayerInsert = {
        id: 'b1234567-e89b-12d3-a456-426614174000',
        name: 'Александър Георгиев',
        rating: 1580.0,
        created_at: '2026-10-02T10:00:00Z',
        updated_at: '2026-10-02T10:00:00Z',
      };

      expect(fullInsert.name).toBe('Александър Георгиев');
      expect(fullInsert.rating).toBe(1580.0);
    });
  });

  describe('PlayerUpdate type contract', () => {
    it('allows partial updates with only rating', () => {
      const updateRating: PlayerUpdate = {
        rating: 1250.0,
      };

      expect(updateRating.rating).toBe(1250.0);
      expect(updateRating.name).toBeUndefined();
    });

    it('allows partial updates with only name', () => {
      const updateName: PlayerUpdate = {
        name: 'Стефан Тодоров',
      };

      expect(updateName.name).toBe('Стефан Тодоров');
      expect(updateName.rating).toBeUndefined();
    });
  });

  describe('MatchRow and MatchPlayerRow type shapes and contracts', () => {
    it('accepts compliant MatchRow and MatchPlayerRow records', () => {
      const matchRow: MatchRow = {
        id: 'match-123',
        round: 1,
        tournament_id: 'tourn-abc-123',
        team_1_score: 5,
        team_2_score: 3,
        played_at: '2026-10-03T10:00:00.000Z',
        created_at: '2026-10-03T10:00:00.000Z',
        updated_at: '2026-10-03T10:00:00.000Z',
      };

      const matchPlayerRow: MatchPlayerRow = {
        id: 'mp-1',
        match_id: 'match-123',
        player_id: 'player-1',
        guest_name: null,
        team_side: 'team_1',
        rating_before: 1200,
        rating_after: 1215,
      };

      expect(matchRow.id).toBe('match-123');
      expect(matchRow.round).toBe(1);
      expect(matchRow.tournament_id).toBe('tourn-abc-123');
      expect(matchRow.team_1_score).toBe(5);
      expect(matchRow.team_2_score).toBe(3);
      expect(matchPlayerRow.team_side).toBe('team_1');
      expect(matchPlayerRow.player_id).toBe('player-1');
      expect(matchPlayerRow.guest_name).toBeNull();
    });

    it('accepts MatchRow with nullable scores and round for upcoming fixtures', () => {
      const upcomingMatchRow: MatchRow = {
        id: 'match-upcoming',
        round: null,
        tournament_id: null,
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-10-04T10:00:00.000Z',
        created_at: '2026-10-03T10:00:00.000Z',
        updated_at: '2026-10-03T10:00:00.000Z',
      };

      expect(upcomingMatchRow.round).toBeNull();
      expect(upcomingMatchRow.tournament_id).toBeNull();
      expect(upcomingMatchRow.team_1_score).toBeNull();
      expect(upcomingMatchRow.team_2_score).toBeNull();
    });

    it('maps correctly to the application domain MatchDetail model with mock Supabase response', () => {
      const mockSupabaseResponse: MatchDetail = {
        id: 'm-456',
        round: 2,
        tournament_id: 'tourn-789',
        team_1_score: 4,
        team_2_score: 2,
        played_at: '2026-10-03T11:00:00.000Z',
        created_at: '2026-10-03T11:00:00.000Z',
        updated_at: '2026-10-03T11:00:00.000Z',
        match_players: [
          {
            id: 'mp-1',
            match_id: 'm-456',
            player_id: 'p-1',
            guest_name: null,
            team_side: 'team_1',
            rating_before: 1300,
            rating_after: 1315,
            players: {
              id: 'p-1',
              name: 'Красимир Балъков',
            },
          },
          {
            id: 'mp-2',
            match_id: 'm-456',
            player_id: null,
            guest_name: 'Иван Гост',
            team_side: 'team_2',
            rating_before: null,
            rating_after: null,
            players: null,
          },
        ],
      };

      expect(mockSupabaseResponse.id).toBe('m-456');
      expect(mockSupabaseResponse.round).toBe(2);
      expect(mockSupabaseResponse.tournament_id).toBe('tourn-789');
      expect(mockSupabaseResponse.match_players).toHaveLength(2);
      expect(mockSupabaseResponse.match_players[0].players?.name).toBe('Красимир Балъков');
      expect(mockSupabaseResponse.match_players[1].guest_name).toBe('Иван Гост');
    });
  });

  describe('MatchInsert and MatchPlayerInsert type contracts', () => {
    it('accepts insert payloads with scores or with null scores and round', () => {
      const matchInsert: MatchInsert = {
        round: 1,
        tournament_id: 'tourn-1',
        team_1_score: 2,
        team_2_score: 1,
        played_at: '2026-10-03T12:00:00.000Z',
      };

      const upcomingInsert: MatchInsert = {
        round: null,
        tournament_id: null,
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-10-04T12:00:00.000Z',
      };

      const matchPlayerInsert: MatchPlayerInsert = {
        match_id: 'm-1',
        player_id: 'p-1',
        guest_name: null,
        team_side: 'team_1',
      };

      expect(matchInsert.round).toBe(1);
      expect(matchInsert.tournament_id).toBe('tourn-1');
      expect(matchInsert.team_1_score).toBe(2);
      expect(upcomingInsert.round).toBeNull();
      expect(upcomingInsert.tournament_id).toBeNull();
      expect(upcomingInsert.team_1_score).toBeNull();
      expect(upcomingInsert.team_2_score).toBeNull();
      expect(matchPlayerInsert.team_side).toBe('team_1');
    });
  });

  describe('MatchUpdate type contract', () => {
    it('allows updating scores and round to null or values', () => {
      const matchUpdateNull: MatchUpdate = {
        round: null,
        tournament_id: null,
        team_1_score: null,
        team_2_score: null,
      };

      const matchUpdateValues: MatchUpdate = {
        round: 3,
        tournament_id: 'tourn-update',
        team_1_score: 3,
        team_2_score: 0,
      };

      expect(matchUpdateNull.round).toBeNull();
      expect(matchUpdateNull.tournament_id).toBeNull();
      expect(matchUpdateNull.team_1_score).toBeNull();
      expect(matchUpdateValues.round).toBe(3);
      expect(matchUpdateValues.tournament_id).toBe('tourn-update');
      expect(matchUpdateValues.team_1_score).toBe(3);
    });
  });

  describe('TournamentRow type shape and contract', () => {
    it('accepts a fully compliant TournamentRow record', () => {
      const mockTournamentRow: TournamentRow = {
        id: 'tourn-uuid-1',
        title: 'Есенен турнир 2026',
        date: '2026-10-10',
        format: 'doubles',
        status: 'draft',
        winner_team_name: null,
        notes: 'Първо издание',
        created_at: '2026-10-10T10:00:00.000Z',
        updated_at: '2026-10-10T10:00:00.000Z',
      };

      expect(mockTournamentRow.id).toBe('tourn-uuid-1');
      expect(mockTournamentRow.title).toBe('Есенен турнир 2026');
      expect(mockTournamentRow.date).toBe('2026-10-10');
      expect(mockTournamentRow.format).toBe('doubles');
      expect(mockTournamentRow.status).toBe('draft');
      expect(mockTournamentRow.winner_team_name).toBeNull();
      expect(mockTournamentRow.notes).toBe('Първо издание');
      expect(mockTournamentRow.created_at).toBe('2026-10-10T10:00:00.000Z');
      expect(mockTournamentRow.updated_at).toBe('2026-10-10T10:00:00.000Z');
    });

    it('maps correctly to the domain Tournament model', () => {
      const dbRow: TournamentRow = {
        id: 'tourn-uuid-2',
        title: 'Пролетен шампионат',
        date: '2026-04-15',
        format: 'singles',
        status: 'completed',
        winner_team_name: 'Шампиони',
        notes: null,
        created_at: '2026-04-15T09:00:00.000Z',
        updated_at: '2026-04-15T18:00:00.000Z',
      };

      const domainTournament: Tournament = {
        id: dbRow.id,
        title: dbRow.title,
        date: dbRow.date,
        format: dbRow.format,
        status: dbRow.status,
        winner_team_name: dbRow.winner_team_name,
        notes: dbRow.notes,
        created_at: dbRow.created_at,
        updated_at: dbRow.updated_at,
      };

      expect(domainTournament).toEqual({
        id: 'tourn-uuid-2',
        title: 'Пролетен шампионат',
        date: '2026-04-15',
        format: 'singles',
        status: 'completed',
        winner_team_name: 'Шампиони',
        notes: null,
        created_at: '2026-04-15T09:00:00.000Z',
        updated_at: '2026-04-15T18:00:00.000Z',
      });
    });
  });

  describe('TournamentInsert type contract', () => {
    it('accepts minimal required fields (title only)', () => {
      const minimalInsert: TournamentInsert = {
        title: 'Бърз турнир',
      };

      expect(minimalInsert.title).toBe('Бърз турнир');
      expect(minimalInsert.id).toBeUndefined();
      expect(minimalInsert.date).toBeUndefined();
      expect(minimalInsert.format).toBeUndefined();
      expect(minimalInsert.status).toBeUndefined();
    });

    it('accepts full fields for insert', () => {
      const fullInsert: TournamentInsert = {
        id: 'custom-tourn-id',
        title: 'Голям зимен шлем',
        date: '2026-12-01',
        format: 'doubles',
        status: 'in_progress',
        winner_team_name: null,
        notes: '8 отбора',
        created_at: '2026-12-01T08:00:00.000Z',
        updated_at: '2026-12-01T08:00:00.000Z',
      };

      expect(fullInsert.title).toBe('Голям зимен шлем');
      expect(fullInsert.format).toBe('doubles');
      expect(fullInsert.status).toBe('in_progress');
      expect(fullInsert.notes).toBe('8 отбора');
    });
  });

  describe('TournamentUpdate type contract', () => {
    it('allows partial updates with title, status, or winner', () => {
      const updateStatus: TournamentUpdate = {
        status: 'completed',
        winner_team_name: 'Отбор 1',
      };

      expect(updateStatus.status).toBe('completed');
      expect(updateStatus.winner_team_name).toBe('Отбор 1');
      expect(updateStatus.title).toBeUndefined();
    });

    it('allows partial update of notes and title', () => {
      const updateNotes: TournamentUpdate = {
        title: 'Обновено заглавие',
        notes: 'Нови бележки',
      };

      expect(updateNotes.title).toBe('Обновено заглавие');
      expect(updateNotes.notes).toBe('Нови бележки');
      expect(updateNotes.status).toBeUndefined();
    });
  });

  describe('Supabase Client Typed Query Builder', () => {
    it('creates query builder typed for players, matches, match_players, and tournaments tables', () => {
      const playersQueryBuilder = supabase.from('players');
      expect(playersQueryBuilder).toBeDefined();
      expect(typeof playersQueryBuilder.select).toBe('function');

      const matchesQueryBuilder = supabase.from('matches');
      expect(matchesQueryBuilder).toBeDefined();
      expect(typeof matchesQueryBuilder.select).toBe('function');
      expect(typeof matchesQueryBuilder.insert).toBe('function');
      expect(typeof matchesQueryBuilder.update).toBe('function');
      expect(typeof matchesQueryBuilder.delete).toBe('function');

      const matchPlayersQueryBuilder = supabase.from('match_players');
      expect(matchPlayersQueryBuilder).toBeDefined();
      expect(typeof matchPlayersQueryBuilder.select).toBe('function');
      expect(typeof matchPlayersQueryBuilder.insert).toBe('function');
      expect(typeof matchPlayersQueryBuilder.delete).toBe('function');

      const tournamentsQueryBuilder = supabase.from('tournaments');
      expect(tournamentsQueryBuilder).toBeDefined();
      expect(typeof tournamentsQueryBuilder.select).toBe('function');
      expect(typeof tournamentsQueryBuilder.insert).toBe('function');
      expect(typeof tournamentsQueryBuilder.update).toBe('function');
      expect(typeof tournamentsQueryBuilder.delete).toBe('function');
    });
  });
});


