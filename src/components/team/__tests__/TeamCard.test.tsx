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

  // T-TC-1: Total Rating Removal from Header
  it('does not render total rating badge in header even if totalRating is provided', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      totalRating: 24,
      players: [{ id: 'p-1', name: 'Иван', rating: 8 }],
    };
    render(<TeamCard team={team} index={0} />);
    expect(screen.queryByText('24')).not.toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
  });

  it('renders player count badge', () => {
    render(<TeamCard team={mockTeam} index={0} />);
    expect(screen.getByText('3 играчи')).toBeInTheDocument();
  });

  // T-TC-2: Unplayed / New Players render "Нов"
  it('renders "Нов" pill for unplayed players without match history', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      players: [
        { id: 'p-1', name: 'Иван' },
        { id: 'p-2', name: 'Петър' },
      ],
    };
    render(<TeamCard team={team} index={0} />);
    const newBadges = screen.getAllByText('Нов');
    expect(newBadges).toHaveLength(2);
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  // T-TC-3: Active Players render percentage win rate
  it('renders percentage win rate pill for players with match history', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      players: [
        {
          id: 'p-1',
          name: 'Иван',
          singles_matches_played: 10,
          singles_wins: 8,
        },
      ],
    };
    render(<TeamCard team={team} index={0} format="singles" />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.queryByText('Нов')).not.toBeInTheDocument();
  });

  // T-TC-4: Guest Players render "Гост" pill
  it('renders "Гост" pill for guest players', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      players: [
        { id: 'g-1', name: 'Стефан', isGuest: true },
        { id: 'g-2', name: 'Николай', source: 'guest' },
      ],
    };
    render(<TeamCard team={team} index={0} />);
    const guestBadges = screen.getAllByText('Гост');
    expect(guestBadges).toHaveLength(2);
  });

  // T-TC-5: Generic Mode Hides All Badges
  it('completely hides win rate, "Нов", and "Гост" badges when mode is generic', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      totalRating: 24,
      players: [
        { id: 'p-1', name: 'Иван', singles_matches_played: 10, singles_wins: 8 },
        { id: 'p-2', name: 'Петър' },
        { id: 'g-1', name: 'Стефан', isGuest: true },
      ],
    };
    render(<TeamCard team={team} index={0} mode="generic" />);
    expect(screen.queryByText('24')).not.toBeInTheDocument();
    expect(screen.queryByText('80%')).not.toBeInTheDocument();
    expect(screen.queryByText('Нов')).not.toBeInTheDocument();
    expect(screen.queryByText('Гост')).not.toBeInTheDocument();
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  // T-TC-6: Format sensitivity
  it('uses format-specific statistics (doubles vs singles)', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      players: [
        {
          id: 'p-1',
          name: 'Иван',
          singles_matches_played: 10,
          singles_wins: 10, // 100% singles
          doubles_matches_played: 4,
          doubles_wins: 1,  // 25% doubles
        },
      ],
    };
    render(<TeamCard team={team} index={0} format="doubles" />);
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
  });

  it('renders "Свободно място" dashed placeholder when team.players.length < targetSize', () => {
    const singlePlayerTeam: Team = {
      id: 'team-incomplete',
      name: 'Отбор 1',
      players: [{ id: 'p-1', name: 'Иван', rating: 1200 }],
    };

    render(<TeamCard team={singlePlayerTeam} index={0} targetSize={2} />);

    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByText('Свободно място')).toBeInTheDocument();
    const emptySlots = screen.getAllByTestId('empty-slot');
    expect(emptySlots).toHaveLength(1);
    expect(emptySlots[0].className).toContain('border-dashed');
  });

  it('renders multiple placeholders when multiple slots are missing', () => {
    const singlePlayerTeam: Team = {
      id: 'team-incomplete',
      name: 'Отбор 1',
      players: [{ id: 'p-1', name: 'Иван' }],
    };

    render(<TeamCard team={singlePlayerTeam} index={0} targetSize={4} />);

    const emptySlots = screen.getAllByTestId('empty-slot');
    expect(emptySlots).toHaveLength(3);
    expect(screen.getAllByText('Свободно място')).toHaveLength(3);
  });

  it('does not render placeholder when team is complete (team.players.length >= targetSize)', () => {
    render(<TeamCard team={mockTeam} index={0} targetSize={3} />);

    expect(screen.queryByText('Свободно място')).not.toBeInTheDocument();
    expect(screen.queryByTestId('empty-slot')).not.toBeInTheDocument();
  });

  it('renders interactive button for empty slot and triggers onSelectEmptySlot on click', async () => {
    const user = userEvent.setup();
    const handleSelectSlot = vi.fn();
    const incompleteTeam: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      players: [],
    };

    render(
      <TeamCard
        team={incompleteTeam}
        index={0}
        targetSize={1}
        onSelectEmptySlot={handleSelectSlot}
      />
    );

    const slotBtn = screen.getByRole('button', { name: 'Избери играч за Отбор 1' });
    expect(slotBtn).toBeInTheDocument();
    expect(slotBtn).toHaveTextContent('+ Избери играч');

    await user.click(slotBtn);
    expect(handleSelectSlot).toHaveBeenCalledWith('team-1');
  });

  it('renders remove button for assigned players and calls onRemovePlayer on click', async () => {
    const user = userEvent.setup();
    const handleRemovePlayer = vi.fn();

    render(
      <TeamCard
        team={mockTeam}
        index={0}
        onRemovePlayer={handleRemovePlayer}
      />
    );

    const removeBtn = screen.getByRole('button', { name: 'Премахни Иван от отбора' });
    expect(removeBtn).toBeInTheDocument();

    await user.click(removeBtn);
    expect(handleRemovePlayer).toHaveBeenCalledWith('team-1', 'p-1');
  });

  it('renders delete team button when onDeleteTeam is provided and calls callback', async () => {
    const user = userEvent.setup();
    const handleDeleteTeam = vi.fn();

    render(
      <TeamCard
        team={mockTeam}
        index={0}
        onDeleteTeam={handleDeleteTeam}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Изтрий Отбор 1' });
    expect(deleteBtn).toBeInTheDocument();

    await user.click(deleteBtn);
    expect(handleDeleteTeam).toHaveBeenCalledWith('team-1');
  });

  it('TC-TARGET-01: scales shuffle, delete, and roster remove buttons to touch targets', () => {
    render(
      <TeamCard
        team={mockTeam}
        index={0}
        onShuffleTeam={vi.fn()}
        onDeleteTeam={vi.fn()}
        onRemovePlayer={vi.fn()}
      />
    );

    const shuffleBtn = screen.getByRole('button', { name: 'Разбъркай отбора' });
    expect(shuffleBtn).toHaveClass('min-w-[36px]', 'min-h-[36px]', 'p-2');

    const deleteBtn = screen.getByRole('button', { name: 'Изтрий Отбор 1' });
    expect(deleteBtn).toHaveClass('min-w-[36px]', 'min-h-[36px]', 'p-2');

    const removePlayerBtn = screen.getByRole('button', { name: 'Премахни Иван от отбора' });
    expect(removePlayerBtn).toHaveClass('min-w-[32px]', 'min-h-[32px]', 'p-1.5');
  });
});

