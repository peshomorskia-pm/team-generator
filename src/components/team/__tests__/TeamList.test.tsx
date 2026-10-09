import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamList } from '../TeamList';
import type { Team } from '../../../types';

describe('TeamList Component', () => {
  const mockTeams2: Team[] = [
    {
      id: 'team-1',
      name: 'Отбор 1',
      players: [{ id: 'p-1', name: 'Иван' }],
    },
    {
      id: 'team-2',
      name: 'Отбор 2',
      players: [{ id: 'p-2', name: 'Георги' }],
    },
  ];

  const mockTeams3: Team[] = [
    ...mockTeams2,
    {
      id: 'team-3',
      name: 'Отбор 3',
      players: [{ id: 'p-3', name: 'Петър' }],
    },
  ];

  const mockTeams6: Team[] = [
    ...mockTeams3,
    { id: 'team-4', name: 'Отбор 4', players: [{ id: 'p-4', name: 'Димитър' }] },
    { id: 'team-5', name: 'Отбор 5', players: [{ id: 'p-5', name: 'Александър' }] },
    { id: 'team-6', name: 'Отбор 6', players: [{ id: 'p-6', name: 'Никола' }] },
  ];

  const mockTeam1: Team[] = [
    {
      id: 'team-1',
      name: 'Отбор 1',
      players: [{ id: 'p-1', name: 'Иван' }],
    },
  ];

  it('Scenario 1 (Happy Path): renders "Запиши като мач" button when exactly 2 teams exist and fires onSaveAsMatch', async () => {
    const user = userEvent.setup();
    const handleSaveAsMatch = vi.fn();

    render(
      <TeamList
        teams={mockTeams2}
        onSaveAsMatch={handleSaveAsMatch}
        onCopy={vi.fn()}
      />
    );

    const saveMatchBtn = screen.getByRole('button', { name: /запиши като мач/i });
    expect(saveMatchBtn).toBeInTheDocument();

    await user.click(saveMatchBtn);
    expect(handleSaveAsMatch).toHaveBeenCalledTimes(1);
  });

  it('Scenario 2 (Edge Cases): does NOT render "Запиши като мач" when teams count is 0, 1, or 3', () => {
    // 0 teams renders null
    const { container: container0 } = render(
      <TeamList teams={[]} onSaveAsMatch={vi.fn()} />
    );
    expect(container0.firstChild).toBeNull();
    expect(screen.queryByRole('button', { name: /запиши като мач/i })).not.toBeInTheDocument();

    // 1 team
    const { unmount: unmount1 } = render(
      <TeamList teams={mockTeam1} onSaveAsMatch={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /запиши като мач/i })).not.toBeInTheDocument();
    unmount1();

    // 3 teams
    render(
      <TeamList teams={mockTeams3} onSaveAsMatch={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /запиши като мач/i })).not.toBeInTheDocument();
  });

  it('does NOT render "Запиши като мач" when exactly 2 teams exist but onSaveAsMatch callback is not provided', () => {
    render(<TeamList teams={mockTeams2} onCopy={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /запиши като мач/i })).not.toBeInTheDocument();
  });

  it('renders copy button and handles copy interaction correctly', async () => {
    const user = userEvent.setup();
    const handleCopy = vi.fn();

    const { rerender } = render(
      <TeamList teams={mockTeams2} onCopy={handleCopy} isCopied={false} />
    );

    const copyBtn = screen.getByRole('button', { name: /копирай/i });
    expect(copyBtn).toBeInTheDocument();
    expect(copyBtn).toHaveAttribute('title', 'Копирай съставите на отборите в клипборда');
    expect(copyBtn).toHaveAttribute('aria-label', 'Копирай отборите');

    await user.click(copyBtn);
    expect(handleCopy).toHaveBeenCalledTimes(1);

    // When copied
    rerender(<TeamList teams={mockTeams2} onCopy={handleCopy} isCopied={true} />);
    expect(screen.getByText('Копирано!')).toBeInTheDocument();
  });

  describe('Generator mode integration', () => {
    it('shows "Запиши като мач" when mode is "tennis" and 2 teams exist', () => {
      render(
        <TeamList
          teams={mockTeams2}
          mode="tennis"
          onSaveAsMatch={vi.fn()}
        />
      );
      expect(screen.getByRole('button', { name: /запиши като мач/i })).toBeInTheDocument();
    });

    it('strictly hides "Запиши като мач" when mode is "generic", even with exactly 2 teams and onSaveAsMatch provided', () => {
      render(
        <TeamList
          teams={mockTeams2}
          mode="generic"
          onSaveAsMatch={vi.fn()}
        />
      );
      expect(screen.queryByRole('button', { name: /запиши като мач/i })).not.toBeInTheDocument();
    });
  });

  describe('Tournament groups draw button', () => {
    it('renders "🎲 Тегли жребий за групи" when tennis mode, >= 6 teams, and onDrawGroups provided', async () => {
      const user = userEvent.setup();
      const onDrawGroupsMock = vi.fn();

      render(
        <TeamList
          teams={mockTeams6}
          mode="tennis"
          onDrawGroups={onDrawGroupsMock}
        />
      );

      const drawBtn = screen.getByRole('button', { name: /тегли жребий за групи/i });
      expect(drawBtn).toBeInTheDocument();

      await user.click(drawBtn);
      expect(onDrawGroupsMock).toHaveBeenCalledTimes(1);
    });

    it('does not render draw button when teams count is less than 6 (e.g. 3 teams)', () => {
      render(
        <TeamList
          teams={mockTeams3}
          mode="tennis"
          onDrawGroups={vi.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /тегли жребий за групи/i })).not.toBeInTheDocument();
    });

    it('does not render draw button when mode is generic', () => {
      render(
        <TeamList
          teams={mockTeams3}
          mode="generic"
          onDrawGroups={vi.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /тегли жребий за групи/i })).not.toBeInTheDocument();
    });
  });

  describe('Incomplete teams gating and placeholders', () => {
    it('disables "Запиши като мач" when hasIncompleteTeams is true', () => {
      render(
        <TeamList
          teams={mockTeams2}
          mode="tennis"
          onSaveAsMatch={vi.fn()}
          hasIncompleteTeams={true}
        />
      );

      const saveMatchBtn = screen.getByRole('button', { name: /запиши като мач/i });
      expect(saveMatchBtn).toBeDisabled();
    });

    it('disables "🎲 Тегли жребий за групи" when hasIncompleteTeams is true', () => {
      render(
        <TeamList
          teams={mockTeams6}
          mode="tennis"
          onDrawGroups={vi.fn()}
          hasIncompleteTeams={true}
        />
      );

      const drawBtn = screen.getByRole('button', { name: /тегли жребий за групи/i });
      expect(drawBtn).toBeDisabled();
    });

    it('passes targetTeamSize to TeamCard to render placeholders when incomplete', () => {
      // In doubles, targetSize is 2. mockTeams2 have 1 player each.
      render(
        <TeamList
          teams={mockTeams2}
          mode="tennis"
          format="doubles"
          targetTeamSize={2}
          hasIncompleteTeams={true}
        />
      );

      const emptySlots = screen.getAllByTestId('empty-slot');
      expect(emptySlots).toHaveLength(2); // 1 empty slot for each of the 2 teams
      expect(screen.getAllByText('Свободно място')).toHaveLength(2);
    });
  });
});
