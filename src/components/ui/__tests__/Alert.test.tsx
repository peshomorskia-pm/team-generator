import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '../Alert';

describe('Alert', () => {
  it('renders role="alert" and displays message text', () => {
    render(<Alert type="error" message="Възникна грешка!" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Възникна грешка!')).toBeInTheDocument();
  });

  it('applies error styling and renders error icon for type="error"', () => {
    const { container } = render(<Alert type="error" message="Грешка" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-50');
    expect(alert).toHaveClass('text-red-800');
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('text-red-500');
  });

  it('applies success styling and renders success icon for type="success"', () => {
    const { container } = render(<Alert type="success" message="Успешно действие" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-green-50');
    expect(alert).toHaveClass('text-green-800');
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('text-green-500');
  });

  it('renders dismiss button when onDismiss is provided and triggers callback on click', async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();
    render(<Alert type="success" message="Затвори ме" onDismiss={handleDismiss} />);

    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn).toBeInTheDocument();

    await user.click(closeBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render dismiss button when onDismiss is omitted', () => {
    render(<Alert type="error" message="Без бутон за затваряне" />);
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });
});
