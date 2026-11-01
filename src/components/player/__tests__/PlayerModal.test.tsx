import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerModal } from '../PlayerModal';
import type { PlayerRow } from '../../../types/database.types';

describe('PlayerModal Component', () => {
  const samplePlayer: PlayerRow = {
    id: 'p-1',
    name: 'Иван Петров',
    rating: 1450,
    singles_rating: 1500,
    doubles_rating: 1400,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <PlayerModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders in create mode with single name input when player prop is undefined', () => {
    render(<PlayerModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Нов играч' })).toBeInTheDocument();
    expect(screen.getByLabelText(/име на играча/i)).toHaveValue('');
    expect(screen.queryByLabelText(/общ рейтинг/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/рейтинг поединично/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/рейтинг по двойки/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /създай/i })).toBeInTheDocument();
  });

  it('renders in edit mode with populated name when player prop is provided', () => {
    render(
      <PlayerModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        player={samplePlayer}
      />
    );

    expect(screen.getByRole('heading', { name: 'Редактиране на играч' })).toBeInTheDocument();
    expect(screen.getByLabelText(/име на играча/i)).toHaveValue('Иван Петров');
    expect(screen.queryByLabelText(/общ рейтинг/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/рейтинг поединично/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/рейтинг по двойки/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /запази/i })).toBeInTheDocument();
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    render(<PlayerModal isOpen={true} onClose={vi.fn()} onSave={handleSave} />);

    const submitBtn = screen.getByRole('button', { name: /създай/i });
    await user.click(submitBtn);

    expect(screen.getByText('Името на играча е задължително.')).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('calls onSave with trimmed name and default ratings on success', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(<PlayerModal isOpen={true} onClose={handleClose} onSave={handleSave} />);

    const nameInput = screen.getByLabelText(/име на играча/i);
    await user.type(nameInput, '  Георги Аспарухов  ');

    const submitBtn = screen.getByRole('button', { name: /създай/i });
    await user.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith('Георги Аспарухов', 1200, 1200, 1200);
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('calls onSave with existing player ratings in edit mode', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <PlayerModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        player={samplePlayer}
      />
    );

    const nameInput = screen.getByLabelText(/име на играча/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Иван Петров - обновен');

    const saveBtn = screen.getByRole('button', { name: /запази/i });
    await user.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith(
      'Иван Петров - обновен',
      1450,
      1500,
      1400
    );
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('closes when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<PlayerModal isOpen={true} onClose={handleClose} onSave={vi.fn()} />);

    const cancelBtn = screen.getByRole('button', { name: /отказ/i });
    await user.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const handleClose = vi.fn();
    render(<PlayerModal isOpen={true} onClose={handleClose} onSave={vi.fn()} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('keeps modal open if onSave rejects', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockRejectedValue(new Error('Network error'));
    const handleClose = vi.fn();

    render(<PlayerModal isOpen={true} onClose={handleClose} onSave={handleSave} />);

    const nameInput = screen.getByLabelText(/име на играча/i);
    await user.type(nameInput, 'Тест');

    const submitBtn = screen.getByRole('button', { name: /създай/i });
    await user.click(submitBtn);

    expect(handleSave).toHaveBeenCalled();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('enforces max dynamic viewport height and vertical scrollability', () => {
    render(<PlayerModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass('max-h-[90dvh]', 'overflow-y-auto', 'p-5', 'sm:p-6');
  });
});
