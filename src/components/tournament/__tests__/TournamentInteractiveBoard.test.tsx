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
    expect(screen.getAllByText('Иван Иванов').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Петър Петров').length).toBeGreaterThanOrEqual(1);
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

  it('supports flexible team count input and [-] / [+] counter buttons', () => {
    render(<TournamentInteractiveBoard tournament={baseTournament} />);

    const countInput = screen.getByLabelText('Целеви брой отбори') as HTMLInputElement;
    expect(countInput.value).toBe('8');

    const decrementBtn = screen.getByRole('button', { name: 'Намали брой отбори' });
    const incrementBtn = screen.getByRole('button', { name: 'Увеличи брой отбори' });

    // Decrement from 8 to 7
    act(() => {
      fireEvent.click(decrementBtn);
    });
    expect(countInput.value).toBe('7');

    // Increment from 7 to 8
    act(() => {
      fireEvent.click(incrementBtn);
    });
    expect(countInput.value).toBe('8');

    // Direct input change
    act(() => {
      fireEvent.change(countInput, { target: { value: '12' } });
    });
    expect(countInput.value).toBe('12');
  });

  it('adds a blank team dynamically via "➕ Добави отбор" without resetting existing teams', () => {
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
          players: [],
          totalRating: 0,
        },
      ],
      activePool: [{ id: 'p-1', name: 'Иван Иванов', rating: 1200, source: 'registered' }],
      groups: [],
      schedule: [],
    };

    render(
      <TournamentInteractiveBoard
        tournament={{ ...baseTournament, draft_state: existingDraft }}
      />
    );

    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();
    expect(screen.queryByText('Отбор 3')).not.toBeInTheDocument();

    const addTeamBtn = screen.getByRole('button', { name: /добави отбор/i });
    act(() => {
      fireEvent.click(addTeamBtn);
    });

    // A 3rd team is added
    expect(screen.getByText('Отбор 3')).toBeInTheDocument();
    // Team 1 still has its assigned player intact
    expect(screen.getAllByText('Иван Иванов').length).toBeGreaterThanOrEqual(1);
  });

  it('deletes a team via trash button and frees assigned players back to pool', () => {
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
          players: [],
          totalRating: 0,
        },
      ],
      activePool: [{ id: 'p-1', name: 'Иван Иванов', rating: 1200, source: 'registered' }],
      groups: [],
      schedule: [],
    };

    render(
      <TournamentInteractiveBoard
        tournament={{ ...baseTournament, draft_state: existingDraft }}
      />
    );

    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();

    const deleteTeam1Btn = screen.getByRole('button', { name: 'Изтрий Отбор 1' });
    act(() => {
      fireEvent.click(deleteTeam1Btn);
    });

    // Team 1 is removed
    expect(screen.queryByText('Отбор 1')).not.toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();

    // Player Иван Иванов was freed back to unassigned pool:
    // Click on empty slot of Team 2 to open picker modal and verify Иван Иванов is available
    const emptySlot = screen.getAllByTestId('empty-slot')[0];
    act(() => {
      fireEvent.click(emptySlot);
    });

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Иван Иванов')).toBeInTheDocument();
  });

  it('does NOT render pool shortage warning banner in manual mode', () => {
    // 4 teams in manual mode, but only 2 players in activePool (needs 8 in doubles)
    const manualDraft: TournamentDraftState = {
      targetTeams: 4,
      formationMode: 'manual',
      teams: [
        { id: 'team-1', name: 'Отбор 1', players: [{ id: 'p-1', name: 'Иван Иванов', rating: 1200 }] },
        { id: 'team-2', name: 'Отбор 2', players: [{ id: 'p-2', name: 'Петър Петров', rating: 1150 }] },
        { id: 'team-3', name: 'Отбор 3', players: [] },
        { id: 'team-4', name: 'Отбор 4', players: [] },
      ],
      activePool: [
        { id: 'p-1', name: 'Иван Иванов', rating: 1200, source: 'registered' },
        { id: 'p-2', name: 'Петър Петров', rating: 1150, source: 'registered' },
      ],
      groups: [],
      schedule: [],
    };

    render(
      <TournamentInteractiveBoard
        tournament={{ ...baseTournament, draft_state: manualDraft }}
      />
    );

    // In manual mode, the shortage banner should NOT appear
    expect(screen.queryByText(/недостиг на играчи/i)).not.toBeInTheDocument();
  });

  it('renders visible confirmed participants summary chips when players are in pool', () => {
    const draftWithPool: TournamentDraftState = {
      targetTeams: 2,
      formationMode: 'manual',
      teams: [
        { id: 'team-1', name: 'Отбор 1', players: [] },
        { id: 'team-2', name: 'Отбор 2', players: [] },
      ],
      activePool: [
        { id: 'p-1', name: 'Иван Иванов', rating: 1200, source: 'registered' },
        { id: 'p-2', name: 'Петър Петров', rating: 1150, source: 'registered' },
      ],
      groups: [],
      schedule: [],
    };

    render(
      <TournamentInteractiveBoard
        tournament={{ ...baseTournament, draft_state: draftWithPool }}
      />
    );

    // With teams present, the pool is collapsed by default and shows the confirmed participants preview
    const participantsSummary = screen.getByTestId('confirmed-participants-summary');
    expect(participantsSummary).toBeInTheDocument();
    expect(within(participantsSummary).getByText('Иван Иванов')).toBeInTheDocument();
    expect(within(participantsSummary).getByText('Петър Петров')).toBeInTheDocument();
  });

  describe('Intelligent Auto-Fill Remaining Slots', () => {
    it('shows friendly notice when clicking "Попълни останалите автоматично" with 0 unassigned pool players, and does NOT render persistent red shortage error banner', () => {
      vi.useFakeTimers();

      // 2 teams in doubles (need 4 players total). Only 2 players in pool, both already assigned to team 1.
      // team 2 has 2 empty slots, but 0 unassigned players in pool.
      const manualDraft: TournamentDraftState = {
        targetTeams: 2,
        formationMode: 'manual',
        teams: [
          {
            id: 'team-1',
            name: 'Отбор 1',
            players: [
              { id: 'p-1', name: 'Иван Иванов', rating: 1200 },
              { id: 'p-2', name: 'Петър Петров', rating: 1150 },
            ],
          },
          { id: 'team-2', name: 'Отбор 2', players: [] },
        ],
        activePool: [
          { id: 'p-1', name: 'Иван Иванов', rating: 1200, source: 'registered' },
          { id: 'p-2', name: 'Петър Петров', rating: 1150, source: 'registered' },
        ],
        groups: [],
        schedule: [],
      };

      render(
        <TournamentInteractiveBoard
          tournament={{ ...baseTournament, draft_state: manualDraft }}
        />
      );

      const autoFillBtn = screen.getAllByRole('button', { name: /попълни останалите автоматично/i })[0];
      act(() => {
        fireEvent.click(autoFillBtn);
      });

      // Persistent red shortage banner should NOT be displayed
      expect(screen.queryByText(/недостиг на играчи/i)).not.toBeInTheDocument();

      // Friendly notice displayed
      const noticeText = 'Няма налични свободни играчи в пула за автоматично попълване.';
      expect(screen.getByText(noticeText)).toBeInTheDocument();

      // Empty slots remain intact and clickable
      const emptySlots = screen.getAllByTestId('empty-slot');
      expect(emptySlots).toHaveLength(2);

      // Auto-dismisses after 4000ms
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.queryByText(noticeText)).not.toBeInTheDocument();
    });

    it('partially fills available unassigned pool players and shows friendly info notice with remaining empty count', async () => {
      vi.useFakeTimers();

      // 2 teams in doubles (4 total slots). Team 1 has 2 players, Team 2 has 0 players (2 empty slots).
      // Pool has 3 players: 2 assigned + 1 unassigned ("Димитър Димитров").
      const manualDraft: TournamentDraftState = {
        targetTeams: 2,
        formationMode: 'manual',
        teams: [
          {
            id: 'team-1',
            name: 'Отбор 1',
            players: [
              { id: 'p-1', name: 'Иван Иванов', rating: 1200 },
              { id: 'p-2', name: 'Петър Петров', rating: 1150 },
            ],
          },
          { id: 'team-2', name: 'Отбор 2', players: [] },
        ],
        activePool: [
          { id: 'p-1', name: 'Иван Иванов', rating: 1200, source: 'registered' },
          { id: 'p-2', name: 'Петър Петров', rating: 1150, source: 'registered' },
          { id: 'p-3', name: 'Димитър Димитров', rating: 1100, source: 'guest' },
        ],
        groups: [],
        schedule: [],
      };

      render(
        <TournamentInteractiveBoard
          tournament={{ ...baseTournament, draft_state: manualDraft }}
        />
      );

      const autoFillBtn = screen.getAllByRole('button', { name: /попълни останалите автоматично/i })[0];
      act(() => {
        fireEvent.click(autoFillBtn);
      });

      // No red error banner
      expect(screen.queryByText(/недостиг на играчи/i)).not.toBeInTheDocument();

      // Friendly notice: 1 filled, 1 remaining
      const noticeText = 'Попълнени са 1 играча. Остават 1 свободни места за ръчен избор.';
      expect(screen.getByText(noticeText)).toBeInTheDocument();

      // Player "Димитър Димитров" was assigned into Team 2
      expect(screen.getAllByText('Димитър Димитров').length).toBeGreaterThanOrEqual(2);

      // Exactly 1 empty slot remains and is clickable for manual selection
      const remainingSlots = screen.getAllByTestId('empty-slot');
      expect(remainingSlots).toHaveLength(1);

      // Auto-dismisses after 4000ms
      await act(async () => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.queryByText(noticeText)).not.toBeInTheDocument();
    });

    it('fills all empty slots when pool has enough unassigned players and shows success notice', async () => {
      vi.useFakeTimers();

      // 2 teams in doubles (4 total slots). Team 1 has 2 players, Team 2 has 0 players (2 empty slots).
      // Pool has 4 players: 2 assigned + 2 unassigned.
      const manualDraft: TournamentDraftState = {
        targetTeams: 2,
        formationMode: 'manual',
        teams: [
          {
            id: 'team-1',
            name: 'Отбор 1',
            players: [
              { id: 'p-1', name: 'Иван Иванов', rating: 1200 },
              { id: 'p-2', name: 'Петър Петров', rating: 1150 },
            ],
          },
          { id: 'team-2', name: 'Отбор 2', players: [] },
        ],
        activePool: [
          { id: 'p-1', name: 'Иван Иванов', rating: 1200, source: 'registered' },
          { id: 'p-2', name: 'Петър Петров', rating: 1150, source: 'registered' },
          { id: 'p-3', name: 'Димитър Димитров', rating: 1100, source: 'guest' },
          { id: 'p-4', name: 'Георги Георгиев', rating: 1050, source: 'guest' },
        ],
        groups: [],
        schedule: [],
      };

      render(
        <TournamentInteractiveBoard
          tournament={{ ...baseTournament, draft_state: manualDraft }}
        />
      );

      const autoFillBtn = screen.getAllByRole('button', { name: /попълни останалите автоматично/i })[0];
      act(() => {
        fireEvent.click(autoFillBtn);
      });

      // No red error banner
      expect(screen.queryByText(/недостиг на играчи/i)).not.toBeInTheDocument();

      // Friendly success notice
      const successText = 'Всички свободни места бяха успешно попълнени.';
      expect(screen.getByText(successText)).toBeInTheDocument();

      // No empty slots remain
      expect(screen.queryByTestId('empty-slot')).not.toBeInTheDocument();

      // Auto-dismisses after 4000ms
      await act(async () => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.queryByText(successText)).not.toBeInTheDocument();
    });
  });

  describe('Universal Mathematical Validation & Auto-Adjustment', () => {
    const createPlayers = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `p-${i + 1}`,
        name: `Играч ${i + 1}`,
        rating: 1000 + i * 20,
        source: 'guest' as const,
      }));

    it('P = 15, T = 7 (Case 2): generates 7 full teams, shows 1 reserve banner, and groups can be drawn for 7 teams', () => {
      const draft: TournamentDraftState = {
        targetTeams: 7,
        formationMode: 'auto',
        teams: [],
        activePool: createPlayers(15),
        groups: [],
        schedule: [],
      };

      render(<TournamentInteractiveBoard tournament={{ ...baseTournament, draft_state: draft }} />);

      const generateBtn = screen.getByRole('button', { name: /генерирай отбори от пула/i });
      act(() => {
        fireEvent.click(generateBtn);
      });

      // 7 teams generated
      expect(screen.getByText('Отбор 1')).toBeInTheDocument();
      expect(screen.getByText('Отбор 7')).toBeInTheDocument();
      expect(screen.queryByText('Отбор 8')).not.toBeInTheDocument();

      // Banner message: "Сформирани са 7 отбора. 1 играч остава като резерва."
      expect(
        screen.getByText('Сформирани са 7 отбора. 1 играч остава като резерва.')
      ).toBeInTheDocument();

      // Groups can be drawn for 7 teams
      const drawGroupsBtn = screen.getAllByRole('button', { name: /тегли жребий за групи/i })[0];
      expect(drawGroupsBtn).not.toBeDisabled();

      act(() => {
        fireEvent.click(drawGroupsBtn);
      });

      // Groups are rendered (Група А and Група Б)
      expect(screen.getByText('Група А')).toBeInTheDocument();
      expect(screen.getByText('Група Б')).toBeInTheDocument();
    });

    it('P = 16, T = 7 (Case 1): adapts target teams to 8 teams, generates 8 full teams, and shows banner', () => {
      const draft: TournamentDraftState = {
        targetTeams: 7,
        formationMode: 'auto',
        teams: [],
        activePool: createPlayers(16),
        groups: [],
        schedule: [],
      };

      render(<TournamentInteractiveBoard tournament={{ ...baseTournament, draft_state: draft }} />);

      const generateBtn = screen.getByRole('button', { name: /генерирай отбори от пула/i });
      act(() => {
        fireEvent.click(generateBtn);
      });

      // 8 teams generated
      expect(screen.getByText('Отбор 1')).toBeInTheDocument();
      expect(screen.getByText('Отбор 8')).toBeInTheDocument();

      // Target team input updated to 8
      const targetInput = screen.getByLabelText('Целеви брой отбори') as HTMLInputElement;
      expect(targetInput.value).toBe('8');

      // Banner message: "Поради наличие на 16 играчи, турнирът се формира с 8 отбора."
      expect(
        screen.getByText('Поради наличие на 16 играчи, турнирът се формира с 8 отбора.')
      ).toBeInTheDocument();
    });

    it('P = 17, T = 7 (Case 1 with reserve): adapts target teams to 8 teams, generates 8 full teams with 1 reserve banner', () => {
      const draft: TournamentDraftState = {
        targetTeams: 7,
        formationMode: 'auto',
        teams: [],
        activePool: createPlayers(17),
        groups: [],
        schedule: [],
      };

      render(<TournamentInteractiveBoard tournament={{ ...baseTournament, draft_state: draft }} />);

      const generateBtn = screen.getByRole('button', { name: /генерирай отбори от пула/i });
      act(() => {
        fireEvent.click(generateBtn);
      });

      // 8 teams generated
      expect(screen.getByText('Отбор 8')).toBeInTheDocument();

      // Target team input updated to 8
      const targetInput = screen.getByLabelText('Целеви брой отбори') as HTMLInputElement;
      expect(targetInput.value).toBe('8');

      // Banner message: "Поради наличие на 17 играчи, турнирът се формира с 8 отбора. 1 играч остава като резерва."
      expect(
        screen.getByText('Поради наличие на 17 играчи, турнирът се формира с 8 отбора. 1 играч остава като резерва.')
      ).toBeInTheDocument();
    });

    it('P = 13, T = 7 (Case 4): generates 7 teams with 1 team having 1 slot, shortage banner, clicking draw groups prunes to 6 teams, draws groups for 6 teams with adjustment banner', () => {
      const draft: TournamentDraftState = {
        targetTeams: 7,
        formationMode: 'auto',
        teams: [],
        activePool: createPlayers(13),
        groups: [],
        schedule: [],
      };

      render(<TournamentInteractiveBoard tournament={{ ...baseTournament, draft_state: draft }} />);

      const generateBtn = screen.getByRole('button', { name: /генерирай отбори от пула/i });
      act(() => {
        fireEvent.click(generateBtn);
      });

      // 7 teams generated
      expect(screen.getByText('Отбор 7')).toBeInTheDocument();

      // Exactly 1 empty slot "[ + Избери играч ]" rendered
      const emptySlotButtons = screen.getAllByRole('button', { name: /избери играч/i });
      expect(emptySlotButtons).toHaveLength(1);

      // Shortage banner
      expect(
        screen.getByText('Необходим е още 1 играч за попълване на 7 отбора.')
      ).toBeInTheDocument();

      // Draw groups button is available and enabled
      const drawGroupsBtn = screen.getAllByRole('button', { name: /тегли жребий за групи/i })[0];
      expect(drawGroupsBtn).not.toBeDisabled();

      // Clicking draw groups prunes the incomplete team to 6 teams and draws groups!
      act(() => {
        fireEvent.click(drawGroupsBtn);
      });

      // Target team count input updated to 6
      const targetInput = screen.getByLabelText('Целеви брой отбори') as HTMLInputElement;
      expect(targetInput.value).toBe('6');

      // Adjustment banner: "Турнирът е коригиран на 6 отбора поради липсващ играч за последния отбор."
      expect(
        screen.getByText('Турнирът е коригиран на 6 отбора поради липсващ играч за последния отбор.')
      ).toBeInTheDocument();

      // Groups are drawn (Група А and Група Б for 6 teams)
      expect(screen.getByText('Група А')).toBeInTheDocument();
      expect(screen.getByText('Група Б')).toBeInTheDocument();
    });

    it('P = 12, T = 7 (Case 5): adapts target teams to 6 teams, generates 6 full teams, and shows banner', () => {
      const draft: TournamentDraftState = {
        targetTeams: 7,
        formationMode: 'auto',
        teams: [],
        activePool: createPlayers(12),
        groups: [],
        schedule: [],
      };

      render(<TournamentInteractiveBoard tournament={{ ...baseTournament, draft_state: draft }} />);

      const generateBtn = screen.getByRole('button', { name: /генерирай отбори от пула/i });
      act(() => {
        fireEvent.click(generateBtn);
      });

      expect(screen.getByText('Отбор 6')).toBeInTheDocument();
      expect(screen.queryByText('Отбор 7')).not.toBeInTheDocument();

      const targetInput = screen.getByLabelText('Целеви брой отбори') as HTMLInputElement;
      expect(targetInput.value).toBe('6');

      expect(
        screen.getByText('Поради 12 налични играчи турнирът е коригиран на 6 отбора (първоначално зададени 7).')
      ).toBeInTheDocument();
    });

    it('P = 9, T = 5 (Case 4): generates 5 teams with 1 team having 1 slot, draw groups prunes to 4 teams and auto-assigns group with adjustment banner', () => {
      const draft: TournamentDraftState = {
        targetTeams: 5,
        formationMode: 'auto',
        teams: [],
        activePool: createPlayers(9),
        groups: [],
        schedule: [],
      };

      render(<TournamentInteractiveBoard tournament={{ ...baseTournament, draft_state: draft }} />);

      const generateBtn = screen.getByRole('button', { name: /генерирай отбори от пула/i });
      act(() => {
        fireEvent.click(generateBtn);
      });

      expect(screen.getByText('Отбор 5')).toBeInTheDocument();
      expect(
        screen.getByText('Необходим е още 1 играч за попълване на 5 отбора.')
      ).toBeInTheDocument();

      const drawGroupsBtn = screen.getAllByRole('button', { name: /тегли жребий за групи/i })[0];
      expect(drawGroupsBtn).not.toBeDisabled();

      act(() => {
        fireEvent.click(drawGroupsBtn);
      });

      const targetInput = screen.getByLabelText('Целеви брой отбори') as HTMLInputElement;
      expect(targetInput.value).toBe('4');

      expect(
        screen.getByText('Турнирът е коригиран на 4 отбора поради липсващ играч за последния отбор.')
      ).toBeInTheDocument();

      // 4 teams auto-assigned to Група А
      expect(screen.getByText('Група А')).toBeInTheDocument();
    });

    it('P = 5, T = 3 (Case 4): generates 3 teams with 1 team having 1 slot, draw groups prunes to 2 teams with adjustment banner', () => {
      const draft: TournamentDraftState = {
        targetTeams: 3,
        formationMode: 'auto',
        teams: [],
        activePool: createPlayers(5),
        groups: [],
        schedule: [],
      };

      render(<TournamentInteractiveBoard tournament={{ ...baseTournament, draft_state: draft }} />);

      const generateBtn = screen.getByRole('button', { name: /генерирай отбори от пула/i });
      act(() => {
        fireEvent.click(generateBtn);
      });

      expect(screen.getByText('Отбор 3')).toBeInTheDocument();
      expect(
        screen.getByText('Необходим е още 1 играч за попълване на 3 отбора.')
      ).toBeInTheDocument();

      const drawGroupsBtn = screen.getAllByRole('button', { name: /тегли жребий за групи/i })[0];
      expect(drawGroupsBtn).not.toBeDisabled();

      act(() => {
        fireEvent.click(drawGroupsBtn);
      });

      const targetInput = screen.getByLabelText('Целеви брой отбори') as HTMLInputElement;
      expect(targetInput.value).toBe('2');

      expect(
        screen.getByText('Турнирът е коригиран на 2 отбора поради липсващ играч за последния отбор.')
      ).toBeInTheDocument();
    });

    it('P = 11, T = 7 (Case 5 with reserve): adapts target teams to 5 teams + 1 reserve banner', () => {
      const draft: TournamentDraftState = {
        targetTeams: 7,
        formationMode: 'auto',
        teams: [],
        activePool: createPlayers(11),
        groups: [],
        schedule: [],
      };

      render(<TournamentInteractiveBoard tournament={{ ...baseTournament, draft_state: draft }} />);

      const generateBtn = screen.getByRole('button', { name: /генерирай отбори от пула/i });
      act(() => {
        fireEvent.click(generateBtn);
      });

      expect(screen.getByText('Отбор 5')).toBeInTheDocument();
      expect(screen.queryByText('Отбор 6')).not.toBeInTheDocument();

      const targetInput = screen.getByLabelText('Целеви брой отбори') as HTMLInputElement;
      expect(targetInput.value).toBe('5');

      expect(
        screen.getByText(
          'Поради 11 налични играчи турнирът е коригиран на 5 отбора (първоначално зададени 7). 1 играч остава като резерва.'
        )
      ).toBeInTheDocument();
    });

    it('P = 14, T = 7 (Case 3): generates exactly 7 full teams with no reserves and no banner', () => {
      const draft: TournamentDraftState = {
        targetTeams: 7,
        formationMode: 'auto',
        teams: [],
        activePool: createPlayers(14),
        groups: [],
        schedule: [],
      };

      render(<TournamentInteractiveBoard tournament={{ ...baseTournament, draft_state: draft }} />);

      const generateBtn = screen.getByRole('button', { name: /генерирай отбори от пула/i });
      act(() => {
        fireEvent.click(generateBtn);
      });

      expect(screen.getByText('Отбор 7')).toBeInTheDocument();
      expect(screen.queryByText('Отбор 8')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('Singles mode: P = 7, T = 6 (Case 2): generates 6 full teams of 1 player with 1 reserve banner', () => {
      const singlesTournament: Tournament = {
        ...baseTournament,
        format: 'singles',
      };

      const draft: TournamentDraftState = {
        targetTeams: 6,
        formationMode: 'auto',
        teams: [],
        activePool: createPlayers(7),
        groups: [],
        schedule: [],
      };

      render(
        <TournamentInteractiveBoard
          tournament={{ ...singlesTournament, draft_state: draft }}
        />
      );

      const generateBtn = screen.getByRole('button', { name: /генерирай отбори от пула/i });
      act(() => {
        fireEvent.click(generateBtn);
      });

      expect(screen.getByText('Отбор 6')).toBeInTheDocument();
      expect(screen.queryByText('Отбор 7')).not.toBeInTheDocument();

      // In singles, 1 player per team:
      expect(
        screen.getByText('Сформирани са 6 отбора. 1 играч остава като резерва.')
      ).toBeInTheDocument();
    });
  });
});
