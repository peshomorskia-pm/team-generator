import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TournamentScoreModal } from '../TournamentScoreModal';
import type { MatchDetail } from '../../../types/matches';

describe('TournamentScoreModal Component', () => {
  const sampleMatch: MatchDetail = {
    id: 'm-tournament-1',
    team_1_score: null,
    team_2_score: null,
    played_at: '2026-10-16T12:00:00.000Z',
    team_1_name: 'Отбор Тигри',
    team_2_name: 'Отбор Лъвове',
    group_name: 'Група А',
    round: 1,
    tournament_id: 't-100',
    created_at: '2026-10-16T12:00:00.000Z',
    updated_at: '2026-10-16T12:00:00.000Z',
    match_players: [
      {
        id: 'mp-1',
        match_id: 'm-tournament-1',
        player_id: 'p-1',
        guest_name: null,
        team_side: 'team_1',
        rating_before: 1200,
        rating_after: null,
        players: { id: 'p-1', name: 'Григор Димитров' },
      },
      {
        id: 'mp-2',
        match_id: 'm-tournament-1',
        player_id: null,
        guest_name: 'Новак Джокович',
        team_side: 'team_2',
        rating_before: null,
        rating_after: null,
        players: null,
      },
    ],
  };

  it('renders Set 1 input fields with Team 1 and Team 2 names, badges, and no date picker', () => {
    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={vi.fn()}
        match={sampleMatch}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Въвеждане на резултат')).toBeInTheDocument();
    expect(screen.getByText('Отбор Тигри')).toBeInTheDocument();
    expect(screen.getByText('Отбор Лъвове')).toBeInTheDocument();
    expect(screen.getByText('Григор Димитров')).toBeInTheDocument();
    expect(screen.getByText('Новак Джокович')).toBeInTheDocument();
    expect(screen.getByText('(гост)')).toBeInTheDocument();
    expect(screen.getByText('Група А')).toBeInTheDocument();
    expect(screen.getByText('Кръг 1')).toBeInTheDocument();
    expect(screen.getByText('Сет 1')).toBeInTheDocument();

    // Verify there is no date picker or format picker
    expect(screen.queryByLabelText(/дата/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/поединично/i)).not.toBeInTheDocument();
  });

  it('progressively adds Set 2 and Set 3 (deciding tiebreak when 1-1)', async () => {
    const user = userEvent.setup();
    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={vi.fn()}
        match={sampleMatch}
        onSave={vi.fn()}
      />
    );

    const addSet2Button = screen.getByText('+ Добави сет (2 от 3)');
    expect(addSet2Button).toBeInTheDocument();
    await user.click(addSet2Button);

    expect(screen.getByText('Сет 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Премахни Сет 2')).toBeInTheDocument();

    // Fill Set 1: 6 : 4
    const set1Team1 = screen.getByLabelText('Сет 1 Отбор 1');
    const set1Team2 = screen.getByLabelText('Сет 1 Отбор 2');
    await user.type(set1Team1, '6');
    await user.type(set1Team2, '4');

    // Fill Set 2: 4 : 6 (Sets are tied 1-1)
    const set2Team1 = screen.getByLabelText('Сет 2 Отбор 1');
    const set2Team2 = screen.getByLabelText('Сет 2 Отбор 2');
    await user.type(set2Team1, '4');
    await user.type(set2Team2, '6');

    // Now Set 3 deciding tiebreak button should appear
    const addSet3Button = await screen.findByText('+ Добави решителен тайбрек (Сет 3)');
    expect(addSet3Button).toBeInTheDocument();

    await user.click(addSet3Button);
    expect(screen.getByText('Сет 3 (Тайбрек)')).toBeInTheDocument();
    expect(screen.getByLabelText('Премахни Сет 3')).toBeInTheDocument();
  });

  it('does not display Set 3 button when a team leads 2-0', async () => {
    const user = userEvent.setup();
    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={vi.fn()}
        match={sampleMatch}
        onSave={vi.fn()}
      />
    );

    await user.click(screen.getByText('+ Добави сет (2 от 3)'));

    const set1Team1 = screen.getByLabelText('Сет 1 Отбор 1');
    const set1Team2 = screen.getByLabelText('Сет 1 Отбор 2');
    await user.type(set1Team1, '6');
    await user.type(set1Team2, '2');

    const set2Team1 = screen.getByLabelText('Сет 2 Отбор 1');
    const set2Team2 = screen.getByLabelText('Сет 2 Отбор 2');
    await user.type(set2Team1, '6');
    await user.type(set2Team2, '3');

    // Set 3 button should NOT be in the document
    expect(
      screen.queryByText('+ Добави решителен тайбрек (Сет 3)')
    ).not.toBeInTheDocument();
  });

  it('removes Set 2 when clicking remove button', async () => {
    const user = userEvent.setup();
    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={vi.fn()}
        match={sampleMatch}
        onSave={vi.fn()}
      />
    );

    await user.click(screen.getByText('+ Добави сет (2 от 3)'));
    expect(screen.getByText('Сет 2')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Премахни Сет 2'));
    expect(screen.queryByText('Сет 2')).not.toBeInTheDocument();
    expect(screen.getByText('+ Добави сет (2 от 3)')).toBeInTheDocument();
  });

  it('shows error validation when a set is tied (e.g. 6:6)', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={vi.fn()}
        match={sampleMatch}
        onSave={handleSave}
      />
    );

    const set1Team1 = screen.getByLabelText('Сет 1 Отбор 1');
    const set1Team2 = screen.getByLabelText('Сет 1 Отбор 2');
    await user.type(set1Team1, '6');
    await user.type(set1Team2, '6');

    await user.click(screen.getByText('💾 Запази резултат'));

    expect(
      screen.getAllByText('Сетовете не могат да завършват наравно.').length
    ).toBeGreaterThanOrEqual(1);
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('shows error validation when 1-1 tie in 2 sets is saved without deciding set', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={vi.fn()}
        match={sampleMatch}
        onSave={handleSave}
      />
    );

    await user.click(screen.getByText('+ Добави сет (2 от 3)'));

    const set1Team1 = screen.getByLabelText('Сет 1 Отбор 1');
    const set1Team2 = screen.getByLabelText('Сет 1 Отбор 2');
    await user.type(set1Team1, '6');
    await user.type(set1Team2, '4');

    const set2Team1 = screen.getByLabelText('Сет 2 Отбор 1');
    const set2Team2 = screen.getByLabelText('Сет 2 Отбор 2');
    await user.type(set2Team1, '3');
    await user.type(set2Team2, '6');

    await user.click(screen.getByText('💾 Запази резултат'));

    expect(
      screen.getByText('При резултат 1-1 в сетовете е необходим трети решителен сет.')
    ).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('submits single-set score with games as final scores', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={handleClose}
        match={sampleMatch}
        onSave={handleSave}
      />
    );

    const set1Team1 = screen.getByLabelText('Сет 1 Отбор 1');
    const set1Team2 = screen.getByLabelText('Сет 1 Отбор 2');
    await user.type(set1Team1, '6');
    await user.type(set1Team2, '3');

    await user.click(screen.getByText('💾 Запази резултат'));

    expect(handleSave).toHaveBeenCalledWith(
      'm-tournament-1',
      [{ set_number: 1, team_1_score: 6, team_2_score: 3 }],
      6,
      3
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('submits multi-set score with sets won as final scores', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={handleClose}
        match={sampleMatch}
        onSave={handleSave}
      />
    );

    await user.click(screen.getByText('+ Добави сет (2 от 3)'));

    const set1Team1 = screen.getByLabelText('Сет 1 Отбор 1');
    const set1Team2 = screen.getByLabelText('Сет 1 Отбор 2');
    await user.type(set1Team1, '6');
    await user.type(set1Team2, '4');

    const set2Team1 = screen.getByLabelText('Сет 2 Отбор 1');
    const set2Team2 = screen.getByLabelText('Сет 2 Отбор 2');
    await user.type(set2Team1, '6');
    await user.type(set2Team2, '3');

    await user.click(screen.getByText('💾 Запази резултат'));

    expect(handleSave).toHaveBeenCalledWith(
      'm-tournament-1',
      [
        { set_number: 1, team_1_score: 6, team_2_score: 4 },
        { set_number: 2, team_1_score: 6, team_2_score: 3 },
      ],
      2,
      0
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('submits null scores when all inputs are empty (clearing match score)', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={handleClose}
        match={sampleMatch}
        onSave={handleSave}
      />
    );

    // Click save directly without typing anything
    await user.click(screen.getByText('💾 Запази резултат'));

    expect(handleSave).toHaveBeenCalledWith('m-tournament-1', null, null, null);
    expect(handleClose).toHaveBeenCalled();
  });

  it('populates scores using 1-tap preset chips across sets and submits valid 3-set match', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={handleClose}
        match={sampleMatch}
        onSave={handleSave}
      />
    );

    // Set 1: click preset 6:3
    const preset63 = screen.getByRole('button', { name: '6:3' });
    await user.click(preset63);

    const set1Team1 = screen.getByLabelText('Сет 1 Отбор 1');
    const set1Team2 = screen.getByLabelText('Сет 1 Отбор 2');
    expect(set1Team1).toHaveValue('6');
    expect(set1Team2).toHaveValue('3');

    // Add Set 2
    await user.click(screen.getByText('+ Добави сет (2 от 3)'));

    // Set 2: click preset 3:6
    const preset36 = screen.getAllByRole('button', { name: '3:6' })[1];
    await user.click(preset36);

    const set2Team1 = screen.getByLabelText('Сет 2 Отбор 1');
    const set2Team2 = screen.getByLabelText('Сет 2 Отбор 2');
    expect(set2Team1).toHaveValue('3');
    expect(set2Team2).toHaveValue('6');

    // Deciding set button should appear
    const addSet3Button = await screen.findByText('+ Добави решителен тайбрек (Сет 3)');
    expect(addSet3Button).toBeInTheDocument();
    await user.click(addSet3Button);

    // Set 3: type into numeric inputs
    const set3Team1 = screen.getByLabelText('Сет 3 Отбор 1');
    const set3Team2 = screen.getByLabelText('Сет 3 Отбор 2');
    await user.type(set3Team1, '10');
    await user.type(set3Team2, '7');
    expect(set3Team1).toHaveValue('10');
    expect(set3Team2).toHaveValue('7');

    // Submit
    await user.click(screen.getByText('💾 Запази резултат'));

    expect(handleSave).toHaveBeenCalledWith(
      'm-tournament-1',
      [
        { set_number: 1, team_1_score: 6, team_2_score: 3 },
        { set_number: 2, team_1_score: 3, team_2_score: 6 },
        { set_number: 3, team_1_score: 10, team_2_score: 7 },
      ],
      2,
      1
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('types Set 3 super tiebreak score directly into clean numeric inputs', async () => {
    const user = userEvent.setup();

    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={vi.fn()}
        match={sampleMatch}
        onSave={vi.fn()}
      />
    );

    // Set 1: 6:4
    await user.click(screen.getByRole('button', { name: '6:4' }));

    // Add Set 2: 4:6
    await user.click(screen.getByText('+ Добави сет (2 от 3)'));
    const preset46 = screen.getAllByRole('button', { name: '4:6' })[1];
    await user.click(preset46);

    // Add Set 3
    await user.click(screen.getByText('+ Добави решителен тайбрек (Сет 3)'));

    const set3Team1 = screen.getByLabelText('Сет 3 Отбор 1');
    const set3Team2 = screen.getByLabelText('Сет 3 Отбор 2');
    expect(set3Team1).toHaveValue('');
    expect(set3Team2).toHaveValue('');

    // Type directly
    await user.type(set3Team1, '10');
    await user.type(set3Team2, '8');
    expect(set3Team1).toHaveValue('10');
    expect(set3Team2).toHaveValue('8');

    // Confirm steppers are NOT in document
    expect(screen.queryByLabelText(/намали/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/увеличи/i)).not.toBeInTheDocument();
  });

  it('rejects corrupt scores (7:56) and shows error banner without saving', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <TournamentScoreModal
        isOpen={true}
        onClose={vi.fn()}
        match={sampleMatch}
        onSave={handleSave}
      />
    );

    const set1Team1 = screen.getByLabelText('Сет 1 Отбор 1');
    const set1Team2 = screen.getByLabelText('Сет 1 Отбор 2');

    await user.type(set1Team1, '7');
    await user.type(set1Team2, '56');

    // Live validation error should already be shown
    expect(
      screen.getByText('Невалиден сет: сетовете се играят до 6 гейма с 2 разлика, 7:5 или 7:6 при тайбрек.')
    ).toBeInTheDocument();

    await user.click(screen.getByText('💾 Запази резултат'));

    // Top error banner also displays it
    expect(handleSave).not.toHaveBeenCalled();
  });
});
