import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivePool } from '../ActivePool';
import { GeneratorPlayer } from '../../../types/generator';

describe('ActivePool Component', () => {
  const samplePool: GeneratorPlayer[] = [
    {
      id: 'reg-1',
      name: 'Христо',
      source: 'registered',
      rating: 1520,
    },
    {
      id: 'guest-1',
      name: 'Мартин',
      source: 'guest',
    },
  ];

  it('renders empty state when pool is empty', () => {
    const onRemove = vi.fn();
    render(<ActivePool activePool={[]} onRemovePlayer={onRemove} />);

    expect(screen.getByRole('heading', { name: 'Активен състав' })).toBeInTheDocument();
    expect(
      screen.getByText(/Няма избрани играчи. Изберете регистрирани играчи или добавете гости/i)
    ).toBeInTheDocument();
  });

  it('renders correct badges for registered vs guest players', () => {
    const onRemove = vi.fn();
    render(<ActivePool activePool={samplePool} onRemovePlayer={onRemove} />);

    // Roster count summary
    expect(screen.getByText('1 регистрирани')).toBeInTheDocument();
    expect(screen.getByText('1 гости')).toBeInTheDocument();

    // Registered player badge
    const regBadge = screen.getByTestId('player-badge-reg-1');
    expect(regBadge).toHaveTextContent('Христо');
    expect(regBadge).toHaveTextContent('1520');
    expect(regBadge.className).toContain('indigo');

    // Guest player badge
    const guestBadge = screen.getByTestId('player-badge-guest-1');
    expect(guestBadge).toHaveTextContent('Мартин');
    expect(guestBadge).toHaveTextContent('Гост');
    expect(guestBadge.className).toContain('slate');
  });

  it('calls onRemovePlayer when "X" button is clicked for a player', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<ActivePool activePool={samplePool} onRemovePlayer={onRemove} />);

    const removeGuestBtn = screen.getByRole('button', { name: 'Премахни Мартин' });
    await user.click(removeGuestBtn);

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('guest-1');
  });

  it('calls onClearPool when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onClear = vi.fn();
    render(
      <ActivePool
        activePool={samplePool}
        onRemovePlayer={onRemove}
        onClearPool={onClear}
      />
    );

    const clearBtn = screen.getByRole('button', { name: /изчисти всички/i });
    await user.click(clearBtn);

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
