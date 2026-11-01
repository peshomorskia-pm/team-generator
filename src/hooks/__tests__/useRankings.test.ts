import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRankings } from '../useRankings';
import * as supabaseModule from '../../lib/supabase';
import type { PlayerRow } from '../../types/database.types';
import type { MatchDetail } from '../../types/matches';

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

  const mockMatches: MatchDetail[] = [
    {
      id: 'm-1',
      match_format: 'singles',
      team_1_score: 6,
      team_2_score: 4,
      played_at: '2026-10-02T10:00:00Z',
      created_at: '2026-10-02T10:00:00Z',
      updated_at: '2026-10-02T10:00:00Z',
      match_players: [
        {
          id: 'mp-1',
          match_id: 'm-1',
          player_id: 'p-1',
          team_side: 'team_1',
          rating_before: null,
          rating_after: null,
          guest_name: null,
        },
        {
          id: 'mp-2',
          match_id: 'm-1',
          player_id: 'p-2',
          team_side: 'team_2',
          rating_before: null,
          rating_after: null,
          guest_name: null,
        },
      ],
    },
    {
      id: 'm-2',
      match_format: 'singles',
      team_1_score: 6,
      team_2_score: 3,
      played_at: '2026-10-03T10:00:00Z',
      created_at: '2026-10-03T10:00:00Z',
      updated_at: '2026-10-03T10:00:00Z',
      match_players: [
        {
          id: 'mp-3',
          match_id: 'm-2',
          player_id: 'p-1',
          team_side: 'team_1',
          rating_before: null,
          rating_after: null,
          guest_name: null,
        },
        {
          id: 'mp-4',
          match_id: 'm-2',
          player_id: 'p-3',
          team_side: 'team_2',
          rating_before: null,
          rating_after: null,
          guest_name: null,
        },
      ],
    },
    {
      id: 'm-3',
      match_format: 'doubles',
      team_1_score: 3,
      team_2_score: 6,
      played_at: '2026-10-04T10:00:00Z',
      created_at: '2026-10-04T10:00:00Z',
      updated_at: '2026-10-04T10:00:00Z',
      match_players: [
        {
          id: 'mp-5',
          match_id: 'm-3',
          player_id: 'p-1',
          team_side: 'team_1',
          rating_before: null,
          rating_after: null,
          guest_name: null,
        },
        {
          id: 'mp-6',
          match_id: 'm-3',
          player_id: 'p-2',
          team_side: 'team_2',
          rating_before: null,
          rating_after: null,
          guest_name: null,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(true);
  });

  const setupSupabaseMock = (
    players: PlayerRow[] = mockPlayers,
    matches: MatchDetail[] = mockMatches
  ) => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'players') {
        return {
          select: vi.fn().mockResolvedValue({ data: players, error: null }),
        };
      }
      if (table === 'matches') {
        return {
          select: vi.fn().mockResolvedValue({ data: matches, error: null }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });
  };

  it('fetches players and matches on mount and computes pure sports standings for singles', async () => {
    setupSupabaseMock();

    const { result } = renderHook(() => useRankings());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.format).toBe('singles');
    expect(result.current.rankings).toHaveLength(3);

    // Singles order based on matches:
    // Григор Димитров: 2 wins in 2 matches (100% win rate), gameDiff = +5, form = ['W', 'W']
    expect(result.current.rankings[0].player.name).toBe('Григор Димитров');
    expect(result.current.rankings[0].rank).toBe(1);
    expect(result.current.rankings[0].wins).toBe(2);
    expect(result.current.rankings[0].losses).toBe(0);
    expect(result.current.rankings[0].winRate).toBe(100);
    expect(result.current.rankings[0].gameDifference).toBe(5);
    expect(result.current.rankings[0].form).toEqual(['W', 'W']);

    // Rank 2: Димитър Кузманов (0 wins, gameDiff = -2)
    // Rank 3: Адриан Андреев (0 wins, gameDiff = -3)
    // Tier 3: gameDifference (-2 > -3) breaks tie before Bulgarian collation
    expect(result.current.rankings[1].player.name).toBe('Димитър Кузманов');
    expect(result.current.rankings[1].rank).toBe(2);
    expect(result.current.rankings[1].wins).toBe(0);
    expect(result.current.rankings[1].losses).toBe(1);
    expect(result.current.rankings[1].gameDifference).toBe(-2);

    expect(result.current.rankings[2].player.name).toBe('Адриан Андреев');
    expect(result.current.rankings[2].rank).toBe(3);
    expect(result.current.rankings[2].wins).toBe(0);
    expect(result.current.rankings[2].losses).toBe(1);
    expect(result.current.rankings[2].gameDifference).toBe(-3);
  });

  it('switches format to doubles and dynamically re-evaluates game differences and form', async () => {
    setupSupabaseMock();

    const { result } = renderHook(() => useRankings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setFormat('doubles');
    });

    expect(result.current.format).toBe('doubles');

    // In doubles match m-3: team_2 (Кузманов) beat team_1 (Димитров) 6-3.
    // Адриан has 0 matches in matches table, falls back to legacy row (doubles_wins: 1, matches: 2).
    // Let's check ranks:
    // Both Кузманов (1 win in 1 match = 100%) and Адриан (1 win in 2 matches = 50%) have 1 win.
    // Tier 1: Wins tied (1 win each).
    // Tier 2: Win rate: Кузманов 100% > Адриан 50%.
    expect(result.current.rankings[0].player.name).toBe('Димитър Кузманов');
    expect(result.current.rankings[0].rank).toBe(1);
    expect(result.current.rankings[0].wins).toBe(1);
    expect(result.current.rankings[0].winRate).toBe(100);
    expect(result.current.rankings[0].gameDifference).toBe(3);
    expect(result.current.rankings[0].form).toEqual(['W']);

    expect(result.current.rankings[1].player.name).toBe('Адриан Андреев');
    expect(result.current.rankings[1].rank).toBe(2);
    expect(result.current.rankings[1].wins).toBe(1);
    expect(result.current.rankings[1].winRate).toBe(50);

    // Григор: 0 wins, 1 loss (0%)
    expect(result.current.rankings[2].player.name).toBe('Григор Димитров');
    expect(result.current.rankings[2].rank).toBe(3);
    expect(result.current.rankings[2].wins).toBe(0);
    expect(result.current.rankings[2].gameDifference).toBe(-3);
    expect(result.current.rankings[2].form).toEqual(['L']);
  });

  it('filters rankings by search term while preserving original rank position numbers', async () => {
    setupSupabaseMock();

    const { result } = renderHook(() => useRankings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchTerm('кузманов');
    });

    expect(result.current.rankings).toHaveLength(1);
    expect(result.current.rankings[0].player.name).toBe('Димитър Кузманов');
    expect(result.current.rankings[0].rank).toBe(2); // Preserves original rank #2
  });

  it('handles Supabase not configured gracefully', async () => {
    vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

    const { result } = renderHook(() => useRankings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Supabase не е конфигуриран.');
    expect(result.current.rankings).toEqual([]);
  });

  it('ranks players strictly following the 5-tier sports tie-breaking rules', async () => {
    const testPlayers: PlayerRow[] = [
      {
        id: 'p-boris',
        name: 'Борис',
        rating: 1200,
        singles_matches_played: 4,
        singles_wins: 2,
        singles_losses: 2,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'p-angel',
        name: 'Ангел',
        rating: 1200,
        singles_matches_played: 4,
        singles_wins: 2,
        singles_losses: 2,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'p-georgi',
        name: 'Георги',
        rating: 1200,
        singles_matches_played: 10,
        singles_wins: 5,
        singles_losses: 5,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'p-daniel',
        name: 'Даниел',
        rating: 1200,
        singles_matches_played: 2,
        singles_wins: 2,
        singles_losses: 0,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
    ];

    setupSupabaseMock(testPlayers, []);

    const { result } = renderHook(() => useRankings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Tier 1: Wins descending
    // 1st: Георги (5 wins)
    expect(result.current.rankings[0].player.name).toBe('Георги');
    expect(result.current.rankings[0].rank).toBe(1);
    expect(result.current.rankings[0].wins).toBe(5);

    // 2nd: Даниел (2 wins, 100% win rate beats 50%)
    expect(result.current.rankings[1].player.name).toBe('Даниел');
    expect(result.current.rankings[1].rank).toBe(2);
    expect(result.current.rankings[1].winRate).toBe(100);

    // 3rd: Ангел (2 wins, 50% win rate, Bulgarian alphabet 'Ангел' < 'Борис')
    expect(result.current.rankings[2].player.name).toBe('Ангел');
    expect(result.current.rankings[2].rank).toBe(3);

    // 4th: Борис (2 wins, 50% win rate)
    expect(result.current.rankings[3].player.name).toBe('Борис');
    expect(result.current.rankings[3].rank).toBe(4);
  });
});
