import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TournamentModal } from '../TournamentModal';
import type { Tournament } from '../../../types/tournament';

const mockTournament: Tournament = {
  id: 't-123',
  title: 'Есенен шампионат',
  date: '2026-09-20',
  format: 'singles',
  status: 'completed',
  winner_team_name: 'Шампионът',
  notes: 'Играно в зала',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

describe('TournamentModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <TournamentModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders create mode with default values when initialData is null/undefined', () => {
    render(
      <TournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Нов турнир' })).toBeInTheDocument();
    expect(screen.getByLabelText(/име на турнира/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: 'По двойки' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Чернова' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByLabelText(/бележки/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Създай' })).toBeInTheDocument();
  });

  it('renders edit mode prefilling existing tournament data', () => {
    render(
      <TournamentModal
        isOpen={true}
        initialData={mockTournament}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Редактиране на турнир' })).toBeInTheDocument();
    expect(screen.getByLabelText(/име на турнира/i)).toHaveValue('Есенен шампионат');
    expect(screen.getByLabelText(/дата на провеждане/i)).toHaveValue('2026-09-20');
    expect(screen.getByRole('button', { name: 'Поединично' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Приключил' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByLabelText(/бележки/i)).toHaveValue('Играно в зала');
    expect(screen.getByRole('button', { name: 'Запази' })).toBeInTheDocument();
  });

  it('shows validation error when title is empty', async () => {
    const onSave = vi.fn();
    render(
      <TournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const submitBtn = screen.getByRole('button', { name: 'Създай' });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent('Моля, въведете име на турнира.');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with valid payload and closes modal on success', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <TournamentModal
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/име на турнира/i), {
      target: { value: 'Пролетен турнир' },
    });
    fireEvent.change(screen.getByLabelText(/дата на провеждане/i), {
      target: { value: '2099-05-10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'В ход' }));
    fireEvent.change(screen.getByLabelText(/бележки/i), {
      target: { value: 'Корт с твърда настилка' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Създай' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: 'Пролетен турнир',
        date: '2099-05-10',
        format: 'doubles',
        status: 'in_progress',
        notes: 'Корт с твърда настилка',
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose when clicking cancel or close button', () => {
    const onClose = vi.fn();
    render(
      <TournamentModal
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Отказ' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Затвори' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('closes on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <TournamentModal
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('enforces min attribute on date input in create mode and omits it in edit mode', () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const { unmount } = render(
      <TournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const createDateInput = screen.getByLabelText(/дата на провеждане/i);
    expect(createDateInput).toHaveAttribute('min', todayStr);

    unmount();

    render(
      <TournamentModal
        isOpen={true}
        initialData={mockTournament}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const editDateInput = screen.getByLabelText(/дата на провеждане/i);
    expect(editDateInput).not.toHaveAttribute('min');
  });

  it('shows validation error when past date is submitted in create mode and clears on date change', async () => {
    const onSave = vi.fn();
    render(
      <TournamentModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/име на турнира/i), {
      target: { value: 'Турнир в миналото' },
    });
    const dateInput = screen.getByLabelText(/дата на провеждане/i);
    fireEvent.change(dateInput, {
      target: { value: '2020-01-01' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Създай' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Датата на провеждане не може да бъде в миналото.'
    );
    expect(onSave).not.toHaveBeenCalled();

    // Verify changing date clears validation error
    fireEvent.change(dateInput, {
      target: { value: '2099-01-01' },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('allows edit mode to save an existing tournament with a past date', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const pastTournament: Tournament = {
      ...mockTournament,
      date: '2020-01-01',
    };

    render(
      <TournamentModal
        isOpen={true}
        initialData={pastTournament}
        onClose={onClose}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: pastTournament.title,
        date: '2020-01-01',
        format: pastTournament.format,
        status: pastTournament.status,
        notes: pastTournament.notes,
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
