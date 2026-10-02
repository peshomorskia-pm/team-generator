import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerCombobox } from '../PlayerCombobox';

describe('PlayerCombobox Component', () => {
  const mockPlayers = [
    { id: 'p1', name: 'Иван Иванов', rating: 1200 },
    { id: 'p2', name: 'Георги Георгиев', rating: 1300 },
    { id: 'p3', name: 'Димитър Димитров', rating: 1400 },
  ];

  it('renders input with placeholder and toggles dropdown', async () => {
    const user = userEvent.setup();
    render(
      <PlayerCombobox
        players={mockPlayers}
        selectedIds={[]}
        excludedIds={[]}
        onSelect={vi.fn()}
        placeholder="Избери играч..."
        ariaLabel="Избери играч"
      />
    );

    const input = screen.getByLabelText('Избери играч');
    expect(input).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Георги Георгиев')).toBeInTheDocument();
    expect(screen.getByText('Димитър Димитров')).toBeInTheDocument();
  });

  it('filters players by keystroke query', async () => {
    const user = userEvent.setup();
    render(
      <PlayerCombobox
        players={mockPlayers}
        selectedIds={[]}
        excludedIds={[]}
        onSelect={vi.fn()}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'Геор');

    expect(screen.getByText('Георги Георгиев')).toBeInTheDocument();
    expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument();
    expect(screen.queryByText('Димитър Димитров')).not.toBeInTheDocument();
  });

  it('calls onSelect and closes dropdown when an eligible player is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <PlayerCombobox
        players={mockPlayers}
        selectedIds={[]}
        excludedIds={[]}
        onSelect={handleSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    const option = screen.getByRole('option', { name: /иван иванов/i });
    await user.click(option);

    expect(handleSelect).toHaveBeenCalledWith(mockPlayers[0]);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('disables opposing team players (excludedIds) and prevents selection', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <PlayerCombobox
        players={mockPlayers}
        selectedIds={[]}
        excludedIds={['p2']}
        onSelect={handleSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    const excludedOption = screen.getByRole('option', { name: /георги георгиев/i });
    expect(excludedOption).toBeDisabled();
    expect(excludedOption).toHaveTextContent(/в другия отбор/i);

    await user.click(excludedOption);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('disables already selected players (selectedIds) and prevents duplicate selection', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <PlayerCombobox
        players={mockPlayers}
        selectedIds={['p1']}
        excludedIds={[]}
        onSelect={handleSelect}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    const selectedOption = screen.getByRole('option', { name: /иван иванов/i });
    expect(selectedOption).toBeDisabled();
    expect(selectedOption).toHaveTextContent(/избран/i);

    await user.click(selectedOption);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('closes dropdown when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <PlayerCombobox
        players={mockPlayers}
        selectedIds={[]}
        excludedIds={[]}
        onSelect={vi.fn()}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
