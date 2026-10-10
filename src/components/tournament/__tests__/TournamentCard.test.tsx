import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TournamentCard } from '../TournamentCard';
import type { Tournament } from '../../../types/tournament';

const mockTournament: Tournament = {
  id: 't-1',
  title: 'Лятна купа 2026',
  date: '2026-07-15',
  format: 'doubles',
  status: 'in_progress',
  winner_team_name: null,
  notes: 'Мачовете се играят на кортове 1 и 2.',
  created_at: '2026-07-01T10:00:00Z',
  updated_at: '2026-07-01T10:00:00Z',
};

const renderCard = (props: Partial<Parameters<typeof TournamentCard>[0]> = {}) => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  render(
    <MemoryRouter>
      <TournamentCard
        tournament={mockTournament}
        onEdit={onEdit}
        onDelete={onDelete}
        {...props}
      />
    </MemoryRouter>
  );

  return { onEdit, onDelete };
};

describe('TournamentCard', () => {
  it('renders tournament title, date, format, and status badges correctly', () => {
    renderCard();

    expect(screen.getByText('Лятна купа 2026')).toBeInTheDocument();
    expect(screen.getByText('По двойки')).toBeInTheDocument();
    expect(screen.getByText('В ход')).toBeInTheDocument();
    expect(screen.getByText('Мачовете се играят на кортове 1 и 2.')).toBeInTheDocument();
  });

  it('renders singles format badge when format is singles', () => {
    renderCard({
      tournament: {
        ...mockTournament,
        format: 'singles',
        status: 'draft',
      },
    });

    expect(screen.getByText('Поединично')).toBeInTheDocument();
    expect(screen.getByText('Чернова')).toBeInTheDocument();
  });

  it('renders completed status badge when status is completed', () => {
    renderCard({
      tournament: {
        ...mockTournament,
        status: 'completed',
      },
    });

    expect(screen.getByText('Приключил')).toBeInTheDocument();
  });

  it('renders champion badge when winner_team_name is present and hides when null', () => {
    const { unmount } = render(
      <MemoryRouter>
        <TournamentCard
          tournament={mockTournament}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Шампион:/i)).not.toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter>
        <TournamentCard
          tournament={{
            ...mockTournament,
            winner_team_name: 'Отбор Алфа',
          }}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('🏆 Шампион: Отбор Алфа')).toBeInTheDocument();
  });

  it('triggers onEdit callback with tournament object when clicking edit button', () => {
    const { onEdit } = renderCard();

    const editBtn = screen.getByRole('button', { name: 'Редактиране' });
    fireEvent.click(editBtn);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockTournament);
  });

  it('triggers onDelete callback with tournament id when clicking delete button', () => {
    const { onDelete } = renderCard();

    const deleteBtn = screen.getByRole('button', { name: 'Изтриване' });
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('t-1');
  });

  it('has navigation link pointing to tournament details page', () => {
    renderCard();

    const link = screen.getByRole('link', { name: /към турнира/i });
    expect(link).toHaveAttribute('href', '/tournaments/t-1');
  });
});
