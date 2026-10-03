import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchesStatSummary } from '../MatchesStatSummary';
import type { MatchDetail } from '../../../types/matches';

describe('MatchesStatSummary Component', () => {
  it('renders stats with zeros when matches array is empty', () => {
    render(<MatchesStatSummary matches={[]} />);

    expect(screen.getByText('Общо')).toBeInTheDocument();
    expect(screen.getByText('Изиграни')).toBeInTheDocument();
    expect(screen.getByText('Предстоящи')).toBeInTheDocument();

    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(3);
  });

  it('renders computed metrics correctly for completed and upcoming matches', () => {
    const mockMatches: MatchDetail[] = [
      {
        id: '1',
        team_1_score: 3,
        team_2_score: 2,
        played_at: '2026-10-02T18:00:00.000Z',
        created_at: '2026-10-02T18:00:00.000Z',
        updated_at: '2026-10-02T18:00:00.000Z',
        match_players: [],
      },
      {
        id: '2',
        team_1_score: null,
        team_2_score: null,
        played_at: '2026-10-05T18:00:00.000Z',
        created_at: '2026-10-02T18:00:00.000Z',
        updated_at: '2026-10-02T18:00:00.000Z',
        match_players: [],
      },
      {
        id: '3',
        team_1_score: 1,
        team_2_score: 1,
        played_at: '2026-10-01T18:00:00.000Z',
        created_at: '2026-10-01T18:00:00.000Z',
        updated_at: '2026-10-01T18:00:00.000Z',
        match_players: [],
      },
    ];

    render(<MatchesStatSummary matches={mockMatches} />);

    // Total = 3
    expect(screen.getByText('3')).toBeInTheDocument();
    // Изиграни = 2
    expect(screen.getByText('2')).toBeInTheDocument();
    // Предстоящи = 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
