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
});
