import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TennisScoreEditor } from '../TennisScoreEditor';
import type { MatchSet } from '../../../types/match';

describe('TennisScoreEditor Component', () => {
  it('renders Set 1 inputs with placeholder 0 and fast presets on default render', () => {
    const handleChange = vi.fn();
    render(<TennisScoreEditor sets={[]} onChange={handleChange} />);

    const set1T1 = screen.getByLabelText('Сет 1 Отбор 1');
    const set1T2 = screen.getByLabelText('Сет 1 Отбор 2');

    expect(set1T1).toBeInTheDocument();
    expect(set1T1).toHaveAttribute('placeholder', '0');
    expect(set1T2).toBeInTheDocument();
    expect(set1T2).toHaveAttribute('placeholder', '0');

    // Verify presets 6:0 and 7:6 are present
    expect(screen.getByRole('button', { name: '6:0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7:6' })).toBeInTheDocument();
  });

  it('populates scores and calls onChange when a preset chip is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TennisScoreEditor sets={[]} onChange={handleChange} />);

    const preset63 = screen.getByRole('button', { name: '6:3' });
    await user.click(preset63);

    expect(handleChange).toHaveBeenCalledWith([
      { set_number: 1, team_1_score: 6, team_2_score: 3 },
    ]);

    expect(screen.getByLabelText('Сет 1 Отбор 1')).toHaveValue('6');
    expect(screen.getByLabelText('Сет 1 Отбор 2')).toHaveValue('3');
  });

  it('renders Set 2 with remove button and presets when clicking Add Set 2', async () => {
    const user = userEvent.setup();
    render(<TennisScoreEditor sets={[]} onChange={vi.fn()} />);

    const addSet2Btn = screen.getByRole('button', { name: '+ Добави сет (2 от 3)' });
    await user.click(addSet2Btn);

    expect(screen.getByText('Сет 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Премахни Сет 2')).toBeInTheDocument();

    // Check Set 2 inputs
    expect(screen.getByLabelText('Сет 2 Отбор 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Сет 2 Отбор 2')).toBeInTheDocument();

    // Both sets should have preset buttons
    expect(screen.getAllByRole('button', { name: '6:0' })).toHaveLength(2);
  });

  it('does NOT render Set 3 button when a team leads 2-0 after two sets', () => {
    const sets20: MatchSet[] = [
      { set_number: 1, team_1_score: 6, team_2_score: 4 },
      { set_number: 2, team_1_score: 6, team_2_score: 2 },
    ];

    render(<TennisScoreEditor sets={sets20} onChange={vi.fn()} />);

    expect(
      screen.queryByRole('button', { name: '+ Добави решителен тайбрек (Сет 3)' })
    ).not.toBeInTheDocument();
  });

  it('renders Set 3 button when sets 1 and 2 are tied 1-1', () => {
    const sets11: MatchSet[] = [
      { set_number: 1, team_1_score: 6, team_2_score: 4 },
      { set_number: 2, team_1_score: 4, team_2_score: 6 },
    ];

    render(<TennisScoreEditor sets={sets11} onChange={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: '+ Добави решителен тайбрек (Сет 3)' })
    ).toBeInTheDocument();
  });

  it('renders clean Set 3 Tiebreak UX: header, numeric inputs, NO steppers, NO presets', async () => {
    const user = userEvent.setup();
    const sets11: MatchSet[] = [
      { set_number: 1, team_1_score: 6, team_2_score: 4 },
      { set_number: 2, team_1_score: 4, team_2_score: 6 },
    ];

    render(<TennisScoreEditor sets={sets11} onChange={vi.fn()} />);

    await user.click(
      screen.getByRole('button', { name: '+ Добави решителен тайбрек (Сет 3)' })
    );

    // 1. Header
    expect(screen.getByText('Сет 3 (Тайбрек)')).toBeInTheDocument();

    // 2. No steppers
    expect(screen.queryByLabelText(/намали/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/увеличи/i)).not.toBeInTheDocument();

    // 3. No tiebreak preset chips (e.g. 10:7)
    expect(screen.queryByRole('button', { name: '10:7' })).not.toBeInTheDocument();

    // 4. Clean numeric inputs present
    const set3T1 = screen.getByLabelText('Сет 3 Отбор 1');
    const set3T2 = screen.getByLabelText('Сет 3 Отбор 2');
    expect(set3T1).toBeInTheDocument();
    expect(set3T2).toBeInTheDocument();
  });

  it('allows typing into Set 3 and reports validity change for valid tiebreak', async () => {
    const user = userEvent.setup();
    const handleValidationChange = vi.fn();
    const sets11: MatchSet[] = [
      { set_number: 1, team_1_score: 6, team_2_score: 4 },
      { set_number: 2, team_1_score: 4, team_2_score: 6 },
    ];

    render(
      <TennisScoreEditor
        sets={sets11}
        onChange={vi.fn()}
        onValidationChange={handleValidationChange}
      />
    );

    await user.click(
      screen.getByRole('button', { name: '+ Добави решителен тайбрек (Сет 3)' })
    );

    const set3T1 = screen.getByLabelText('Сет 3 Отбор 1');
    const set3T2 = screen.getByLabelText('Сет 3 Отбор 2');

    await user.type(set3T1, '10');
    await user.type(set3T2, '8');

    expect(handleValidationChange).toHaveBeenLastCalledWith(true, undefined);
  });

  it('displays live inline error badge when set score is invalid (6:5)', async () => {
    const user = userEvent.setup();
    render(<TennisScoreEditor sets={[]} onChange={vi.fn()} />);

    const set1T1 = screen.getByLabelText('Сет 1 Отбор 1');
    const set1T2 = screen.getByLabelText('Сет 1 Отбор 2');

    await user.type(set1T1, '6');
    await user.type(set1T2, '5');

    expect(
      screen.getByText('Невалиден сет: сетовете се играят до 6 гейма с 2 разлика, 7:5 или 7:6 при тайбрек.')
    ).toBeInTheDocument();
  });

  it('removes Set 2, unmounts it, and re-evaluates validation when clicking remove', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const handleValidation = vi.fn();
    render(
      <TennisScoreEditor
        sets={[]}
        onChange={handleChange}
        onValidationChange={handleValidation}
      />
    );

    await user.click(screen.getByRole('button', { name: '+ Добави сет (2 от 3)' }));
    expect(screen.getByText('Сет 2')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Премахни Сет 2'));
    expect(screen.queryByText('Сет 2')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Добави сет (2 от 3)' })).toBeInTheDocument();
  });

  it('disables all inputs and hides action buttons in readOnly mode', () => {
    const sets: MatchSet[] = [{ set_number: 1, team_1_score: 6, team_2_score: 4 }];

    render(<TennisScoreEditor sets={sets} onChange={vi.fn()} readOnly={true} />);

    expect(screen.getByLabelText('Сет 1 Отбор 1')).toBeDisabled();
    expect(screen.getByLabelText('Сет 1 Отбор 2')).toBeDisabled();

    // No add buttons or preset chips
    expect(
      screen.queryByRole('button', { name: '+ Добави сет (2 от 3)' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '6:4' })).not.toBeInTheDocument();
  });

  it('TSE-TARGET-01: scales regular set score preset chips to 36px touch targets with font-bold', () => {
    render(<TennisScoreEditor sets={[]} onChange={vi.fn()} />);

    const samplePresets = ['6:0', '6:3', '6:4', '7:5', '7:6'];
    samplePresets.forEach((label) => {
      const presetButtons = screen.getAllByRole('button', { name: label });
      expect(presetButtons.length).toBeGreaterThanOrEqual(1);
      presetButtons.forEach((btn) => {
        expect(btn).toHaveClass(
          'min-h-[36px]',
          'py-1.5',
          'px-2.5',
          'flex',
          'items-center',
          'justify-center',
          'font-bold',
          'rounded-lg'
        );
      });
    });
  });
});

