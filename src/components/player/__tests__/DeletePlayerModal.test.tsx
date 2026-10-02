import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeletePlayerModal } from '../DeletePlayerModal';

describe('DeletePlayerModal Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DeletePlayerModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        playerName="Иван Петров"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders confirmation text with player name when isOpen is true', () => {
    render(
      <DeletePlayerModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        playerName="Иван Петров"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Изтриване на играч' })).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes('Сигурни ли сте, че искате да изтриете')
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Иван Петров')).toBeInTheDocument();
  });

  it('calls onConfirm and closes upon confirming delete', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <DeletePlayerModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        playerName="Иван Петров"
      />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Изтриване' });
    await user.click(deleteBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('closes when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <DeletePlayerModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        playerName="Иван Петров"
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /отказ/i });
    await user.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const handleClose = vi.fn();
    render(
      <DeletePlayerModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        playerName="Иван Петров"
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('keeps modal open if onConfirm rejects', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn().mockRejectedValue(new Error('Deletion failed'));
    const handleClose = vi.fn();

    render(
      <DeletePlayerModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        playerName="Иван Петров"
      />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Изтриване' });
    await user.click(deleteBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleClose).not.toHaveBeenCalled();
  });
});
