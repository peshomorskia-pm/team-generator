import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '../../../context/ThemeContext';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders with initial light theme and correct aria-label', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: 'Превключи към тъмна тема' });
    expect(button).toBeInTheDocument();
  });

  it('toggles theme on click and updates aria-label and html class', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Превключи към тъмна тема');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(button);

    expect(button).toHaveAttribute('aria-label', 'Превключи към светла тема');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(button);

    expect(button).toHaveAttribute('aria-label', 'Превключи към тъмна тема');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('renders label text when showLabel is true', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle showLabel />
      </ThemeProvider>
    );

    expect(screen.getByText('Тъмна тема')).toBeInTheDocument();

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Светла тема')).toBeInTheDocument();
  });
});
