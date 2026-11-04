import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RankingsMobile } from '../RankingsMobile';
import type { RankingStats } from '../../../types/rankings';

describe('RankingsMobile Component', () => {
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
      form: ['W', 'W', 'W', 'W', 'W'],
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
      form: ['W', 'L', 'W'],
    },
  ];

  it('renders clean #rank typography with zero medal emojis (🥇🥈🥉)', () => {
    const { container } = render(<RankingsMobile rankings={mockRankings} />);

    expect(container.textContent).not.toContain('🥇');
    expect(container.textContent).not.toContain('🥈');
    expect(container.textContent).not.toContain('🥉');

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('renders player names and win rate percentages', () => {
    render(<RankingsMobile rankings={mockRankings} />);

    expect(screen.getByText('Григор Димитров')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();

    expect(screen.getByText('Димитър Кузманов')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders 3-stat primary grid (М, П, З) and explicit Геймова разлика row', () => {
    render(<RankingsMobile rankings={mockRankings} />);

    expect(screen.getAllByText('М').length).toBe(2);
    expect(screen.getAllByText('П').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('З').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('+/-')).not.toBeInTheDocument();

    expect(screen.getByText('+25')).toBeInTheDocument();
    expect(screen.getByText('+8')).toBeInTheDocument();
    expect(screen.getAllByText(/Геймова разлика:/i)).toHaveLength(2);
  });

  it('renders FormBadge component in card footer', () => {
    render(<RankingsMobile rankings={mockRankings} />);

    const formLabels = screen.getAllByText('Форма:');
    expect(formLabels).toHaveLength(2);

    const formBadges = screen.getAllByLabelText('Форма от последните 5 мача');
    expect(formBadges).toHaveLength(2);
  });

  it('calls onSelectPlayer when a card is clicked', () => {
    const handleSelect = vi.fn();
    render(<RankingsMobile rankings={mockRankings} onSelectPlayer={handleSelect} />);

    const card = screen.getByRole('button', { name: 'Преглед на профила на Григор Димитров' });
    fireEvent.click(card);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith('p-1', 'Григор Димитров');
  });

  it('calls onSelectPlayer when Enter key is pressed on a card', () => {
    const handleSelect = vi.fn();
    render(<RankingsMobile rankings={mockRankings} onSelectPlayer={handleSelect} />);

    const card = screen.getByRole('button', { name: 'Преглед на профила на Григор Димитров' });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith('p-1', 'Григор Димитров');
  });

  it('calls onSelectPlayer when Space key is pressed on a card and prevents default', () => {
    const handleSelect = vi.fn();
    render(<RankingsMobile rankings={mockRankings} onSelectPlayer={handleSelect} />);

    const card = screen.getByRole('button', { name: 'Преглед на профила на Димитър Кузманов' });
    fireEvent.keyDown(card, { key: ' ' });

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith('p-2', 'Димитър Кузманов');
  });

  it('maintains backward compatibility when onSelectPlayer is not provided', () => {
    render(<RankingsMobile rankings={mockRankings} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
