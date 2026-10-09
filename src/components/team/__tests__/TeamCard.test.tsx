import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamCard } from '../TeamCard';
import { Team } from '../../../types';

describe('TeamCard', () => {
  const mockTeam: Team = {
    id: 'team-1',
    name: 'Отбор 1',
    totalRating: 24,
    players: [
      { id: 'p-1', name: 'Иван', rating: 8 },
      { id: 'p-2', name: 'Петър', rating: 9 },
      { id: 'p-3', name: 'Георги', rating: 7 },
    ],
  };

  it('renders team index and name', () => {
    render(<TeamCard team={mockTeam} index={0} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
  });

  it('renders total rating badge when present and greater than 0', () => {
    render(<TeamCard team={mockTeam} index={0} />);
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('renders player count badge', () => {
    render(<TeamCard team={mockTeam} index={0} />);
    expect(screen.getByText('3 играчи')).toBeInTheDocument();
  });

  it('renders each player with name and rating', () => {
    render(<TeamCard team={mockTeam} index={0} />);
    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByText('★ 8')).toBeInTheDocument();
    expect(screen.getByText('Петър')).toBeInTheDocument();
    expect(screen.getByText('★ 9')).toBeInTheDocument();
    expect(screen.getByText('Георги')).toBeInTheDocument();
    expect(screen.getByText('★ 7')).toBeInTheDocument();
  });

  it('renders empty message when no players are in team', () => {
    const emptyTeam: Team = {
      id: 'team-empty',
      name: 'Празен отбор',
      players: [],
    };
    render(<TeamCard team={emptyTeam} index={1} />);
    expect(screen.getByText('Няма разпределени играчи')).toBeInTheDocument();
  });

  it('renders shuffle button and handles click', async () => {
    const user = userEvent.setup();
    const handleShuffle = vi.fn();
    render(<TeamCard team={mockTeam} index={0} onShuffleTeam={handleShuffle} />);

    const shuffleBtn = screen.getByRole('button', { name: 'Разбъркай отбора' });
    expect(shuffleBtn).toBeInTheDocument();

    await user.click(shuffleBtn);
    expect(handleShuffle).toHaveBeenCalledWith('team-1');
  });

  it('completely hides total rating badge and player rating stars when mode is generic', () => {
    render(<TeamCard team={mockTeam} index={0} mode="generic" />);

    // Header info
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('3 играчи')).toBeInTheDocument();

    // Total rating badge hidden
    expect(screen.queryByText('24')).not.toBeInTheDocument();

    // Player names visible
    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByText('Петър')).toBeInTheDocument();
    expect(screen.getByText('Георги')).toBeInTheDocument();

    // Player ratings/stars hidden
    expect(screen.queryByText('★ 8')).not.toBeInTheDocument();
    expect(screen.queryByText('★ 9')).not.toBeInTheDocument();
    expect(screen.queryByText('★ 7')).not.toBeInTheDocument();
  });
});
