import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRankings } from '../useRankings';
import * as supabaseModule from '../../lib/supabase';
import type { PlayerRow } from '../../types/database.types';

const mockFrom = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

describe('useRankings hook', () => {
  const mockPlayers: PlayerRow[] = [
    {
      id: 'p-1',
      name: 'Григор Димитров',
      rating: 1500,
      singles_rating: 1550,
      doubles_rating: 1300,
      singles_matches_played: 10,
      singles_wins: 8,
      singles_losses: 2,
      doubles_matches_played: 4,
      doubles_wins: 2,
      doubles_losses: 2,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'p-2',
      name: 'Димитър Кузманов',
      rating: 1400,
      singles_rating: 1420,
      doubles_rating: 1490,
      singles_matches_played: 5,
      singles_wins: 3,
      singles_losses: 2,
      doubles_matches_played: 8,
      doubles_wins: 6,
      doubles_losses: 2,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'p-3',
      name: 'Адриан Андреев',
      rating: 1200,
      singles_rating: 1250,
      doubles_rating: 1220,
      singles_matches_played: 0,
      singles_wins: 0,
      singles_losses: 0,
      doubles_matches_played: 2,
      doubles_wins: 1,
      doubles_losses: 1,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(true);
  });

  it('fetches players on mount and sorts by singles rating by default', async () => {
    const selectMock = vi.fn().mockResolvedValue({ data: mockPlayers, error: null });
    mockFrom.mockReturnValue({ select: selectMock });

    const { result } = renderHook(() => useRankings());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.format).toBe('singles');
    expect(result.current.rankings).toHaveLength(3);

    // Singles order: Григор (1550) > Димитър (1420) > Адриан (1250)
    expect(result.current.rankings[0].player.name).toBe('Григор Димитров');
    expect(result.current.rankings[0].rank).toBe(1);
    expect(result.current.rankings[0].rating).toBe(1550);
    expect(result.current.rankings[0].winRate).toBe(80); // (8 / 10) * 100

    expect(result.current.rankings[1].player.name).toBe('Димитър Кузманов');
    expect(result.current.rankings[1].rank).toBe(2);
    expect(result.current.rankings[1].rating).toBe(1420);
    expect(result.current.rankings[1].winRate).toBe(60); // (3 / 5) * 100

    expect(result.current.rankings[2].player.name).toBe('Адриан Андреев');
    expect(result.current.rankings[2].rank).toBe(3);
    expect(result.current.rankings[2].rating).toBe(1250);
    expect(result.current.rankings[2].winRate).toBe(0); // 0 matches -> 0%
  });

  it('switches format to doubles and re-sorts by doubles rating', async () => {
    const selectMock = vi.fn().mockResolvedValue({ data: mockPlayers, error: null });
    mockFrom.mockReturnValue({ select: selectMock });

    const { result } = renderHook(() => useRankings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setFormat('doubles');
    });

    expect(result.current.format).toBe('doubles');

    // Doubles order: Димитър (1490) > Григор (1300) > Адриан (1220)
    expect(result.current.rankings[0].player.name).toBe('Димитър Кузманов');
    expect(result.current.rankings[0].rank).toBe(1);
    expect(result.current.rankings[0].rating).toBe(1490);
    expect(result.current.rankings[0].winRate).toBe(75); // (6 / 8) * 100

    expect(result.current.rankings[1].player.name).toBe('Григор Димитров');
    expect(result.current.rankings[1].rank).toBe(2);
    expect(result.current.rankings[1].rating).toBe(1300);
    expect(result.current.rankings[1].winRate).toBe(50); // (2 / 4) * 100
  });

  it('filters rankings by search term while preserving original rank', async () => {
    const selectMock = vi.fn().mockResolvedValue({ data: mockPlayers, error: null });
    mockFrom.mockReturnValue({ select: selectMock });

    const { result } = renderHook(() => useRankings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('кузманов');
    });

    expect(result.current.rankings).toHaveLength(1);
    expect(result.current.rankings[0].player.name).toBe('Димитър Кузманов');
    expect(result.current.rankings[0].rank).toBe(2); // Preserves rank #2
  });

  it('handles Supabase not configured', async () => {
    vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

    const { result } = renderHook(() => useRankings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Supabase не е конфигуриран.');
    expect(result.current.rankings).toEqual([]);
  });
});
