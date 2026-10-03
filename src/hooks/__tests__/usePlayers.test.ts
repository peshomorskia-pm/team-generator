import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePlayers } from '../usePlayers';
import * as supabaseModule from '../../lib/supabase';
import type { PlayerRow } from '../../types/database.types';

const mockFrom = vi.fn();

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: (table: string) => mockFrom(table),
    },
    isSupabaseConfigured: vi.fn(() => true),
  };
});

describe('usePlayers hook', () => {
  const samplePlayers: PlayerRow[] = [
    {
      id: '1',
      name: 'Димитър Бербатов',
      rating: 1800,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Христо Стоичков',
      rating: 1950,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'Красимир Балъков',
      rating: 1400,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(true);
  });

  describe('fetchPlayers', () => {
    it('fetches players on mount and updates state sorted by rating', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: samplePlayers,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result } = renderHook(() => usePlayers());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith('players');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(orderMock).toHaveBeenCalledWith('rating', { ascending: false });
      expect(result.current.players).toEqual(samplePlayers);
      expect(result.current.error).toBeNull();
      expect(result.current.alert).toBeNull();
    });

    it('sets error and alert when fetch query returns an error', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual([]);
      expect(result.current.error).toBe('Database connection failed');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Database connection failed',
      });
    });

    it('handles unexpected exceptions during fetch gracefully', async () => {
      const orderMock = vi.fn().mockRejectedValue(new Error('Network offline'));
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network offline');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Network offline',
      });
    });

    it('sets error when Supabase is not configured', async () => {
      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Supabase не е конфигуриран.');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Supabase не е конфигуриран.',
      });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('can be manually triggered via fetchPlayers callback', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: samplePlayers,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.fetchPlayers();
      });

      expect(result.current.players).toEqual(samplePlayers);
    });

    it('manually calling fetchPlayers handles error and unconfigured cases gracefully', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ order: orderMock }) });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Test error from query
      const failedOrderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Manual fetch query error' },
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: failedOrderMock }),
      });

      await act(async () => {
        await result.current.fetchPlayers();
      });

      expect(result.current.error).toBe('Manual fetch query error');

      // Test unconfigured case
      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);
      await act(async () => {
        await result.current.fetchPlayers();
      });

      expect(result.current.error).toBe('Supabase не е конфигуриран.');
    });
  });

  describe('createPlayer', () => {
    it('creates a new player, merges into local state and sets success alert', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [samplePlayers[0]],
        error: null,
      });
      const fetchSelect = vi.fn().mockReturnValue({ order: orderMock });

      const newPlayer: PlayerRow = {
        id: 'new-1',
        name: 'Мартин Петров',
        rating: 1600,
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      };

      const singleMock = vi.fn().mockResolvedValue({ data: newPlayer, error: null });
      const insertSelect = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: insertSelect });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'players') {
          return {
            select: fetchSelect,
            insert: insertMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => usePlayers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createPlayer('  Мартин Петров  ', 1600);
      });

      expect(insertMock).toHaveBeenCalledWith({
        name: 'Мартин Петров',
        rating: 1600,
        singles_rating: 1600,
        doubles_rating: 1600,
      });
      expect(result.current.players).toHaveLength(2);
      expect(result.current.players[0].name).toBe('Димитър Бербатов'); // 1800 > 1600
      expect(result.current.players[1].name).toBe('Мартин Петров');
      expect(result.current.alert).toEqual({
        type: 'success',
        message: 'Играчът "Мартин Петров" е добавен успешно.',
      });
    });

    it('defaults rating to 1200 if rating is omitted or invalid', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const fetchSelect = vi.fn().mockReturnValue({ order: orderMock });

      const newPlayer: PlayerRow = {
        id: 'new-2',
        name: 'Новак',
        rating: 1200,
        singles_rating: 1200,
        doubles_rating: 1200,
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      };

      const singleMock = vi.fn().mockResolvedValue({ data: newPlayer, error: null });
      const insertSelect = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: insertSelect });

      mockFrom.mockReturnValue({
        select: fetchSelect,
        insert: insertMock,
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createPlayer('Новак');
      });

      expect(insertMock).toHaveBeenCalledWith({
        name: 'Новак',
        rating: 1200,
        singles_rating: 1200,
        doubles_rating: 1200,
      });
    });

    it('creates player with explicit singles and doubles ratings in payload', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const fetchSelect = vi.fn().mockReturnValue({ order: orderMock });

      const newPlayer: PlayerRow = {
        id: 'new-3',
        name: 'Григор Димитров',
        rating: 1900,
        singles_rating: 2100,
        doubles_rating: 1800,
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      };

      const singleMock = vi.fn().mockResolvedValue({ data: newPlayer, error: null });
      const insertSelect = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: insertSelect });

      mockFrom.mockReturnValue({
        select: fetchSelect,
        insert: insertMock,
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createPlayer('Григор Димитров', 1900, 2100, 1800);
      });

      expect(insertMock).toHaveBeenCalledWith({
        name: 'Григор Димитров',
        rating: 1900,
        singles_rating: 2100,
        doubles_rating: 1800,
      });
    });

    it('handles create failure and updates error and alert states gracefully', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const fetchSelect = vi.fn().mockReturnValue({ order: orderMock });

      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert constraint error' },
      });
      const insertSelect = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: insertSelect });

      mockFrom.mockReturnValue({
        select: fetchSelect,
        insert: insertMock,
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createPlayer('Грешен');
      });

      expect(result.current.error).toBe('Insert constraint error');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Insert constraint error',
      });
    });

    it('handles create when Supabase is not configured', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: orderMock }),
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      await act(async () => {
        await result.current.createPlayer('Тест');
      });

      expect(result.current.error).toBe('Supabase не е конфигуриран.');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Supabase не е конфигуриран.',
      });
    });
  });

  describe('updatePlayer', () => {
    it('updates player data, re-sorts list, and triggers success alert', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [...samplePlayers],
        error: null,
      });
      const fetchSelect = vi.fn().mockReturnValue({ order: orderMock });

      const updatedRow: PlayerRow = {
        ...samplePlayers[2], // Балъков (was 1400)
        rating: 2000,
      };

      const singleMock = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
      const updateSelect = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: updateSelect });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockReturnValue({
        select: fetchSelect,
        update: updateMock,
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updatePlayer('3', 'Красимир Балъков', 2000);
      });

      expect(updateMock).toHaveBeenCalledWith({
        name: 'Красимир Балъков',
        rating: 2000,
        singles_rating: 2000,
        doubles_rating: 2000,
      });
      expect(eqMock).toHaveBeenCalledWith('id', '3');
      expect(result.current.players[0].name).toBe('Красимир Балъков'); // 2000 is now highest
      expect(result.current.alert).toEqual({
        type: 'success',
        message: 'Играчът "Красимир Балъков" е обновен успешно.',
      });
    });

    it('updates player with explicit singles and doubles ratings in payload', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: samplePlayers, error: null });
      const fetchSelect = vi.fn().mockReturnValue({ order: orderMock });

      const updatedRow: PlayerRow = {
        ...samplePlayers[2],
        name: 'Красимир Балъков',
        rating: 2000,
        singles_rating: 1950,
        doubles_rating: 2050,
      };

      const singleMock = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
      const updateSelect = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: updateSelect });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockReturnValue({
        select: fetchSelect,
        update: updateMock,
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updatePlayer('3', 'Красимир Балъков', 2000, 1950, 2050);
      });

      expect(updateMock).toHaveBeenCalledWith({
        name: 'Красимир Балъков',
        rating: 2000,
        singles_rating: 1950,
        doubles_rating: 2050,
      });
      expect(eqMock).toHaveBeenCalledWith('id', '3');
    });

    it('handles update failure and updates error and alert states gracefully', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: samplePlayers, error: null });
      const fetchSelect = vi.fn().mockReturnValue({ order: orderMock });

      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      });
      const updateSelect = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: updateSelect });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockReturnValue({
        select: fetchSelect,
        update: updateMock,
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updatePlayer('non-existent', 'Тест', 1200);
      });

      expect(result.current.error).toBe('Row not found');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Row not found',
      });
    });

    it('handles update when Supabase is not configured', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: orderMock }),
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      await act(async () => {
        await result.current.updatePlayer('1', 'Тест', 1500);
      });

      expect(result.current.error).toBe('Supabase не е конфигуриран.');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Supabase не е конфигуриран.',
      });
    });
  });

  describe('deletePlayer', () => {
    it('deletes player from Supabase and removes from local state', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [...samplePlayers],
        error: null,
      });
      const fetchSelect = vi.fn().mockReturnValue({ order: orderMock });

      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockReturnValue({
        select: fetchSelect,
        delete: deleteMock,
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deletePlayer('1');
      });

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', '1');
      expect(result.current.players.find((p) => p.id === '1')).toBeUndefined();
      expect(result.current.players).toHaveLength(2);
      expect(result.current.alert).toEqual({
        type: 'success',
        message: 'Играчът "Димитър Бербатов" е изтрит успешно.',
      });
    });

    it('handles delete failure and updates error and alert states gracefully', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: samplePlayers, error: null });
      const fetchSelect = vi.fn().mockReturnValue({ order: orderMock });

      const eqMock = vi.fn().mockResolvedValue({
        error: { message: 'Foreign key constraint' },
      });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockReturnValue({
        select: fetchSelect,
        delete: deleteMock,
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deletePlayer('1');
      });

      expect(result.current.error).toBe('Foreign key constraint');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Foreign key constraint',
      });
    });

    it('handles delete when Supabase is not configured', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: orderMock }),
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      await act(async () => {
        await result.current.deletePlayer('1');
      });

      expect(result.current.error).toBe('Supabase не е конфигуриран.');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Supabase не е конфигуриран.',
      });
    });
  });

  describe('clearAlert', () => {
    it('clears active alert', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Some error' },
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: orderMock }),
      });

      const { result } = renderHook(() => usePlayers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.alert).not.toBeNull();

      act(() => {
        result.current.clearAlert();
      });

      expect(result.current.alert).toBeNull();
    });
  });
});
