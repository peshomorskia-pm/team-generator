import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchesStatSummary } from '../MatchesStatSummary';
import type { MatchDetail } from '../../../types/matches';

describe('MatchesStatSummary Component', () => {
  it('renders stats with zeros and empty fallback when matches array is empty', () => {
    render(<MatchesStatSummary matches={[]} />);

    expect(screen.getByText('Общо изиграни мачове')).toBeInTheDocument();
    expect(screen.getByText('Общо отбелязани голове')).toBeInTheDocument();
    expect(screen.getByText('Последен мач')).toBeInTheDocument();

    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(2);
    expect(screen.getByText('Няма')).toBeInTheDocument();
  });

  it('renders computed metrics correctly from matches', () => {
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
        team_1_score: 4,
        team_2_score: 4,
        played_at: '2026-10-01T18:00:00.000Z',
        created_at: '2026-10-01T18:00:00.000Z',
        updated_at: '2026-10-01T18:00:00.000Z',
        match_players: [],
      },
    ];

    render(<MatchesStatSummary matches={mockMatches} />);

    expect(screen.getByText('2')).toBeInTheDocument(); // total matches
    expect(screen.getByText('13')).toBeInTheDocument(); // 3+2 + 4+4 = 13 goals
    expect(screen.queryByText('Няма')).not.toBeInTheDocument();
  });
});
