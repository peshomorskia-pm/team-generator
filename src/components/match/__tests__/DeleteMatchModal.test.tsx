import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteMatchModal } from '../DeleteMatchModal';

describe('DeleteMatchModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <DeleteMatchModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal dialog content when isOpen is true', () => {
    render(
      <DeleteMatchModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Изтриване на мач' })).toBeInTheDocument();
    expect(screen.getByText('Сигурни ли сте, че искате да изтриете този мач?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отказ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Изтриване' })).toBeInTheDocument();
  });

  it('confirms delete execution on button click', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <DeleteMatchModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Изтриване' });
    await user.click(deleteBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('dismisses modal on cancel click or close icon', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <DeleteMatchModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Отказ' }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByLabelText('Затвори'));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('dismisses modal on Escape key press when not loading', () => {
    const handleClose = vi.fn();

    render(
      <DeleteMatchModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner and disables buttons when isLoading is true', () => {
    render(
      <DeleteMatchModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isLoading={true}
      />
    );

    expect(screen.getByText('Изтриване...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /изтриване/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Отказ' })).toBeDisabled();
    expect(screen.getByLabelText('Затвори')).toBeDisabled();
  });
});
