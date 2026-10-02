import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestInput } from '../GuestInput';

describe('GuestInput Component', () => {
  it('renders input and submit button with Bulgarian labels', () => {
    const onAddGuest = vi.fn();
    render(<GuestInput onAddGuest={onAddGuest} />);

    expect(screen.getByRole('heading', { name: 'Добави гости' })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Въведете имена на гости (разделени със запетая)...')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /добави/i })).toBeInTheDocument();
  });

  it('clears input field after successful addition', async () => {
    const user = userEvent.setup();
    const onAddGuest = vi.fn();
    render(<GuestInput onAddGuest={onAddGuest} />);

    const input = screen.getByPlaceholderText(
      'Въведете имена на гости (разделени със запетая)...'
    ) as HTMLInputElement;
    const button = screen.getByRole('button', { name: /добави/i });

    await user.type(input, 'Иван, Петър');
    expect(input.value).toBe('Иван, Петър');

    await user.click(button);
    expect(onAddGuest).toHaveBeenCalledTimes(1);
    expect(onAddGuest).toHaveBeenCalledWith('Иван, Петър');
    expect(input.value).toBe('');
  });

  it('submits on Enter key in input field', async () => {
    const user = userEvent.setup();
    const onAddGuest = vi.fn();
    render(<GuestInput onAddGuest={onAddGuest} />);

    const input = screen.getByPlaceholderText(
      'Въведете имена на гости (разделени със запетая)...'
    ) as HTMLInputElement;

    await user.type(input, 'Георги{Enter}');
    expect(onAddGuest).toHaveBeenCalledWith('Георги');
    expect(input.value).toBe('');
  });

  it('does not submit when input is empty or contains only whitespace', async () => {
    const user = userEvent.setup();
    const onAddGuest = vi.fn();
    render(<GuestInput onAddGuest={onAddGuest} />);

    const button = screen.getByRole('button', { name: /добави/i });
    expect(button).toBeDisabled();

    const input = screen.getByPlaceholderText(
      'Въведете имена на гости (разделени със запетая)...'
    );
    await user.type(input, '   ');
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onAddGuest).not.toHaveBeenCalled();
  });

  it('disables input and button when disabled prop is true', () => {
    const onAddGuest = vi.fn();
    render(<GuestInput onAddGuest={onAddGuest} disabled={true} />);

    const input = screen.getByPlaceholderText(
      'Въведете имена на гости (разделени със запетая)...'
    );
    const button = screen.getByRole('button', { name: /добави/i });

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });
});
