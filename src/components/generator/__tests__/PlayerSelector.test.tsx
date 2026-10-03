import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerSelector } from '../PlayerSelector';
import { PlayerRow } from '../../../types/database.types';

describe('PlayerSelector Component', () => {
  const samplePlayers: PlayerRow[] = [
    {
      id: 'p-1',
      name: 'Александър',
      rating: 1550,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'p-2',
      name: 'Борис',
      rating: 1400,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  it('renders registered players with ratings and checkboxes', () => {
    const onToggle = vi.fn();
    render(
      <PlayerSelector
        players={samplePlayers}
        selectedIds={new Set(['p-1'])}
        onTogglePlayer={onToggle}
      />
    );

    expect(screen.getByRole('heading', { name: 'Регистрирани играчи' })).toBeInTheDocument();
    expect(screen.getByText('Александър')).toBeInTheDocument();
    expect(screen.getByText('1550')).toBeInTheDocument();
    expect(screen.getByText('Борис')).toBeInTheDocument();
    expect(screen.getByText('1400')).toBeInTheDocument();

    const checkbox1 = screen.getByRole('checkbox', { name: 'Александър' });
    const checkbox2 = screen.getByRole('checkbox', { name: 'Борис' });

    expect(checkbox1).toBeChecked();
    expect(checkbox2).not.toBeChecked();
  });

  it('filters players by search query', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <PlayerSelector
        players={samplePlayers}
        selectedIds={new Set()}
        onTogglePlayer={onToggle}
      />
    );

    const searchInput = screen.getByPlaceholderText('Търсене на играчи...');
    await user.type(searchInput, 'Борис');

    expect(screen.queryByText('Александър')).not.toBeInTheDocument();
    expect(screen.getByText('Борис')).toBeInTheDocument();
  });

  it('calls onTogglePlayer when player row or checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <PlayerSelector
        players={samplePlayers}
        selectedIds={new Set()}
        onTogglePlayer={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Александър' });
    await user.click(checkbox);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(samplePlayers[0]);
  });

  it('supports select all and deselect all buttons', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <PlayerSelector
        players={samplePlayers}
        selectedIds={new Set(['p-1'])}
        onTogglePlayer={onToggle}
      />
    );

    // "Избери всички" button should be visible since not all are selected
    const selectAllBtn = screen.getByRole('button', { name: /избери всички/i });
    await user.click(selectAllBtn);

    // Should call onToggle for unselected p-2
    expect(onToggle).toHaveBeenCalledWith(samplePlayers[1]);
  });

  it('renders loading indicator when loading is true', () => {
    render(
      <PlayerSelector
        players={[]}
        selectedIds={new Set()}
        onTogglePlayer={vi.fn()}
        loading={true}
      />
    );

    expect(screen.getByText('Зареждане на играчи...')).toBeInTheDocument();
  });

  it('renders error message when error is provided', () => {
    render(
      <PlayerSelector
        players={[]}
        selectedIds={new Set()}
        onTogglePlayer={vi.fn()}
        error="Грешка при зареждане."
      />
    );

    expect(screen.getByText('Грешка при зареждане.')).toBeInTheDocument();
  });

  it('clears search input when clear button (X) is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PlayerSelector
        players={samplePlayers}
        selectedIds={new Set()}
        onTogglePlayer={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Търсене на играчи...') as HTMLInputElement;
    await user.type(searchInput, 'Борис');
    expect(searchInput.value).toBe('Борис');

    const clearBtn = screen.getByRole('button', { name: 'Изчисти търсенето' });
    expect(clearBtn).toBeInTheDocument();

    await user.click(clearBtn);
    expect(searchInput.value).toBe('');
    expect(screen.queryByRole('button', { name: 'Изчисти търсенето' })).not.toBeInTheDocument();
  });

  it('supports controlled searchTerm and triggers onSearchChange', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <PlayerSelector
        players={samplePlayers}
        selectedIds={new Set()}
        onTogglePlayer={vi.fn()}
        searchTerm="Алекс"
        onSearchChange={onSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Търсене на играчи...') as HTMLInputElement;
    expect(searchInput.value).toBe('Алекс');

    await user.type(searchInput, 'а');
    expect(onSearchChange).toHaveBeenCalled();
  });
});
