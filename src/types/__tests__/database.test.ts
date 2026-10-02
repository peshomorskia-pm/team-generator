import { describe, it, expect } from 'vitest';
import type { PlayerRow, PlayerInsert, PlayerUpdate } from '../database.types';
import type { Player } from '../index';
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

  describe('Supabase Client Typed Query Builder', () => {
    it('creates query builder typed for players table', () => {
      const queryBuilder = supabase.from('players');
      expect(queryBuilder).toBeDefined();
      expect(typeof queryBuilder.select).toBe('function');
      expect(typeof queryBuilder.insert).toBe('function');
      expect(typeof queryBuilder.update).toBe('function');
      expect(typeof queryBuilder.delete).toBe('function');
    });
  });
});
