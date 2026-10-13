import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('T-CARD-4: hides ratings when mode is generic', () => {
    render(<GroupCard group={dummyGroup} mode="generic" />);

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it('T-CARD-1: when empty slots exist and onSelectEmptySlot is provided, clicking slot button fires onSelectEmptySlot', () => {
    const onSelectEmptySlotMock = vi.fn();

    // dummyGroup has 2 teams, targetSize is 3 -> 1 empty slot
    render(
      <GroupCard
        group={dummyGroup}
        targetSize={3}
        onSelectEmptySlot={onSelectEmptySlotMock}
      />
    );

    const emptySlotBtn = screen.getByTestId('empty-group-slot');
    expect(emptySlotBtn).toBeInTheDocument();
    expect(screen.getByText('+ Избери отбор')).toBeInTheDocument();

    fireEvent.click(emptySlotBtn);
    expect(onSelectEmptySlotMock).toHaveBeenCalledTimes(1);
    expect(onSelectEmptySlotMock).toHaveBeenCalledWith('group-0');
  });

  it('T-CARD-2: clicking X button on a team fires onRemoveTeam', () => {
    const onRemoveTeamMock = vi.fn();

    render(
      <GroupCard
        group={dummyGroup}
        onRemoveTeam={onRemoveTeamMock}
      />
    );

    const removeBtn = screen.getByTestId('remove-team-team-1');
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);
    expect(onRemoveTeamMock).toHaveBeenCalledTimes(1);
    expect(onRemoveTeamMock).toHaveBeenCalledWith('group-0', 'team-1');
  });

  it('T-CARD-3: selecting a target group in the transfer dropdown fires onMoveTeam', () => {
    const onMoveTeamMock = vi.fn();
    const availableGroups = [
      { id: 'group-0', name: 'Група А' },
      { id: 'group-1', name: 'Група Б' },
      { id: 'group-2', name: 'Група В' },
    ];

    render(
      <GroupCard
        group={dummyGroup}
        onMoveTeam={onMoveTeamMock}
        availableGroups={availableGroups}
      />
    );

    const selects = screen.getAllByRole('combobox', { name: 'Премести в друга група' });
    expect(selects).toHaveLength(2); // One for each team in dummyGroup

    // Target group options must exclude current group ('group-0')
    const team1Select = selects[0];
    fireEvent.change(team1Select, { target: { value: 'group-1' } });

    expect(onMoveTeamMock).toHaveBeenCalledTimes(1);
    expect(onMoveTeamMock).toHaveBeenCalledWith('team-1', 'group-1');
  });

  it('T-CARD-5: renders empty dashed slots up to group.targetSize when targetSize prop is omitted', () => {
    const groupWithTarget: TournamentGroup = {
      id: 'group-0',
      name: 'Група А',
      teams: [],
      targetSize: 4,
    };

    render(
      <GroupCard
        group={groupWithTarget}
        onSelectEmptySlot={vi.fn()}
      />
    );

    const emptySlots = screen.getAllByTestId('empty-group-slot');
    expect(emptySlots).toHaveLength(4);
  });

  it('T-CARD-6: renders targetCapacity - group.teams.length empty slots when partially filled', () => {
    const partiallyFilledGroup: TournamentGroup = {
      id: 'group-0',
      name: 'Група А',
      teams: [dummyGroup.teams[0]], // 1 team
      targetSize: 4,
    };

    render(
      <GroupCard
        group={partiallyFilledGroup}
        onSelectEmptySlot={vi.fn()}
      />
    );

    // 4 - 1 = 3 empty slots
    const emptySlots = screen.getAllByTestId('empty-group-slot');
    expect(emptySlots).toHaveLength(3);
  });
});
