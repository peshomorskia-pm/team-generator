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
    team_1_score: 6,
    team_2_score: 4,
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
    expect(screen.getByLabelText('Сет 1 Отбор 1')).toHaveValue('');
    expect(screen.getByLabelText('Сет 1 Отбор 2')).toHaveValue('');
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
    expect(screen.getByLabelText('Сет 1 Отбор 1')).toHaveValue('6');
    expect(screen.getByLabelText('Сет 1 Отбор 2')).toHaveValue('4');
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
        sets: null,
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
    const score1 = screen.getByLabelText('Сет 1 Отбор 1');
    await user.type(score1, '2');

    await user.click(screen.getByRole('button', { name: /създай/i }));

    expect(
      screen.getByText('Моля, попълнете резултата за Сет 1.')
    ).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('rejects corrupt score (> 50, e.g. 7:56)', async () => {
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

    const scoreInput1 = screen.getByLabelText('Сет 1 Отбор 1');
    const scoreInput2 = screen.getByLabelText('Сет 1 Отбор 2');
    await user.clear(scoreInput1);
    await user.type(scoreInput1, '7');
    await user.clear(scoreInput2);
    await user.type(scoreInput2, '56');

    await user.click(screen.getByRole('button', { name: /запази/i }));

    expect(
      screen.getAllByText('Невалиден сет: сетовете се играят до 6 гейма с 2 разлика, 7:5 или 7:6 при тайбрек.').length
    ).toBeGreaterThanOrEqual(1);
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('rejects tied set score (e.g. 2:2)', async () => {
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

    const scoreInput1 = screen.getByLabelText('Сет 1 Отбор 1');
    const scoreInput2 = screen.getByLabelText('Сет 1 Отбор 2');
    await user.clear(scoreInput1);
    await user.type(scoreInput1, '2');
    await user.clear(scoreInput2);
    await user.type(scoreInput2, '2');

    await user.click(screen.getByRole('button', { name: /запази/i }));

    expect(
      screen.getAllByText('Сетовете не могат да завършват наравно.').length
    ).toBeGreaterThanOrEqual(1);
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('prevents submit when a team has no players in singles', async () => {
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
      screen.getByText('При мач поединично Отбор 1 трябва да има точно 1 играч.')
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

    expect(
      screen.getByRole('button', { name: /премахни димитър бербатов/i })
    ).toBeInTheDocument();
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

  it('allows adding guests and calls onSave with valid data and calculated scores', async () => {
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

    // Set scores via preset chip 6:3
    await user.click(screen.getByRole('button', { name: '6:3' }));

    // Submit
    await user.click(screen.getByRole('button', { name: /създай/i }));

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        team_1_score: 6,
        team_2_score: 3,
        sets: [{ set_number: 1, team_1_score: 6, team_2_score: 3 }],
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

  describe('Roster Capacity Enforcement & Locking Status Pill', () => {
    it('Singles: locks Team 1 with "Пълен състав (1/1)" pill and hides combobox when 1 player added', async () => {
      const user = userEvent.setup();
      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          availablePlayers={availablePlayers}
        />
      );

      // In singles, combobox & guest input visible initially
      expect(screen.getByLabelText('Избери играч за Отбор 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Име на гост за Отбор 1')).toBeInTheDocument();

      // Add 1 player
      await user.click(screen.getByLabelText('Избери играч за Отбор 1'));
      await user.click(screen.getByRole('option', { name: /христо стоичков/i }));

      // Combobox & guest input hidden
      expect(screen.queryByLabelText('Избери играч за Отбор 1')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Име на гост за Отбор 1')).not.toBeInTheDocument();

      // Lock status pill displayed
      expect(screen.getByText('Пълен състав (1/1)')).toBeInTheDocument();
    });

    it('Singles: removing a player restores combobox and guest input', async () => {
      const user = userEvent.setup();
      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          availablePlayers={availablePlayers}
        />
      );

      // Add 1 player
      await user.click(screen.getByLabelText('Избери играч за Отбор 1'));
      await user.click(screen.getByRole('option', { name: /христо стоичков/i }));

      expect(screen.getByText('Пълен състав (1/1)')).toBeInTheDocument();

      // Remove player
      await user.click(screen.getByLabelText('Премахни Христо Стоичков'));

      // Pill removed, inputs restored
      expect(screen.queryByText('Пълен състав (1/1)')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Избери играч за Отбор 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Име на гост за Отбор 1')).toBeInTheDocument();
    });

    it('Doubles: locks Team 2 with "Пълен състав (2/2)" pill after 2 players added', async () => {
      const user = userEvent.setup();
      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          availablePlayers={availablePlayers}
          initialFormat="doubles"
        />
      );

      // Add 1st player to Team 2
      const comboboxT2 = screen.getByRole('combobox', { name: 'Избери играч за Отбор 2' });
      await user.click(comboboxT2);
      await user.click(screen.getByRole('option', { name: /димитър бербатов/i }));

      // Not full yet (1/2)
      expect(screen.getByRole('combobox', { name: 'Избери играч за Отбор 2' })).toBeInTheDocument();
      expect(screen.queryByText('Пълен състав (2/2)')).not.toBeInTheDocument();

      // Add 2nd player to Team 2 via guest
      const guestT2 = screen.getByLabelText('Име на гост за Отбор 2');
      await user.type(guestT2, 'Гост Тест');
      await user.click(screen.getByLabelText('Добави гост към Отбор 2'));

      // Now full
      expect(screen.queryByRole('combobox', { name: 'Избери играч за Отбор 2' })).not.toBeInTheDocument();
      expect(screen.getByText('Пълен състав (2/2)')).toBeInTheDocument();
    });

    it('Doubles submit error: rejects when team has fewer than 2 players', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn();

      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={handleSave}
          availablePlayers={availablePlayers}
          initialFormat="doubles"
        />
      );

      // Team 1 has 2 players
      const comboboxT1 = screen.getByRole('combobox', { name: 'Избери играч за Отбор 1' });
      await user.click(comboboxT1);
      await user.click(screen.getByRole('option', { name: /христо стоичков/i }));
      await user.click(screen.getByRole('option', { name: /красимир балъков/i }));

      // Team 2 has only 1 player
      const comboboxT2 = screen.getByRole('combobox', { name: 'Избери играч за Отбор 2' });
      await user.click(comboboxT2);
      await user.click(screen.getByRole('option', { name: /димитър бербатов/i }));

      await user.click(screen.getByRole('button', { name: /създай/i }));

      expect(
        screen.getByText('При мач по двойки Отбор 2 трябва да има точно 2 играчи.')
      ).toBeInTheDocument();
      expect(handleSave).not.toHaveBeenCalled();
    });
  });

  describe('Prefill from Generator Integration', () => {
    const initialTeam1 = [
      { player_id: 'p-1', name: 'Христо Стоичков' },
      { guest_name: 'Гост Георги', name: 'Гост Георги' },
    ];
    const initialTeam2 = [
      { player_id: 'p-2', name: 'Димитър Бербатов' },
      { guest_name: 'Гост Мартин', name: 'Гост Мартин' },
    ];

    it('Scenario 1 (Prefill): renders prefilled participants for both teams in Create mode without a match prop', () => {
      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          availablePlayers={availablePlayers}
          initialTeam1={initialTeam1}
          initialTeam2={initialTeam2}
        />
      );

      // Verify header is "Нов мач"
      expect(screen.getByRole('heading', { name: 'Нов мач' })).toBeInTheDocument();

      // Team 1 participants
      expect(screen.getByText('Христо Стоичков')).toBeInTheDocument();
      expect(screen.getByText('Гост Георги')).toBeInTheDocument();

      // Team 2 participants
      expect(screen.getByText('Димитър Бербатов')).toBeInTheDocument();
      expect(screen.getByText('Гост Мартин')).toBeInTheDocument();

      // Guest tags
      const guestBadges = screen.getAllByText('(гост)');
      expect(guestBadges).toHaveLength(2);

      // Participant counts in team headers (both teams have 2 players)
      expect(screen.getAllByText('(2 играчи)')).toHaveLength(2);
    });

    it('Scenario 2 (Date/Score): defaults date to today and leaves scores empty when prefilled in Create mode', () => {
      const now = new Date();
      const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          availablePlayers={availablePlayers}
          initialTeam1={initialTeam1}
          initialTeam2={initialTeam2}
        />
      );

      const dateInput = screen.getByLabelText('Дата на мача') as HTMLInputElement;
      expect(dateInput.value).toBe(todayFormatted);

      expect(screen.getByLabelText('Сет 1 Отбор 1')).toHaveValue('');
      expect(screen.getByLabelText('Сет 1 Отбор 2')).toHaveValue('');
    });

    it('Scenario 3 (Stage 5 Validation): displays warning banner and prevents submitting Singles format with 2 players per team', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn();

      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={handleSave}
          availablePlayers={availablePlayers}
          initialTeam1={initialTeam1} // 2 players
          initialTeam2={initialTeam2} // 2 players
        />
      );

      // Explicitly switch to Singles
      const singlesBtn = screen.getByRole('button', { name: /поединично/i });
      await user.click(singlesBtn);

      // Warning banner displayed
      expect(
        screen.getByText('Внимание: За поединичен мач е необходим по 1 играч на отбор.')
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /създай/i }));

      expect(
        screen.getByText('При мач поединично Отбор 1 трябва да има точно 1 играч.')
      ).toBeInTheDocument();
      expect(handleSave).not.toHaveBeenCalled();
    });

    it('Scenario 4 (Stage 5 Validation): prevents submitting Doubles format with 1 player per team', async () => {
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

      // Switch to Doubles
      const doublesBtn = screen.getByRole('button', { name: /по двойки/i });
      await user.click(doublesBtn);

      // Add only 1 player to team 1 and 1 player to team 2
      const comboboxT1 = screen.getByLabelText('Избери играч за Отбор 1');
      await user.click(comboboxT1);
      await user.click(screen.getByRole('option', { name: /христо стоичков/i }));

      const comboboxT2 = screen.getByLabelText('Избери играч за Отбор 2');
      await user.click(comboboxT2);
      await user.click(screen.getByRole('option', { name: /димитър бербатов/i }));

      await user.click(screen.getByRole('button', { name: /създай/i }));

      expect(
        screen.getByText('При мач по двойки Отбор 1 трябва да има точно 2 играчи.')
      ).toBeInTheDocument();
      expect(handleSave).not.toHaveBeenCalled();
    });

    it('Scenario 5 (Stage 5 Auto-detection): auto-selects Doubles when initialized with 2 players per team', () => {
      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          availablePlayers={availablePlayers}
          initialTeam1={initialTeam1} // 2 players
          initialTeam2={initialTeam2} // 2 players
        />
      );

      const doublesBtn = screen.getByRole('button', { name: /по двойки/i });
      expect(doublesBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('automatically maps legacy match with 2v2 labeled as singles to doubles when opening edit modal', () => {
      const legacySingles2v2Match: MatchDetail = {
        id: 'legacy-m1',
        match_format: 'singles', // mislabeled legacy
        team_1_score: 6,
        team_2_score: 4,
        played_at: '2026-10-02T15:00:00.000Z',
        created_at: '2026-10-02T15:00:00.000Z',
        updated_at: '2026-10-02T15:00:00.000Z',
        match_players: [
          {
            id: 'mp-1',
            match_id: 'legacy-m1',
            player_id: 'p-1',
            guest_name: null,
            team_side: 'team_1',
            rating_before: 1200,
            rating_after: 1215,
            players: { id: 'p-1', name: 'Христо Стоичков' },
          },
          {
            id: 'mp-2',
            match_id: 'legacy-m1',
            player_id: 'p-2',
            guest_name: null,
            team_side: 'team_1',
            rating_before: 1200,
            rating_after: 1215,
            players: { id: 'p-2', name: 'Димитър Бербатов' },
          },
          {
            id: 'mp-3',
            match_id: 'legacy-m1',
            player_id: 'p-3',
            guest_name: null,
            team_side: 'team_2',
            rating_before: 1200,
            rating_after: 1185,
            players: { id: 'p-3', name: 'Красимир Балъков' },
          },
          {
            id: 'mp-4',
            match_id: 'legacy-m1',
            player_id: null,
            guest_name: 'Гост Играч',
            team_side: 'team_2',
            rating_before: null,
            rating_after: null,
            players: null,
          },
        ],
      };

      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          match={legacySingles2v2Match}
          availablePlayers={availablePlayers}
        />
      );

      const doublesBtn = screen.getByRole('button', { name: /по двойки/i });
      expect(doublesBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('initializes format toggle to doubles when initialFormat="doubles" is provided', () => {
      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          initialFormat="doubles"
        />
      );

      const singlesBtn = screen.getByRole('button', { name: /поединично/i });
      const doublesBtn = screen.getByRole('button', { name: /по двойки/i });

      expect(doublesBtn).toHaveAttribute('aria-pressed', 'true');
      expect(singlesBtn).toHaveAttribute('aria-pressed', 'false');
    });

    it('initializes format toggle to singles when initialFormat="singles" is provided', () => {
      render(
        <MatchModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          initialFormat="singles"
        />
      );

      const singlesBtn = screen.getByRole('button', { name: /поединично/i });
      const doublesBtn = screen.getByRole('button', { name: /по двойки/i });

      expect(singlesBtn).toHaveAttribute('aria-pressed', 'true');
      expect(doublesBtn).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
