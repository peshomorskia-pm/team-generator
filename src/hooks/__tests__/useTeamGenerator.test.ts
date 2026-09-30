import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTeamGenerator } from '../useTeamGenerator';

describe('useTeamGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useTeamGenerator());

    expect(result.current.rawText).toBe('');
    expect(result.current.players).toEqual([]);
    expect(result.current.numberOfTeams).toBeNull();
    expect(result.current.playersPerTeam).toBeNull();
    expect(result.current.teams).toEqual([]);
    expect(result.current.alert).toBeNull();
    expect(result.current.balanceByRating).toBe(false);
  });

  it('correctly parses rawText with different rating formats', () => {
    const { result } = renderHook(() => useTeamGenerator());

    act(() => {
      result.current.setRawText('Иван (8)\nПетър [9]\nГеорги: 7\nДимитър');
    });

    expect(result.current.players).toHaveLength(4);
    expect(result.current.players[0]).toEqual({ id: 'p-1', name: 'Иван', rating: 8 });
    expect(result.current.players[1]).toEqual({ id: 'p-2', name: 'Петър', rating: 9 });
    expect(result.current.players[2]).toEqual({ id: 'p-3', name: 'Георги', rating: 7 });
    expect(result.current.players[3]).toEqual({ id: 'p-4', name: 'Димитър' });
  });

  it('adds players using addPlayer helper', () => {
    const { result } = renderHook(() => useTeamGenerator());

    act(() => {
      result.current.addPlayer('Иван', 8);
    });
    expect(result.current.rawText).toBe('Иван (8)');

    act(() => {
      result.current.addPlayer('Петър');
    });
    expect(result.current.rawText).toBe('Иван (8)\nПетър');
  });

  it('removes a player using removePlayer helper', () => {
    const { result } = renderHook(() => useTeamGenerator());

    act(() => {
      result.current.setRawText('Иван\nПетър\nГеорги');
    });

    expect(result.current.players).toHaveLength(3);

    // Remove 2nd player (id: 'p-2')
    act(() => {
      result.current.removePlayer('p-2');
    });

    expect(result.current.rawText).toBe('Иван\nГеорги');
    expect(result.current.players).toHaveLength(2);
    expect(result.current.players[0].name).toBe('Иван');
    expect(result.current.players[1].name).toBe('Георги');
  });

  it('shows error if generating teams with empty player list', () => {
    const { result } = renderHook(() => useTeamGenerator());

    act(() => {
      result.current.generateTeams();
    });

    expect(result.current.alert).toEqual({
      type: 'error',
      message: 'Списъкът с играчи е празен. Моля, въведете поне няколко имена.',
    });
  });

  it('shows error if generating teams with less than 2 players', () => {
    const { result } = renderHook(() => useTeamGenerator());

    act(() => {
      result.current.setRawText('Иван');
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
      result.current.setRawText('Иван\nПетър');
    });

    act(() => {
      result.current.generateTeams();
    });

    expect(result.current.alert).toEqual({
      type: 'error',
      message: "Моля, въведете 'Брой отбори' или 'Брой играчи в отбор'.",
    });
  });

  it('shows error if numberOfTeams is greater than players count', () => {
    const { result } = renderHook(() => useTeamGenerator());

    act(() => {
      result.current.setRawText('Иван\nПетър');
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

  it('generates teams successfully by numberOfTeams', () => {
    const { result } = renderHook(() => useTeamGenerator());

    act(() => {
      result.current.setRawText('Иван\nПетър\nГеорги\nДимитър');
      result.current.setNumberOfTeams(2);
    });

    act(() => {
      result.current.generateTeams();
    });

    expect(result.current.teams).toHaveLength(2);
    expect(result.current.teams[0].players.length + result.current.teams[1].players.length).toBe(4);
    expect(result.current.alert).toBeNull();
  });

  it('generates teams successfully by playersPerTeam', () => {
    const { result } = renderHook(() => useTeamGenerator());

    act(() => {
      result.current.setRawText('Иван\nПетър\nГеорги\nДимитър');
      result.current.setPlayersPerTeam(2);
    });

    act(() => {
      result.current.generateTeams();
    });

    expect(result.current.teams).toHaveLength(2);
    expect(result.current.teams[0].players).toHaveLength(2);
    expect(result.current.teams[1].players).toHaveLength(2);
  });

  it('balances teams evenly by rating when balanceByRating is true', () => {
    const { result } = renderHook(() => useTeamGenerator());

    act(() => {
      result.current.setRawText('Иван (10)\nПетър (10)\nГеорги (5)\nДимитър (5)');
      result.current.setNumberOfTeams(2);
      result.current.setBalanceByRating(true);
    });

    act(() => {
      result.current.generateTeams();
    });

    expect(result.current.teams).toHaveLength(2);
    // Balanced teams should each have 15 total rating (10 + 5)
    expect(result.current.teams[0].totalRating).toBe(15);
    expect(result.current.teams[1].totalRating).toBe(15);
  });

  it('shuffles single team order', () => {
    const { result } = renderHook(() => useTeamGenerator());

    act(() => {
      result.current.setRawText('Иван\nПетър\nГеорги\nДимитър\nСтефан\nСтоян');
      result.current.setNumberOfTeams(2);
    });

    act(() => {
      result.current.generateTeams();
    });

    const originalFirstTeamPlayers = [...result.current.teams[0].players];

    act(() => {
      result.current.shuffleSingleTeam(result.current.teams[0].id);
    });

    // Players list should still have same elements
    expect(result.current.teams[0].players).toHaveLength(originalFirstTeamPlayers.length);
  });

  it('copies results to clipboard', async () => {
    const { result } = renderHook(() => useTeamGenerator());

    // Mock clipboard API
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    act(() => {
      result.current.setRawText('Иван\nПетър');
      result.current.setNumberOfTeams(2);
    });

    act(() => {
      result.current.generateTeams();
    });

    let copySuccess: boolean | undefined;
    await act(async () => {
      copySuccess = await result.current.copyResults();
    });

    expect(copySuccess).toBe(true);
    expect(writeTextMock).toHaveBeenCalled();
    expect(result.current.isCopied).toBe(true);
  });
});
