import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MatchScheduleList } from '../MatchScheduleList';
import type { TournamentMatch, Team } from '../../../types';
import * as clipboardModule from '../../../utils/clipboard';

function createMockTeam(id: string, name: string, rating?: number, playerName = 'Играч'): Team {
  return {
    id,
    name,
    totalRating: rating,
    players: [{ id: `p-${id}`, name: `${playerName} ${name}`, rating }],
  };
}

describe('MatchScheduleList Component', () => {
  it('returns null when schedule is empty', () => {
    const { container } = render(<MatchScheduleList schedule={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders matches partitioned by rounds with Bulgarian headers and team details', () => {
    const team1 = createMockTeam('t1', 'Отбор 1', 1200, 'Иван');
    const team2 = createMockTeam('t2', 'Отбор 2', 1300, 'Петър');
    const team3 = createMockTeam('t3', 'Отбор 3', 1100, 'Георги');

    const schedule: TournamentMatch[] = [
      {
        id: 'match-group-0-r1-m1',
        groupId: 'group-0',
        groupName: 'Група А',
        round: 1,
        team1,
        team2,
        byeTeam: team3,
      },
      {
        id: 'match-group-0-r2-m1',
        groupId: 'group-0',
        groupName: 'Група А',
        round: 2,
        team1,
        team2: team3,
        byeTeam: team2,
      },
    ];

    render(<MatchScheduleList schedule={schedule} />);

    // Main header
    expect(screen.getByRole('heading', { level: 2, name: /програма на срещите/i })).toBeInTheDocument();

    // Round headings
    expect(screen.getByRole('heading', { level: 3, name: 'Кръг 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Кръг 2' })).toBeInTheDocument();

    // Team names and ratings
    expect(screen.getAllByText('Отбор 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Отбор 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Отбор 3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('★ 1200').length).toBeGreaterThan(0);
    expect(screen.getAllByText('★ 1300').length).toBeGreaterThan(0);

    // Resting team badges
    expect(screen.getByText('Почива: Отбор 3')).toBeInTheDocument();
    expect(screen.getByText('Почива: Отбор 2')).toBeInTheDocument();
  });

  it('renders match card without bye badge when no team is resting (e.g. N=4)', () => {
    const team1 = createMockTeam('t1', 'Отбор 1');
    const team2 = createMockTeam('t2', 'Отбор 2');
    const team3 = createMockTeam('t3', 'Отбор 3');
    const team4 = createMockTeam('t4', 'Отбор 4');

    const schedule: TournamentMatch[] = [
      {
        id: 'match-group-0-r1-m1',
        groupId: 'group-0',
        groupName: 'Група А',
        round: 1,
        team1,
        team2: team4,
      },
      {
        id: 'match-group-0-r1-m2',
        groupId: 'group-0',
        groupName: 'Група А',
        round: 1,
        team1: team2,
        team2: team3,
      },
    ];

    render(<MatchScheduleList schedule={schedule} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Кръг 1' })).toBeInTheDocument();
    expect(screen.queryByTestId('bye-team-badge')).not.toBeInTheDocument();
    expect(screen.queryByText(/почива:/i)).not.toBeInTheDocument();
  });

  it('invokes onReset or onClear when "Изчисти програмата" button is clicked', () => {
    const onReset = vi.fn();
    const team1 = createMockTeam('t1', 'Отбор 1');
    const team2 = createMockTeam('t2', 'Отбор 2');

    const schedule: TournamentMatch[] = [
      {
        id: 'match-group-0-r1-m1',
        groupId: 'group-0',
        groupName: 'Група А',
        round: 1,
        team1,
        team2,
      },
    ];

    render(<MatchScheduleList schedule={schedule} onReset={onReset} />);

    const resetBtn = screen.getByRole('button', { name: /изчисти програмата/i });
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('does not render "Нова програма" button', () => {
    const team1 = createMockTeam('t1', 'Отбор 1');
    const team2 = createMockTeam('t2', 'Отбор 2');

    const schedule: TournamentMatch[] = [
      {
        id: 'match-group-0-r1-m1',
        groupId: 'group-0',
        groupName: 'Група А',
        round: 1,
        team1,
        team2,
      },
    ];

    render(<MatchScheduleList schedule={schedule} />);
    expect(screen.queryByRole('button', { name: /нова програма/i })).not.toBeInTheDocument();
  });

  it('renders "Копирай програмата" button, triggers copy, and temporarily shows "Копирано!"', async () => {
    const copySpy = vi.spyOn(clipboardModule, 'copyTextToClipboard').mockResolvedValue(true);
    vi.useFakeTimers();

    const team1 = createMockTeam('t1', 'Отбор 1', 1200, 'Иван');
    const team2 = createMockTeam('t2', 'Отбор 2', 1300, 'Петър');

    const schedule: TournamentMatch[] = [
      {
        id: 'match-group-0-r1-m1',
        groupId: 'group-0',
        groupName: 'Група А',
        round: 1,
        team1,
        team2,
      },
    ];

    render(<MatchScheduleList schedule={schedule} />);

    const copyBtn = screen.getByRole('button', { name: /копирай програмата/i });
    expect(copyBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(copySpy).toHaveBeenCalledTimes(1);
    expect(copySpy).toHaveBeenCalledWith(expect.stringContaining('📅 Програма на срещите:'));

    // Status changes to "Копирано!"
    expect(screen.getByRole('button', { name: /копирано!/i })).toBeInTheDocument();

    // Advance 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Reverts back to "Копирай програмата"
    expect(screen.getByRole('button', { name: /копирай програмата/i })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders "⚡ Запиши всички мачове" button and calls onSaveAllMatches on click', async () => {
    const onSaveAllMatches = vi.fn();
    const team1 = createMockTeam('t1', 'Отбор 1');
    const team2 = createMockTeam('t2', 'Отбор 2');

    const schedule: TournamentMatch[] = [
      {
        id: 'match-group-0-r1-m1',
        groupId: 'group-0',
        groupName: 'Група А',
        round: 1,
        team1,
        team2,
      },
    ];

    render(
      <MatchScheduleList
        schedule={schedule}
        onSaveAllMatches={onSaveAllMatches}
        isSavingMatches={false}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /запиши всички мачове/i });
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).toHaveAttribute('id', 'saveAllMatchesBtn');
    expect(saveBtn).not.toBeDisabled();
    expect(screen.getByText(/⚡ Запиши всички мачове/i)).toBeInTheDocument();

    fireEvent.click(saveBtn);
    expect(onSaveAllMatches).toHaveBeenCalledTimes(1);
  });

  it('disables save button and displays "Записване..." with spinner during isSavingMatches', () => {
    const onSaveAllMatches = vi.fn();
    const onReset = vi.fn();
    const team1 = createMockTeam('t1', 'Отбор 1');
    const team2 = createMockTeam('t2', 'Отбор 2');

    const schedule: TournamentMatch[] = [
      {
        id: 'match-group-0-r1-m1',
        groupId: 'group-0',
        groupName: 'Група А',
        round: 1,
        team1,
        team2,
      },
    ];

    render(
      <MatchScheduleList
        schedule={schedule}
        onSaveAllMatches={onSaveAllMatches}
        onReset={onReset}
        isSavingMatches={true}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /записване.../i });
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();
    expect(screen.getByText('Записване...')).toBeInTheDocument();

    // Reset button should also be disabled during save
    const resetBtn = screen.getByRole('button', { name: /изчисти програмата/i });
    expect(resetBtn).toBeDisabled();

    fireEvent.click(saveBtn);
    expect(onSaveAllMatches).not.toHaveBeenCalled();
  });

  describe('Multi-group and bye badge handling', () => {
    it('renders multiple bye badges with group names when multiple groups have byes in the same round', () => {
      const teamA1 = createMockTeam('ta1', 'Отбор 1');
      const teamA2 = createMockTeam('ta2', 'Отбор 2');
      const byeA = createMockTeam('ta3', 'Отбор 3');

      const teamB1 = createMockTeam('tb1', 'Отбор 4');
      const teamB2 = createMockTeam('tb2', 'Отбор 5');
      const byeB = createMockTeam('tb3', 'Отбор 6');

      const schedule: TournamentMatch[] = [
        {
          id: 'm-gA-r1-1',
          groupId: 'group-A',
          groupName: 'Група А',
          round: 1,
          team1: teamA1,
          team2: teamA2,
          byeTeam: byeA,
        },
        {
          id: 'm-gB-r1-1',
          groupId: 'group-B',
          groupName: 'Група Б',
          round: 1,
          team1: teamB1,
          team2: teamB2,
          byeTeam: byeB,
        },
      ];

      render(<MatchScheduleList schedule={schedule} />);

      const byeBadges = screen.getAllByTestId('bye-team-badge');
      expect(byeBadges).toHaveLength(2);
      expect(byeBadges[0]).toHaveTextContent('Почива: Отбор 3 (Група А)');
      expect(byeBadges[1]).toHaveTextContent('Почива: Отбор 6 (Група Б)');
    });

    it('renders single-group bye badge without redundant group parentheses', () => {
      const team1 = createMockTeam('t1', 'Отбор 1');
      const team2 = createMockTeam('t2', 'Отбор 2');
      const byeTeam = createMockTeam('t3', 'Отбор 3');

      const schedule: TournamentMatch[] = [
        {
          id: 'm-r1-1',
          groupId: 'group-0',
          groupName: 'Група А',
          round: 1,
          team1,
          team2,
          byeTeam,
        },
      ];

      render(<MatchScheduleList schedule={schedule} />);

      const byeBadges = screen.getAllByTestId('bye-team-badge');
      expect(byeBadges).toHaveLength(1);
      expect(byeBadges[0]).toHaveTextContent('Почива: Отбор 3');
      expect(byeBadges[0]).not.toHaveTextContent('(Група А)');
    });

    it('renders bye badges only for odd groups in mixed group configurations (Group A: 4, Group B: 3, Group C: 3)', () => {
      // Group A (4 teams, 2 matches per round, no byes)
      const teamA1 = createMockTeam('ta1', 'Отбор 1');
      const teamA2 = createMockTeam('ta2', 'Отбор 2');
      const teamA3 = createMockTeam('ta3', 'Отбор 3');
      const teamA4 = createMockTeam('ta4', 'Отбор 4');

      // Group B (3 teams, 1 match, 1 bye)
      const teamB1 = createMockTeam('tb1', 'Отбор 5');
      const teamB2 = createMockTeam('tb2', 'Отбор 6');
      const byeB = createMockTeam('tb3', 'Отбор 7');

      // Group C (3 teams, 1 match, 1 bye)
      const teamC1 = createMockTeam('tc1', 'Отбор 8');
      const teamC2 = createMockTeam('tc2', 'Отбор 9');
      const byeC = createMockTeam('tc3', 'Отбор 10');

      const schedule: TournamentMatch[] = [
        {
          id: 'm-ga-1',
          groupId: 'group-A',
          groupName: 'Група А',
          round: 1,
          team1: teamA1,
          team2: teamA2,
        },
        {
          id: 'm-ga-2',
          groupId: 'group-A',
          groupName: 'Група А',
          round: 1,
          team1: teamA3,
          team2: teamA4,
        },
        {
          id: 'm-gb-1',
          groupId: 'group-B',
          groupName: 'Група Б',
          round: 1,
          team1: teamB1,
          team2: teamB2,
          byeTeam: byeB,
        },
        {
          id: 'm-gc-1',
          groupId: 'group-C',
          groupName: 'Група В',
          round: 1,
          team1: teamC1,
          team2: teamC2,
          byeTeam: byeC,
        },
      ];

      render(<MatchScheduleList schedule={schedule} />);

      const byeBadges = screen.getAllByTestId('bye-team-badge');
      expect(byeBadges).toHaveLength(2);
      expect(byeBadges[0]).toHaveTextContent('Почива: Отбор 7 (Група Б)');
      expect(byeBadges[1]).toHaveTextContent('Почива: Отбор 10 (Група В)');
      expect(screen.getAllByText('Група А').length).toBeGreaterThan(0); // match group labels
      expect(screen.queryByText(/Почива.*Група А/)).not.toBeInTheDocument();
    });

    it('renders 3 bye badges per round with correct group names for 3 odd groups', () => {
      const byeA = createMockTeam('ta3', 'Отбор 3');
      const byeB = createMockTeam('tb3', 'Отбор 6');
      const byeC = createMockTeam('tc3', 'Отбор 9');

      const schedule: TournamentMatch[] = [
        {
          id: 'm-ga-1',
          groupId: 'group-A',
          groupName: 'Група А',
          round: 1,
          team1: createMockTeam('ta1', 'Отбор 1'),
          team2: createMockTeam('ta2', 'Отбор 2'),
          byeTeam: byeA,
        },
        {
          id: 'm-gb-1',
          groupId: 'group-B',
          groupName: 'Група Б',
          round: 1,
          team1: createMockTeam('tb1', 'Отбор 4'),
          team2: createMockTeam('tb2', 'Отбор 5'),
          byeTeam: byeB,
        },
        {
          id: 'm-gc-1',
          groupId: 'group-C',
          groupName: 'Група В',
          round: 1,
          team1: createMockTeam('tc1', 'Отбор 7'),
          team2: createMockTeam('tc2', 'Отбор 8'),
          byeTeam: byeC,
        },
      ];

      render(<MatchScheduleList schedule={schedule} />);

      const byeBadges = screen.getAllByTestId('bye-team-badge');
      expect(byeBadges).toHaveLength(3);
      expect(byeBadges[0]).toHaveTextContent('Почива: Отбор 3 (Група А)');
      expect(byeBadges[1]).toHaveTextContent('Почива: Отбор 6 (Група Б)');
      expect(byeBadges[2]).toHaveTextContent('Почива: Отбор 9 (Група В)');
    });

    it('renders 0 bye badges when all groups have an even number of teams', () => {
      const schedule: TournamentMatch[] = [
        {
          id: 'm-ga-1',
          groupId: 'group-A',
          groupName: 'Група А',
          round: 1,
          team1: createMockTeam('ta1', 'Отбор 1'),
          team2: createMockTeam('ta2', 'Отбор 2'),
        },
        {
          id: 'm-gb-1',
          groupId: 'group-B',
          groupName: 'Група Б',
          round: 1,
          team1: createMockTeam('tb1', 'Отбор 3'),
          team2: createMockTeam('tb2', 'Отбор 4'),
        },
      ];

      render(<MatchScheduleList schedule={schedule} />);

      expect(screen.queryAllByTestId('bye-team-badge')).toHaveLength(0);
      expect(screen.queryByText(/почива:/i)).not.toBeInTheDocument();
    });
  });
});

