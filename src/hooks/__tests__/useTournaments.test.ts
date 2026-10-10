import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTournaments } from '../useTournaments';
import * as supabaseModule from '../../lib/supabase';
import type { Tournament, CreateTournamentInput, UpdateTournamentInput } from '../../types/tournament';

const mockFrom = vi.fn();

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: (table: string) => mockFrom(table),
    },
    isSupabaseConfigured: vi.fn(() => true),
  };
});

describe('useTournaments hook', () => {
  const sampleTournaments: Tournament[] = [
    {
      id: 'tourn-1',
      title: 'Есенен турнир 2026',
      date: '2026-10-10',
      format: 'doubles',
      status: 'in_progress',
      winner_team_name: null,
      notes: 'Групова фаза',
      created_at: '2026-10-10T10:00:00.000Z',
      updated_at: '2026-10-10T10:00:00.000Z',
    },
    {
      id: 'tourn-2',
      title: 'Летен турнир 2026',
      date: '2026-07-15',
      format: 'singles',
      status: 'completed',
      winner_team_name: 'Иван Иванов',
      notes: null,
      created_at: '2026-07-15T09:00:00.000Z',
      updated_at: '2026-07-15T18:00:00.000Z',
    },
  ];

  const setupFetchMock = (data: Tournament[] | null = sampleTournaments, error: unknown = null) => {
    const orderMock2 = vi.fn().mockResolvedValue({ data, error });
    const orderMock1 = vi.fn().mockReturnValue({ order: orderMock2 });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock1 });

    mockFrom.mockReturnValue({
      select: selectMock,
    });

    return { selectMock, orderMock1, orderMock2 };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(true);
  });

  describe('Initial Mount and fetchTournaments', () => {
    it('fetches tournaments on mount and sets loading to false', async () => {
      const { selectMock, orderMock1, orderMock2 } = setupFetchMock();

      const { result } = renderHook(() => useTournaments());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith('tournaments');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(orderMock1).toHaveBeenCalledWith('date', { ascending: false });
      expect(orderMock2).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.current.tournaments).toEqual(sampleTournaments);
      expect(result.current.error).toBeNull();
    });

    it('sets error when Supabase is not configured on mount', async () => {
      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      const { result } = renderHook(() => useTournaments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tournaments).toEqual([]);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Supabase не е конфигуриран.');
    });

    it('sets error when fetch query returns an error', async () => {
      setupFetchMock(null, { message: 'Failed to fetch tournaments' });

      const { result } = renderHook(() => useTournaments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tournaments).toEqual([]);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch tournaments');
    });

    it('handles unexpected exceptions during fetch gracefully', async () => {
      const orderMock2 = vi.fn().mockRejectedValue(new Error('Network error'));
      const orderMock1 = vi.fn().mockReturnValue({ order: orderMock2 });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock1 });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result } = renderHook(() => useTournaments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tournaments).toEqual([]);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });

    it('manually calling fetchTournaments refetches data', async () => {
      const { orderMock2 } = setupFetchMock(sampleTournaments);

      const { result } = renderHook(() => useTournaments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const updatedList: Tournament[] = [
        ...sampleTournaments,
        {
          id: 'tourn-3',
          title: 'Нов турнир',
          date: '2026-11-01',
          format: 'doubles',
          status: 'draft',
          winner_team_name: null,
          notes: null,
          created_at: '2026-11-01T10:00:00.000Z',
          updated_at: '2026-11-01T10:00:00.000Z',
        },
      ];

      orderMock2.mockResolvedValueOnce({ data: updatedList, error: null });

      await act(async () => {
        await result.current.fetchTournaments();
      });

      expect(result.current.tournaments).toEqual(updatedList);
    });

    it('handles unmounted component during async fetch', async () => {
      let resolvePromise: (value: unknown) => void = () => {};
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const orderMock2 = vi.fn().mockReturnValue(pendingPromise);
      const orderMock1 = vi.fn().mockReturnValue({ order: orderMock2 });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock1 });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result, unmount } = renderHook(() => useTournaments());

      expect(result.current.loading).toBe(true);

      unmount();

      resolvePromise({ data: sampleTournaments, error: null });
      await act(async () => {
        await Promise.resolve();
      });

      // Does not throw and initial state stays intact
      expect(result.current.tournaments).toEqual([]);
    });
  });

  describe('createTournament', () => {
    it('creates a new tournament and updates local state', async () => {
      const { selectMock } = setupFetchMock([]);

      const newTournament: Tournament = {
        id: 'tourn-new-1',
        title: 'Купа на откриването',
        date: '2026-10-15',
        format: 'doubles',
        status: 'draft',
        winner_team_name: null,
        notes: null,
        created_at: '2026-10-10T11:00:00.000Z',
        updated_at: '2026-10-10T11:00:00.000Z',
      };

      const singleMock = vi.fn().mockResolvedValue({ data: newTournament, error: null });
      const insertSelect = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: insertSelect });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') {
          return {
            select: selectMock,
            insert: insertMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useTournaments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const input: CreateTournamentInput = {
        title: 'Купа на откриването',
        format: 'doubles',
      };

      let created: Tournament | undefined;
      await act(async () => {
        created = await result.current.createTournament(input);
      });

      expect(insertMock).toHaveBeenCalledWith(input);
      expect(created).toEqual(newTournament);
      expect(result.current.tournaments).toEqual([newTournament]);
      expect(result.current.error).toBeNull();
    });

    it('sets error and throws when createTournament fails', async () => {
      const { selectMock } = setupFetchMock([]);

      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert constraint violated' },
      });
      const insertSelect = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: insertSelect });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') {
          return {
            select: selectMock,
            insert: insertMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useTournaments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(
          result.current.createTournament({ title: 'Невалиден' })
        ).rejects.toThrow('Insert constraint violated');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Insert constraint violated');
    });

    it('throws error when creating while Supabase is not configured', async () => {
      setupFetchMock([]);

      const { result } = renderHook(() => useTournaments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      await act(async () => {
        await expect(
          result.current.createTournament({ title: 'Тест' })
        ).rejects.toThrow('Supabase не е конфигуриран.');
      });

      expect(result.current.error?.message).toBe('Supabase не е конфигуриран.');
    });
  });

  describe('updateTournament', () => {
    it('updates tournament in local state', async () => {
      const { selectMock } = setupFetchMock(sampleTournaments);

      const updatedTournament: Tournament = {
        ...sampleTournaments[0],
        title: 'Есенен турнир 2026 - Финали',
        status: 'completed',
        winner_team_name: 'Шампиони',
      };

      const singleMock = vi.fn().mockResolvedValue({ data: updatedTournament, error: null });
      const updateSelect = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: updateSelect });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') {
          return {
            select: selectMock,
            update: updateMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useTournaments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const updateInput: UpdateTournamentInput = {
        title: 'Есенен турнир 2026 - Финали',
        status: 'completed',
        winner_team_name: 'Шампиони',
      };

      let updated: Tournament | undefined;
      await act(async () => {
        updated = await result.current.updateTournament('tourn-1', updateInput);
      });

      expect(updateMock).toHaveBeenCalledWith(updateInput);
      expect(eqMock).toHaveBeenCalledWith('id', 'tourn-1');
      expect(updated).toEqual(updatedTournament);
      expect(result.current.tournaments[0]).toEqual(updatedTournament);
      expect(result.current.tournaments[1]).toEqual(sampleTournaments[1]);
      expect(result.current.error).toBeNull();
    });

    it('sets error and throws when updateTournament fails', async () => {
      const { selectMock } = setupFetchMock(sampleTournaments);

      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database update failed' },
      });
      const updateSelect = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: updateSelect });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') {
          return {
            select: selectMock,
            update: updateMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useTournaments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(
          result.current.updateTournament('tourn-1', { title: 'Грешка' })
        ).rejects.toThrow('Database update failed');
      });

      expect(result.current.error?.message).toBe('Database update failed');
    });

    it('throws error when updating while Supabase is not configured', async () => {
      setupFetchMock(sampleTournaments);

      const { result } = renderHook(() => useTournaments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      await act(async () => {
        await expect(
          result.current.updateTournament('tourn-1', { title: 'Тест' })
        ).rejects.toThrow('Supabase не е конфигуриран.');
      });

      expect(result.current.error?.message).toBe('Supabase не е конфигуриран.');
    });
  });

  describe('deleteTournament', () => {
    it('deletes tournament and removes it from local state', async () => {
      const { selectMock } = setupFetchMock(sampleTournaments);

      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') {
          return {
            select: selectMock,
            delete: deleteMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useTournaments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.tournaments).toHaveLength(2);

      await act(async () => {
        await result.current.deleteTournament('tourn-1');
      });

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'tourn-1');
      expect(result.current.tournaments).toHaveLength(1);
      expect(result.current.tournaments[0].id).toBe('tourn-2');
      expect(result.current.error).toBeNull();
    });

    it('sets error and throws when deleteTournament fails', async () => {
      const { selectMock } = setupFetchMock(sampleTournaments);

      const eqMock = vi.fn().mockResolvedValue({ error: { message: 'Row locked' } });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tournaments') {
          return {
            select: selectMock,
            delete: deleteMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useTournaments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(
          result.current.deleteTournament('tourn-1')
        ).rejects.toThrow('Row locked');
      });

      expect(result.current.error?.message).toBe('Row locked');
    });

    it('throws error when deleting while Supabase is not configured', async () => {
      setupFetchMock(sampleTournaments);

      const { result } = renderHook(() => useTournaments());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      await act(async () => {
        await expect(
          result.current.deleteTournament('tourn-1')
        ).rejects.toThrow('Supabase не е конфигуриран.');
      });

      expect(result.current.error?.message).toBe('Supabase не е конфигуриран.');
    });
  });
});
