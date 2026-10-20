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

  it('renders direct and wildcard badges when qualifierMap is provided', () => {
    const qualifierMap = new Map([
      [
        't1',
        {
          teamId: 't1',
          teamName: 'Отбор 1',
          seed: 1,
          isWildcard: false,
          groupOrigin: 'Група А',
          rankInGroup: 1,
          played: 2,
          pointsPerMatch: 1,
          gameDiffPerMatch: 3.5,
          gamesWonPerMatch: 6,
        },
      ],
      [
        't2',
        {
          teamId: 't2',
          teamName: 'Отбор 2',
          seed: 4,
          isWildcard: true,
          groupOrigin: 'Група А',
          rankInGroup: 2,
          played: 2,
          pointsPerMatch: 0.5,
          gameDiffPerMatch: 0,
          gamesWonPerMatch: 5,
        },
      ],
    ]);

    render(
      <GroupStandingsTable
        groupName="Група А"
        standings={mockStandings}
        qualifierMap={qualifierMap}
      />
    );

    expect(screen.getByText('Плейофи')).toBeInTheDocument();
    expect(screen.getByText('Плейофи (Wildcard)')).toBeInTheDocument();

    const row1 = screen.getByTestId('standings-row-1');
    const row2 = screen.getByTestId('standings-row-2');
    const row3 = screen.getByTestId('standings-row-3');

    expect(row1).toHaveClass('bg-emerald-50/40');
    expect(row2).toHaveClass('bg-purple-50/40');
    expect(row3).not.toHaveClass('bg-emerald-50/40');
    expect(row3).not.toHaveClass('bg-purple-50/40');
  });

  it('GST-01: renders player roster below team name when teamRosterMap provided as Map', () => {
    const teamRosterMap = new Map<string, string[]>([
      ['t1', ['Иван Иванов', 'Петър Петров']],
    ]);

    render(
      <GroupStandingsTable
        groupName="Група А"
        standings={mockStandings}
        teamRosterMap={teamRosterMap}
      />
    );

    const rosterEl = screen.getByText('Иван Иванов, Петър Петров');
    expect(rosterEl).toBeInTheDocument();
    expect(rosterEl).toHaveClass('line-clamp-2', 'break-words', 'mt-0.5', 'text-xs', 'text-slate-500');
    expect(rosterEl).not.toHaveClass('truncate');
    expect(rosterEl).toHaveAttribute('title', 'Иван Иванов, Петър Петров');
    expect(screen.getByTestId('team-roster-1')).toBe(rosterEl);
  });

  it('GST-05: provides unabridged roster as title tooltip attribute for hover', () => {
    const longNames = [
      'Константин Константинополски',
      'Александър Александров-Велики',
    ];
    const teamRosterMap = new Map<string, string[]>([['t1', longNames]]);

    render(
      <GroupStandingsTable
        groupName="Група А"
        standings={mockStandings}
        teamRosterMap={teamRosterMap}
      />
    );

    const rosterEl = screen.getByTestId('team-roster-1');
    expect(rosterEl).toHaveAttribute(
      'title',
      'Константин Константинополски, Александър Александров-Велики'
    );
  });

  it('GST-02: renders player roster when teamRosterMap is passed as Record / Object', () => {
    const teamRosterMap = {
      'Отбор 2': ['Димитър Михайлов'],
    };

    render(
      <GroupStandingsTable
        groupName="Група А"
        standings={mockStandings}
        teamRosterMap={teamRosterMap}
      />
    );

    const rosterEl = screen.getByText('Димитър Михайлов');
    expect(rosterEl).toBeInTheDocument();
    expect(screen.getByTestId('team-roster-2')).toBe(rosterEl);
  });

  it('GST-03: graceful fallback when team has no roster in map', () => {
    const teamRosterMap = new Map<string, string[]>([
      ['t1', ['Иван Иванов']],
    ]);

    render(
      <GroupStandingsTable
        groupName="Група А"
        standings={mockStandings}
        teamRosterMap={teamRosterMap}
      />
    );

    expect(screen.getByTestId('team-roster-1')).toBeInTheDocument();
    expect(screen.queryByTestId('team-roster-3')).not.toBeInTheDocument();
    expect(screen.getByText('Отбор 3')).toBeInTheDocument();
  });

  it('GST-04: supports teams prop fallback', () => {
    const teams = [
      {
        id: 't1',
        name: 'Отбор 1',
        players: [{ id: 'p1', name: 'Георги' }],
      },
    ];

    render(
      <GroupStandingsTable
        groupName="Група А"
        standings={mockStandings}
        teams={teams}
      />
    );

    const rosterEl = screen.getByText('Георги');
    expect(rosterEl).toBeInTheDocument();
    expect(screen.getByTestId('team-roster-1')).toBe(rosterEl);
  });
});

