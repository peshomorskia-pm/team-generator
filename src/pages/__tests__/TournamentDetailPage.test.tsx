import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TournamentDetailPage } from '../TournamentDetailPage';
import { ThemeProvider } from '../../context/ThemeContext';
import * as useTournamentsModule from '../../hooks/useTournaments';
import * as useMatchesModule from '../../hooks/useMatches';
import * as usePlayersModule from '../../hooks/usePlayers';
import type { Tournament } from '../../types/tournament';
import type { MatchDetail } from '../../types/matches';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('TournamentDetailPage Integration Tests', () => {
  const mockUpdateTournament = vi.fn();
  const mockDeleteTournament = vi.fn();
  const mockUpdateMatch = vi.fn();
  const mockDeleteMatch = vi.fn();

  const dummyTournament: Tournament = {
    id: 't-1',
    title: 'Пролетен Мастърс 2026',
    date: '2026-04-18',
    format: 'doubles',
    status: 'in_progress',
    winner_team_name: null,
    notes: 'Кортове на открито',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
  };

  const dummyMatches: MatchDetail[] = [
    {
      id: 'm-1',
      match_format: 'doubles',
      team_1_score: 6,
      team_2_score: 4,
      played_at: '2026-04-18T11:00:00Z',
      team_1_name: 'Отбор Алфа',
      team_2_name: 'Отбор Бета',
      group_name: 'Група А',
      round: 1,
      tournament_id: 't-1',
      created_at: '2026-04-18T11:00:00Z',
      updated_at: '2026-04-18T11:00:00Z',
      match_players: [
        {
          id: 'mp-1',
          match_id: 'm-1',
          player_id: 'p-1',
          team_side: 'team_1',
          rating_before: 1200,
          rating_after: 1215,
          guest_name: null,
          players: { id: 'p-1', name: 'Иван' },
        },
        {
          id: 'mp-2',
          match_id: 'm-1',
          player_id: 'p-2',
          team_side: 'team_2',
          rating_before: 1200,
          rating_after: 1185,
          guest_name: null,
          players: { id: 'p-2', name: 'Георги' },
        },
      ],
    },
    {
      id: 'm-2',
      match_format: 'doubles',
      team_1_score: null,
      team_2_score: null,
      played_at: '2026-04-18T14:00:00Z',
      team_1_name: 'Отбор Гама',
      team_2_name: 'Отбор Делта',
      group_name: 'Група Б',
      round: 2,
      tournament_id: 't-1',
      created_at: '2026-04-18T11:00:00Z',
      updated_at: '2026-04-18T11:00:00Z',
      match_players: [],
    },
    {
      id: 'm-other',
      match_format: 'singles',
      team_1_score: 6,
      team_2_score: 2,
      played_at: '2026-04-18T10:00:00Z',
      team_1_name: 'Играч 1',
      team_2_name: 'Играч 2',
      group_name: null,
      round: null,
      tournament_id: 't-other', // different tournament
      created_at: '2026-04-18T10:00:00Z',
      updated_at: '2026-04-18T10:00:00Z',
      match_players: [],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    mockUpdateTournament.mockReset();
    mockDeleteTournament.mockReset();
    mockUpdateMatch.mockReset();
    mockDeleteMatch.mockReset();

    vi.spyOn(useTournamentsModule, 'useTournaments').mockReturnValue({
      tournaments: [dummyTournament],
      loading: false,
      error: null,
      fetchTournaments: vi.fn(),
      createTournament: vi.fn(),
      updateTournament: mockUpdateTournament,
      deleteTournament: mockDeleteTournament,
    });

    vi.spyOn(useMatchesModule, 'useMatches').mockReturnValue({
      matches: dummyMatches,
      loading: false,
      error: null,
      alert: null,
      fetchMatches: vi.fn(),
      createMatch: vi.fn(),
      updateMatch: mockUpdateMatch,
      deleteMatch: mockDeleteMatch,
      bulkCreateMatches: vi.fn(),
      clearAlert: vi.fn(),
    });

    vi.spyOn(usePlayersModule, 'usePlayers').mockReturnValue({
      players: [],
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

  const renderComponent = (
    route = '/tournaments/t-1',
    locationState?: { fromBulkCreate?: boolean; matchCount?: number }
  ) => {
    return render(
      <ThemeProvider>
        <MemoryRouter
          initialEntries={[
            locationState ? { pathname: route, state: locationState } : route,
          ]}
        >
          <Routes>
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders tournament header with title, format, status badge, formatted date, and notes', () => {
    renderComponent();

    // Title
    expect(
      screen.getByRole('heading', { level: 1, name: /пролетен мастърс 2026/i })
    ).toBeInTheDocument();

    // Format badge
    expect(screen.getAllByText('По двойки').length).toBeGreaterThanOrEqual(1);

    // Status badge
    expect(screen.getAllByText('В ход').length).toBeGreaterThanOrEqual(1);

    // Date formatted as DD.MM.YYYY г.
    expect(screen.getAllByText('18.04.2026 г.').length).toBeGreaterThanOrEqual(1);

    // Notes
    expect(screen.getByText('Кортове на открито')).toBeInTheDocument();

    // Back link to /tournaments
    const backLink = screen.getByRole('link', { name: /към турнири/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/tournaments');
  });

  it('allows quick status update via segmented control', async () => {
    mockUpdateTournament.mockResolvedValue({
      ...dummyTournament,
      status: 'completed',
    });

    renderComponent();

    const completedBtn = screen.getByRole('button', { name: 'Приключил' });
    fireEvent.click(completedBtn);

    expect(mockUpdateTournament).toHaveBeenCalledWith('t-1', {
      status: 'completed',
    });
  });

  it('displays empty state and generator prompt when tournament has no matches', () => {
    vi.spyOn(useMatchesModule, 'useMatches').mockReturnValue({
      matches: [],
      loading: false,
      error: null,
      alert: null,
      fetchMatches: vi.fn(),
      createMatch: vi.fn(),
      updateMatch: mockUpdateMatch,
      deleteMatch: mockDeleteMatch,
      bulkCreateMatches: vi.fn(),
      clearAlert: vi.fn(),
    });

    renderComponent();

    expect(
      screen.getByText('Все още няма записани мачове за този турнир')
    ).toBeInTheDocument();

    const ctaLinks = screen.getAllByRole('link', {
      name: /стартирай генератор за турнира/i,
    });
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1);
    expect(ctaLinks[0]).toHaveAttribute('href', '/generator?tournamentId=t-1');
  });

  it('renders matches list for this tournament and filters out matches from other tournaments', () => {
    renderComponent();

    // Matches of t-1: Отбор Алфа vs Отбор Бета, Отбор Гама vs Отбор Делта
    expect(screen.getByText('Отбор Алфа')).toBeInTheDocument();
    expect(screen.getByText('Отбор Бета')).toBeInTheDocument();
    expect(screen.getByText('Отбор Гама')).toBeInTheDocument();
    expect(screen.getByText('Отбор Делта')).toBeInTheDocument();

    // Match of t-other should NOT be rendered
    expect(screen.queryByText('Играч 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Играч 2')).not.toBeInTheDocument();

    // Generator launch CTA banner is hidden when tournament already has matches
    expect(screen.queryByText('🎲 Стартирай генератор за турнира')).not.toBeInTheDocument();
  });

  it('filters tournament matches by status (Всички, Изиграни, Предстоящи)', () => {
    renderComponent();

    // Total 2 matches (1 completed, 1 upcoming)
    expect(screen.getByRole('button', { name: 'Всички (2)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Изиграни (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Предстоящи (1)' })).toBeInTheDocument();

    // Filter to "Изиграни"
    fireEvent.click(screen.getByRole('button', { name: 'Изиграни (1)' }));
    expect(screen.getByText('Отбор Алфа')).toBeInTheDocument();
    expect(screen.queryByText('Отбор Гама')).not.toBeInTheDocument();

    // Filter to "Предстоящи"
    fireEvent.click(screen.getByRole('button', { name: 'Предстоящи (1)' }));
    expect(screen.queryByText('Отбор Алфа')).not.toBeInTheDocument();
    expect(screen.getByText('Отбор Гама')).toBeInTheDocument();
  });

  it('filters tournament matches by group when multiple groups exist', () => {
    renderComponent();

    expect(screen.getByRole('button', { name: 'Всички групи' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Група А' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Група Б' })).toBeInTheDocument();

    // Filter to "Група А"
    fireEvent.click(screen.getByRole('button', { name: 'Група А' }));
    expect(screen.getByText('Отбор Алфа')).toBeInTheDocument();
    expect(screen.queryByText('Отбор Гама')).not.toBeInTheDocument();

    // Filter to "Група Б"
    fireEvent.click(screen.getByRole('button', { name: 'Група Б' }));
    expect(screen.queryByText('Отбор Алфа')).not.toBeInTheDocument();
    expect(screen.getByText('Отбор Гама')).toBeInTheDocument();
  });

  it('renders Bulgarian success banner when navigating from bulk create with state', () => {
    renderComponent('/tournaments/t-1', {
      fromBulkCreate: true,
      matchCount: 6,
    });

    expect(
      screen.getByText('Успешно записани 6 мача за турнира!')
    ).toBeInTheDocument();

    // Dismiss alert
    const dismissBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText('Успешно записани 6 мача за турнира!')
    ).not.toBeInTheDocument();
  });

  it('triggers delete tournament modal and navigates to /tournaments on confirm', async () => {
    mockDeleteTournament.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderComponent();

    const deleteBtn = screen.getByRole('button', { name: /изтрий турнир/i });
    await user.click(deleteBtn);

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(
      screen.getByText(/сигурни ли сте, че искате да изтриете турнира/i)
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Изтриване' });
    await act(async () => {
      await user.click(confirmBtn);
    });

    expect(mockDeleteTournament).toHaveBeenCalledWith('t-1');
    expect(mockNavigate).toHaveBeenCalledWith('/tournaments');
  });

  it('renders not found 404 state when tournament id is missing', () => {
    renderComponent('/tournaments/unknown-id');

    expect(
      screen.getByRole('heading', { level: 2, name: /турнирът не е намерен/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/избраният турнир не съществува или е бил изтрит/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /към турнири/i })).toHaveAttribute(
      'href',
      '/tournaments'
    );
  });

  it('renders loading state when tournaments are loading', () => {
    vi.spyOn(useTournamentsModule, 'useTournaments').mockReturnValue({
      tournaments: [],
      loading: true,
      error: null,
      fetchTournaments: vi.fn(),
      createTournament: vi.fn(),
      updateTournament: mockUpdateTournament,
      deleteTournament: mockDeleteTournament,
    });

    renderComponent();

    expect(screen.getByText('Зареждане на турнира...')).toBeInTheDocument();
  });
});
