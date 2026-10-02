import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatchesPage } from '../MatchesPage';
import type { MatchDetail } from '../../types/matches';
import type { PlayerRow } from '../../types/database.types';

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
  const sampleMatches: MatchDetail[] = [
    {
      id: 'm-1',
      team_1_score: 4,
      team_2_score: 2,
      played_at: '2026-10-02T18:00:00Z',
      created_at: '2026-10-02T18:00:00Z',
      updated_at: '2026-10-02T18:00:00Z',
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
      played_at: '2026-10-01T18:00:00Z',
      created_at: '2026-10-01T18:00:00Z',
      updated_at: '2026-10-01T18:00:00Z',
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

  it('renders stats, search input, and match cards', () => {
    render(<MatchesPage />);

    expect(screen.getByRole('heading', { name: 'Мачове', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /нов мач/i })).toBeInTheDocument();
    expect(screen.getByText('Общо изиграни мачове')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Търсене по име на играч или гост...')).toBeInTheDocument();

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Георги Гост')).toBeInTheDocument();
    expect(screen.getByText('Стоян Петров')).toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    mockLoading = true;
    render(<MatchesPage />);

    expect(screen.getByText('Зареждане на мачовете...')).toBeInTheDocument();
  });

  it('renders empty state "Няма записани мачове" when matches list is empty', () => {
    mockMatchesData = [];
    render(<MatchesPage />);

    expect(screen.getByText('Няма записани мачове')).toBeInTheDocument();
    expect(
      screen.getByText('Все още няма изиграни двубои в системата. Запишете първия си мач с бутона по-долу.')
    ).toBeInTheDocument();
  });

  it('filters match cards by player or guest name through search bar', async () => {
    const user = userEvent.setup();
    render(<MatchesPage />);

    const searchInput = screen.getByPlaceholderText('Търсене по име на играч или гост...');
    await user.type(searchInput, 'Георги');

    // Matches with 'Георги' should be visible
    expect(screen.getByText('Георги Гост')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument(); // part of match 1

    // Match 2 should be filtered out
    expect(screen.queryByText('Стоян Петров')).not.toBeInTheDocument();

    // Search for non-existent name
    await user.clear(searchInput);
    await user.type(searchInput, 'Несъществуващ');
    expect(screen.getByText(/Няма намерени мачове за/i)).toBeInTheDocument();
  });

  it('opens MatchModal on "Нов мач" button click', async () => {
    const user = userEvent.setup();
    render(<MatchesPage />);

    await user.click(screen.getByRole('button', { name: /нов мач/i }));

    expect(screen.getByRole('heading', { name: 'Нов мач' })).toBeInTheDocument();
    expect(screen.getByLabelText('Резултат Отбор 1')).toBeInTheDocument();
  });

  it('opens edit MatchModal when clicking edit on a match card', async () => {
    const user = userEvent.setup();
    render(<MatchesPage />);

    const editButtons = screen.getAllByRole('button', { name: 'Редактирай' });
    await user.click(editButtons[0]);

    expect(screen.getByRole('heading', { name: 'Редактиране на мач' })).toBeInTheDocument();
    expect(screen.getByLabelText('Резултат Отбор 1')).toHaveValue(4);
    expect(screen.getByLabelText('Резултат Отбор 2')).toHaveValue(2);
  });

  it('opens DeleteMatchModal and executes deletion on confirm', async () => {
    const user = userEvent.setup();
    mockDeleteMatch.mockResolvedValue(undefined);

    render(<MatchesPage />);

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

    render(<MatchesPage />);

    expect(screen.getByText('Мачът е записан успешно.')).toBeInTheDocument();
    const closeBtn = screen.getByLabelText('Close');
    await user.click(closeBtn);

    expect(mockClearAlert).toHaveBeenCalledTimes(1);
  });
});
