import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTeamGenerator, getTargetTeamSize, calculateTeamRating } from '../useTeamGenerator';
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
        message: 'Броят отбори (3) не може да надвишава наличните играчи (2).',
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

    it('copies generated team results to clipboard with formatted text', async () => {
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
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      const copiedText = writeTextMock.mock.calls[0][0] as string;
      expect(copiedText).toContain('🎾 Тенис - По двойки');
      expect(copiedText).toContain('Отбор 1:');
      expect(copiedText).toContain('Отбор 2:');
      expect(copiedText).toContain('Среща: Отбор 1 vs Отбор 2');
      expect(result.current.isCopied).toBe(true);
    });

    it('returns false when copying with no generated teams', async () => {
      const { result } = renderHook(() => useTeamGenerator());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.copyResults();
      });

      expect(success).toBe(false);
      expect(result.current.isCopied).toBe(false);
    });

    it('handles clipboard failure gracefully by invoking window.prompt and showing alert', async () => {
      const { result } = renderHook(() => useTeamGenerator());

      // Simulate clipboard writeText failing
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      // Simulate execCommand failing
      document.execCommand = vi.fn().mockReturnValue(false);
      const promptMock = vi.fn();
      window.prompt = promptMock;

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

      expect(success).toBe(false);
      expect(result.current.isCopied).toBe(false);
      expect(promptMock).toHaveBeenCalledTimes(1);
      expect(promptMock).toHaveBeenCalledWith(
        'Копирайте съставите ръчно (Ctrl+C):',
        expect.stringContaining('🎾 Тенис - По двойки')
      );
      expect(result.current.alert).toEqual({
        message: 'Неуспешно копиране. Моля, копирайте ръчно.',
        type: 'error',
      });

      delete (window as unknown as { prompt?: typeof window.prompt }).prompt;
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

  describe('generic mode validation rules', () => {
    const add10Players = (result: { current: ReturnType<typeof useTeamGenerator> }) => {
      act(() => {
        result.current.setMode('generic');
        result.current.addGuest('P1, P2, P3, P4, P5, P6, P7, P8, P9, P10');
      });
    };

    it('validates playersPerTeam = 12 with 10 players (canGenerate = false and Bulgarian error string)', () => {
      const { result } = renderHook(() => useTeamGenerator());
      add10Players(result);

      act(() => {
        result.current.setPlayersPerTeam(12);
      });

      expect(result.current.canGenerate).toBe(false);
      expect(result.current.validationError).toBe(
        'Броят играчи в отбор (12) не може да бъде по-голям или равен на общия брой играчи (10). Нужни са играчи за поне 2 отбора.'
      );

      // Guard clause prevents generateTeams from executing
      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.teams).toHaveLength(0);
      expect(result.current.alert?.message).toBe(
        'Броят играчи в отбор (12) не може да бъде по-голям или равен на общия брой играчи (10). Нужни са играчи за поне 2 отбора.'
      );
    });

    it('validates playersPerTeam = 10 with 10 players (canGenerate = false)', () => {
      const { result } = renderHook(() => useTeamGenerator());
      add10Players(result);

      act(() => {
        result.current.setPlayersPerTeam(10);
      });

      expect(result.current.canGenerate).toBe(false);
      expect(result.current.validationError).toBe(
        'Броят играчи в отбор (10) не може да бъде по-голям или равен на общия брой играчи (10). Нужни са играчи за поне 2 отбора.'
      );
    });

    it('validates numberOfTeams = 12 with 10 players (canGenerate = false)', () => {
      const { result } = renderHook(() => useTeamGenerator());
      add10Players(result);

      act(() => {
        result.current.setNumberOfTeams(12);
      });

      expect(result.current.canGenerate).toBe(false);
      expect(result.current.validationError).toBe(
        'Броят отбори (12) не може да надвишава наличните играчи (10).'
      );

      // Guard clause prevents generateTeams from executing
      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.teams).toHaveLength(0);
      expect(result.current.alert?.message).toBe(
        'Броят отбори (12) не може да надвишава наличните играчи (10).'
      );
    });

    it('validates numberOfTeams = 1 with 10 players (canGenerate = false)', () => {
      const { result } = renderHook(() => useTeamGenerator());
      add10Players(result);

      act(() => {
        result.current.setNumberOfTeams(1);
      });

      expect(result.current.canGenerate).toBe(false);
      expect(result.current.validationError).toBe('Нужни са поне 2 отбора за разпределение.');

      // Guard clause prevents generateTeams from executing
      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.teams).toHaveLength(0);
      expect(result.current.alert?.message).toBe('Нужни са поне 2 отбора за разпределение.');
    });

    it('validates playersPerTeam = 3 with 10 players (canGenerate = true and validationError = null)', () => {
      const { result } = renderHook(() => useTeamGenerator());
      add10Players(result);

      act(() => {
        result.current.setPlayersPerTeam(3);
      });

      expect(result.current.canGenerate).toBe(true);
      expect(result.current.validationError).toBeNull();

      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.teams.length).toBeGreaterThan(0);
    });

    it('validates playersPerTeam < 1 with 10 players (canGenerate = false)', () => {
      const { result } = renderHook(() => useTeamGenerator());
      add10Players(result);

      act(() => {
        result.current.setPlayersPerTeam(0);
      });

      expect(result.current.canGenerate).toBe(false);
      expect(result.current.validationError).toBe('Броят играчи в отбор трябва да бъде поне 1.');
    });
  });

  describe('tournament group draw lifecycle', () => {
    it('initializes groups as empty array', () => {
      const { result } = renderHook(() => useTeamGenerator());
      expect(result.current.groups).toEqual([]);
    });

    it('does not draw groups if mode is generic or teams length < 3', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('generic');
        result.current.addGuest('P1, P2, P3, P4');
        result.current.setNumberOfTeams(2);
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(2);

      act(() => {
        result.current.drawGroups();
      });

      expect(result.current.groups).toEqual([]);
    });

    it('draws groups when teams >= 3 and mode is tennis', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('tennis');
        result.current.setFormat('singles');
        result.current.addGuest('P1, P2, P3, P4, P5, P6');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(6);

      act(() => {
        result.current.drawGroups();
      });

      expect(result.current.groups).toHaveLength(2);
      expect(result.current.groups[0].name).toBe('Група А');
      expect(result.current.groups[1].name).toBe('Група Б');
      expect(result.current.groups[0].teams).toHaveLength(3);
      expect(result.current.groups[1].teams).toHaveLength(3);

      // Verify resetGroups / clearGroups
      act(() => {
        result.current.resetGroups();
      });
      expect(result.current.groups).toEqual([]);

      // Draw again and clear with clearGroups alias
      act(() => {
        result.current.drawGroups();
      });
      expect(result.current.groups).toHaveLength(2);

      act(() => {
        result.current.clearGroups();
      });
      expect(result.current.groups).toEqual([]);
    });

    it('clears groups when pool changes or generateTeams is executed', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('tennis');
        result.current.setFormat('singles');
        result.current.addGuest('P1, P2, P3, P4, P5, P6');
      });

      act(() => {
        result.current.generateTeams();
      });

      act(() => {
        result.current.drawGroups();
      });

      expect(result.current.groups).toHaveLength(2);

      // Adding guest resets groups
      act(() => {
        result.current.addGuest('P7');
      });
      expect(result.current.groups).toEqual([]);

      // Re-generate and draw
      act(() => {
        result.current.generateTeams();
      });

      act(() => {
        result.current.drawGroups();
      });
      expect(result.current.groups.length).toBeGreaterThan(0);

      // Changing mode resets groups
      act(() => {
        result.current.setMode('generic');
      });
      expect(result.current.groups).toEqual([]);

      // Re-generate in tennis and draw
      act(() => {
        result.current.setMode('tennis');
      });

      act(() => {
        result.current.generateTeams();
      });

      act(() => {
        result.current.drawGroups();
      });
      expect(result.current.groups.length).toBeGreaterThan(0);

      // Re-running generateTeams resets groups
      act(() => {
        result.current.generateTeams();
      });
      expect(result.current.groups).toEqual([]);

      // Draw again, then clearPool resets groups
      act(() => {
        result.current.drawGroups();
      });
      expect(result.current.groups.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearPool();
      });
      expect(result.current.groups).toEqual([]);
    });
  });

  describe('in-place team slot substitution, pruning, and gating', () => {
    describe('getTargetTeamSize helper', () => {
      it('returns 2 in tennis doubles and 1 in tennis singles', () => {
        expect(getTargetTeamSize('tennis', 'doubles')).toBe(2);
        expect(getTargetTeamSize('tennis', 'singles')).toBe(1);
      });

      it('returns playersPerTeam in generic mode when ppt is defined', () => {
        expect(getTargetTeamSize('generic', undefined, 3, null, 10)).toBe(3);
        expect(getTargetTeamSize('generic', undefined, 4, 2, 8)).toBe(4);
      });

      it('returns Math.ceil(poolSize / numberOfTeams) in generic mode with numberOfTeams', () => {
        expect(getTargetTeamSize('generic', undefined, null, 2, 5)).toBe(3);
        expect(getTargetTeamSize('generic', undefined, null, 3, 9)).toBe(3);
        expect(getTargetTeamSize('generic', undefined, null, 2, 0)).toBe(1);
      });
    });

    describe('calculateTeamRating helper', () => {
      it('calculates team rating taking format into account and ignoring guest ratings', () => {
        const players = [
          { id: '1', name: 'P1', rating: 1200, doubles_rating: 1300, singles_rating: 1100, source: 'registered' as const },
          { id: '2', name: 'G1', rating: 999, source: 'guest' as const },
        ];
        expect(calculateTeamRating(players, 'doubles')).toBe(1300);
        expect(calculateTeamRating(players, 'singles')).toBe(1100);
        expect(calculateTeamRating(players, undefined)).toBe(1200);
      });
    });

    it('in-place player removal in doubles: removes 1 player, leaves 1 player, keeps other teams intact, resets groups', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('P1, P2, P3, P4, P5, P6');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(3);
      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[1].players).toHaveLength(2);
      expect(result.current.teams[2].players).toHaveLength(2);

      // Draw groups first
      act(() => {
        result.current.drawGroups();
      });
      expect(result.current.groups.length).toBeGreaterThan(0);

      const playerToRemoveId = result.current.teams[0].players[0].id;
      const preservedPlayer = result.current.teams[0].players[1];
      const preservedTeam1 = { ...result.current.teams[1] };
      const preservedTeam2 = { ...result.current.teams[2] };

      // Remove player
      act(() => {
        result.current.removePlayer(playerToRemoveId);
      });

      // Teams remain 3, team[0] has 1 player remaining
      expect(result.current.teams).toHaveLength(3);
      expect(result.current.teams[0].players).toHaveLength(1);
      expect(result.current.teams[0].players[0].id).toBe(preservedPlayer.id);

      // Other teams intact
      expect(result.current.teams[1].players).toEqual(preservedTeam1.players);
      expect(result.current.teams[2].players).toEqual(preservedTeam2.players);

      // Groups cleared
      expect(result.current.groups).toEqual([]);
      expect(result.current.hasIncompleteTeams).toBe(true);
    });

    it('team pruning: removing the last player of a team prunes that team entirely', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('P1, P2, P3, P4');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(2);
      const team0 = result.current.teams[0];
      const team1 = result.current.teams[1];
      const [t0p0, t0p1] = team0.players;

      // Remove first player of team 0
      act(() => {
        result.current.removePlayer(t0p0.id);
      });
      expect(result.current.teams).toHaveLength(2);
      expect(result.current.teams[0].players).toHaveLength(1);

      // Remove remaining player of team 0 -> team 0 is pruned!
      act(() => {
        result.current.removePlayer(t0p1.id);
      });
      expect(result.current.teams).toHaveLength(1);
      expect(result.current.teams[0].id).toBe(team1.id);
      expect(result.current.teams[0].players).toEqual(team1.players);
    });

    it('in-place player substitution: adding a player fills the incomplete team empty slot without reshuffling other teams', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('P1, P2, P3, P4');
      });

      act(() => {
        result.current.generateTeams();
      });

      const team0 = result.current.teams[0];
      const team1 = result.current.teams[1];
      const playerToRemove = team0.players[0];
      const remainingPlayer = team0.players[1];

      // Remove player -> team0 now has 1 player (slot open)
      act(() => {
        result.current.removePlayer(playerToRemove.id);
      });
      expect(result.current.teams[0].players).toHaveLength(1);

      // Substitute with new guest
      act(() => {
        result.current.addGuest('NewGuest');
      });

      // Team 0 now has 2 players, filled with NewGuest
      expect(result.current.teams).toHaveLength(2);
      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[0].players[0].id).toBe(remainingPlayer.id);
      expect(result.current.teams[0].players[1].name).toBe('NewGuest');

      // Team 1 was completely preserved
      expect(result.current.teams[1].players).toEqual(team1.players);
      expect(result.current.hasIncompleteTeams).toBe(false);
    });

    it('in-place player substitution: adding a registered player fills empty slot', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('P1, P2, P3, P4');
      });

      act(() => {
        result.current.generateTeams();
      });

      const playerToRemove = result.current.teams[0].players[0];
      act(() => {
        result.current.removePlayer(playerToRemove.id);
      });

      const newDbPlayer: DatabasePlayer = {
        id: 'new-db-sub',
        name: 'Нов Състезател',
        rating: 1600,
        doubles_rating: 1650,
      };

      act(() => {
        result.current.toggleRegisteredPlayer(newDbPlayer);
      });

      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[0].players[1].name).toBe('Нов Състезател');
      expect(result.current.teams[0].players[1].id).toBe('new-db-sub');
    });

    it('adding a player when all teams are full only adds them to activePool without mutating teams', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('P1, P2, P3, P4');
      });

      act(() => {
        result.current.generateTeams();
      });

      const snapshot = JSON.parse(JSON.stringify(result.current.teams));

      act(() => {
        result.current.addGuest('FifthPlayer');
      });

      expect(result.current.activePool).toHaveLength(5);
      expect(result.current.teams).toEqual(snapshot);
    });

    it('recalculates team totalRating upon removal and substitution', () => {
      const { result } = renderHook(() => useTeamGenerator());

      const p1: DatabasePlayer = { id: 'p-1', name: 'P1', rating: 1200, doubles_rating: 1250 };
      const p2: DatabasePlayer = { id: 'p-2', name: 'P2', rating: 1100, doubles_rating: 1150 };
      const p3: DatabasePlayer = { id: 'p-3', name: 'P3', rating: 1000, doubles_rating: 1050 };
      const p4: DatabasePlayer = { id: 'p-4', name: 'P4', rating: 900, doubles_rating: 950 };

      act(() => {
        result.current.toggleRegisteredPlayer(p1);
        result.current.toggleRegisteredPlayer(p2);
        result.current.toggleRegisteredPlayer(p3);
        result.current.toggleRegisteredPlayer(p4);
      });

      act(() => {
        result.current.generateTeams();
      });

      const targetTeam = result.current.teams.find((t) =>
        t.players.some((p) => p.id === 'p-1')
      )!;
      const initialRating = targetTeam.totalRating;
      const isP1TogetherWith = targetTeam.players.find((p) => p.id !== 'p-1')!;

      // Remove p1
      act(() => {
        result.current.removePlayer('p-1');
      });

      const updatedTeam = result.current.teams.find((t) => t.id === targetTeam.id)!;
      const partnerDoublesRating =
        isP1TogetherWith.doubles_rating ?? isP1TogetherWith.rating!;
      expect(updatedTeam.totalRating).toBe(partnerDoublesRating);
      expect(updatedTeam.totalRating).toBeLessThan(initialRating!);

      // Substitute with p5
      const p5: DatabasePlayer = { id: 'p-5', name: 'P5', rating: 1500, doubles_rating: 1550 };
      act(() => {
        result.current.toggleRegisteredPlayer(p5);
      });

      const subbedTeam = result.current.teams.find((t) => t.id === targetTeam.id)!;
      expect(subbedTeam.totalRating).toBe(partnerDoublesRating + 1550);
    });

    it('reports missing player validation error when incomplete teams exist in tennis doubles', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('P1, P2, P3, P4');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.canGenerate).toBe(true);
      expect(result.current.validationError).toBeNull();

      // Remove 1 player -> odd active pool (3) and incomplete team
      act(() => {
        result.current.removePlayer(result.current.teams[0].players[0].id);
      });

      expect(result.current.hasIncompleteTeams).toBe(true);
      expect(result.current.validationError).toBe('Добавете още 1 играч за пълни двойки');
      expect(result.current.canGenerate).toBe(false);

      // Substitute 1 guest back -> pool is 4 again
      act(() => {
        result.current.addGuest('Sub');
      });

      expect(result.current.hasIncompleteTeams).toBe(false);
      expect(result.current.validationError).toBeNull();
      expect(result.current.canGenerate).toBe(true);
    });

    it('draw gating: prevents drawing groups while teams are incomplete', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('P1, P2, P3, P4, P5, P6');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(3);

      // Remove a player -> team 0 has 1 player (incomplete)
      act(() => {
        result.current.removePlayer(result.current.teams[0].players[0].id);
      });

      expect(result.current.hasIncompleteTeams).toBe(true);

      // Attempt draw groups
      act(() => {
        result.current.drawGroups();
      });

      // Gating must prevent drawing
      expect(result.current.groups).toEqual([]);
    });
  });

  describe('single-group auto-assignment and tournament schedule lifecycle', () => {
    it('automatically assigns single group (Група А) when tennis mode has N in {3, 4, 5} teams', () => {
      const { result } = renderHook(() => useTeamGenerator());

      // 3 teams in tennis singles (3 guests)
      act(() => {
        result.current.setMode('tennis');
        result.current.setFormat('singles');
        result.current.addGuest('T1, T2, T3');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(3);
      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].id).toBe('group-0');
      expect(result.current.groups[0].name).toBe('Група А');
      expect(result.current.groups[0].teams).toHaveLength(3);

      // 4 teams in tennis doubles (8 guests)
      act(() => {
        result.current.clearPool();
        result.current.setFormat('doubles');
        result.current.addGuest('A1, A2, B1, B2, C1, C2, D1, D2');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(4);
      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].name).toBe('Група А');
      expect(result.current.groups[0].teams).toHaveLength(4);

      // 5 teams in tennis singles (5 guests)
      act(() => {
        result.current.clearPool();
        result.current.setFormat('singles');
        result.current.addGuest('P1, P2, P3, P4, P5');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(5);
      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].name).toBe('Група А');
      expect(result.current.groups[0].teams).toHaveLength(5);
    });

    it('requires manual draw for N >= 6 teams and does not auto-assign', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('tennis');
        result.current.setFormat('singles');
        result.current.addGuest('P1, P2, P3, P4, P5, P6');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.teams).toHaveLength(6);
      expect(result.current.groups).toEqual([]);

      act(() => {
        result.current.drawGroups();
      });

      expect(result.current.groups).toHaveLength(2);
      expect(result.current.groups[0].name).toBe('Група А');
      expect(result.current.groups[1].name).toBe('Група Б');
    });

    it('generates schedule and handles reset lifecycle', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('tennis');
        result.current.setFormat('singles');
        result.current.addGuest('T1, T2, T3');
      });

      act(() => {
        result.current.generateTeams();
      });

      expect(result.current.schedule).toEqual([]);

      // Generate schedule
      act(() => {
        result.current.generateSchedule();
      });

      expect(result.current.schedule).toHaveLength(3); // 3 matches for N=3
      expect(result.current.schedule[0].groupId).toBe('group-0');
      expect(result.current.schedule[0].round).toBe(1);

      // Reset schedule
      act(() => {
        result.current.resetSchedule();
      });

      expect(result.current.schedule).toEqual([]);
    });

    it('resets schedule when teams change, pool changes, or mode changes', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.setMode('tennis');
        result.current.setFormat('singles');
        result.current.addGuest('T1, T2, T3');
      });

      act(() => {
        result.current.generateTeams();
      });

      act(() => {
        result.current.generateSchedule();
      });

      expect(result.current.schedule).toHaveLength(3);

      // Adding guest resets schedule
      act(() => {
        result.current.addGuest('T4');
      });
      expect(result.current.schedule).toEqual([]);

      // Re-generate teams and schedule
      act(() => {
        result.current.generateTeams();
      });

      act(() => {
        result.current.generateSchedule();
      });
      expect(result.current.schedule).toHaveLength(6); // N=4 -> 6 matches

      // Changing mode resets schedule
      act(() => {
        result.current.setMode('generic');
      });
      expect(result.current.schedule).toEqual([]);
    });
  });

  describe('Interactive Team Board - Manual & Hybrid Slot Builder', () => {
    it('initializes blank teams with empty player arrays and manual mode', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.initializeBlankTeams(4, 2);
      });

      expect(result.current.formationMode).toBe('manual');
      expect(result.current.teamFormationMode).toBe('manual');
      expect(result.current.teams).toHaveLength(4);
      expect(result.current.teams[0]).toEqual({
        id: 'team-1',
        name: 'Отбор 1',
        players: [],
        totalRating: 0,
      });
      expect(result.current.teams[3]).toEqual({
        id: 'team-4',
        name: 'Отбор 4',
        players: [],
        totalRating: 0,
      });
      expect(result.current.targetTeamSize).toBe(2);
      expect(result.current.hasIncompleteTeams).toBe(true);
    });

    it('assignPlayerToTeam assigns player and updates team totalRating and unassignedPoolPlayers', () => {
      const { result } = renderHook(() => useTeamGenerator());

      const mockPlayer1 = { id: 'p-1', name: 'Иван', source: 'registered' as const, rating: 1200 };
      const mockPlayer2 = { id: 'p-2', name: 'Петър', source: 'registered' as const, rating: 1400 };

      act(() => {
        result.current.toggleRegisteredPlayer(mockPlayer1);
        result.current.toggleRegisteredPlayer(mockPlayer2);
        result.current.initializeBlankTeams(2, 2);
      });

      expect(result.current.unassignedPoolPlayers).toHaveLength(2);

      act(() => {
        result.current.assignPlayerToTeam('team-1', mockPlayer1);
      });

      expect(result.current.teams[0].players).toHaveLength(1);
      expect(result.current.teams[0].players[0].name).toBe('Иван');
      expect(result.current.teams[0].totalRating).toBe(1200);
      expect(result.current.unassignedPoolPlayers).toHaveLength(1);
      expect(result.current.unassignedPoolPlayers[0].id).toBe('p-2');

      act(() => {
        result.current.assignPlayerToTeam('team-1', mockPlayer2);
      });

      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[0].totalRating).toBe(2600);
      expect(result.current.unassignedPoolPlayers).toHaveLength(0);
    });

    it('removePlayerFromTeam preserves empty team container without pruning in manual mode', () => {
      const { result } = renderHook(() => useTeamGenerator());

      const mockPlayer = { id: 'p-1', name: 'Иван', source: 'registered' as const, rating: 1200 };

      act(() => {
        result.current.toggleRegisteredPlayer(mockPlayer);
        result.current.initializeBlankTeams(2, 2);
      });

      act(() => {
        result.current.assignPlayerToTeam('team-1', mockPlayer);
      });

      expect(result.current.teams[0].players).toHaveLength(1);

      act(() => {
        result.current.removePlayerFromTeam('team-1', 'p-1');
      });

      // Team container is preserved with 0 players!
      expect(result.current.teams).toHaveLength(2);
      expect(result.current.teams[0].id).toBe('team-1');
      expect(result.current.teams[0].players).toEqual([]);
      expect(result.current.teams[0].totalRating).toBe(0);
      expect(result.current.unassignedPoolPlayers).toHaveLength(1);
      expect(result.current.unassignedPoolPlayers[0].id).toBe('p-1');
    });

    it('autoFillRemainingSlots fills remaining slots across incomplete teams', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
        result.current.addGuest('A, B, C, D');
        result.current.initializeBlankTeams(2, 2);
      });

      expect(result.current.unassignedPoolPlayers).toHaveLength(4);
      expect(result.current.hasIncompleteTeams).toBe(true);

      // Manually assign 1 player to team-1
      const playerA = result.current.activePool[0];
      act(() => {
        result.current.assignPlayerToTeam('team-1', playerA);
      });

      expect(result.current.teams[0].players).toHaveLength(1);
      expect(result.current.teams[1].players).toHaveLength(0);
      expect(result.current.unassignedPoolPlayers).toHaveLength(3);

      // Auto-fill remaining 3 slots
      act(() => {
        result.current.autoFillRemainingSlots();
      });

      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[1].players).toHaveLength(2);
      expect(result.current.unassignedPoolPlayers).toHaveLength(0);
      expect(result.current.hasIncompleteTeams).toBe(false);
    });

    it('autoFillRemainingSlots with balance sorts players and distributes to weakest team', () => {
      const { result } = renderHook(() => useTeamGenerator());

      const p1 = { id: 'p-1', name: 'Strong 1', rating: 1600, source: 'registered' as const };
      const p2 = { id: 'p-2', name: 'Strong 2', rating: 1500, source: 'registered' as const };
      const p3 = { id: 'p-3', name: 'Weak 1', rating: 1100, source: 'registered' as const };
      const p4 = { id: 'p-4', name: 'Weak 2', rating: 1000, source: 'registered' as const };

      act(() => {
        result.current.toggleRegisteredPlayer(p1);
        result.current.toggleRegisteredPlayer(p2);
        result.current.toggleRegisteredPlayer(p3);
        result.current.toggleRegisteredPlayer(p4);
        result.current.initializeBlankTeams(2, 2);
      });

      act(() => {
        result.current.autoFillRemainingSlots(true);
      });

      expect(result.current.teams[0].players).toHaveLength(2);
      expect(result.current.teams[1].players).toHaveLength(2);
      // Total ratings should be balanced (1600+1000=2600 vs 1500+1100=2600)
      expect(result.current.teams[0].totalRating).toBe(2600);
      expect(result.current.teams[1].totalRating).toBe(2600);
    });
  });
});




