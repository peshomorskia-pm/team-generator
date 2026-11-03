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
    it('fetches players on mount and updates state sorted alphabetically by name', async () => {
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
      expect(orderMock).toHaveBeenCalledWith('name', { ascending: true });
      expect(result.current.players).toEqual([
        samplePlayers[0], // Димитър Бербатов
        samplePlayers[2], // Красимир Балъков
        samplePlayers[1], // Христо Стоичков
      ]);
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

      expect(result.current.players).toEqual([
        samplePlayers[0],
        samplePlayers[2],
        samplePlayers[1],
      ]);
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
        await result.current.createPlayer('  Мартин Петров  ');
      });

      expect(insertMock).toHaveBeenCalledWith({
        name: 'Мартин Петров',
      });
      expect(result.current.players).toHaveLength(2);
      expect(result.current.players[0].name).toBe('Димитър Бербатов');
      expect(result.current.players[1].name).toBe('Мартин Петров');
      expect(result.current.alert).toEqual({
        type: 'success',
        message: 'Играчът "Мартин Петров" е добавен успешно.',
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
        ...samplePlayers[2], // Балъков
        name: 'Красимир Балъков',
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
        await result.current.updatePlayer('3', 'Красимир Балъков');
      });

      expect(updateMock).toHaveBeenCalledWith({
        name: 'Красимир Балъков',
      });
      expect(eqMock).toHaveBeenCalledWith('id', '3');
      expect(result.current.players[0].name).toBe('Димитър Бербатов');
      expect(result.current.players[1].name).toBe('Красимир Балъков');
      expect(result.current.players[2].name).toBe('Христо Стоичков');
      expect(result.current.alert).toEqual({
        type: 'success',
        message: 'Играчът "Красимир Балъков" е обновен успешно.',
      });
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
        await result.current.updatePlayer('non-existent', 'Тест');
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
        await result.current.updatePlayer('1', 'Тест');
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
