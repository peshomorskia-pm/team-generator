import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerInput } from '../PlayerInput';

describe('PlayerInput', () => {
  it('renders textarea with placeholder and label', () => {
    render(<PlayerInput onAddPlayer={vi.fn()} value="" />);

    expect(screen.getByLabelText(/списък с играчи/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/въведете по едно име на ред/i)
    ).toBeInTheDocument();
  });

  it('triggers onChange when typing in textarea', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PlayerInput onAddPlayer={vi.fn()} value="" onChange={handleChange} />);

    const textarea = screen.getByLabelText(/списък с играчи/i);
    await user.type(textarea, 'Иван');

    expect(handleChange).toHaveBeenCalled();
  });

  it('displays player count indicator correctly', () => {
    const { rerender } = render(<PlayerInput onAddPlayer={vi.fn()} playerCount={0} />);
    expect(screen.getByText('0 въведени')).toBeInTheDocument();

    rerender(<PlayerInput onAddPlayer={vi.fn()} playerCount={5} />);
    expect(screen.getByText('5 въведени')).toBeInTheDocument();
  });

  it('toggles quick add form and submits single player with rating', async () => {
    const user = userEvent.setup();
    const handleAddPlayer = vi.fn();
    render(<PlayerInput onAddPlayer={handleAddPlayer} />);

    const toggleBtn = screen.getByRole('button', { name: /\+ бързо добавяне с рейтинг/i });
    await user.click(toggleBtn);

    const nameInput = screen.getByPlaceholderText(/име на играч/i);
    const ratingInput = screen.getByPlaceholderText(/рейтинг/i);
    const submitBtn = screen.getByRole('button', { name: /добави/i });

    await user.type(nameInput, 'Николай');
    await user.type(ratingInput, '8');
    await user.click(submitBtn);

    expect(handleAddPlayer).toHaveBeenCalledWith('Николай', 8);
    expect(nameInput).toHaveValue('');
    expect(ratingInput).toHaveValue(null);
  });
});
