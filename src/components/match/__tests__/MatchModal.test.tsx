import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatchModal } from '../MatchModal';
import type { PlayerRow } from '../../../types/database.types';
import type { MatchDetail } from '../../../types/matches';

describe('MatchModal Component', () => {
  const availablePlayers: PlayerRow[] = [
    {
      id: 'p-1',
      name: 'Христо Стоичков',
      rating: 1950,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p-2',
      name: 'Димитър Бербатов',
      rating: 1900,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p-3',
      name: 'Красимир Балъков',
      rating: 1700,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  const sampleMatch: MatchDetail = {
    id: 'm-1',
    team_1_score: 3,
    team_2_score: 1,
    played_at: '2026-10-02T15:00:00.000Z',
    created_at: '2026-10-02T15:00:00.000Z',
    updated_at: '2026-10-02T15:00:00.000Z',
    match_players: [
      {
        id: 'mp-1',
        match_id: 'm-1',
        player_id: 'p-1',
        guest_name: null,
        team_side: 'team_1',
        rating_before: 1950,
        rating_after: 1960,
        players: { id: 'p-1', name: 'Христо Стоичков' },
      },
      {
        id: 'mp-2',
        match_id: 'm-1',
        player_id: 'p-2',
        guest_name: null,
        team_side: 'team_2',
        rating_before: 1900,
        rating_after: 1890,
        players: { id: 'p-2', name: 'Димитър Бербатов' },
      },
    ],
  };

  it('does not render when isOpen is false', () => {
    render(
      <MatchModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders empty form with empty scores in Create mode', () => {
    render(
      <MatchModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        availablePlayers={availablePlayers}
      />
    );

    expect(screen.getByRole('heading', { name: 'Нов мач' })).toBeInTheDocument();
    // In Create mode, score inputs start empty ('')
    expect(screen.getByLabelText('Резултат Отбор 1')).toHaveValue(null);
    expect(screen.getByLabelText('Резултат Отбор 2')).toHaveValue(null);
    expect(screen.getByRole('button', { name: /създай/i })).toBeInTheDocument();
  });

  it('renders prefilled form in Edit mode with existing scores', () => {
    render(
      <MatchModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        match={sampleMatch}
        availablePlayers={availablePlayers}
      />
    );

    expect(screen.getByRole('heading', { name: 'Редактиране на мач' })).toBeInTheDocument();
    expect(screen.getByLabelText('Резултат Отбор 1')).toHaveValue(3);
    expect(screen.getByLabelText('Резултат Отбор 2')).toHaveValue(1);
    expect(screen.getAllByText('Христо Стоичков').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Димитър Бербатов').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /запази/i })).toBeInTheDocument();
  });

  it('allows future/today matches to be saved without scores (null scores)', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <MatchModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        availablePlayers={availablePlayers}
      />
    );

    // Set a future date
    const dateInput = screen.getByLabelText('Дата на мача');
    await user.clear(dateInput);
    await user.type(dateInput, '2099-12-31');

    // Add Player 1 to Team 1 via Combobox
    const comboboxT1 = screen.getByLabelText('Избери играч за Отбор 1');
    await user.click(comboboxT1);
    const optionT1 = screen.getByRole('option', { name: /христо стоичков/i });
    await user.click(optionT1);

    // Add Player 2 to Team 2 via Combobox
    const comboboxT2 = screen.getByLabelText('Избери играч за Отбор 2');
    await user.click(comboboxT2);
    const optionT2 = screen.getByRole('option', { name: /димитър бербатов/i });
    await user.click(optionT2);

    // Submit with empty scores
    await user.click(screen.getByRole('button', { name: /създай/i }));

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        team_1_score: null,
        team_2_score: null,
        team_1_players: [{ player_id: 'p-1', guest_name: undefined }],
        team_2_players: [{ player_id: 'p-2', guest_name: undefined }],
      })
    );
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('demands scores when match date is in the past', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <MatchModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        availablePlayers={availablePlayers}
      />
    );

    // Set past date
    const dateInput = screen.getByLabelText('Дата на мача');
    await user.clear(dateInput);
    await user.type(dateInput, '2020-01-01');

    // Add Player 1 to Team 1
    const comboboxT1 = screen.getByLabelText('Избери играч за Отбор 1');
    await user.click(comboboxT1);
    await user.click(screen.getByRole('option', { name: /христо стоичков/i }));

    // Add Player 2 to Team 2
    const comboboxT2 = screen.getByLabelText('Избери играч за Отбор 2');
    await user.click(comboboxT2);
    await user.click(screen.getByRole('option', { name: /димитър бербатов/i }));

    // Submit with empty scores
    await user.click(screen.getByRole('button', { name: /създай/i }));

    expect(
      screen.getByText('За минали мачове резултатът е задължителен.')
    ).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('prevents submit when only one score is filled for today/future date', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <MatchModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        availablePlayers={availablePlayers}
      />
    );

    const dateInput = screen.getByLabelText('Дата на мача');
    await user.clear(dateInput);
    await user.type(dateInput, '2099-12-31');

    // Add players
    const comboboxT1 = screen.getByLabelText('Избери играч за Отбор 1');
    await user.click(comboboxT1);
    await user.click(screen.getByRole('option', { name: /христо стоичков/i }));

    const comboboxT2 = screen.getByLabelText('Избери играч за Отбор 2');
    await user.click(comboboxT2);
    await user.click(screen.getByRole('option', { name: /димитър бербатов/i }));

    // Fill only score 1
    const score1 = screen.getByLabelText('Резултат Отбор 1');
    await user.type(score1, '2');

    await user.click(screen.getByRole('button', { name: /създай/i }));

    expect(
      screen.getByText('Моля, въведете резултат и за двата отбора или оставете полетата празни.')
    ).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('prevents submit when score is negative', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <MatchModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        match={sampleMatch}
        availablePlayers={availablePlayers}
      />
    );

    const scoreInput1 = screen.getByLabelText('Резултат Отбор 1');
    await user.clear(scoreInput1);
    await user.type(scoreInput1, '-1');

    await user.click(screen.getByRole('button', { name: /запази/i }));

    expect(
      screen.getByText('Резултатът трябва да бъде 0 или по-голям.')
    ).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('prevents submit when a team has no players', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <MatchModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        availablePlayers={availablePlayers}
      />
    );

    // Click submit without adding any players
    await user.click(screen.getByRole('button', { name: /създай/i }));

    expect(
      screen.getByText('Всеки отбор трябва да има поне един играч.')
    ).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('filters players on keystroke and adds player instantly from combobox', async () => {
    const user = userEvent.setup();

    render(
      <MatchModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        availablePlayers={availablePlayers}
      />
    );

    const comboboxT1 = screen.getByLabelText('Избери играч за Отбор 1');
    await user.type(comboboxT1, 'Берб');

    // Only Димитър Бербатов should match
    expect(screen.getByRole('option', { name: /димитър бербатов/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /христо стоичков/i })).not.toBeInTheDocument();

    // Clicking option instantly adds to Team 1
    await user.click(screen.getByRole('option', { name: /димитър бербатов/i }));

    expect(screen.getByText('Димитър Бербатов')).toBeInTheDocument();
  });

  it('enforces cross-team selection exclusion in player comboboxes', async () => {
    const user = userEvent.setup();

    render(
      <MatchModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        availablePlayers={availablePlayers}
      />
    );

    // Add Христо Стоичков to Team 1
    const comboboxT1 = screen.getByLabelText('Избери играч за Отбор 1');
    await user.click(comboboxT1);
    await user.click(screen.getByRole('option', { name: /христо стоичков/i }));

    // Now open Team 2 combobox
    const comboboxT2 = screen.getByLabelText('Избери играч за Отбор 2');
    await user.click(comboboxT2);

    // Option for Христо Стоичков should be disabled with "в другия отбор"
    const t2OptionStoichkov = screen.getByRole('option', { name: /христо стоичков/i });
    expect(t2OptionStoichkov).toBeDisabled();
    expect(t2OptionStoichkov).toHaveTextContent(/в другия отбор/i);
  });

  it('allows adding guests and calls onSave with valid data', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <MatchModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        availablePlayers={availablePlayers}
      />
    );

    // Add Player 1 to Team 1 via Combobox
    const comboboxT1 = screen.getByLabelText('Избери играч за Отбор 1');
    await user.click(comboboxT1);
    await user.click(screen.getByRole('option', { name: /христо стоичков/i }));

    // Add Guest to Team 2
    const guestInputT2 = screen.getByLabelText('Име на гост за Отбор 2');
    await user.type(guestInputT2, 'Гост Георги');
    await user.click(screen.getByLabelText('Добави гост към Отбор 2'));

    // Set scores
    const score1 = screen.getByLabelText('Резултат Отбор 1');
    await user.type(score1, '4');

    const score2 = screen.getByLabelText('Резултат Отбор 2');
    await user.type(score2, '2');

    // Submit
    await user.click(screen.getByRole('button', { name: /създай/i }));

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        team_1_score: 4,
        team_2_score: 2,
        team_1_players: [{ player_id: 'p-1', guest_name: undefined }],
        team_2_players: [{ player_id: undefined, guest_name: 'Гост Георги' }],
      })
    );
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on cancel button click or close icon', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <MatchModal
        isOpen={true}
        onClose={handleClose}
        onSave={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Отказ' }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByLabelText('Затвори'));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('closes on Escape key press when not submitting', () => {
    const handleClose = vi.fn();

    render(
      <MatchModal
        isOpen={true}
        onClose={handleClose}
        onSave={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
