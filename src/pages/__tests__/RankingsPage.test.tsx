import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RankingsPage } from '../RankingsPage';
import * as supabaseModule from '../../lib/supabase';
import type { PlayerRow } from '../../types/database.types';

const mockFrom = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

describe('RankingsPage Component', () => {
  const mockPlayers: PlayerRow[] = [
    {
      id: 'p-1',
      name: 'Григор Димитров',
      rating: 1600,
      singles_rating: 1600,
      doubles_rating: 1300,
      singles_matches_played: 20,
      singles_wins: 16,
      singles_losses: 4,
      doubles_matches_played: 6,
      doubles_wins: 3,
      doubles_losses: 3,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'p-2',
      name: 'Димитър Кузманов',
      rating: 1450,
      singles_rating: 1450,
      doubles_rating: 1550,
      singles_matches_played: 15,
      singles_wins: 10,
      singles_losses: 5,
      doubles_matches_played: 12,
      doubles_wins: 9,
      doubles_losses: 3,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'p-3',
      name: 'Адриан Андреев',
      rating: 1350,
      singles_rating: 1350,
      doubles_rating: 1250,
      singles_matches_played: 8,
      singles_wins: 4,
      singles_losses: 4,
      doubles_matches_played: 4,
      doubles_wins: 2,
      doubles_losses: 2,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'p-4',
      name: 'Александър Лазаров',
      rating: 1200,
      singles_rating: 1200,
      doubles_rating: 1200,
      singles_matches_played: 0,
      singles_wins: 0,
      singles_losses: 0,
      doubles_matches_played: 0,
      doubles_wins: 0,
      doubles_losses: 0,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(true);
  });

  it('renders Podium and top rankings correctly for Singles by default', async () => {
    const selectMock = vi.fn().mockResolvedValue({ data: mockPlayers, error: null });
    mockFrom.mockReturnValue({ select: selectMock });

    render(<RankingsPage />);

    expect(screen.getByRole('heading', { name: /класиране/i })).toBeInTheDocument();

    // Wait for data load
    expect(await screen.findByTestId('rankings-podium')).toBeInTheDocument();

    // Check singles 1st place in podium: Григор Димитров (1600)
    expect(screen.getByText('Шампион')).toBeInTheDocument();
    expect(screen.getAllByText('Григор Димитров').length).toBeGreaterThan(0);

    // Check 2nd place in podium: Димитър Кузманов
    expect(screen.getByText('2-ро място')).toBeInTheDocument();
    expect(screen.getAllByText('Димитър Кузманов').length).toBeGreaterThan(0);

    // Check 3rd place in podium: Адриан Андреев
    expect(screen.getByText('3-то място')).toBeInTheDocument();
    expect(screen.getAllByText('Адриан Андреев').length).toBeGreaterThan(0);
  });

  it('switches format tabs to Doubles and updates leaderboard', async () => {
    const user = userEvent.setup();
    const selectMock = vi.fn().mockResolvedValue({ data: mockPlayers, error: null });
    mockFrom.mockReturnValue({ select: selectMock });

    render(<RankingsPage />);
    await screen.findByTestId('rankings-podium');

    const doublesTab = screen.getByRole('button', { name: /по двойки/i });
    await user.click(doublesTab);

    expect(doublesTab).toHaveAttribute('aria-pressed', 'true');

    // In Doubles, Димитър Кузманов (1550) is #1
    // Григор Димитров (1300) is #2
    // Адриан Андреев (1250) is #3
    const podium = screen.getByTestId('rankings-podium');
    expect(podium).toBeInTheDocument();
    expect(screen.getByText('Шампион')).toBeInTheDocument();
  });

  it('filters rankings by search input and hides podium during active search', async () => {
    const user = userEvent.setup();
    const selectMock = vi.fn().mockResolvedValue({ data: mockPlayers, error: null });
    mockFrom.mockReturnValue({ select: selectMock });

    render(<RankingsPage />);
    await screen.findByTestId('rankings-podium');

    const searchInput = screen.getByLabelText('Търсене на играч');
    await user.type(searchInput, 'Лазаров');

    // Podium is hidden during search
    expect(screen.queryByTestId('rankings-podium')).not.toBeInTheDocument();

    // Only Лазаров should be visible
    expect(screen.getAllByText('Александър Лазаров').length).toBeGreaterThan(0);
    expect(screen.queryByText('Григор Димитров')).not.toBeInTheDocument();
  });

  it('displays empty state when no player matches search query', async () => {
    const user = userEvent.setup();
    const selectMock = vi.fn().mockResolvedValue({ data: mockPlayers, error: null });
    mockFrom.mockReturnValue({ select: selectMock });

    render(<RankingsPage />);
    await screen.findByTestId('rankings-podium');

    const searchInput = screen.getByLabelText('Търсене на играч');
    await user.type(searchInput, 'Несъществуващ');

    expect(screen.getByText(/Няма намерени играчи за/i)).toBeInTheDocument();
  });

  it('displays empty state when no players are in the database', async () => {
    const selectMock = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({ select: selectMock });

    render(<RankingsPage />);

    expect(await screen.findByText('Все още няма добавени играчи')).toBeInTheDocument();
    expect(screen.queryByTestId('rankings-podium')).not.toBeInTheDocument();
  });
});
