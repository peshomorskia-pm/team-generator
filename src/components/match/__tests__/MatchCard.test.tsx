import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatchCard } from '../MatchCard';
import type { MatchDetail } from '../../../types/matches';

describe('MatchCard Component', () => {
  const sampleMatch: MatchDetail = {
    id: 'm-100',
    team_1_score: 5,
    team_2_score: 3,
    played_at: '2026-10-02T18:00:00.000Z',
    created_at: '2026-10-02T18:00:00.000Z',
    updated_at: '2026-10-02T18:00:00.000Z',
    match_players: [
      {
        id: 'mp-1',
        match_id: 'm-100',
        player_id: 'p-1',
        guest_name: null,
        team_side: 'team_1',
        rating_before: 1200,
        rating_after: 1215,
        players: { id: 'p-1', name: 'Димитър Бербатов' },
      },
      {
        id: 'mp-2',
        match_id: 'm-100',
        player_id: null,
        guest_name: 'Спас Делев',
        team_side: 'team_2',
        rating_before: null,
        rating_after: null,
        players: null,
      },
    ],
  };

  it('renders scores, team sides, and player names for completed match', () => {
    render(<MatchCard match={sampleMatch} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();
    expect(screen.getByText('Димитър Бербатов')).toBeInTheDocument();
    expect(screen.getByText('Спас Делев')).toBeInTheDocument();
    expect(screen.getByText('(гост)')).toBeInTheDocument();
    expect(screen.queryByText('Предстоящ')).not.toBeInTheDocument();
  });

  it('renders upcoming match with "- : -", "Предстоящ" badge, and no trophies', () => {
    const upcomingMatch: MatchDetail = {
      ...sampleMatch,
      id: 'm-upcoming',
      team_1_score: null,
      team_2_score: null,
    };

    render(<MatchCard match={upcomingMatch} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('- : -')).toBeInTheDocument();
    expect(screen.getByText('Предстоящ')).toBeInTheDocument();
    expect(screen.queryByText('Равенство')).not.toBeInTheDocument();
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('renders draw badge when match is a tie', () => {
    const drawMatch: MatchDetail = {
      ...sampleMatch,
      team_1_score: 2,
      team_2_score: 2,
    };

    render(<MatchCard match={drawMatch} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Равенство')).toBeInTheDocument();
    expect(screen.queryByText('Предстоящ')).not.toBeInTheDocument();
  });

  it('calls onEdit callback when clicking edit button', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();

    render(<MatchCard match={sampleMatch} onEdit={handleEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Редактирай' }));
    expect(handleEdit).toHaveBeenCalledWith(sampleMatch);
  });

  it('calls onDelete callback when clicking delete button', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();

    render(<MatchCard match={sampleMatch} onEdit={vi.fn()} onDelete={handleDelete} />);

    await user.click(screen.getByRole('button', { name: 'Изтрий' }));
    expect(handleDelete).toHaveBeenCalledWith(sampleMatch);
  });

  it('renders format badge and delta chips for completed matches with ratings', () => {
    render(<MatchCard match={sampleMatch} onEdit={vi.fn()} onDelete={vi.fn()} />);

    // Format badge defaults to singles
    expect(screen.getByText('Поединично')).toBeInTheDocument();

    // Rating delta chip for Димитър Бербатов (1215 - 1200 = +15)
    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  it('renders doubles format badge when match_format is doubles', () => {
    const doublesMatch: MatchDetail = {
      ...sampleMatch,
      match_format: 'doubles',
    };

    render(<MatchCard match={doublesMatch} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('По двойки')).toBeInTheDocument();
  });

  it('renders "По двойки" as format fallback for a 2v2 match with null/legacy format', () => {
    const legacy2v2Match: MatchDetail = {
      ...sampleMatch,
      match_format: undefined,
      match_players: [
        {
          id: 'mp-1',
          match_id: 'm-100',
          player_id: 'p-1',
          guest_name: null,
          team_side: 'team_1',
          rating_before: 1200,
          rating_after: 1215,
          players: { id: 'p-1', name: 'Димитър Бербатов' },
        },
        {
          id: 'mp-2',
          match_id: 'm-100',
          player_id: 'p-2',
          guest_name: null,
          team_side: 'team_1',
          rating_before: 1200,
          rating_after: 1215,
          players: { id: 'p-2', name: 'Христо Стоичков' },
        },
        {
          id: 'mp-3',
          match_id: 'm-100',
          player_id: 'p-3',
          guest_name: null,
          team_side: 'team_2',
          rating_before: 1200,
          rating_after: 1185,
          players: { id: 'p-3', name: 'Красимир Балъков' },
        },
        {
          id: 'mp-4',
          match_id: 'm-100',
          player_id: null,
          guest_name: 'Спас Делев',
          team_side: 'team_2',
          rating_before: null,
          rating_after: null,
          players: null,
        },
      ],
    };

    render(<MatchCard match={legacy2v2Match} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('По двойки')).toBeInTheDocument();
  });

  it('renders custom team names when provided', () => {
    const customMatch: MatchDetail = {
      ...sampleMatch,
      team_1_name: 'Отбор 2',
      team_2_name: 'Отбор 3',
    };

    render(<MatchCard match={customMatch} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Отбор 2')).toBeInTheDocument();
    expect(screen.getByText('Отбор 3')).toBeInTheDocument();
    expect(screen.queryByText('Отбор 1')).not.toBeInTheDocument();
  });

  it('renders group badge when group_name is provided', () => {
    const groupedMatch: MatchDetail = {
      ...sampleMatch,
      group_name: 'Група А',
    };

    render(<MatchCard match={groupedMatch} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Група А')).toBeInTheDocument();
  });

  it('falls back to "Отбор 1" and "Отбор 2" when team names are null or undefined', () => {
    const fallbackMatch: MatchDetail = {
      ...sampleMatch,
      team_1_name: null,
      team_2_name: undefined,
      group_name: null,
    };

    render(<MatchCard match={fallbackMatch} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();
  });

  it('renders round badge when round is provided and > 0', () => {
    const matchWithRound: MatchDetail = {
      ...sampleMatch,
      round: 1,
    };

    render(<MatchCard match={matchWithRound} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Кръг 1')).toBeInTheDocument();
  });

  it('does not render round badge when round is null or undefined', () => {
    const matchWithoutRound: MatchDetail = {
      ...sampleMatch,
      round: null,
    };

    render(<MatchCard match={matchWithoutRound} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByText(/Кръг/)).not.toBeInTheDocument();

    const matchUndefinedRound: MatchDetail = {
      ...sampleMatch,
      round: undefined,
    };

    const { unmount } = render(
      <MatchCard match={matchUndefinedRound} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.queryByText(/Кръг/)).not.toBeInTheDocument();
    unmount();
  });

  it('hides delete button when hideDelete is true or onDelete is not provided', () => {
    const { rerender } = render(
      <MatchCard
        match={sampleMatch}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        hideDelete={true}
      />
    );
    expect(screen.queryByLabelText('Изтрий')).not.toBeInTheDocument();

    rerender(
      <MatchCard
        match={sampleMatch}
        onEdit={vi.fn()}
        hideDelete={false}
      />
    );
    expect(screen.queryByLabelText('Изтрий')).not.toBeInTheDocument();
  });

  it('renders and allows clicking delete button when hideDelete is false and onDelete is passed', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();

    render(
      <MatchCard
        match={sampleMatch}
        onEdit={vi.fn()}
        onDelete={handleDelete}
        hideDelete={false}
      />
    );

    const deleteBtn = screen.getByLabelText('Изтрий');
    expect(deleteBtn).toBeInTheDocument();
    await user.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(sampleMatch);
  });

  it('renders multi-set tennis scores compactly', () => {
    const multiSetMatch: MatchDetail = {
      ...sampleMatch,
      team_1_score: 2,
      team_2_score: 1,
      sets: [
        { set_number: 1, team_1_score: 6, team_2_score: 4 },
        { set_number: 2, team_1_score: 3, team_2_score: 6 },
        { set_number: 3, team_1_score: 10, team_2_score: 7 },
      ],
    };

    render(<MatchCard match={multiSetMatch} onEdit={vi.fn()} />);

    expect(screen.getByText('6:4, 3:6, 10:7')).toBeInTheDocument();
  });

  it('awards trophy icon to multi-set match winner based on sets won, not game difference', () => {
    // Team 1 won 2 sets to 1, but Team 2 won more total games (18 vs 15)
    const multiSetMatch: MatchDetail = {
      ...sampleMatch,
      team_1_name: 'Отбор Победител',
      team_2_name: 'Отбор Загубил',
      team_1_score: 2,
      team_2_score: 1,
      sets: [
        { set_number: 1, team_1_score: 1, team_2_score: 6 },
        { set_number: 2, team_1_score: 7, team_2_score: 6 },
        { set_number: 3, team_1_score: 7, team_2_score: 6 },
      ],
    };

    render(<MatchCard match={multiSetMatch} onEdit={vi.fn()} />);

    // Team 1 header should have the Trophy SVG and emerald text color
    const team1Header = screen.getByText('Отбор Победител');
    expect(team1Header).toHaveClass('text-emerald-600');

    const team2Header = screen.getByText('Отбор Загубил');
    expect(team2Header).not.toHaveClass('text-emerald-600');
  });

  describe('Playoff MatchCard Badges Streamlining', () => {
    it('MC-PLY-01: suppresses format and round badges when isPlayoff={true}', () => {
      const match: MatchDetail = {
        ...sampleMatch,
        match_format: 'doubles',
        group_name: 'Полуфинал',
        round: 2,
      };

      render(<MatchCard match={match} onEdit={vi.fn()} isPlayoff={true} />);

      expect(screen.queryByText('По двойки')).not.toBeInTheDocument();
      expect(screen.queryByText(/Кръг 2/)).not.toBeInTheDocument();
      expect(screen.getByText('Полуфинал')).toBeInTheDocument();
    });

    it('MC-PLY-02: renders standard 7-column layout preserving format badge when isPlayoff prop is omitted, even for playoff stage', () => {
      const match: MatchDetail & { stage?: string } = {
        ...sampleMatch,
        match_format: 'doubles',
        group_name: 'Полуфинал',
        stage: 'semifinal',
        round: 2,
      };

      render(<MatchCard match={match} onEdit={vi.fn()} />);

      // Standard layout preserves format badge and stage badge
      expect(screen.getByText('По двойки')).toBeInTheDocument();
      expect(screen.getByText('Полуфинал')).toBeInTheDocument();
      // Stacked playoff container is NOT rendered
      expect(screen.queryByTestId('match-card-stacked-layout')).not.toBeInTheDocument();
      expect(screen.queryByTestId('playoff-team-row-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('playoff-team-row-2')).not.toBeInTheDocument();
    });

    it('MC-PLY-04: renders stacked 2-row layout when isPlayoff={true} is explicitly passed for playoff match', () => {
      const match: MatchDetail & { stage?: string } = {
        ...sampleMatch,
        match_format: 'doubles',
        group_name: 'Полуфинал',
        stage: 'semifinal',
      };

      render(<MatchCard match={match} onEdit={vi.fn()} isPlayoff={true} />);

      expect(screen.getByTestId('match-card-stacked-layout')).toBeInTheDocument();
      expect(screen.getByTestId('playoff-team-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('playoff-team-row-2')).toBeInTheDocument();
      expect(screen.queryByText('По двойки')).not.toBeInTheDocument();
    });

    it('MC-PLY-03: renders trophy badge for Final stage', () => {
      const match: MatchDetail = {
        ...sampleMatch,
        match_format: 'doubles',
        group_name: 'Финал',
      };

      render(<MatchCard match={match} onEdit={vi.fn()} isPlayoff={true} />);

      expect(screen.getByText('🏆 Финал')).toBeInTheDocument();
    });

    it('MC-GRP-01: preserves format and round badges for non-playoff (group) matches', () => {
      const match: MatchDetail = {
        ...sampleMatch,
        match_format: 'doubles',
        group_name: 'Група А',
        round: 1,
      };

      render(<MatchCard match={match} onEdit={vi.fn()} isPlayoff={false} />);

      expect(screen.getByText('По двойки')).toBeInTheDocument();
      expect(screen.getByText('Кръг 1')).toBeInTheDocument();
      expect(screen.getByText('Група А')).toBeInTheDocument();
    });
  });

  describe('readOnly Lockdown', () => {
    it('MC-LOCK-01: suppresses edit button when readOnly is true', () => {
      const handleEdit = vi.fn();
      render(<MatchCard match={sampleMatch} onEdit={handleEdit} readOnly={true} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Димитър Бербатов')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Редактирай' })).not.toBeInTheDocument();
    });

    it('MC-LOCK-02: renders edit button and triggers onEdit when readOnly is false or default', async () => {
      const user = userEvent.setup();
      const handleEdit = vi.fn();
      render(<MatchCard match={sampleMatch} onEdit={handleEdit} readOnly={false} />);

      const editBtn = screen.getByRole('button', { name: 'Редактирай' });
      expect(editBtn).toBeInTheDocument();
      await user.click(editBtn);
      expect(handleEdit).toHaveBeenCalledWith(sampleMatch);
    });

    it('MC-LOCK-03: retains delete button when readOnly is true if hideDelete is false and onDelete provided', async () => {
      const user = userEvent.setup();
      const handleDelete = vi.fn();
      render(
        <MatchCard
          match={sampleMatch}
          onEdit={vi.fn()}
          onDelete={handleDelete}
          hideDelete={false}
          readOnly={true}
        />
      );

      expect(screen.queryByRole('button', { name: 'Редактирай' })).not.toBeInTheDocument();
      const deleteBtn = screen.getByRole('button', { name: 'Изтрий' });
      expect(deleteBtn).toBeInTheDocument();
      await user.click(deleteBtn);
      expect(handleDelete).toHaveBeenCalledWith(sampleMatch);
    });
  });

  describe('Stacked Playoff Bracket Layout & Player Badge Standard', () => {
    it('MC-STK-01: renders stacked bracket layout when isPlayoff={true}', () => {
      render(
        <MatchCard
          match={sampleMatch}
          onEdit={vi.fn()}
          isPlayoff={true}
          team1Seed={1}
          team2Seed={4}
        />
      );

      const stackedLayout = screen.getByTestId('match-card-stacked-layout');
      expect(stackedLayout).toBeInTheDocument();

      const team1Row = screen.getByTestId('playoff-team-row-1');
      const team2Row = screen.getByTestId('playoff-team-row-2');
      expect(team1Row).toBeInTheDocument();
      expect(team2Row).toBeInTheDocument();

      // Seed badges
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#4')).toBeInTheDocument();

      // Outer container
      expect(screen.getByTestId('playoff-match-card-m-100')).toBeInTheDocument();
    });

    it('MC-STK-02: applies emerald winner styling and trophy to winning team row', () => {
      const matchWithWinner: MatchDetail = {
        ...sampleMatch,
        team_1_score: 6,
        team_2_score: 3,
      };

      render(<MatchCard match={matchWithWinner} onEdit={vi.fn()} isPlayoff={true} />);

      const team1Row = screen.getByTestId('playoff-team-row-1');
      const team2Row = screen.getByTestId('playoff-team-row-2');

      expect(team1Row).toHaveClass('bg-emerald-50/70');
      expect(screen.getByTestId('winner-trophy-team-1')).toBeInTheDocument();
      expect(screen.queryByTestId('winner-trophy-team-2')).not.toBeInTheDocument();
      expect(team2Row).not.toHaveClass('bg-emerald-50/70');
    });

    it('MC-STK-03: renders multi-set scores on right of each team row and in footer', () => {
      const multiSetPlayoffMatch: MatchDetail = {
        ...sampleMatch,
        team_1_score: 2,
        team_2_score: 1,
        sets: [
          { set_number: 1, team_1_score: 6, team_2_score: 4 },
          { set_number: 2, team_1_score: 3, team_2_score: 6 },
          { set_number: 3, team_1_score: 10, team_2_score: 7 },
        ],
      };

      render(<MatchCard match={multiSetPlayoffMatch} onEdit={vi.fn()} isPlayoff={true} />);

      const team1Row = screen.getByTestId('playoff-team-row-1');
      const team2Row = screen.getByTestId('playoff-team-row-2');

      // Team 1 set scores & sets won
      expect(team1Row).toHaveTextContent('6');
      expect(team1Row).toHaveTextContent('3');
      expect(team1Row).toHaveTextContent('10');
      expect(team1Row).toHaveTextContent('2');

      // Team 2 set scores & sets won
      expect(team2Row).toHaveTextContent('4');
      expect(team2Row).toHaveTextContent('6');
      expect(team2Row).toHaveTextContent('7');
      expect(team2Row).toHaveTextContent('1');

      // Footer multi-set summary
      expect(screen.getByText('6:4, 3:6, 10:7')).toBeInTheDocument();
      expect(screen.getByText('Статус: Завършен')).toBeInTheDocument();
    });

    it('MC-STK-04: renders "-" for each team row and "Предстоящ" status badge for upcoming playoff match', () => {
      const upcomingPlayoffMatch: MatchDetail = {
        ...sampleMatch,
        team_1_score: null,
        team_2_score: null,
      };

      render(<MatchCard match={upcomingPlayoffMatch} onEdit={vi.fn()} isPlayoff={true} />);

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Предстоящ')).toBeInTheDocument();
      expect(screen.getByText('Статус: Предстоящ')).toBeInTheDocument();
    });

    it('MC-BADGE-01: constrains playoff player badges with max-w-[180px] sm:max-w-[200px], truncate, and title tooltip', () => {
      const longNameMatch: MatchDetail = {
        ...sampleMatch,
        match_players: [
          {
            id: 'mp-long-1',
            match_id: 'm-100',
            player_id: 'p-long-1',
            guest_name: null,
            team_side: 'team_1',
            rating_before: 1200,
            rating_after: 1210,
            players: { id: 'p-long-1', name: 'Константин Константинополски' },
          },
        ],
      };

      render(<MatchCard match={longNameMatch} onEdit={vi.fn()} isPlayoff={true} />);

      const badge = screen.getByTestId('player-badge-mp-long-1');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('max-w-[180px]', 'sm:max-w-[200px]', 'truncate');
      expect(badge).toHaveAttribute('title', 'Константин Константинополски');
    });

    it('MC-BADGE-02: constrains regular group match player badges with max-w-[180px] sm:max-w-[200px], truncate, and title tooltip', () => {
      const longNameMatch: MatchDetail = {
        ...sampleMatch,
        group_name: 'Група А',
        match_players: [
          {
            id: 'mp-long-2',
            match_id: 'm-100',
            player_id: 'p-long-2',
            guest_name: null,
            team_side: 'team_1',
            rating_before: 1200,
            rating_after: 1210,
            players: { id: 'p-long-2', name: 'Александър Александров-Велики' },
          },
        ],
      };

      render(<MatchCard match={longNameMatch} onEdit={vi.fn()} isPlayoff={false} />);

      const badge = screen.getByTestId('player-badge-mp-long-2');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('max-w-[180px]', 'sm:max-w-[200px]', 'truncate');
      expect(badge).toHaveAttribute('title', 'Александър Александров-Велики');
    });
  });
});

