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
});
