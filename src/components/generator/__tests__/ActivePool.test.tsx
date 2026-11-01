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
      singles_matches_played: 10,
      singles_wins: 8,
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
    render(<ActivePool activePool={samplePool} onRemovePlayer={onRemove} format="singles" />);

    // Roster count summary
    expect(screen.getByText('1 регистрирани')).toBeInTheDocument();
    expect(screen.getByText('1 гости')).toBeInTheDocument();

    // Registered player badge
    const regBadge = screen.getByTestId('player-badge-reg-1');
    expect(regBadge).toHaveTextContent('Христо');
    expect(regBadge).toHaveTextContent('80%');
    expect(regBadge).not.toHaveTextContent('1520');
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

  it('renders win rate badge corresponding to the active format context', () => {
    const dualPool: GeneratorPlayer[] = [
      {
        id: 'reg-dual',
        name: 'Димитър',
        source: 'registered',
        rating: 1500,
        singles_matches_played: 10,
        singles_wins: 8,
        doubles_matches_played: 10,
        doubles_wins: 6,
      },
    ];

    const { rerender } = render(
      <ActivePool
        activePool={dualPool}
        onRemovePlayer={vi.fn()}
        format="singles"
      />
    );

    const badge = screen.getByTestId('player-badge-reg-dual');
    expect(badge).toHaveTextContent('80%');
    expect(badge).not.toHaveTextContent('60%');
    expect(badge).not.toHaveTextContent('1500');

    rerender(
      <ActivePool
        activePool={dualPool}
        onRemovePlayer={vi.fn()}
        format="doubles"
      />
    );

    expect(badge).toHaveTextContent('60%');
    expect(badge).not.toHaveTextContent('80%');
    expect(badge).not.toHaveTextContent('1500');
  });

  it('hides win rate badges when mode is generic', () => {
    const poolWithRatings: GeneratorPlayer[] = [
      {
        id: 'reg-1',
        name: 'Христо',
        source: 'registered',
        rating: 1520,
        singles_matches_played: 10,
        singles_wins: 8,
      },
    ];

    render(
      <ActivePool
        activePool={poolWithRatings}
        onRemovePlayer={vi.fn()}
        mode="generic"
      />
    );

    const badge = screen.getByTestId('player-badge-reg-1');
    expect(badge).toHaveTextContent('Христо');
    expect(badge).not.toHaveTextContent('80%');
    expect(badge).not.toHaveTextContent('1520');
  });

  it('renders badges in alphabetical order by Bulgarian Cyrillic collation', () => {
    const unsortedPool: GeneratorPlayer[] = [
      { id: '1', name: 'Христо', source: 'registered', rating: 1500 },
      { id: '2', name: 'Александър', source: 'registered', rating: 1400 },
      { id: '3', name: 'Борис', source: 'guest' },
    ];

    render(
      <ActivePool
        activePool={unsortedPool}
        onRemovePlayer={vi.fn()}
      />
    );

    const badges = screen.getAllByTestId(/^player-badge-/);
    expect(badges[0]).toHaveTextContent('Александър');
    expect(badges[1]).toHaveTextContent('Борис');
    expect(badges[2]).toHaveTextContent('Христо');
  });

  it('AP-TARGET-01: scales player badge remove button to 36px touch target', () => {
    render(<ActivePool activePool={samplePool} onRemovePlayer={vi.fn()} />);

    const removeBtn = screen.getByRole('button', { name: 'Премахни Мартин' });
    expect(removeBtn).toHaveClass('min-w-[36px]', 'min-h-[36px]', 'p-2', '-mr-2', '-my-1.5', 'inline-flex');
  });
});

