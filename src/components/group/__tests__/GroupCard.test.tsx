import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GroupCard } from '../GroupCard';
import type { TournamentGroup } from '../../../types';

describe('GroupCard component', () => {
  const dummyGroup: TournamentGroup = {
    id: 'group-0',
    name: 'Група А',
    teams: [
      {
        id: 'team-1',
        name: 'Отбор 1',
        totalRating: 3100,
        players: [
          { id: 'p1', name: 'Иван Иванов', singles_rating: 1600, doubles_rating: 1550, rating: 1500 },
          { id: 'p2', name: 'Георги Димитров', singles_rating: 1500, doubles_rating: 1550, rating: 1500 },
        ],
      },
      {
        id: 'team-2',
        name: 'Отбор 2',
        totalRating: 2800,
        players: [
          { id: 'p3', name: 'Петър Стоянов', singles_rating: 1400, doubles_rating: 1400, rating: 1400 },
        ],
      },
    ],
  };

  it('renders group title, team count badge, and teams list', () => {
    render(<GroupCard group={dummyGroup} mode="tennis" format="doubles" />);

    expect(screen.getByText('Група А')).toBeInTheDocument();
    expect(screen.getByText('2 отбора')).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 2')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Георги Димитров')).toBeInTheDocument();
    expect(screen.getByText('Петър Стоянов')).toBeInTheDocument();
  });

  it('displays singular badge for 1 team', () => {
    const singleTeamGroup: TournamentGroup = {
      id: 'group-1',
      name: 'Група Б',
      teams: [dummyGroup.teams[0]],
    };

    render(<GroupCard group={singleTeamGroup} mode="tennis" />);
    expect(screen.getByText('1 отбор')).toBeInTheDocument();
  });

  it('renders empty fallback when group has no teams', () => {
    const emptyGroup: TournamentGroup = {
      id: 'group-empty',
      name: 'Група В',
      teams: [],
    };

    render(<GroupCard group={emptyGroup} />);
    expect(screen.getByText('Няма разпределени отбори в групата')).toBeInTheDocument();
  });

  it('hides ratings when mode is generic', () => {
    render(<GroupCard group={dummyGroup} mode="generic" />);

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });
});
