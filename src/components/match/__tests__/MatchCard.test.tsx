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
});
