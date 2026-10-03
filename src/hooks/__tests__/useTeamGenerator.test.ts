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

    expect(result.current.activePool).toEqual([]);
    expect(result.current.players).toEqual([]);
    expect(result.current.numberOfTeams).toBeNull();
    expect(result.current.playersPerTeam).toBeNull();
    expect(result.current.teams).toEqual([]);
    expect(result.current.history).toEqual([]);
    expect(result.current.alert).toBeNull();
    expect(result.current.balanceByRating).toBe(false);
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
        result.current.addGuest('Гост 1, Гост 2');
        result.current.toggleRegisteredPlayer({ id: 'db-1', name: 'Играч 1', rating: 1200 });
        result.current.setNumberOfTeams(2);
      });

      expect(result.current.activePool).toHaveLength(3);

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

    it('shows error if generating teams with fewer than 2 players', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
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

    it('shows error if neither numberOfTeams nor playersPerTeam is specified', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
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

    it('shows error if numberOfTeams is greater than pool size', () => {
      const { result } = renderHook(() => useTeamGenerator());

      act(() => {
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
        result.current.addGuest('Иван, Петър');
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
});
