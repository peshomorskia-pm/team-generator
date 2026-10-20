import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlayoffFinalistsSelector } from '../PlayoffFinalistsSelector';

describe('PlayoffFinalistsSelector Component', () => {
  it('renders available options for 2 groups and 4 teams (2 and 4 finalists)', () => {
    const handleChange = vi.fn();
    render(
      <PlayoffFinalistsSelector
        groupCount={2}
        totalTeams={4}
        selectedCount={4}
        onChange={handleChange}
      />
    );

    expect(screen.getByText('Формат на елиминациите')).toBeInTheDocument();
    expect(screen.getByTestId('finalists-option-2')).toBeInTheDocument();
    expect(screen.getByTestId('finalists-option-4')).toBeInTheDocument();
    expect(screen.queryByTestId('finalists-option-8')).not.toBeInTheDocument();

    const opt4 = screen.getByTestId('finalists-option-4');
    expect(opt4).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange when clicking an unselected option', () => {
    const handleChange = vi.fn();
    render(
      <PlayoffFinalistsSelector
        groupCount={4}
        totalTeams={8}
        selectedCount={4}
        onChange={handleChange}
      />
    );

    const opt8 = screen.getByTestId('finalists-option-8');
    fireEvent.click(opt8);
    expect(handleChange).toHaveBeenCalledWith(8);
  });

  it('renders nothing when totalTeams < 2 or no available options', () => {
    const { container } = render(
      <PlayoffFinalistsSelector
        groupCount={1}
        totalTeams={1}
        selectedCount={2}
        onChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('respects disabled prop on buttons', () => {
    render(
      <PlayoffFinalistsSelector
        groupCount={2}
        totalTeams={4}
        selectedCount={4}
        onChange={vi.fn()}
        disabled={true}
      />
    );

    const btn = screen.getByTestId('finalists-option-2');
    expect(btn).toBeDisabled();
  });
});
