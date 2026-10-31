import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Podium } from '../Podium';
import type { RankingStats } from '../../../types/rankings';

describe('Podium Component', () => {
  const mockTopPlayers: RankingStats[] = [
    {
      rank: 1,
      player: {
        id: 'p-1',
        name: 'Александър Златков',
        singles_rating: 1550,
        doubles_rating: 1550,
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
      winRate: 90,
    },
    {
      rank: 2,
      player: {
        id: 'p-2',
        name: 'Борис Сребров',
        singles_rating: 1420,
        doubles_rating: 1420,
        singles_matches_played: 10,
        singles_wins: 7,
        singles_losses: 3,
        doubles_matches_played: 0,
        doubles_wins: 0,
        doubles_losses: 0,
      },
      rating: 1420,
      matchesPlayed: 10,
      wins: 7,
      losses: 3,
      winRate: 70,
    },
    {
      rank: 3,
      player: {
        id: 'p-3',
        name: 'Васил Бронзов',
        singles_rating: 1380,
        doubles_rating: 1380,
        singles_matches_played: 10,
        singles_wins: 6,
        singles_losses: 4,
        doubles_matches_played: 0,
        doubles_wins: 0,
        doubles_losses: 0,
      },
      rating: 1380,
      matchesPlayed: 10,
      wins: 6,
      losses: 4,
      winRate: 60,
    },
  ];

  it('POD-01: renders top 3 players with names, ratings, and match records', () => {
    render(<Podium topPlayers={mockTopPlayers} />);

    expect(screen.getByTestId('rankings-podium')).toBeInTheDocument();

    // 1st place
    expect(screen.getByText('Шампион')).toBeInTheDocument();
    expect(screen.getByText('Александър Златков')).toBeInTheDocument();
    expect(screen.getByText('1550')).toBeInTheDocument();
    expect(screen.getByText('9П - 1З (90%)')).toBeInTheDocument();

    // 2nd place
    expect(screen.getByText('2-ро място')).toBeInTheDocument();
    expect(screen.getByText('Борис Сребров')).toBeInTheDocument();
    expect(screen.getByText('1420')).toBeInTheDocument();
    expect(screen.getByText('7П - 3З (70%)')).toBeInTheDocument();

    // 3rd place
    expect(screen.getByText('3-то място')).toBeInTheDocument();
    expect(screen.getByText('Васил Бронзов')).toBeInTheDocument();
    expect(screen.getByText('1380')).toBeInTheDocument();
    expect(screen.getByText('6П - 4З (60%)')).toBeInTheDocument();
  });

  it('POD-02: applies responsive w-full and sm:max-w-* classes on podium card wrappers', () => {
    render(<Podium topPlayers={mockTopPlayers} />);

    const card1 = screen.getByTestId('podium-card-1');
    const card2 = screen.getByTestId('podium-card-2');
    const card3 = screen.getByTestId('podium-card-3');

    expect(card1).toHaveClass('w-full', 'sm:max-w-[260px]');
    expect(card2).toHaveClass('w-full', 'sm:max-w-[240px]');
    expect(card3).toHaveClass('w-full', 'sm:max-w-[240px]');
  });

  it('POD-03: handles fewer than 3 players and returns null when empty', () => {
    // Single player case
    const { unmount } = render(<Podium topPlayers={[mockTopPlayers[0]]} />);

    expect(screen.getByTestId('podium-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('podium-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('podium-card-3')).not.toBeInTheDocument();

    unmount();

    // Empty list case
    const { container } = render(<Podium topPlayers={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
