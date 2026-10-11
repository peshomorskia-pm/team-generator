import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { TournamentInteractiveBoard } from '../TournamentInteractiveBoard';
import * as useTournamentsModule from '../../../hooks/useTournaments';
import * as useMatchesModule from '../../../hooks/useMatches';
import * as usePlayersModule from '../../../hooks/usePlayers';
import type { Tournament, TournamentDraftState } from '../../../types/tournament';

describe('TournamentInteractiveBoard Component', () => {
  const saveTournamentDraftMock = vi.fn();
  const bulkCreateMatchesMock = vi.fn();

  const dummyDbPlayers = [
    {
      id: 'p-1',
      name: 'Иван Иванов',
      rating: 1200,
      singles_rating: 1200,
      doubles_rating: 1200,
      singles_matches_played: 2,
      singles_wins: 2,
      singles_losses: 0,
      doubles_matches_played: 2,
      doubles_wins: 2,
      doubles_losses: 0,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'p-2',
      name: 'Петър Петров',
      rating: 1150,
      singles_rating: 1150,
      doubles_rating: 1150,
      singles_matches_played: 1,
      singles_wins: 1,
      singles_losses: 0,
      doubles_matches_played: 1,
      doubles_wins: 1,
      doubles_losses: 0,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  const baseTournament: Tournament = {
    id: 'tourn-100',
    title: 'Тестов турнир',
    date: '2026-10-15',
    format: 'doubles',
    status: 'draft',
    winner_team_name: null,
    notes: 'Интерактивни тестове',
    draft_state: null,
    created_at: '2026-10-11T12:00:00Z',
    updated_at: '2026-10-11T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    saveTournamentDraftMock.mockResolvedValue(true);
    bulkCreateMatchesMock.mockResolvedValue({ count: 2, error: null });

    vi.spyOn(useTournamentsModule, 'useTournaments').mockReturnValue({
      tournaments: [baseTournament],
      loading: false,
      error: null,
      fetchTournaments: vi.fn(),
      createTournament: vi.fn(),
      updateTournament: vi.fn(),
      deleteTournament: vi.fn(),
      saveTournamentDraft: saveTournamentDraftMock,
    });

    vi.spyOn(useMatchesModule, 'useMatches').mockReturnValue({
      matches: [],
      loading: false,
      error: null,
      alert: null,
      fetchMatches: vi.fn(),
      createMatch: vi.fn(),
      updateMatch: vi.fn(),
      deleteMatch: vi.fn(),
      bulkCreateMatches: bulkCreateMatchesMock,
      clearAlert: vi.fn(),
    });

    vi.spyOn(usePlayersModule, 'usePlayers').mockReturnValue({
      players: dummyDbPlayers,
      loading: false,
      error: null,
      alert: null,
      fetchPlayers: vi.fn(),
      createPlayer: vi.fn(),
      updatePlayer: vi.fn(),
      deletePlayer: vi.fn(),
      clearAlert: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hydrates existing draft state properly on mount', () => {
    const existingDraft: TournamentDraftState = {
      targetTeams: 2,
      formationMode: 'manual',
      teams: [
        {
          id: 'team-1',
          name: 'Отбор 1',
          players: [{ id: 'p-1', name: 'Иван Иванов', rating: 1200 }],
          totalRating: 1200,
        },
        {
          id: 'team-2',
          name: 'Отбор 2',
          players: [{ id: 'p-2', name: 'Петър Петров', rating: 1150 }],
          totalRating: 1150,
        },
      ],
      activePool: [
        { id: 'p-1', name: 'Иван Иванов', rating: 1200, source: 'registered' },
        { id: 'p-2', name: 'Петър Петров', rating: 1150, source: 'registered' },
      ],
      groups: [],
      schedule: [],
    };

    const tournamentWithDraft: Tournament = {
      ...baseTournament,
      draft_state: existingDraft,
    };

    render(
      <TournamentInteractiveBoard
        tournament={tournamentWithDraft}
      />
    );

    // Verifies hydrated teams are rendered
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Петър Петров')).toBeInTheDocument();
    expect(screen.getByText('✓ Всички промени са запазени като чернова')).toBeInTheDocument();
  });

  it('verifies format is strictly locked to tournament.format (no format switcher pills rendered)', () => {
    render(
      <TournamentInteractiveBoard
        tournament={baseTournament}
      />
    );

    // Locked badge is displayed
    expect(screen.getByText('По двойки')).toBeInTheDocument();

    // No toggle controls to switch between singles and doubles or change mode
    expect(screen.queryByRole('button', { name: /^Поединично$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^По двойки$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /общ генератор/i })).not.toBeInTheDocument();
  });

  it('automatically invokes saveTournamentDraft 800ms after slot assignment and displays status badge', async () => {
    vi.useFakeTimers();

    render(
      <TournamentInteractiveBoard
        tournament={baseTournament}
      />
    );

    // Create 4 blank teams
    const createBlankBtn = screen.getByRole('button', { name: /създай празни отбори/i });
    act(() => {
      fireEvent.click(createBlankBtn);
    });

    // An empty slot should be available
    const emptySlots = screen.getAllByTestId('empty-slot');
    expect(emptySlots.length).toBeGreaterThan(0);

    // Click on the first empty slot to open picker modal
    act(() => {
      fireEvent.click(emptySlots[0]);
    });

    // The picker modal opens
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Select the player "Иван Иванов" within modal
    const playerToAssign = within(dialog).getByText('Иван Иванов');
    act(() => {
      fireEvent.click(playerToAssign);
    });

    // Debounce timer (800ms) is active and saving indicator is shown
    expect(screen.getByTestId('draft-status-saving')).toHaveTextContent('Запазване на чернова...');
    expect(saveTournamentDraftMock).not.toHaveBeenCalled();

    // Fast-forward by 800ms
    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(saveTournamentDraftMock).toHaveBeenCalledTimes(1);
    expect(saveTournamentDraftMock).toHaveBeenCalledWith(
      'tourn-100',
      expect.objectContaining({
        teams: expect.arrayContaining([
          expect.objectContaining({
            players: expect.arrayContaining([
              expect.objectContaining({ name: 'Иван Иванов' }),
            ]),
          }),
        ]),
      })
    );

    // Resolves and displays saved badge
    expect(screen.getByTestId('draft-status-saved')).toHaveTextContent(
      '✓ Всички промени са запазени като чернова'
    );
  });

  it('verifies "🎲 Тегли жребий за групи" is disabled when incomplete teams exist', () => {
    // 6 teams but with incomplete slots
    const draftWithIncomplete: TournamentDraftState = {
      targetTeams: 6,
      formationMode: 'manual',
      teams: Array.from({ length: 6 }, (_, i) => ({
        id: `team-${i + 1}`,
        name: `Отбор ${i + 1}`,
        players: i === 0 ? [] : [{ id: `p-${i}`, name: `Играч ${i}`, rating: 1200 }],
        totalRating: 1200,
      })),
      activePool: [],
      groups: [],
      schedule: [],
    };

    render(
      <TournamentInteractiveBoard
        tournament={{ ...baseTournament, draft_state: draftWithIncomplete }}
      />
    );

    const drawGroupsBtns = screen.getAllByRole('button', { name: /тегли жребий за групи/i });
    expect(drawGroupsBtns.length).toBeGreaterThanOrEqual(1);
    drawGroupsBtns.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('clicking "💾 Запиши мачове за турнира" calls bulkCreateMatches and triggers onMatchesCreated', async () => {
    const onMatchesCreatedMock = vi.fn();

    const teamA = { id: 'team-1', name: 'Отбор 1', players: [{ id: 'p-1', name: 'Иван' }] };
    const teamB = { id: 'team-2', name: 'Отбор 2', players: [{ id: 'p-2', name: 'Петър' }] };

    const draftWithSchedule: TournamentDraftState = {
      targetTeams: 2,
      formationMode: 'manual',
      teams: [teamA, teamB],
      activePool: [],
      groups: [{ id: 'group-0', name: 'Група А', teams: [teamA, teamB] }],
      schedule: [
        {
          id: 'match-1',
          groupId: 'group-0',
          groupName: 'Група А',
          round: 1,
          team1: teamA,
          team2: teamB,
        },
      ],
    };

    render(
      <TournamentInteractiveBoard
        tournament={{ ...baseTournament, draft_state: draftWithSchedule }}
        onMatchesCreated={onMatchesCreatedMock}
      />
    );

    const saveMatchesBtn = screen.getByRole('button', { name: /запиши мачове за турнира/i });
    expect(saveMatchesBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(saveMatchesBtn);
    });

    expect(bulkCreateMatchesMock).toHaveBeenCalledTimes(1);
    expect(bulkCreateMatchesMock).toHaveBeenCalledWith(
      draftWithSchedule.schedule,
      'doubles',
      'tourn-100'
    );
    expect(saveTournamentDraftMock).toHaveBeenCalledWith('tourn-100', null);
    expect(onMatchesCreatedMock).toHaveBeenCalledTimes(1);
  });
});
