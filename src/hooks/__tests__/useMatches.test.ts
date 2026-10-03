import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMatches } from '../useMatches';
import * as supabaseModule from '../../lib/supabase';
import type { MatchDetail, MatchFormData } from '../../types/matches';

const mockFrom = vi.fn();

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: (table: string) => mockFrom(table),
    },
    isSupabaseConfigured: vi.fn(() => true),
  };
});

describe('useMatches hook', () => {
  const sampleMatches: MatchDetail[] = [
    {
      id: 'match-1',
      team_1_score: 5,
      team_2_score: 3,
      played_at: '2026-10-02T18:00:00Z',
      created_at: '2026-10-02T18:00:00Z',
      updated_at: '2026-10-02T18:00:00Z',
      match_players: [
        {
          id: 'mp-1',
          match_id: 'match-1',
          player_id: 'p-1',
          guest_name: null,
          team_side: 'team_1',
          rating_before: 1200,
          rating_after: 1215,
          players: { id: 'p-1', name: 'Иван' },
        },
        {
          id: 'mp-2',
          match_id: 'match-1',
          player_id: null,
          guest_name: 'Петър Гост',
          team_side: 'team_2',
          rating_before: null,
          rating_after: null,
          players: null,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(true);
  });

  describe('fetchMatches (Mount & Manual)', () => {
    it('fetches matches on mount and updates state sorted by date', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: sampleMatches,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result } = renderHook(() => useMatches());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith('matches');
      expect(result.current.matches).toEqual(sampleMatches);
      expect(result.current.error).toBeNull();
      expect(result.current.alert).toBeNull();
    });

    it('fetches matches containing both upcoming fixtures (null scores) and completed matches', async () => {
      const mixedMatches: MatchDetail[] = [
        {
          id: 'upcoming-1',
          team_1_score: null,
          team_2_score: null,
          played_at: '2026-10-10T18:00:00Z',
          created_at: '2026-10-02T18:00:00Z',
          updated_at: '2026-10-02T18:00:00Z',
          match_players: [],
        },
        ...sampleMatches,
      ];
      const orderMock = vi.fn().mockResolvedValue({
        data: mixedMatches,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.matches).toHaveLength(2);
      expect(result.current.matches[0].team_1_score).toBeNull();
      expect(result.current.matches[0].team_2_score).toBeNull();
      expect(result.current.matches[1].team_1_score).toBe(5);
    });

    it('sets error and alert when fetch query returns an error', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result } = renderHook(() => useMatches());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.matches).toEqual([]);
      expect(result.current.error).toBe('Database connection failed');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Database connection failed',
      });
    });

    it('sets error when Supabase is not configured (offline fallback)', async () => {
      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      const { result } = renderHook(() => useMatches());

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

    it('can be manually re-triggered via fetchMatches callback', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: sampleMatches,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.fetchMatches();
      });

      expect(result.current.matches).toEqual(sampleMatches);
    });

    it('handles manual fetch error gracefully', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ order: orderMock }) });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const failedOrderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query timed out' },
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: failedOrderMock }),
      });

      await act(async () => {
        await result.current.fetchMatches();
      });

      expect(result.current.error).toBe('Query timed out');
      expect(result.current.alert?.message).toBe('Query timed out');
    });
  });

  describe('createMatch', () => {
    it('inserts match and players, updates state and shows success alert', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: sampleMatches,
        error: null,
      });
      const initialSelect = vi.fn().mockReturnValue({ order: orderMock });

      const createdMatchRow = {
        id: 'match-2',
        team_1_score: 4,
        team_2_score: 1,
        played_at: '2026-10-03T19:00:00Z',
        created_at: '2026-10-03T19:00:00Z',
        updated_at: '2026-10-03T19:00:00Z',
      };

      const createdMatchPlayers = [
        {
          id: 'mp-3',
          match_id: 'match-2',
          player_id: 'p-2',
          guest_name: null,
          team_side: 'team_1',
          rating_before: null,
          rating_after: null,
          players: { id: 'p-2', name: 'Георги' },
        },
        {
          id: 'mp-4',
          match_id: 'match-2',
          player_id: null,
          guest_name: 'Стоян',
          team_side: 'team_2',
          rating_before: null,
          rating_after: null,
          players: null,
        },
      ];

      const matchSingleMock = vi.fn().mockResolvedValue({ data: createdMatchRow, error: null });
      const matchInsertSelect = vi.fn().mockReturnValue({ single: matchSingleMock });
      const matchInsertMock = vi.fn().mockReturnValue({ select: matchInsertSelect });

      const playersSelectMock = vi.fn().mockResolvedValue({ data: createdMatchPlayers, error: null });
      const playersInsertMock = vi.fn().mockReturnValue({ select: playersSelectMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: initialSelect,
            insert: matchInsertMock,
          };
        }
        if (table === 'match_players') {
          return {
            insert: playersInsertMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const newMatchData: MatchFormData = {
        team_1_score: 4,
        team_2_score: 1,
        played_at: '2026-10-03T19:00:00Z',
        team_1_players: [{ player_id: 'p-2' }],
        team_2_players: [{ guest_name: 'Стоян' }],
      };

      let resultSuccess: boolean | undefined;
      await act(async () => {
        resultSuccess = await result.current.createMatch(newMatchData);
      });

      expect(resultSuccess).toBe(true);

      expect(matchInsertMock).toHaveBeenCalledWith({
        team_1_score: 4,
        team_2_score: 1,
        played_at: '2026-10-03T19:00:00Z',
      });
      expect(playersInsertMock).toHaveBeenCalledWith([
        {
          match_id: 'match-2',
          player_id: 'p-2',
          guest_name: null,
          team_side: 'team_1',
        },
        {
          match_id: 'match-2',
          player_id: null,
          guest_name: 'Стоян',
          team_side: 'team_2',
        },
      ]);
      expect(result.current.matches).toHaveLength(2);
      expect(result.current.matches[0].id).toBe('match-2'); // 2026-10-03 is newer than 2026-10-02
      expect(result.current.alert).toEqual({
        type: 'success',
        message: 'Мачът е записан успешно.',
      });
    });

    it('creates upcoming match with null scores and sorts correctly', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: sampleMatches,
        error: null,
      });
      const initialSelect = vi.fn().mockReturnValue({ order: orderMock });

      const createdUpcomingMatch = {
        id: 'match-upcoming-future',
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-10-10T19:00:00Z',
        created_at: '2026-10-03T19:00:00Z',
        updated_at: '2026-10-03T19:00:00Z',
      };

      const matchSingleMock = vi.fn().mockResolvedValue({ data: createdUpcomingMatch, error: null });
      const matchInsertSelect = vi.fn().mockReturnValue({ single: matchSingleMock });
      const matchInsertMock = vi.fn().mockReturnValue({ select: matchInsertSelect });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: initialSelect,
            insert: matchInsertMock,
          };
        }
        if (table === 'match_players') {
          return {
            insert: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [], error: null }) }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const newMatchData: MatchFormData = {
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-10-10T19:00:00Z',
        team_1_players: [],
        team_2_players: [],
      };

      await act(async () => {
        await result.current.createMatch(newMatchData);
      });

      expect(matchInsertMock).toHaveBeenCalledWith({
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-10-10T19:00:00Z',
      });
      expect(result.current.matches[0].id).toBe('match-upcoming-future');
      expect(result.current.matches[0].team_1_score).toBeNull();
      expect(result.current.matches[0].team_2_score).toBeNull();
    });

    it('handles create match error when matches insert fails', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const initialSelect = vi.fn().mockReturnValue({ order: orderMock });

      const matchSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert score failed' },
      });
      const matchInsertSelect = vi.fn().mockReturnValue({ single: matchSingleMock });
      const matchInsertMock = vi.fn().mockReturnValue({ select: matchInsertSelect });

      mockFrom.mockReturnValue({
        select: initialSelect,
        insert: matchInsertMock,
      });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let resultSuccess: boolean | undefined;
      await act(async () => {
        resultSuccess = await result.current.createMatch({
          team_1_score: 2,
          team_2_score: 0,
          played_at: '2026-10-03T10:00:00Z',
          team_1_players: [],
          team_2_players: [],
        });
      });

      expect(resultSuccess).toBe(false);
      expect(result.current.error).toBe('Insert score failed');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Insert score failed',
      });
    });

    it('handles create match error when match_players insert fails', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const initialSelect = vi.fn().mockReturnValue({ order: orderMock });

      const createdMatchRow = {
        id: 'match-x',
        team_1_score: 2,
        team_2_score: 1,
        played_at: '2026-10-03T10:00:00Z',
        created_at: '2026-10-03T10:00:00Z',
        updated_at: '2026-10-03T10:00:00Z',
      };
      const matchSingleMock = vi.fn().mockResolvedValue({ data: createdMatchRow, error: null });
      const matchInsertSelect = vi.fn().mockReturnValue({ single: matchSingleMock });
      const matchInsertMock = vi.fn().mockReturnValue({ select: matchInsertSelect });

      const playersSelectMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Players constraint failed' },
      });
      const playersInsertMock = vi.fn().mockReturnValue({ select: playersSelectMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return { select: initialSelect, insert: matchInsertMock };
        }
        if (table === 'match_players') {
          return { insert: playersInsertMock };
        }
        return {};
      });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createMatch({
          team_1_score: 2,
          team_2_score: 1,
          played_at: '2026-10-03T10:00:00Z',
          team_1_players: [{ player_id: 'p-1' }],
          team_2_players: [],
        });
      });

      expect(result.current.error).toBe('Players constraint failed');
    });

    it('sets error on create when Supabase is not configured', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ order: orderMock }) });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      await act(async () => {
        await result.current.createMatch({
          team_1_score: 1,
          team_2_score: 1,
          played_at: '2026-10-03T10:00:00Z',
          team_1_players: [],
          team_2_players: [],
        });
      });

      expect(result.current.error).toBe('Supabase не е конфигуриран.');
    });
  });

  describe('updateMatch', () => {
    it('modifies match and players, updates state and shows success alert', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [...sampleMatches],
        error: null,
      });
      const initialSelect = vi.fn().mockReturnValue({ order: orderMock });

      const updatedMatchRow = {
        id: 'match-1',
        team_1_score: 6,
        team_2_score: 4,
        played_at: '2026-10-02T19:00:00Z',
        created_at: '2026-10-02T18:00:00Z',
        updated_at: '2026-10-02T19:00:00Z',
      };

      const updatedPlayers = [
        {
          id: 'mp-new',
          match_id: 'match-1',
          player_id: 'p-3',
          guest_name: null,
          team_side: 'team_1',
          rating_before: null,
          rating_after: null,
          players: { id: 'p-3', name: 'Христо' },
        },
      ];

      const singleMock = vi.fn().mockResolvedValue({ data: updatedMatchRow, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock });

      const playersSelectMock = vi.fn().mockResolvedValue({ data: updatedPlayers, error: null });
      const playersInsertMock = vi.fn().mockReturnValue({ select: playersSelectMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: initialSelect,
            update: updateMock,
          };
        }
        if (table === 'match_players') {
          return {
            delete: deleteMock,
            insert: playersInsertMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMatch('match-1', {
          team_1_score: 6,
          team_2_score: 4,
          played_at: '2026-10-02T19:00:00Z',
          team_1_players: [{ player_id: 'p-3' }],
          team_2_players: [],
        });
      });

      expect(updateMock).toHaveBeenCalledWith({
        team_1_score: 6,
        team_2_score: 4,
        played_at: '2026-10-02T19:00:00Z',
      });
      expect(deleteEqMock).toHaveBeenCalledWith('match_id', 'match-1');
      expect(result.current.matches[0].team_1_score).toBe(6);
      expect(result.current.matches[0].team_2_score).toBe(4);
      expect(result.current.matches[0].match_players).toEqual(updatedPlayers);
      expect(result.current.alert).toEqual({
        type: 'success',
        message: 'Мачът е обновен успешно.',
      });
    });

    it('updates existing match with null scores', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [...sampleMatches],
        error: null,
      });
      const initialSelect = vi.fn().mockReturnValue({ order: orderMock });

      const updatedRow = {
        id: 'match-1',
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-10-02T19:00:00Z',
        created_at: '2026-10-02T18:00:00Z',
        updated_at: '2026-10-02T19:00:00Z',
      };

      const singleMock = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: initialSelect,
            update: updateMock,
          };
        }
        if (table === 'match_players') {
          return {
            delete: deleteMock,
            insert: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [], error: null }) }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMatch('match-1', {
          team_1_score: null,
          team_2_score: null,
          played_at: '2026-10-02T19:00:00Z',
          team_1_players: [],
          team_2_players: [],
        });
      });

      expect(updateMock).toHaveBeenCalledWith({
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-10-02T19:00:00Z',
      });
      expect(result.current.matches[0].team_1_score).toBeNull();
      expect(result.current.matches[0].team_2_score).toBeNull();
    });

    it('handles update failure gracefully', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: sampleMatches, error: null });
      const initialSelect = vi.fn().mockReturnValue({ order: orderMock });

      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockReturnValue({
        select: initialSelect,
        update: updateMock,
      });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMatch('non-existent', {
          team_1_score: 1,
          team_2_score: 1,
          played_at: '2026-10-03T10:00:00Z',
          team_1_players: [],
          team_2_players: [],
        });
      });

      expect(result.current.error).toBe('Row not found');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Row not found',
      });
    });

    it('sets error on update when Supabase is not configured', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ order: orderMock }) });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      await act(async () => {
        await result.current.updateMatch('match-1', {
          team_1_score: 2,
          team_2_score: 1,
          played_at: '2026-10-03T10:00:00Z',
          team_1_players: [],
          team_2_players: [],
        });
      });

      expect(result.current.error).toBe('Supabase не е конфигуриран.');
    });
  });

  describe('deleteMatch', () => {
    it('removes match from state and shows success alert', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [...sampleMatches],
        error: null,
      });
      const initialSelect = vi.fn().mockReturnValue({ order: orderMock });

      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockReturnValue({
        select: initialSelect,
        delete: deleteMock,
      });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteMatch('match-1');
      });

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'match-1');
      expect(result.current.matches).toHaveLength(0);
      expect(result.current.alert).toEqual({
        type: 'success',
        message: 'Мачът е изтрит успешно.',
      });
    });

    it('handles delete failure gracefully', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: sampleMatches, error: null });
      const initialSelect = vi.fn().mockReturnValue({ order: orderMock });

      const eqMock = vi.fn().mockResolvedValue({
        error: { message: 'Foreign key error' },
      });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockFrom.mockReturnValue({
        select: initialSelect,
        delete: deleteMock,
      });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteMatch('match-1');
      });

      expect(result.current.error).toBe('Foreign key error');
      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Foreign key error',
      });
    });

    it('sets error on delete when Supabase is not configured', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ order: orderMock }) });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

      await act(async () => {
        await result.current.deleteMatch('match-1');
      });

      expect(result.current.error).toBe('Supabase не е конфигуриран.');
    });
  });

  describe('clearAlert', () => {
    it('clears alert state', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Some error' },
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: orderMock }),
      });

      const { result } = renderHook(() => useMatches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.alert).not.toBeNull();

      act(() => {
        result.current.clearAlert();
      });

      expect(result.current.alert).toBeNull();
    });
  });
});
