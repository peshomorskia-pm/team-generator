import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MatchesPage } from '../MatchesPage';
import type { MatchDetail } from '../../types/matches';
import type { PlayerRow } from '../../types/database.types';

const renderPage = (
  initialEntries: Array<string | { pathname: string; state?: unknown }> = ['/']
) => render(<MemoryRouter initialEntries={initialEntries as unknown as string[]}>{<MatchesPage />}</MemoryRouter>);

const mockCreateMatch = vi.fn();
const mockUpdateMatch = vi.fn();
const mockDeleteMatch = vi.fn();
const mockClearAlert = vi.fn();
const mockFetchMatches = vi.fn();

let mockMatchesData: MatchDetail[] = [];
let mockLoading = false;
let mockAlert: { type: 'success' | 'error' | 'info'; message: string } | null = null;
let mockPlayersData: PlayerRow[] = [];

vi.mock('../../hooks/useMatches', () => ({
  useMatches: () => ({
    matches: mockMatchesData,
    loading: mockLoading,
    error: null,
    alert: mockAlert,
    createMatch: mockCreateMatch,
    updateMatch: mockUpdateMatch,
    deleteMatch: mockDeleteMatch,
    clearAlert: mockClearAlert,
    fetchMatches: mockFetchMatches,
  }),
}));

vi.mock('../../hooks/usePlayers', () => ({
  usePlayers: () => ({
    players: mockPlayersData,
    loading: false,
    error: null,
    alert: null,
    fetchPlayers: vi.fn(),
    createPlayer: vi.fn(),
    updatePlayer: vi.fn(),
    deletePlayer: vi.fn(),
    clearAlert: vi.fn(),
  }),
}));

describe('MatchesPage Integration Tests', () => {
  const now = new Date();
  const currentWeekDate = now.toISOString();

  // Create a date in another month/year
  const pastYearDate = new Date(now.getFullYear() - 1, 0, 15).toISOString();

  const sampleMatches: MatchDetail[] = [
    {
      id: 'm-1',
      team_1_score: 4,
      team_2_score: 2,
      played_at: currentWeekDate,
      created_at: currentWeekDate,
      updated_at: currentWeekDate,
      match_players: [
        {
          id: 'mp-1',
          match_id: 'm-1',
          player_id: 'p-1',
          guest_name: null,
          team_side: 'team_1',
          rating_before: 1200,
          rating_after: 1210,
          players: { id: 'p-1', name: 'Иван Иванов' },
        },
        {
          id: 'mp-2',
          match_id: 'm-1',
          player_id: null,
          guest_name: 'Георги Гост',
          team_side: 'team_2',
          rating_before: null,
          rating_after: null,
          players: null,
        },
      ],
    },
    {
      id: 'm-2',
      team_1_score: 1,
      team_2_score: 1,
      played_at: currentWeekDate,
      created_at: currentWeekDate,
      updated_at: currentWeekDate,
      match_players: [
        {
          id: 'mp-3',
          match_id: 'm-2',
          player_id: 'p-2',
          guest_name: null,
          team_side: 'team_1',
          rating_before: 1300,
          rating_after: 1300,
          players: { id: 'p-2', name: 'Стоян Петров' },
        },
      ],
    },
    {
      id: 'm-3',
      team_1_score: null,
      team_2_score: null,
      played_at: currentWeekDate,
      created_at: currentWeekDate,
      updated_at: currentWeekDate,
      match_players: [
        {
          id: 'mp-4',
          match_id: 'm-3',
          player_id: 'p-3',
          guest_name: null,
          team_side: 'team_1',
          rating_before: 1400,
          rating_after: 1400,
          players: { id: 'p-3', name: 'Димитър Бербатов' },
        },
      ],
    },
    {
      id: 'm-4',
      team_1_score: 3,
      team_2_score: 0,
      played_at: pastYearDate,
      created_at: pastYearDate,
      updated_at: pastYearDate,
      match_players: [
        {
          id: 'mp-5',
          match_id: 'm-4',
          player_id: 'p-4',
          guest_name: null,
          team_side: 'team_1',
          rating_before: 1500,
          rating_after: 1500,
          players: { id: 'p-4', name: 'Красимир Балъков' },
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchesData = [...sampleMatches];
    mockLoading = false;
    mockAlert = null;
    mockPlayersData = [
      {
        id: 'p-1',
        name: 'Иван Иванов',
        rating: 1200,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];
  });

  it('renders stats, search input, status tabs, and match cards', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Мачове', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /нов мач/i })).toBeInTheDocument();
    expect(screen.getByText('Общо')).toBeInTheDocument();
    expect(screen.getAllByText('Изиграни')).toHaveLength(2);
    expect(screen.getAllByText('Предстоящи')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Всички' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Търсене по име на играч или гост...')).toBeInTheDocument();

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Георги Гост')).toBeInTheDocument();
    expect(screen.getByText('Стоян Петров')).toBeInTheDocument();
    expect(screen.getByText('Димитър Бербатов')).toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    mockLoading = true;
    renderPage();

    expect(screen.getByText('Зареждане на мачовете...')).toBeInTheDocument();
  });

  it('renders empty state "Няма записани мачове" when matches list is empty', () => {
    mockMatchesData = [];
    renderPage();

    expect(screen.getByText('Няма записани мачове')).toBeInTheDocument();
    expect(
      screen.getByText('Все още няма изиграни двубои в системата. Запишете първия си мач с бутона по-долу.')
    ).toBeInTheDocument();
  });

  it('filters matches by status tabs (Всички, Изиграни, Предстоящи)', async () => {
    const user = userEvent.setup();
    renderPage();

    // Click "Изиграни" tab
    const completedTab = screen.getByRole('button', { name: 'Изиграни' });
    await user.click(completedTab);

    // Completed matches should be visible
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Стоян Петров')).toBeInTheDocument();
    expect(screen.getByText('Красимир Балъков')).toBeInTheDocument();
    // Upcoming match should be hidden
    expect(screen.queryByText('Димитър Бербатов')).not.toBeInTheDocument();

    // Click "Предстоящи" tab
    const upcomingTab = screen.getByRole('button', { name: 'Предстоящи' });
    await user.click(upcomingTab);

    // Upcoming match should be visible
    expect(screen.getByText('Димитър Бербатов')).toBeInTheDocument();
    // Completed matches should be hidden
    expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument();
    expect(screen.queryByText('Стоян Петров')).not.toBeInTheDocument();

    // Click "Всички" tab
    const allTab = screen.getByRole('button', { name: 'Всички' });
    await user.click(allTab);

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Димитър Бербатов')).toBeInTheDocument();
  });

  it('filters matches by period dropdown (Тази седмица, Този месец)', async () => {
    const user = userEvent.setup();
    renderPage();

    const periodSelect = screen.getByLabelText('Филтър по период');

    // Select "Тази седмица"
    await user.selectOptions(periodSelect, 'this_week');

    // Matches from this week should be visible
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Димитър Бербатов')).toBeInTheDocument();
    // Past year match should be hidden
    expect(screen.queryByText('Красимир Балъков')).not.toBeInTheDocument();

    // Select "Този месец"
    await user.selectOptions(periodSelect, 'this_month');
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.queryByText('Красимир Балъков')).not.toBeInTheDocument();

    // Select "Всички периоди"
    await user.selectOptions(periodSelect, 'all');
    expect(screen.getByText('Красимир Балъков')).toBeInTheDocument();
  });

  it('filters matches by custom date range period from calendar', async () => {
    const user = userEvent.setup();
    renderPage();

    const periodSelect = screen.getByLabelText('Филтър по период');
    await user.selectOptions(periodSelect, 'custom');

    // Date inputs appear
    const startDateInput = screen.getByLabelText('Начална дата');
    const endDateInput = screen.getByLabelText('Крайна дата');
    expect(startDateInput).toBeInTheDocument();
    expect(endDateInput).toBeInTheDocument();

    // Set custom range targeting the 2025 match
    await user.type(startDateInput, '2025-01-01');
    await user.type(endDateInput, '2025-12-31');

    expect(screen.getByText('Красимир Балъков')).toBeInTheDocument();
    expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument();
  });

  it('applies combined AND filtering logic (Status AND Period AND Search)', async () => {
    const user = userEvent.setup();
    renderPage();

    // 1. Switch to "Предстоящи"
    await user.click(screen.getByRole('button', { name: 'Предстоящи' }));
    // 2. Select "Тази седмица"
    await user.selectOptions(screen.getByLabelText('Филтър по период'), 'this_week');
    // 3. Search for "Бербатов"
    const searchInput = screen.getByPlaceholderText('Търсене по име на играч или гост...');
    await user.type(searchInput, 'Бербатов');

    // Only Димитър Бербатов should match
    expect(screen.getByText('Димитър Бербатов')).toBeInTheDocument();
    expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument();

    // Search for someone not upcoming: "Иван"
    await user.clear(searchInput);
    await user.type(searchInput, 'Иван');

    // No upcoming match has Иван
    expect(screen.getByText(/Няма намерени мачове за/i)).toBeInTheDocument();
    expect(screen.queryByText('Димитър Бербатов')).not.toBeInTheDocument();
  });

  it('filters match cards by player or guest name through search bar', async () => {
    const user = userEvent.setup();
    renderPage();

    const searchInput = screen.getByPlaceholderText('Търсене по име на играч или гост...');
    await user.type(searchInput, 'Георги');

    // Matches with 'Георги' should be visible
    expect(screen.getByText('Георги Гост')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();

    // Match 2 should be filtered out
    expect(screen.queryByText('Стоян Петров')).not.toBeInTheDocument();

    // Search for non-existent name
    await user.clear(searchInput);
    await user.type(searchInput, 'Несъществуващ');
    expect(screen.getByText(/Няма намерени мачове за/i)).toBeInTheDocument();
  });

  it('filters match cards by group name, team 1 name, or team 2 name through search bar', async () => {
    mockMatchesData = [
      {
        ...sampleMatches[0],
        id: 'm-tournament-1',
        team_1_name: 'Червени Дяволи',
        team_2_name: 'Бели Орли',
        group_name: 'Група Б',
      },
      {
        ...sampleMatches[1],
        id: 'm-tournament-2',
        team_1_name: 'Зелени Вълци',
        team_2_name: 'Сини Акули',
        group_name: 'Група В',
      },
    ];

    const user = userEvent.setup();
    renderPage();

    const searchInput = screen.getByPlaceholderText('Търсене по име на играч или гост...');

    // Search by group name
    await user.type(searchInput, 'Група Б');
    expect(screen.getByText('Червени Дяволи')).toBeInTheDocument();
    expect(screen.queryByText('Зелени Вълци')).not.toBeInTheDocument();

    // Search by team 1 name
    await user.clear(searchInput);
    await user.type(searchInput, 'Зелени');
    expect(screen.getByText('Зелени Вълци')).toBeInTheDocument();
    expect(screen.queryByText('Червени Дяволи')).not.toBeInTheDocument();

    // Search by team 2 name
    await user.clear(searchInput);
    await user.type(searchInput, 'Бели Орли');
    expect(screen.getByText('Червени Дяволи')).toBeInTheDocument();
    expect(screen.queryByText('Зелени Вълци')).not.toBeInTheDocument();
  });

  it('filters match cards by round number through search bar', async () => {
    mockMatchesData = [
      {
        ...sampleMatches[0],
        id: 'm-round-1',
        round: 1,
        team_1_name: 'Отбор Алфа',
        team_2_name: 'Отбор Бета',
      },
      {
        ...sampleMatches[1],
        id: 'm-round-2',
        round: 2,
        team_1_name: 'Отбор Гама',
        team_2_name: 'Отбор Делта',
      },
    ];

    const user = userEvent.setup();
    renderPage();

    const searchInput = screen.getByPlaceholderText('Търсене по име на играч или гост...');

    // Search by "Кръг 1"
    await user.type(searchInput, 'Кръг 1');
    expect(screen.getByText('Отбор Алфа')).toBeInTheDocument();
    expect(screen.queryByText('Отбор Гама')).not.toBeInTheDocument();

    // Search by exact round number "2"
    await user.clear(searchInput);
    await user.type(searchInput, '2');
    expect(screen.getByText('Отбор Гама')).toBeInTheDocument();
    expect(screen.queryByText('Отбор Алфа')).not.toBeInTheDocument();
  });

  it('opens MatchModal on "Нов мач" button click', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /нов мач/i }));

    expect(screen.getByRole('heading', { name: 'Нов мач' })).toBeInTheDocument();
    expect(screen.getByLabelText('Резултат Отбор 1')).toBeInTheDocument();
  });

  it('opens edit MatchModal when clicking edit on a match card', async () => {
    const user = userEvent.setup();
    renderPage();

    const editButtons = screen.getAllByRole('button', { name: 'Редактирай' });
    await user.click(editButtons[0]);

    expect(screen.getByRole('heading', { name: 'Редактиране на мач' })).toBeInTheDocument();
    expect(screen.getByLabelText('Резултат Отбор 1')).toHaveValue(4);
    expect(screen.getByLabelText('Резултат Отбор 2')).toHaveValue(2);
  });

  it('opens DeleteMatchModal and executes deletion on confirm', async () => {
    const user = userEvent.setup();
    mockDeleteMatch.mockResolvedValue(undefined);

    renderPage();

    const deleteButtons = screen.getAllByRole('button', { name: 'Изтрий' });
    await user.click(deleteButtons[0]);

    expect(screen.getByRole('heading', { name: 'Изтриване на мач' })).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Изтриване' });
    await user.click(confirmBtn);

    expect(mockDeleteMatch).toHaveBeenCalledWith('m-1');
  });

  it('renders alert notification and allows clearing it', async () => {
    const user = userEvent.setup();
    mockAlert = { type: 'success', message: 'Мачът е записан успешно.' };

    renderPage();

    expect(screen.getByText('Мачът е записан успешно.')).toBeInTheDocument();
    const closeBtn = screen.getByLabelText('Close');
    await user.click(closeBtn);

    expect(mockClearAlert).toHaveBeenCalledTimes(1);
  });

  it('navigates with fromBulkCreate state -> renders "Предстоящи" tab active with success alert and allows dismissal', async () => {
    const user = userEvent.setup();
    renderPage([
      {
        pathname: '/matches',
        state: {
          fromBulkCreate: true,
          matchCount: 4,
          statusFilter: 'upcoming',
        },
      },
    ]);

    expect(
      screen.getByText('Успешно създадени 4 предстоящи мача от турнира!')
    ).toBeInTheDocument();

    const upcomingTab = screen.getByRole('button', { name: 'Предстоящи' });
    expect(upcomingTab).toHaveClass('bg-white');

    // Shows upcoming fixture
    expect(screen.getByText('Димитър Бербатов')).toBeInTheDocument();
    // Excludes completed matches
    expect(screen.queryByText('Красимир Балъков')).not.toBeInTheDocument();

    // Dismiss alert banner
    const closeBtn = screen.getByLabelText('Close');
    await user.click(closeBtn);
    expect(
      screen.queryByText('Успешно създадени 4 предстоящи мача от турнира!')
    ).not.toBeInTheDocument();
  });
});
