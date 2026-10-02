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
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <PlayerModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders in create mode when player prop is undefined', () => {
    render(<PlayerModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Нов играч' })).toBeInTheDocument();
    expect(screen.getByLabelText(/име на играча/i)).toHaveValue('');
    expect(screen.getByLabelText(/рейтинг/i)).toHaveValue(1200);
    expect(screen.getByRole('button', { name: /създай/i })).toBeInTheDocument();
  });

  it('renders in edit mode when player prop is provided', () => {
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
    expect(screen.getByLabelText(/рейтинг/i)).toHaveValue(1450);
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

  it('shows validation error when rating is negative', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    render(<PlayerModal isOpen={true} onClose={vi.fn()} onSave={handleSave} />);

    const nameInput = screen.getByLabelText(/име на играча/i);
    const ratingInput = screen.getByLabelText(/рейтинг/i);

    await user.type(nameInput, 'Тестов Играч');
    await user.clear(ratingInput);
    await user.type(ratingInput, '-50');

    const submitBtn = screen.getByRole('button', { name: /създай/i });
    await user.click(submitBtn);

    expect(
      screen.getByText('Рейтингът трябва да бъде положително число или 0.')
    ).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('calls onSave with parsed values and closes on success', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(<PlayerModal isOpen={true} onClose={handleClose} onSave={handleSave} />);

    const nameInput = screen.getByLabelText(/име на играча/i);
    const ratingInput = screen.getByLabelText(/рейтинг/i);

    await user.type(nameInput, '  Георги Аспарухов  ');
    await user.clear(ratingInput);
    await user.type(ratingInput, '1900');

    const submitBtn = screen.getByRole('button', { name: /създай/i });
    await user.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith('Георги Аспарухов', 1900);
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
});
