import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTeamGenerator } from '../useTeamGenerator';
import { areTeamConfigsEqual } from '../../utils/history';
import { DatabasePlayer } from '../../types/generator';

describe('useTeamGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useTeamGenerator());

    expect(result.current.mode).toBe('tennis');
    expect(result.current.activePool).toEqual([]);
    expect(result.current.players).toEqual([]);
    expect(result.current.numberOfTeams).toBeNull();
    expect(result.current.playersPerTeam).toBeNull();
    expect(result.current.teams).toEqual([]);
    expect(result.current.history).toEqual([]);
    expect(result.current.alert).toBeNull();
    expect(result.current.balanceByRating).toBe(false);
    expect(result.current.format).toBe('doubles');
    expect(result.current.canGenerate).toBe(false);
    expect(result.current.validationError).toBeNull();
  });

  describe('guest player management', () => {
    it('adds a single guest player with valid UUID and guest source', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('Борис');
      });

      expect(result.current.activePool).toHaveLength(1);
      const guest = result.current.activePool[0];
      expect(guest.name).toBe('Борис');
      expect(guest.source).toBe('guest');
      expect(guest.rating).toBeUndefined();
      expect(guest.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('adds bulk guests from comma-separated string with distinct UUIDs', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('Иван, Петър, Георги');
      });

      expect(result.current.activePool).toHaveLength(3);
      expect(result.current.activePool.map((p) => p.name)).toEqual(['Иван', 'Петър', 'Георги']);
      expect(result.current.activePool.every((p) => p.source === 'guest')).toBe(true);

      const ids = result.current.activePool.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
      ids.forEach((id) => {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      });
    });

    it('ignores empty or whitespace-only guest input', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('   ');
      });

      expect(result.current.activePool).toEqual([]);
    });
  });

  describe('registered player toggling', () => {
    const mockDbPlayer: DatabasePlayer = {
      id: 'db-uuid-1',
      name: 'Николай',
      rating: 1450,
    };

    it('toggles a registered DB player into the active pool', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.toggleRegisteredPlayer(mockDbPlayer);
      });

      expect(result.current.activePool).toHaveLength(1);
      expect(result.current.activePool[0]).toEqual({
        id: 'db-uuid-1',
        name: 'Николай',
        source: 'registered',
        rating: 1450,
      });
    });

    it('toggles a registered DB player out of the active pool when called again', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.toggleRegisteredPlayer(mockDbPlayer);
      });
      expect(result.current.activePool).toHaveLength(1);

      act(() => {
        result.current.toggleRegisteredPlayer(mockDbPlayer);
      });
      expect(result.current.activePool).toHaveLength(0);
    });
  });

  describe('pool modifications', () => {
    it('removes a player by id regardless of source', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('Гост 1');
        result.current.toggleRegisteredPlayer({ id: 'db-1', name: 'Играч 1', rating: 1200 });
      });

      expect(result.current.activePool).toHaveLength(2);
      const guestId = result.current.activePool[0].id;

      act(() => {
        result.current.removePlayer(guestId);
      });

      expect(result.current.activePool).toHaveLength(1);
      expect(result.current.activePool[0].id).toBe('db-1');

      act(() => {
        result.current.removePlayer('db-1');
      });

      expect(result.current.activePool).toHaveLength(0);
    });

    it('clears active pool and generated teams completely with clearPool', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('Гост 1, Гост 2, Гост 3');
        result.current.toggleRegisteredPlayer({ id: 'db-1', name: 'Играч 1', rating: 1200 });
        result.current.setNumberOfTeams(2);
      });

      expect(result.current.activePool).toHaveLength(4);

      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.teams.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearPool();
      });

      expect(result.current.activePool).toEqual([]);
      expect(result.current.teams).toEqual([]);
    });
  });

  describe('validation errors', () => {
    it('shows error if generating teams with empty pool', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Списъкът с играчи е празен. Моля, въведете поне няколко имена.',
      });
    });

    it('shows error if generating teams with fewer than 2 players in generic mode', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('generic');
        result.current.addGuest('Иван');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Нужни са поне 2-ма играчи за да се сформират отбори.',
      });
    });

    it('shows error in generic mode if neither numberOfTeams nor playersPerTeam is specified', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('generic');
        result.current.addGuest('Иван, Петър');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.alert).toEqual({
        type: 'error',
        message: "Моля, въведете 'Брой отбори' или 'Брой играчи в отбор'.",
      });
    });

    it('shows error in generic mode if numberOfTeams is greater than pool size', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('generic');
        result.current.addGuest('Иван, Петър');
        result.current.setNumberOfTeams(3);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.alert).toEqual({
        type: 'error',
        message: 'Броят на отборите не може да е по-голям от броя на играчите.',
      });
    });
  });

  describe('team generation with hybrid roster', () => {
    it('generates teams successfully with numberOfTeams', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('Гост 1, Гост 2');
        result.current.toggleRegisteredPlayer({ id: 'reg-1', name: 'Рег 1', rating: 1300 });
        result.current.toggleRegisteredPlayer({ id: 'reg-2', name: 'Рег 2', rating: 1400 });
        result.current.setNumberOfTeams(2);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(2);
      expect(
        result.current.teams[0].players.length + result.current.teams[1].players.length
      ).toBe(4);
      expect(result.current.alert).toBeNull();
      expect(result.current.history).toHaveLength(1);
    });

    it('supports direct arguments in generateTeams(teamCount, balanceByRating)', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('Гост 1, Гост 2, Гост 3, Гост 4');
      });

      act(() => {
        result.current.generateTeams(2, false);
      });

      expect(result.current.teams).toHaveLength(2);
      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[1].players).toHaveLength(2);
    });

    it('generates teams successfully with playersPerTeam', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('A, B, C, D');
        result.current.setPlayersPerTeam(2);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(2);
      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[1].players).toHaveLength(2);
    });

    it('partitions team sizes evenly with max size difference of 1 when playersPerTeam is specified (e.g. 13 players / 3 per team => [3, 3, 3, 2, 2])', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('generic');
        result.current.addGuest('P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13');
        result.current.setPlayersPerTeam(3);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(5);
      const sizes = result.current.teams.map((t) => t.players.length);
      expect(sizes).toEqual([3, 3, 3, 2, 2]);
      const totalPlayers = sizes.reduce((a, b) => a + b, 0);
      expect(totalPlayers).toBe(13);
    });

    it('partitions team sizes evenly with max size difference of 1 when numberOfTeams is specified (e.g. 13 players / 5 teams => [3, 3, 3, 2, 2])', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('generic');
        result.current.addGuest('P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13');
        result.current.setNumberOfTeams(5);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(5);
      const sizes = result.current.teams.map((t) => t.players.length);
      expect(sizes).toEqual([3, 3, 3, 2, 2]);
      const totalPlayers = sizes.reduce((a, b) => a + b, 0);
      expect(totalPlayers).toBe(13);
    });

    it('partitions team sizes evenly for other non-divisible counts (10 players / 4 per team => [4, 3, 3])', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('generic');
        result.current.addGuest('P1, P2, P3, P4, P5, P6, P7, P8, P9, P10');
        result.current.setPlayersPerTeam(4);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(3);
      const sizes = result.current.teams.map((t) => t.players.length);
      expect(sizes).toEqual([4, 3, 3]);
    });

    it('balances teams evenly by rating defaulting unrated guests to neutral rating', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        // 2 registered players with 1500 and 1500
        result.current.toggleRegisteredPlayer({ id: 'reg-1', name: 'Рег 1', rating: 1500 });
        result.current.toggleRegisteredPlayer({ id: 'reg-2', name: 'Рег 2', rating: 1500 });
        // 2 guests with no rating
        result.current.addGuest('Гост 1, Гост 2');
        result.current.setNumberOfTeams(2);
        result.current.setBalanceByRating(true);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(2);
      // Both teams must have 1500 total rating and 2 players
      expect(result.current.teams[0].totalRating).toBe(1500);
      expect(result.current.teams[1].totalRating).toBe(1500);
      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[1].players).toHaveLength(2);
    });

    it('shuffles single team without changing composition of other teams', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('P1, P2, P3, P4, P5, P6');
        result.current.setNumberOfTeams(2);
      });

      act(() => {
        result.current.generateTeams();
      });

      const initialTeam1Players = [...result.current.teams[0].players];

      act(() => {
        result.current.shuffleSingleTeam(result.current.teams[0].id);
      });

      expect(result.current.teams[0].players).toHaveLength(initialTeam1Players.length);
    });

    it('copies generated team results to clipboard', async () => {
      const { result } = renderHook(() => useTeamGenerator());

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      act(() => {
        result.current.addGuest('Иван, Петър, Георги, Стоян');
        result.current.setNumberOfTeams(2);
      });

      act(() => {
        result.current.generateTeams();
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.copyResults();
      });

      expect(success).toBe(true);
      expect(writeTextMock).toHaveBeenCalled();
      expect(result.current.isCopied).toBe(true);
    });

    it('guarantees consecutive different configurations when multiple balanced pairings exist', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.toggleRegisteredPlayer({ id: 'r1', name: 'R1', rating: 1600 });
        result.current.toggleRegisteredPlayer({ id: 'r2', name: 'R2', rating: 1600 });
        result.current.toggleRegisteredPlayer({ id: 'r3', name: 'R3', rating: 1200 });
        result.current.toggleRegisteredPlayer({ id: 'r4', name: 'R4', rating: 1200 });
        result.current.setNumberOfTeams(2);
        result.current.setBalanceByRating(true);
      });

      act(() => {
        result.current.generateTeams();
      });
      const firstRun = result.current.teams;

      act(() => {
        result.current.generateTeams();
      });
      const secondRun = result.current.teams;

      expect(areTeamConfigsEqual(firstRun, secondRun)).toBe(false);
    });
  });

  describe('format state and dual ratings', () => {
    it('manages format state transitions', () => {
      const { result } = renderHook(() => useTeamGenerator());
      expect(result.current.format).toBe('doubles');

      act(() => {
        result.current.setFormat('singles');
      });
      expect(result.current.format).toBe('singles');

      act(() => {
        result.current.setFormat('doubles');
      });
      expect(result.current.format).toBe('doubles');
    });

    it('preserves singles_rating and doubles_rating when toggling registered player', () => {
      const { result } = renderHook(() => useTeamGenerator());
      const playerWithDualRatings: DatabasePlayer = {
        id: 'p-dual-1',
        name: 'Христо',
        rating: 1500,
        singles_rating: 1650,
        doubles_rating: 1400,
      };

      act(() => {
        result.current.toggleRegisteredPlayer(playerWithDualRatings);
      });

      expect(result.current.activePool).toHaveLength(1);
      expect(result.current.activePool[0]).toEqual({
        id: 'p-dual-1',
        name: 'Христо',
        source: 'registered',
        rating: 1500,
        singles_rating: 1650,
        doubles_rating: 1400,
      });
    });

    it('computes team totalRating based on active format when generating teams in tennis mode', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.toggleRegisteredPlayer({
          id: 'p1',
          name: 'P1',
          rating: 1200,
          singles_rating: 1800,
          doubles_rating: 1300,
        });
        result.current.toggleRegisteredPlayer({
          id: 'p2',
          name: 'P2',
          rating: 1200,
          singles_rating: 1400,
          doubles_rating: 1700,
        });
        result.current.setFormat('singles');
      });

      act(() => {
        result.current.generateTeams();
      });

      const singlesRatings = result.current.teams.map((t) => t.totalRating);
      expect(singlesRatings.sort()).toEqual([1400, 1800]);

      // Add 2 more players for tennis doubles format (requires >= 4 players)
      act(() => {
        result.current.toggleRegisteredPlayer({
          id: 'p3',
          name: 'P3',
          rating: 1200,
          singles_rating: 1500,
          doubles_rating: 1100,
        });
        result.current.toggleRegisteredPlayer({
          id: 'p4',
          name: 'P4',
          rating: 1200,
          singles_rating: 1600,
          doubles_rating: 1500,
        });
        result.current.setFormat('doubles');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(2);
      const doublesRatings = result.current.teams.map((t) => t.totalRating);
      const totalDoubles = 1300 + 1700 + 1100 + 1500;
      expect((doublesRatings[0] ?? 0) + (doublesRatings[1] ?? 0)).toBe(totalDoubles);
    });

    it('balances teams evenly by rating in tennis mode', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('tennis');
        result.current.setFormat('doubles');
        result.current.toggleRegisteredPlayer({ id: 'p1', name: 'P1', rating: 1800 });
        result.current.toggleRegisteredPlayer({ id: 'p2', name: 'P2', rating: 1600 });
        result.current.toggleRegisteredPlayer({ id: 'p3', name: 'P3', rating: 1400 });
        result.current.toggleRegisteredPlayer({ id: 'p4', name: 'P4', rating: 1200 });
        result.current.setBalanceByRating(true);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(2);
      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[1].players).toHaveLength(2);
      // Perfect balance: 1800+1200=3000 and 1600+1400=3000
      expect(result.current.teams[0].totalRating).toBe(3000);
      expect(result.current.teams[1].totalRating).toBe(3000);
    });

    it('partitions 10 players with playersPerTeam = 3 into sizes [3, 3, 2, 2] in generic mode even if balanceByRating is true', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('tennis');
        result.current.setBalanceByRating(true);
        result.current.setMode('generic');
        for (let i = 1; i <= 10; i++) {
          result.current.toggleRegisteredPlayer({
            id: `p-${i}`,
            name: `Player ${i}`,
            rating: i === 1 ? 5000 : 1000,
          });
        }
        result.current.setPlayersPerTeam(3);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(4);
      const sizes = result.current.teams.map((t) => t.players.length).sort((a, b) => b - a);
      expect(sizes).toEqual([3, 3, 2, 2]);
    });

    it('isolates ratings in generic mode ignoring format state even if playersPerTeam is set', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('generic');
        result.current.setFormat('doubles');
        result.current.toggleRegisteredPlayer({
          id: 'p1',
          name: 'P1',
          rating: 1000,
          doubles_rating: 1800,
        });
        result.current.toggleRegisteredPlayer({
          id: 'p2',
          name: 'P2',
          rating: 1000,
          doubles_rating: 1600,
        });
        result.current.toggleRegisteredPlayer({
          id: 'p3',
          name: 'P3',
          rating: 1000,
          doubles_rating: 1400,
        });
        result.current.toggleRegisteredPlayer({
          id: 'p4',
          name: 'P4',
          rating: 1000,
          doubles_rating: 1200,
        });
        result.current.setPlayersPerTeam(2);
        result.current.setBalanceByRating(true);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(2);
      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[1].players).toHaveLength(2);
      // In generic mode, balanced by general rating (1000+1000=2000), ignoring leaked doubles_rating
      expect(result.current.teams[0].totalRating).toBe(2000);
      expect(result.current.teams[1].totalRating).toBe(2000);
    });
  });

  describe('Generator mode & Tennis validation', () => {
    it('manages mode state transitions', () => {
      const { result } = renderHook(() => useTeamGenerator());
      expect(result.current.mode).toBe('tennis');

      act(() => {
        result.current.setMode('generic');
      });
      expect(result.current.mode).toBe('generic');

      act(() => {
        result.current.setMode('tennis');
      });
      expect(result.current.mode).toBe('tennis');
    });

    it('enforces tennis doubles validations: blocks < 4 players or odd count', () => {
      const { result } = renderHook(() => useTeamGenerator());
      expect(result.current.mode).toBe('tennis');
      expect(result.current.format).toBe('doubles');

      // Empty pool
      expect(result.current.canGenerate).toBe(false);
      expect(result.current.validationError).toBeNull();

      // 3 players (< 4 and odd)
      act(() => {
        result.current.addGuest('A, B, C');
      });
      expect(result.current.canGenerate).toBe(false);
      expect(result.current.validationError).toBe('Нужни са поне 4 играчи за игра по двойки.');

      // Try generate: shows alert
      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.alert?.message).toBe('Нужни са поне 4 играчи за игра по двойки.');

      // 5 players (>= 4 but odd)
      act(() => {
        result.current.addGuest('D, E');
      });
      expect(result.current.canGenerate).toBe(false);
      expect(result.current.validationError).toBe('Добавете още 1 играч за пълни двойки');

      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.alert?.message).toBe('Добавете още 1 играч за пълни двойки');

      // 6 players (>= 4 and even) -> valid!
      act(() => {
        result.current.addGuest('F');
      });
      expect(result.current.canGenerate).toBe(true);
      expect(result.current.validationError).toBeNull();

      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.teams).toHaveLength(3); // 6 / 2 = 3 teams
    });

    it('toggles to generic mode with 3 players and allows generation', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('A, B, C');
      });

      // Invalid in tennis doubles
      expect(result.current.canGenerate).toBe(false);
      expect(result.current.validationError).not.toBeNull();

      // Switch to generic
      act(() => {
        result.current.setMode('generic');
      });

      expect(result.current.canGenerate).toBe(true);
      expect(result.current.validationError).toBeNull();
    });

    it('validates singles format in tennis mode requiring >= 2 players', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setFormat('singles');
        result.current.addGuest('A');
      });

      expect(result.current.canGenerate).toBe(false);
      expect(result.current.validationError).toBe('Нужни са поне 2-ма играчи за сформиране на сингъл срещи');

      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.alert?.message).toBe('Нужни са поне 2-ма играчи за сформиране на сингъл срещи');

      act(() => {
        result.current.addGuest('B');
      });

      expect(result.current.canGenerate).toBe(true);
      expect(result.current.validationError).toBeNull();

      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.teams).toHaveLength(2);
    });

    it('balances by general rating in generic mode without leaking tennis ratings', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('generic');
        result.current.setNumberOfTeams(2);
        result.current.setBalanceByRating(true);
        // Player 1: general rating 1000, doubles_rating 3000
        result.current.toggleRegisteredPlayer({
          id: 'p-1',
          name: 'Player 1',
          rating: 1000,
          doubles_rating: 3000,
        });
        // Player 2: general rating 1000, doubles_rating 1000
        result.current.toggleRegisteredPlayer({
          id: 'p-2',
          name: 'Player 2',
          rating: 1000,
          doubles_rating: 1000,
        });
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(2);
      expect(result.current.teams[0].totalRating).toBe(1000);
      expect(result.current.teams[1].totalRating).toBe(1000);
    });
  });
});

