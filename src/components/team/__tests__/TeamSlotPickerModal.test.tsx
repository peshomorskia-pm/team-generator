import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamSlotPickerModal } from '../TeamSlotPickerModal';
import { GeneratorPlayer } from '../../../types/generator';

describe('TeamSlotPickerModal', () => {
  const mockPlayers: GeneratorPlayer[] = [
    { id: 'p-1', name: 'Иван Иванов', rating: 1200, source: 'registered' },
    { id: 'p-2', name: 'Петър Петров', singles_rating: 1400, doubles_rating: 1350, source: 'registered' },
    { id: 'p-3', name: 'Георги Гост', source: 'guest' },
  ];

  it('does not render when isOpen is false or teamId is null', () => {
    const { rerender } = render(
      <TeamSlotPickerModal
        isOpen={false}
        onClose={vi.fn()}
        teamId="team-1"
        unassignedPlayers={mockPlayers}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <TeamSlotPickerModal
        isOpen={true}
        onClose={vi.fn()}
        teamId={null}
        unassignedPlayers={mockPlayers}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with title and lists all unassigned players', () => {
    render(
      <TeamSlotPickerModal
        isOpen={true}
        onClose={vi.fn()}
        teamId="team-1"
        teamName="Отбор 1"
        unassignedPlayers={mockPlayers}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Избери играч за Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Петър Петров')).toBeInTheDocument();
    expect(screen.getByText('Георги Гост')).toBeInTheDocument();
    expect(screen.getByText('гост')).toBeInTheDocument();
  });

  it('filters unassigned players based on search query', async () => {
    const user = userEvent.setup();
    render(
      <TeamSlotPickerModal
        isOpen={true}
        onClose={vi.fn()}
        teamId="team-1"
        unassignedPlayers={mockPlayers}
      />
    );

    const searchInput = screen.getByPlaceholderText('Търсене на играч...');
    await user.type(searchInput, 'петър');

    expect(screen.getByText('Петър Петров')).toBeInTheDocument();
    expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument();
    expect(screen.queryByText('Георги Гост')).not.toBeInTheDocument();
  });

  it('calls onSelectPlayer / onAssign and closes modal when a player is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <TeamSlotPickerModal
        isOpen={true}
        onClose={handleClose}
        teamId="team-1"
        unassignedPlayers={mockPlayers}
        onSelectPlayer={handleSelect}
      />
    );

    const playerBtn = screen.getByRole('button', { name: /иван иванов/i });
    await user.click(playerBtn);

    expect(handleSelect).toHaveBeenCalledWith('team-1', mockPlayers[0]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('allows adding a new guest and assigns them immediately', async () => {
    const user = userEvent.setup();
    const handleAssign = vi.fn();
    const handleClose = vi.fn();

    render(
      <TeamSlotPickerModal
        isOpen={true}
        onClose={handleClose}
        teamId="team-2"
        unassignedPlayers={[]}
        onAssign={handleAssign}
      />
    );

    const guestInput = screen.getByPlaceholderText('Име на нов гост...');
    await user.type(guestInput, 'Нов Гост');

    const addGuestBtn = screen.getByRole('button', { name: /\+ гост/i });
    await user.click(addGuestBtn);

    expect(handleAssign).toHaveBeenCalledWith(
      'team-2',
      expect.objectContaining({
        name: 'Нов Гост',
        source: 'guest',
      })
    );
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal on Escape key press', () => {
    const handleClose = vi.fn();
    render(
      <TeamSlotPickerModal
        isOpen={true}
        onClose={handleClose}
        teamId="team-1"
        unassignedPlayers={mockPlayers}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal on backdrop click', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <TeamSlotPickerModal
        isOpen={true}
        onClose={handleClose}
        teamId="team-1"
        unassignedPlayers={mockPlayers}
      />
    );

    const backdrop = screen.getByRole('presentation');
    await user.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
