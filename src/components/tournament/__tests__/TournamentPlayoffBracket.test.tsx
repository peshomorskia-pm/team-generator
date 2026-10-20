import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TournamentPlayoffBracket } from '../TournamentPlayoffBracket';
import type { Tournament } from '../../../types/tournament';
import type { MatchDetail } from '../../../types/matches';

describe('TournamentPlayoffBracket Component', () => {
  const dummyTournament: Tournament = {
    id: 't-1',
    title: 'Турнир София 2026',
    date: '2026-04-18',
    format: 'doubles',
    status: 'in_progress',
    winner_team_name: null,
    notes: null,
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
  };

  const completedGroupMatch: MatchDetail = {
    id: 'm-g-1',
    match_format: 'doubles',
    team_1_score: 6,
    team_2_score: 3,
    played_at: '2026-04-18T10:00:00Z',
    team_1_name: 'Отбор 1',
    team_2_name: 'Отбор 2',
    group_name: 'Група А',
    round: 1,
    tournament_id: 't-1',
    created_at: '2026-04-18T10:00:00Z',
    updated_at: '2026-04-18T10:00:00Z',
    match_players: [],
  };

  const unplayedGroupMatch: MatchDetail = {
    id: 'm-g-2',
    match_format: 'doubles',
    team_1_score: null,
    team_2_score: null,
    played_at: '2026-04-18T11:00:00Z',
    team_1_name: 'Отбор 3',
    team_2_name: 'Отбор 4',
    group_name: 'Група А',
    round: 1,
    tournament_id: 't-1',
    created_at: '2026-04-18T10:00:00Z',
    updated_at: '2026-04-18T10:00:00Z',
    match_players: [],
  };

  it('renders exactly one CTA generate button in empty state when playoffMatches is empty', () => {
    render(
      <TournamentPlayoffBracket
        tournament={dummyTournament}
        playoffMatches={[]}
        groupMatches={[completedGroupMatch]}
        onGeneratePlayoffs={vi.fn()}
        onEditMatchScore={vi.fn()}
      />
    );

    expect(
      screen.getByText('Елиминационната схема все още не е генерирана')
    ).toBeInTheDocument();

    // Assert exactly one generate button exists across the entire rendered component
    const generateButtons = screen.getAllByRole('button', { name: /генерирай елиминации/i });
    expect(generateButtons).toHaveLength(1);

    // Assert empty state CTA is present
    expect(screen.getByTestId('generate-playoffs-cta-btn')).toBeInTheDocument();

    // Assert duplicate header button is completely absent
    expect(screen.queryByTestId('generate-playoffs-btn')).not.toBeInTheDocument();
  });

  it('renders zero generate buttons when playoffMatches exist', () => {
    render(
      <TournamentPlayoffBracket
        tournament={dummyTournament}
        playoffMatches={[completedGroupMatch]}
        groupMatches={[completedGroupMatch]}
        onGeneratePlayoffs={vi.fn()}
        onEditMatchScore={vi.fn()}
      />
    );

    expect(screen.queryByTestId('generate-playoffs-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('generate-playoffs-cta-btn')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /генерирай елиминации/i })).not.toBeInTheDocument();
  });

  it('shows warning modal on generate click when group matches remain unplayed', () => {
    const handleGenerate = vi.fn();
    render(
      <TournamentPlayoffBracket
        tournament={dummyTournament}
        playoffMatches={[]}
        groupMatches={[completedGroupMatch, unplayedGroupMatch]}
        onGeneratePlayoffs={handleGenerate}
        onEditMatchScore={vi.fn()}
      />
    );

    const btn = screen.getByTestId('generate-playoffs-cta-btn');
    fireEvent.click(btn);

    expect(screen.getByTestId('playoff-warning-modal')).toBeInTheDocument();
    expect(
      screen.getByText('Внимание: Неизграни мачове')
    ).toBeInTheDocument();
    expect(handleGenerate).not.toHaveBeenCalled();

    const confirmBtn = screen.getByTestId('confirm-generate-playoffs-btn');
    fireEvent.click(confirmBtn);

    expect(handleGenerate).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('playoff-warning-modal')).not.toBeInTheDocument();
  });

  it('calls onGeneratePlayoffs immediately when all group matches are completed', () => {
    const handleGenerate = vi.fn();
    render(
      <TournamentPlayoffBracket
        tournament={dummyTournament}
        playoffMatches={[]}
        groupMatches={[completedGroupMatch]}
        onGeneratePlayoffs={handleGenerate}
        onEditMatchScore={vi.fn()}
      />
    );

    const btn = screen.getByTestId('generate-playoffs-cta-btn');
    fireEvent.click(btn);

    expect(handleGenerate).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('playoff-warning-modal')).not.toBeInTheDocument();
  });

  it('renders bracket columns and handles edit modal clicks on valid matches', () => {
    const handleEdit = vi.fn();
    const playoffMatches: MatchDetail[] = [
      {
        id: 'p-sf-1',
        match_format: 'doubles',
        team_1_score: 6,
        team_2_score: 2,
        played_at: '2026-04-18T13:00:00Z',
        team_1_name: 'Отбор Алфа',
        team_2_name: 'Отбор Бета',
        group_name: 'Полуфинал',
        round: 1,
        tournament_id: 't-1',
        created_at: '2026-04-18T10:00:00Z',
        updated_at: '2026-04-18T10:00:00Z',
        match_players: [],
      },
      {
        id: 'p-final',
        match_format: 'doubles',
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-04-18T15:00:00Z',
        team_1_name: 'Отбор Алфа',
        team_2_name: 'Победител от Полуфинал 2',
        group_name: 'Финал',
        round: 2,
        tournament_id: 't-1',
        created_at: '2026-04-18T10:00:00Z',
        updated_at: '2026-04-18T10:00:00Z',
        match_players: [],
      },
    ];

    render(
      <TournamentPlayoffBracket
        tournament={dummyTournament}
        playoffMatches={playoffMatches}
        groupMatches={[completedGroupMatch]}
        onGeneratePlayoffs={vi.fn()}
        onEditMatchScore={handleEdit}
      />
    );

    expect(screen.getByTestId('sf-column')).toBeInTheDocument();
    expect(screen.getByTestId('final-column')).toBeInTheDocument();

    // Clicking edit on non-placeholder match triggers onEditMatchScore
    const editBtns = screen.getAllByRole('button', { name: /редактирай/i });
    fireEvent.click(editBtns[0]);
    expect(handleEdit).toHaveBeenCalledWith(playoffMatches[0]);

    // Clicking edit on placeholder match (final match with 'Победител от...') does NOT trigger handleEdit
    handleEdit.mockClear();
    fireEvent.click(editBtns[1]);
    expect(handleEdit).not.toHaveBeenCalled();
  });

  it('renders celebratory Champion banner and complete button when Final is completed', () => {
    const handleComplete = vi.fn();
    const finalMatch: MatchDetail = {
      id: 'p-final',
      match_format: 'doubles',
      team_1_score: 6,
      team_2_score: 4,
      played_at: '2026-04-18T15:00:00Z',
      team_1_name: 'Отбор Шампиони',
      team_2_name: 'Отбор Финалисти',
      group_name: 'Финал',
      round: 2,
      tournament_id: 't-1',
      created_at: '2026-04-18T10:00:00Z',
      updated_at: '2026-04-18T10:00:00Z',
      match_players: [],
    };

    render(
      <TournamentPlayoffBracket
        tournament={dummyTournament}
        playoffMatches={[finalMatch]}
        groupMatches={[completedGroupMatch]}
        onGeneratePlayoffs={vi.fn()}
        onEditMatchScore={vi.fn()}
        onCompleteTournament={handleComplete}
      />
    );

    expect(screen.getByTestId('playoff-champion-banner')).toBeInTheDocument();
    expect(screen.getByText('🏆 Отбор Шампиони')).toBeInTheDocument();

    const completeBtn = screen.getByTestId('mark-tournament-completed-btn');
    fireEvent.click(completeBtn);
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });

  it('renders playoff matches with streamlined header badges (no format/round badges, trophy for final)', () => {
    const playoffMatches: MatchDetail[] = [
      {
        id: 'p-sf-1',
        match_format: 'doubles',
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-04-18T13:00:00Z',
        team_1_name: 'Отбор Алфа',
        team_2_name: 'Отбор Бета',
        group_name: 'Полуфинал',
        round: 1,
        tournament_id: 't-1',
        created_at: '2026-04-18T10:00:00Z',
        updated_at: '2026-04-18T10:00:00Z',
        match_players: [],
      },
      {
        id: 'p-final',
        match_format: 'doubles',
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-04-18T15:00:00Z',
        team_1_name: 'Победител от Полуфинал 1',
        team_2_name: 'Победител от Полуфинал 2',
        group_name: 'Финал',
        round: 2,
        tournament_id: 't-1',
        created_at: '2026-04-18T10:00:00Z',
        updated_at: '2026-04-18T10:00:00Z',
        match_players: [],
      },
    ];

    render(
      <TournamentPlayoffBracket
        tournament={dummyTournament}
        playoffMatches={playoffMatches}
        groupMatches={[completedGroupMatch]}
        onGeneratePlayoffs={vi.fn()}
        onEditMatchScore={vi.fn()}
      />
    );

    expect(screen.queryByText('По двойки')).not.toBeInTheDocument();
    expect(screen.queryByText(/Кръг 1/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Кръг 2/)).not.toBeInTheDocument();
    expect(screen.getByText('Полуфинал')).toBeInTheDocument();
    expect(screen.getByText('🏆 Финал')).toBeInTheDocument();
  });

  describe('Playoff Bracket Lockdown', () => {
    const finalMatch: MatchDetail = {
      id: 'p-final',
      match_format: 'doubles',
      team_1_score: 6,
      team_2_score: 4,
      played_at: '2026-04-18T15:00:00Z',
      team_1_name: 'Отбор Шампиони',
      team_2_name: 'Отбор Финалисти',
      group_name: 'Финал',
      round: 2,
      tournament_id: 't-1',
      created_at: '2026-04-18T10:00:00Z',
      updated_at: '2026-04-18T10:00:00Z',
      match_players: [],
    };

    it('BRK-LOCK-01: suppresses edit buttons and complete button when tournament.status is completed', () => {
      const handleEdit = vi.fn();
      const handleComplete = vi.fn();

      render(
        <TournamentPlayoffBracket
          tournament={{ ...dummyTournament, status: 'completed' }}
          playoffMatches={[finalMatch]}
          groupMatches={[completedGroupMatch]}
          onGeneratePlayoffs={vi.fn()}
          onEditMatchScore={handleEdit}
          onCompleteTournament={handleComplete}
        />
      );

      // Assert no edit buttons rendered anywhere in the bracket
      const editButtons = screen.queryAllByRole('button', { name: /редактирай/i });
      expect(editButtons).toHaveLength(0);

      // Champion banner displays champion team
      expect(screen.getByTestId('playoff-champion-banner')).toBeInTheDocument();
      expect(screen.getByText('🏆 Отбор Шампиони')).toBeInTheDocument();

      // Assert complete tournament button is suppressed
      expect(screen.queryByTestId('mark-tournament-completed-btn')).not.toBeInTheDocument();
    });

    it('BRK-LOCK-02: suppresses edit buttons when explicit readOnly={true} prop is passed', () => {
      const handleEdit = vi.fn();

      render(
        <TournamentPlayoffBracket
          tournament={{ ...dummyTournament, status: 'in_progress' }}
          playoffMatches={[finalMatch]}
          groupMatches={[completedGroupMatch]}
          onGeneratePlayoffs={vi.fn()}
          onEditMatchScore={handleEdit}
          readOnly={true}
        />
      );

      // Assert zero edit buttons rendered
      const editButtons = screen.queryAllByRole('button', { name: /редактирай/i });
      expect(editButtons).toHaveLength(0);

      // Assert complete tournament button is also suppressed under readOnly
      expect(screen.queryByTestId('mark-tournament-completed-btn')).not.toBeInTheDocument();
    });
  });

  describe('Bracket Column Constraints & Horizontal Scrolling', () => {
    const playoffMatches: MatchDetail[] = [
      {
        id: 'p-sf-1',
        match_format: 'doubles',
        team_1_score: 6,
        team_2_score: 2,
        played_at: '2026-04-18T13:00:00Z',
        team_1_name: 'Отбор Алфа',
        team_2_name: 'Отбор Бета',
        group_name: 'Полуфинал',
        round: 1,
        tournament_id: 't-1',
        created_at: '2026-04-18T10:00:00Z',
        updated_at: '2026-04-18T10:00:00Z',
        match_players: [],
      },
      {
        id: 'p-final',
        match_format: 'doubles',
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-04-18T15:00:00Z',
        team_1_name: 'Отбор Алфа',
        team_2_name: 'Отбор Гама',
        group_name: 'Финал',
        round: 2,
        tournament_id: 't-1',
        created_at: '2026-04-18T10:00:00Z',
        updated_at: '2026-04-18T10:00:00Z',
        match_players: [],
      },
    ];

    it('BRK-SCR-01: renders outer scroll container with horizontal scroll and padding classes', () => {
      render(
        <TournamentPlayoffBracket
          tournament={dummyTournament}
          playoffMatches={playoffMatches}
          groupMatches={[completedGroupMatch]}
          onGeneratePlayoffs={vi.fn()}
          onEditMatchScore={vi.fn()}
        />
      );

      const scrollContainer = screen.getByTestId('playoffs-bracket-scroll-container');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('overflow-x-auto', 'pb-4');
    });

    it('BRK-COL-01: applies width and shrink constraints to stage columns', () => {
      render(
        <TournamentPlayoffBracket
          tournament={dummyTournament}
          playoffMatches={playoffMatches}
          groupMatches={[completedGroupMatch]}
          onGeneratePlayoffs={vi.fn()}
          onEditMatchScore={vi.fn()}
        />
      );

      const sfColumn = screen.getByTestId('sf-column');
      const finalColumn = screen.getByTestId('final-column');

      expect(sfColumn).toHaveClass('md:min-w-[320px]', 'shrink-0');
      expect(finalColumn).toHaveClass('md:min-w-[320px]', 'shrink-0');
    });
  });
});

