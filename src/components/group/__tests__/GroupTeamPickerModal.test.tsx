import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupTeamPickerModal } from '../GroupTeamPickerModal';
import type { Team } from '../../../types';

describe('GroupTeamPickerModal Component', () => {
  const dummyTeams: Team[] = [
    {
      id: 'team-1',
      name: 'Левски',
      totalRating: 2500,
      players: [
        { id: 'p1', name: 'Иван Иванов', doubles_rating: 1300 },
        { id: 'p2', name: 'Георги Димитров', doubles_rating: 1200 },
      ],
    },
    {
      id: 'team-2',
      name: 'ЦСКА',
      totalRating: 2400,
      players: [
        { id: 'p3', name: 'Петър Петров', doubles_rating: 1250 },
        { id: 'p4', name: 'Димитър Бербатов', doubles_rating: 1150 },
      ],
    },
    {
      id: 'team-3',
      name: 'Ботев',
      totalRating: 2200,
      players: [
        { id: 'p5', name: 'Тодор Неделев', doubles_rating: 1100 },
        { id: 'p6', name: 'Атанас Илиев', doubles_rating: 1100 },
      ],
    },
  ];

  it('renders null when isOpen is false or groupId is null', () => {
    const { container: c1 } = render(
      <GroupTeamPickerModal
        isOpen={false}
        onClose={vi.fn()}
        groupId="group-0"
        unassignedTeams={dummyTeams}
        onSelectTeam={vi.fn()}
      />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <GroupTeamPickerModal
        isOpen={true}
        onClose={vi.fn()}
        groupId={null}
        unassignedTeams={dummyTeams}
        onSelectTeam={vi.fn()}
      />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('T-MODAL-1: opens modal with unassigned teams list and search filters dynamically', () => {
    render(
      <GroupTeamPickerModal
        isOpen={true}
        onClose={vi.fn()}
        groupId="group-0"
        groupName="Група А"
        unassignedTeams={dummyTeams}
        onSelectTeam={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Избери отбор за Група А')).toBeInTheDocument();
    expect(screen.getByText('3 свободни отбора')).toBeInTheDocument();
    expect(screen.getByText('Левски')).toBeInTheDocument();
    expect(screen.getByText('ЦСКА')).toBeInTheDocument();
    expect(screen.getByText('Ботев')).toBeInTheDocument();

    // Search by team name
    const searchInput = screen.getByRole('textbox', { name: /търсене на отбор/i });
    fireEvent.change(searchInput, { target: { value: 'ЦСКА' } });

    expect(screen.queryByText('Левски')).not.toBeInTheDocument();
    expect(screen.getByText('ЦСКА')).toBeInTheDocument();
    expect(screen.queryByText('Ботев')).not.toBeInTheDocument();

    // Search by player name
    fireEvent.change(searchInput, { target: { value: 'Неделев' } });
    expect(screen.getByText('Ботев')).toBeInTheDocument();
    expect(screen.queryByText('ЦСКА')).not.toBeInTheDocument();

    // Search with no results
    fireEvent.change(searchInput, { target: { value: 'НямаТакъв' } });
    expect(screen.getByText('Няма намерени отбори с име "НямаТакъв".')).toBeInTheDocument();
  });

  it('T-MODAL-2: clicking a team card invokes onSelectTeam and onClose', () => {
    const onSelectTeamMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <GroupTeamPickerModal
        isOpen={true}
        onClose={onCloseMock}
        groupId="group-1"
        groupName="Група Б"
        unassignedTeams={dummyTeams}
        onSelectTeam={onSelectTeamMock}
      />
    );

    const teamCard = screen.getByTestId('select-team-team-2');
    fireEvent.click(teamCard);

    expect(onSelectTeamMock).toHaveBeenCalledTimes(1);
    expect(onSelectTeamMock).toHaveBeenCalledWith('group-1', dummyTeams[1]);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('T-MODAL-3: pressing Escape key triggers onClose', () => {
    const onCloseMock = vi.fn();

    render(
      <GroupTeamPickerModal
        isOpen={true}
        onClose={onCloseMock}
        groupId="group-0"
        unassignedTeams={dummyTeams}
        onSelectTeam={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('closes modal when clicking close button or backdrop', () => {
    const onCloseMock = vi.fn();

    render(
      <GroupTeamPickerModal
        isOpen={true}
        onClose={onCloseMock}
        groupId="group-0"
        unassignedTeams={dummyTeams}
        onSelectTeam={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'Затвори' });
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
