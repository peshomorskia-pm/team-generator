import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteTournamentModal } from '../DeleteTournamentModal';

describe('DeleteTournamentModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <DeleteTournamentModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders confirmation text and tournament title when provided', () => {
    render(
      <DeleteTournamentModal
        isOpen={true}
        tournamentTitle="Лятна купа"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Изтриване на турнир' })).toBeInTheDocument();
    expect(screen.getByText('Лятна купа')).toBeInTheDocument();
    expect(screen.getByText(/Това действие е необратимо/i)).toBeInTheDocument();
  });

  it('calls onConfirm and closes upon confirming delete', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <DeleteTournamentModal
        isOpen={true}
        tournamentTitle="Лятна купа"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Изтриване' });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose when clicking cancel or close button', () => {
    const onClose = vi.fn();

    render(
      <DeleteTournamentModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
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
      <DeleteTournamentModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
