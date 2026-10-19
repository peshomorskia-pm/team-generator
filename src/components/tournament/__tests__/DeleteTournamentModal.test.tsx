import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteTournamentModal } from '../DeleteTournamentModal';

describe('DeleteTournamentModal', () => {
  it('DTM-01: does not render when isOpen is false', () => {
    render(
      <DeleteTournamentModal
        isOpen={false}
        tournament={{ id: '1', title: 'Чернова 1', status: 'draft' }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('DTM-02: renders draft mode UI and instant action button', () => {
    render(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '1', title: 'Чернова 1', status: 'draft' }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Изтриване на чернова' })).toBeInTheDocument();
    expect(screen.getByText(/Чернова 1/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Въведете името на турнира тук...')).not.toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: 'Изтрий' });
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn).toBeEnabled();
  });

  it('DTM-03: executes draft mode deletion upon clicking delete', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '1', title: 'Чернова 1', status: 'draft' }}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Изтрий' });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('DTM-04: renders active mode warning banner and disabled submit button initially', () => {
    render(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '2', title: 'Лятна Купа 2026', status: 'in_progress' }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Необратимо изтриване на турнир' })).toBeInTheDocument();
    expect(screen.getByText(/⚠️ Внимание: Този турнир съдържа записани мачове и официални резултати/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Въведете името на турнира тук...')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /🗑️ Изтрий безвъзвратно/i });
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn).toBeDisabled();
  });

  it('DTM-05: keeps submit button disabled when typed name does not match', async () => {
    const user = userEvent.setup();

    render(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '2', title: 'Лятна Купа 2026', status: 'in_progress' }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Въведете името на турнира тук...');
    await user.type(input, 'Грешно име');

    const deleteBtn = screen.getByRole('button', { name: /🗑️ Изтрий безвъзвратно/i });
    expect(deleteBtn).toBeDisabled();
  });

  it('DTM-06: enables submit button when exact name is typed and triggers deletion on click', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '2', title: 'Лятна Купа 2026', status: 'in_progress' }}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    const input = screen.getByPlaceholderText('Въведете името на турнира тук...');
    const deleteBtn = screen.getByRole('button', { name: /🗑️ Изтрий безвъзвратно/i });

    await user.type(input, 'Лятна Купа 2026');
    expect(deleteBtn).toBeEnabled();

    await user.click(deleteBtn);
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('DTM-07: enables submit button when name matches with leading/trailing whitespace', async () => {
    const user = userEvent.setup();

    render(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '2', title: 'Лятна Купа 2026', status: 'in_progress' }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Въведете името на турнира тук...');
    const deleteBtn = screen.getByRole('button', { name: /🗑️ Изтрий безвъзвратно/i });

    await user.type(input, '  Лятна Купа 2026  ');
    expect(deleteBtn).toBeEnabled();
  });

  it('DTM-08: enforces strict verification for completed tournaments', async () => {
    const user = userEvent.setup();

    render(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '3', title: 'Зимно Първенство', status: 'completed' }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Необратимо изтриване на турнир' })).toBeInTheDocument();
    const deleteBtn = screen.getByRole('button', { name: /🗑️ Изтрий безвъзвратно/i });
    expect(deleteBtn).toBeDisabled();

    const input = screen.getByPlaceholderText('Въведете името на турнира тук...');
    await user.type(input, 'Зимно Първенство');
    expect(deleteBtn).toBeEnabled();
  });

  it('DTM-09: resets confirmation input when modal is closed and reopened', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '2', title: 'Лятна Купа 2026', status: 'in_progress' }}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Въведете името на турнира тук...');
    await user.type(input, 'Лятна');
    expect(input).toHaveValue('Лятна');

    // Close modal
    rerender(
      <DeleteTournamentModal
        isOpen={false}
        tournament={{ id: '2', title: 'Лятна Купа 2026', status: 'in_progress' }}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    // Reopen modal
    rerender(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '2', title: 'Лятна Купа 2026', status: 'in_progress' }}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    const reopenedInput = screen.getByPlaceholderText('Въведете името на турнира тук...');
    expect(reopenedInput).toHaveValue('');
    const deleteBtn = screen.getByRole('button', { name: /🗑️ Изтрий безвъзвратно/i });
    expect(deleteBtn).toBeDisabled();
  });

  it('DTM-10: cancels deletion on Escape key press in strict mode without submitting', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '2', title: 'Лятна Купа 2026', status: 'in_progress' }}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('DTM-11: disables input and buttons and shows loading spinner when isDeleting is true', () => {
    render(
      <DeleteTournamentModal
        isOpen={true}
        tournament={{ id: '2', title: 'Лятна Купа 2026', status: 'in_progress' }}
        isDeleting={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Въведете името на турнира тук...');
    expect(input).toBeDisabled();

    const deleteBtn = screen.getByRole('button', { name: /Изтриване.../i });
    expect(deleteBtn).toBeDisabled();

    const cancelBtn = screen.getByRole('button', { name: 'Отказ' });
    expect(cancelBtn).toBeDisabled();

    const closeBtn = screen.getByRole('button', { name: 'Затвори' });
    expect(closeBtn).toBeDisabled();
  });

  it('falls back to tournamentTitle and draft status when tournament object is omitted', () => {
    render(
      <DeleteTournamentModal
        isOpen={true}
        tournamentTitle="Резервен турнир"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Изтриване на чернова' })).toBeInTheDocument();
    expect(screen.getByText(/Резервен турнир/)).toBeInTheDocument();
  });
});
