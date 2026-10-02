import { describe, it, expect } from 'vitest';
import type {
  PlayerRow,
  PlayerInsert,
  PlayerUpdate,
  MatchRow,
  MatchInsert,
  MatchPlayerRow,
  MatchPlayerInsert,
} from '../database.types';
import type { Player, MatchDetail } from '../index';
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
      expect(matchRow.team_1_score).toBe(5);
      expect(matchRow.team_2_score).toBe(3);
      expect(matchPlayerRow.team_side).toBe('team_1');
      expect(matchPlayerRow.player_id).toBe('player-1');
      expect(matchPlayerRow.guest_name).toBeNull();
    });

    it('maps correctly to the application domain MatchDetail model with mock Supabase response', () => {
      const mockSupabaseResponse: MatchDetail = {
        id: 'm-456',
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
      expect(mockSupabaseResponse.match_players).toHaveLength(2);
      expect(mockSupabaseResponse.match_players[0].players?.name).toBe('Красимир Балъков');
      expect(mockSupabaseResponse.match_players[1].guest_name).toBe('Иван Гост');
    });
  });

  describe('MatchInsert and MatchPlayerInsert type contracts', () => {
    it('accepts insert payloads', () => {
      const matchInsert: MatchInsert = {
        team_1_score: 2,
        team_2_score: 1,
        played_at: '2026-10-03T12:00:00.000Z',
      };

      const matchPlayerInsert: MatchPlayerInsert = {
        match_id: 'm-1',
        player_id: 'p-1',
        guest_name: null,
        team_side: 'team_1',
      };

      expect(matchInsert.team_1_score).toBe(2);
      expect(matchPlayerInsert.team_side).toBe('team_1');
    });
  });

  describe('Supabase Client Typed Query Builder', () => {
    it('creates query builder typed for players, matches, and match_players tables', () => {
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
    });
  });
});

