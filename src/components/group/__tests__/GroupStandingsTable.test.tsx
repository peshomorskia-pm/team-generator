import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GroupStandingsTable } from '../GroupStandingsTable';
import type { GroupStandingRow } from '../../../types/standings';

describe('GroupStandingsTable Component', () => {
  const mockStandings: GroupStandingRow[] = [
    {
      rank: 1,
      teamId: 't1',
      teamName: 'Отбор 1',
      played: 2,
      won: 2,
      lost: 0,
      gamesWon: 12,
      gamesLost: 5,
      gameDiff: 7,
      points: 2,
    },
    {
      rank: 2,
      teamId: 't2',
      teamName: 'Отбор 2',
      played: 2,
      won: 1,
      lost: 1,
      gamesWon: 10,
      gamesLost: 10,
      gameDiff: 0,
      points: 1,
    },
    {
      rank: 3,
      teamId: 't3',
      teamName: 'Отбор 3',
      played: 2,
      won: 0,
      lost: 2,
      gamesWon: 4,
      gamesLost: 11,
      gameDiff: -7,
      points: 0,
    },
  ];

  it('renders all 7 columns (#, Отбор, М, П, З, +/-, Т) with correct Bulgarian headers', () => {
    render(<GroupStandingsTable groupName="Група А" standings={mockStandings} />);

    expect(screen.getByText('Класиране - Група А')).toBeInTheDocument();

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(7);
    expect(headers[0]).toHaveTextContent('#');
    expect(headers[1]).toHaveTextContent('Отбор');
    expect(headers[2]).toHaveTextContent('М');
    expect(headers[3]).toHaveTextContent('П');
    expect(headers[4]).toHaveTextContent('З');
    expect(headers[5]).toHaveTextContent('+/-');
    expect(headers[6]).toHaveTextContent('Т');
  });

  it('displays visual highlight badges for top 2 playoff positions', () => {
    render(<GroupStandingsTable groupName="Група А" standings={mockStandings} highlightTop={2} />);

    const playoffBadges = screen.getAllByText('Плейофи');
    expect(playoffBadges).toHaveLength(2);

    const row1 = screen.getByTestId('standings-row-1');
    const row2 = screen.getByTestId('standings-row-2');
    const row3 = screen.getByTestId('standings-row-3');

    expect(row1).toHaveClass('bg-emerald-50/40');
    expect(row2).toHaveClass('bg-emerald-50/40');
    expect(row3).not.toHaveClass('bg-emerald-50/40');
  });

  it('handles negative, positive, and zero game difference formatting (+7, 0, -7)', () => {
    render(<GroupStandingsTable standings={mockStandings} />);

    expect(screen.getByText('+7')).toBeInTheDocument();
    expect(screen.getByText('-7')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('renders subtle note when no completed matches exist in the group', () => {
    const unplayedStandings: GroupStandingRow[] = [
      {
        rank: 1,
        teamId: 't1',
        teamName: 'Отбор 1',
        played: 0,
        won: 0,
        lost: 0,
        gamesWon: 0,
        gamesLost: 0,
        gameDiff: 0,
        points: 0,
      },
    ];

    render(<GroupStandingsTable groupName="Група Б" standings={unplayedStandings} />);

    expect(screen.getByText('Все още няма изиграни мачове в групата.')).toBeInTheDocument();
  });

  it('renders empty message when standings array is empty', () => {
    render(<GroupStandingsTable groupName="Група В" standings={[]} />);

    expect(screen.getByText('Няма добавени отбори в групата.')).toBeInTheDocument();
  });
});
