import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RankingsTable } from '../RankingsTable';
import type { RankingStats } from '../../../types/rankings';

describe('RankingsTable Component', () => {
  const mockRankings: RankingStats[] = [
    {
      rank: 1,
      player: {
        id: 'p-1',
        name: 'Григор Димитров',
        singles_rating: 1550,
        doubles_rating: 1300,
        singles_matches_played: 10,
        singles_wins: 9,
        singles_losses: 1,
        doubles_matches_played: 0,
        doubles_wins: 0,
        doubles_losses: 0,
      },
      rating: 1550,
      matchesPlayed: 10,
      wins: 9,
      losses: 1,
      winRate: 90.0,
      gamesWon: 60,
      gamesLost: 35,
      gameDifference: 25,
      form: ['W', 'W', 'L', 'W', 'W'],
    },
    {
      rank: 2,
      player: {
        id: 'p-2',
        name: 'Димитър Кузманов',
        singles_rating: 1420,
        doubles_rating: 1490,
        singles_matches_played: 8,
        singles_wins: 6,
        singles_losses: 2,
        doubles_matches_played: 0,
        doubles_wins: 0,
        doubles_losses: 0,
      },
      rating: 1420,
      matchesPlayed: 8,
      wins: 6,
      losses: 2,
      winRate: 75.0,
      gamesWon: 48,
      gamesLost: 40,
      gameDifference: 8,
      form: ['W', 'L', 'W', 'W', 'L'],
    },
    {
      rank: 3,
      player: {
        id: 'p-3',
        name: 'Адриан Андреев',
        singles_rating: 1250,
        doubles_rating: 1220,
        singles_matches_played: 5,
        singles_wins: 2,
        singles_losses: 3,
        doubles_matches_played: 0,
        doubles_wins: 0,
        doubles_losses: 0,
      },
      rating: 1250,
      matchesPlayed: 5,
      wins: 2,
      losses: 3,
      winRate: 40.0,
      gamesWon: 25,
      gamesLost: 30,
      gameDifference: -5,
      form: ['L', 'L', 'W'],
    },
  ];

  it('renders all required pure sports table headers including explicit game difference with tooltip', () => {
    render(<RankingsTable rankings={mockRankings} />);

    expect(screen.getByRole('columnheader', { name: '#' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Играч' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'М' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'П' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'З' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Успеваемост' })).toBeInTheDocument();

    const diffHeader = screen.getByRole('columnheader', { name: 'Геймова разлика' });
    expect(diffHeader).toBeInTheDocument();
    expect(diffHeader).toHaveAttribute('title', 'Геймова разлика (спечелени - загубени геймове)');
    expect(diffHeader).toHaveClass('whitespace-nowrap');
    expect(screen.queryByText('+/-')).not.toBeInTheDocument();

    expect(screen.getByRole('columnheader', { name: 'Форма' })).toBeInTheDocument();
  });

  it('renders clean numeric typography without medal emojis (🥇🥈🥉)', () => {
    const { container } = render(<RankingsTable rankings={mockRankings} />);

    // Ensure no medal emojis in rendered HTML
    expect(container.textContent).not.toContain('🥇');
    expect(container.textContent).not.toContain('🥈');
    expect(container.textContent).not.toContain('🥉');

    // Clean numeric ranks in first column cells
    const rows = screen.getAllByRole('row');
    // Header is row 0; rows 1, 2, 3 are players
    expect(rows[1].querySelector('td:first-child')?.textContent?.trim()).toBe('1');
    expect(rows[2].querySelector('td:first-child')?.textContent?.trim()).toBe('2');
    expect(rows[3].querySelector('td:first-child')?.textContent?.trim()).toBe('3');
  });

  it('renders game difference with positive sign prefix for positive diffs', () => {
    render(<RankingsTable rankings={mockRankings} />);

    expect(screen.getByText('+25')).toBeInTheDocument();
    expect(screen.getByText('+8')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('renders FormBadge component for each row', () => {
    render(<RankingsTable rankings={mockRankings} />);

    const formContainers = screen.getAllByLabelText('Форма от последните 5 мача');
    expect(formContainers).toHaveLength(3);
  });
});
