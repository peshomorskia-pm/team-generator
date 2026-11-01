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
    const doublesMatches: MatchDetail[] = [
      {
        id: 'dm-1',
        match_format: 'doubles',
        team_1_score: 3,
        team_2_score: 6,
        played_at: '2026-10-04T10:00:00Z',
        created_at: '2026-10-04T10:00:00Z',
        updated_at: '2026-10-04T10:00:00Z',
        match_players: [
          {
            id: 'dmp-1',
            match_id: 'dm-1',
            player_id: 'p-1',
            team_side: 'team_1',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
          {
            id: 'dmp-2',
            match_id: 'dm-1',
            player_id: 'p-2',
            team_side: 'team_2',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
        ],
      },
      {
        id: 'dm-2',
        match_format: 'doubles',
        team_1_score: 6,
        team_2_score: 2,
        played_at: '2026-10-05T10:00:00Z',
        created_at: '2026-10-05T10:00:00Z',
        updated_at: '2026-10-05T10:00:00Z',
        match_players: [
          {
            id: 'dmp-3',
            match_id: 'dm-2',
            player_id: 'p-3',
            team_side: 'team_1',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
          {
            id: 'dmp-4',
            match_id: 'dm-2',
            player_id: 'p-1',
            team_side: 'team_2',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
        ],
      },
      {
        id: 'dm-3',
        match_format: 'doubles',
        team_1_score: 1,
        team_2_score: 6,
        played_at: '2026-10-06T10:00:00Z',
        created_at: '2026-10-06T10:00:00Z',
        updated_at: '2026-10-06T10:00:00Z',
        match_players: [
          {
            id: 'dmp-5',
            match_id: 'dm-3',
            player_id: 'p-3',
            team_side: 'team_1',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
          {
            id: 'dmp-6',
            match_id: 'dm-3',
            player_id: 'p-2',
            team_side: 'team_2',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
        ],
      },
    ];

    setupSupabaseMock(mockPlayers, doublesMatches);

    const { result } = renderHook(() => useRankings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setFormat('doubles');
    });

    expect(result.current.format).toBe('doubles');

    // In doubles matches:
    // Кузманов: 2 wins in 2 matches = 100%, gameDiff = +8, form = ['W', 'W']
    // Адриан: 1 win in 2 matches = 50%, gameDiff = -1, form = ['W', 'L']
    // Григор: 0 wins in 2 matches = 0%, gameDiff = -7, form = ['L', 'L']
    expect(result.current.rankings[0].player.name).toBe('Димитър Кузманов');
    expect(result.current.rankings[0].rank).toBe(1);
    expect(result.current.rankings[0].wins).toBe(2);
    expect(result.current.rankings[0].winRate).toBe(100);
    expect(result.current.rankings[0].gameDifference).toBe(8);
    expect(result.current.rankings[0].form).toEqual(['W', 'W']);

    expect(result.current.rankings[1].player.name).toBe('Адриан Андреев');
    expect(result.current.rankings[1].rank).toBe(2);
    expect(result.current.rankings[1].wins).toBe(1);
    expect(result.current.rankings[1].winRate).toBe(50);
    expect(result.current.rankings[1].gameDifference).toBe(-1);
    expect(result.current.rankings[1].form).toEqual(['W', 'L']);

    expect(result.current.rankings[2].player.name).toBe('Григор Димитров');
    expect(result.current.rankings[2].rank).toBe(3);
    expect(result.current.rankings[2].wins).toBe(0);
    expect(result.current.rankings[2].gameDifference).toBe(-7);
    expect(result.current.rankings[2].form).toEqual(['L', 'L']);
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

  it('ranks players strictly following the 6-tier sports tie-breaking rules', async () => {
    const testPlayers: PlayerRow[] = [
      {
        id: 'p-boris',
        name: 'Борис',
        rating: 1200,
        singles_matches_played: 0,
        singles_wins: 0,
        singles_losses: 0,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'p-angel',
        name: 'Ангел',
        rating: 1200,
        singles_matches_played: 0,
        singles_wins: 0,
        singles_losses: 0,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'p-georgi',
        name: 'Георги',
        rating: 1200,
        singles_matches_played: 0,
        singles_wins: 0,
        singles_losses: 0,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'p-daniel',
        name: 'Даниел',
        rating: 1200,
        singles_matches_played: 0,
        singles_wins: 0,
        singles_losses: 0,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'p-asen',
        name: 'Асен',
        rating: 1200,
        singles_matches_played: 0,
        singles_wins: 0,
        singles_losses: 0,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
    ];

    const tieBreakMatches: MatchDetail[] = [];
    let matchCounter = 1;
    const addSinglesMatch = (p1Id: string, p2Id: string, s1: number, s2: number) => {
      tieBreakMatches.push({
        id: `tbm-${matchCounter}`,
        match_format: 'singles',
        team_1_score: s1,
        team_2_score: s2,
        played_at: `2026-10-${String(matchCounter).padStart(2, '0')}T10:00:00Z`,
        created_at: `2026-10-${String(matchCounter).padStart(2, '0')}T10:00:00Z`,
        updated_at: `2026-10-${String(matchCounter).padStart(2, '0')}T10:00:00Z`,
        match_players: [
          {
            id: `tbmp-${matchCounter}-1`,
            match_id: `tbm-${matchCounter}`,
            player_id: p1Id,
            team_side: 'team_1',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
          {
            id: `tbmp-${matchCounter}-2`,
            match_id: `tbm-${matchCounter}`,
            player_id: p2Id,
            team_side: 'team_2',
            rating_before: null,
            rating_after: null,
            guest_name: null,
          },
        ],
      });
      matchCounter++;
    };

    // 1. Георги: 5 wins, 5 losses (10 matches, 50% win rate, diff: 0)
    for (let i = 0; i < 5; i++) {
      addSinglesMatch('p-georgi', 'p-dummy', 6, 4);
    }
    for (let i = 0; i < 5; i++) {
      addSinglesMatch('p-georgi', 'p-dummy', 4, 6);
    }

    // 2. Даниел: 2 wins, 0 losses (2 matches, 100% win rate, diff: +4)
    addSinglesMatch('p-daniel', 'p-dummy', 6, 4);
    addSinglesMatch('p-daniel', 'p-dummy', 6, 4);

    // 3. Ангел: 2 wins, 2 losses (4 matches, 50% win rate, diff: 0)
    addSinglesMatch('p-angel', 'p-dummy', 6, 4);
    addSinglesMatch('p-angel', 'p-dummy', 6, 4);
    addSinglesMatch('p-angel', 'p-dummy', 4, 6);
    addSinglesMatch('p-angel', 'p-dummy', 4, 6);

    // 4. Борис: 2 wins, 2 losses (4 matches, 50% win rate, diff: 0)
    addSinglesMatch('p-boris', 'p-dummy', 6, 4);
    addSinglesMatch('p-boris', 'p-dummy', 6, 4);
    addSinglesMatch('p-boris', 'p-dummy', 4, 6);
    addSinglesMatch('p-boris', 'p-dummy', 4, 6);

    // 5. Асен has 0 matches (inactive player)

    setupSupabaseMock(testPlayers, tieBreakMatches);

    const { result } = renderHook(() => useRankings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Tier 1: Wins descending
    // 1st: Георги (5 wins)
    expect(result.current.rankings[0].player.name).toBe('Георги');
    expect(result.current.rankings[0].rank).toBe(1);
    expect(result.current.rankings[0].wins).toBe(5);

    // Tier 2: Даниел (2 wins, 100% win rate beats 50%)
    expect(result.current.rankings[1].player.name).toBe('Даниел');
    expect(result.current.rankings[1].rank).toBe(2);
    expect(result.current.rankings[1].winRate).toBe(100);

    // Tier 5: Ангел vs Борис (both 2 wins, 50% win rate, diff: 0, 4 matches) -> Bulgarian alphabet 'Ангел' < 'Борис'
    expect(result.current.rankings[2].player.name).toBe('Ангел');
    expect(result.current.rankings[2].rank).toBe(3);

    expect(result.current.rankings[3].player.name).toBe('Борис');
    expect(result.current.rankings[3].rank).toBe(4);

    // Gate 1: Active Player Priority (active players outrank inactive 'Асен' despite 'А' alphabetical precedence)
    expect(result.current.rankings[4].player.name).toBe('Асен');
    expect(result.current.rankings[4].rank).toBe(5);
    expect(result.current.rankings[4].matchesPlayed).toBe(0);
  });
});
