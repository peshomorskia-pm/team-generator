import { describe, it, expect } from 'vitest';
import { generateGroupRoundRobin, generateTournamentSchedule } from '../roundRobin';
import type { Team, TournamentGroup } from '../../types';

function createMockTeam(id: string, name: string): Team {
  return {
    id,
    name,
    players: [{ id: `p-${id}`, name: `Player ${name}` }],
  };
}

describe('generateGroupRoundRobin', () => {
  it('returns empty array when teams count < 2', () => {
    const group0: TournamentGroup = {
      id: 'group-0',
      name: 'Група А',
      teams: [],
    };
    expect(generateGroupRoundRobin(group0)).toEqual([]);

    const group1: TournamentGroup = {
      id: 'group-0',
      name: 'Група А',
      teams: [createMockTeam('t1', 'Team 1')],
    };
    expect(generateGroupRoundRobin(group1)).toEqual([]);
  });

  it('correctly schedules N = 2 teams (1 round, 1 match, 0 byes)', () => {
    const teams = [createMockTeam('t1', 'Team 1'), createMockTeam('t2', 'Team 2')];
    const group: TournamentGroup = {
      id: 'group-0',
      name: 'Група А',
      teams,
    };

    const rounds = generateGroupRoundRobin(group);
    expect(rounds).toHaveLength(1);
    expect(rounds[0].roundNumber).toBe(1);
    expect(rounds[0].matches).toHaveLength(1);
    expect(rounds[0].byeTeam).toBeUndefined();
    expect(rounds[0].matches[0].id).toBe('match-group-0-r1-m1');
    expect(rounds[0].matches[0].team1.id).toBe('t1');
    expect(rounds[0].matches[0].team2.id).toBe('t2');
  });

  it('correctly schedules N = 3 teams (3 rounds, 1 match per round, 1 bye per round, 3 total matches)', () => {
    const teams = [
      createMockTeam('t1', 'Team 1'),
      createMockTeam('t2', 'Team 2'),
      createMockTeam('t3', 'Team 3'),
    ];
    const group: TournamentGroup = {
      id: 'group-0',
      name: 'Група А',
      teams,
    };

    const rounds = generateGroupRoundRobin(group);

    // Round count
    expect(rounds).toHaveLength(3);

    // Each round has exactly 1 match and 1 bye
    const allMatches = rounds.flatMap((r) => r.matches);
    expect(allMatches).toHaveLength(3);

    rounds.forEach((round, idx) => {
      expect(round.roundNumber).toBe(idx + 1);
      expect(round.matches).toHaveLength(1);
      expect(round.byeTeam).toBeDefined();
    });

    // Verify all teams have rested exactly once
    const byeTeamIds = rounds.map((r) => r.byeTeam?.id);
    expect(new Set(byeTeamIds).size).toBe(3);
    expect(byeTeamIds).toContain('t1');
    expect(byeTeamIds).toContain('t2');
    expect(byeTeamIds).toContain('t3');

    // Verify pair uniqueness
    const pairs = allMatches.map((m) => [m.team1.id, m.team2.id].sort().join('-'));
    expect(new Set(pairs).size).toBe(3);
    expect(pairs).toContain('t1-t2');
    expect(pairs).toContain('t1-t3');
    expect(pairs).toContain('t2-t3');
  });

  it('correctly schedules N = 4 teams (3 rounds, 2 matches per round, 0 byes, 6 total matches)', () => {
    const teams = [
      createMockTeam('t1', 'Team 1'),
      createMockTeam('t2', 'Team 2'),
      createMockTeam('t3', 'Team 3'),
      createMockTeam('t4', 'Team 4'),
    ];
    const group: TournamentGroup = {
      id: 'group-0',
      name: 'Група А',
      teams,
    };

    const rounds = generateGroupRoundRobin(group);

    expect(rounds).toHaveLength(3);

    const allMatches = rounds.flatMap((r) => r.matches);
    expect(allMatches).toHaveLength(6);

    rounds.forEach((round, idx) => {
      expect(round.roundNumber).toBe(idx + 1);
      expect(round.matches).toHaveLength(2);
      expect(round.byeTeam).toBeUndefined();
    });

    // Verify pairings uniqueness
    const pairs = allMatches.map((m) => [m.team1.id, m.team2.id].sort().join('-'));
    expect(new Set(pairs).size).toBe(6);
    expect(pairs).toContain('t1-t2');
    expect(pairs).toContain('t1-t3');
    expect(pairs).toContain('t1-t4');
    expect(pairs).toContain('t2-t3');
    expect(pairs).toContain('t2-t4');
    expect(pairs).toContain('t3-t4');
  });

  it('correctly schedules N = 5 teams (5 rounds, 2 matches per round, 1 bye per round, 10 total matches)', () => {
    const teams = [
      createMockTeam('t1', 'Team 1'),
      createMockTeam('t2', 'Team 2'),
      createMockTeam('t3', 'Team 3'),
      createMockTeam('t4', 'Team 4'),
      createMockTeam('t5', 'Team 5'),
    ];
    const group: TournamentGroup = {
      id: 'group-0',
      name: 'Група А',
      teams,
    };

    const rounds = generateGroupRoundRobin(group);

    expect(rounds).toHaveLength(5);

    const allMatches = rounds.flatMap((r) => r.matches);
    expect(allMatches).toHaveLength(10);

    rounds.forEach((round, idx) => {
      expect(round.roundNumber).toBe(idx + 1);
      expect(round.matches).toHaveLength(2);
      expect(round.byeTeam).toBeDefined();
    });

    // Verify all teams rested once
    const byeTeamIds = rounds.map((r) => r.byeTeam?.id);
    expect(new Set(byeTeamIds).size).toBe(5);

    // Verify pairings uniqueness: C(5, 2) = 10
    const pairs = allMatches.map((m) => [m.team1.id, m.team2.id].sort().join('-'));
    expect(new Set(pairs).size).toBe(10);
  });

  it('is purely functional and idempotent', () => {
    const teams = [
      createMockTeam('t1', 'Team 1'),
      createMockTeam('t2', 'Team 2'),
      createMockTeam('t3', 'Team 3'),
    ];
    const group: TournamentGroup = {
      id: 'group-0',
      name: 'Група А',
      teams,
    };

    const originalTeamsOrder = [...group.teams];
    const run1 = generateGroupRoundRobin(group);
    const run2 = generateGroupRoundRobin(group);

    // Idempotent outputs
    expect(run1).toEqual(run2);

    // Did not mutate input teams
    expect(group.teams).toEqual(originalTeamsOrder);
  });
});

describe('generateTournamentSchedule', () => {
  it('returns empty array for empty groups', () => {
    expect(generateTournamentSchedule([])).toEqual([]);
  });

  it('aggregates matches across multiple groups in group-round order', () => {
    const groupA: TournamentGroup = {
      id: 'group-0',
      name: 'Група А',
      teams: [
        createMockTeam('a1', 'Отбор А1'),
        createMockTeam('a2', 'Отбор А2'),
        createMockTeam('a3', 'Отбор А3'),
      ],
    };
    const groupB: TournamentGroup = {
      id: 'group-1',
      name: 'Група Б',
      teams: [
        createMockTeam('b1', 'Отбор Б1'),
        createMockTeam('b2', 'Отбор Б2'),
        createMockTeam('b3', 'Отбор Б3'),
      ],
    };

    const schedule = generateTournamentSchedule([groupA, groupB]);

    // 3 matches in Group A + 3 matches in Group B = 6 matches total
    expect(schedule).toHaveLength(6);

    // Check first 3 matches belong to Group A
    expect(schedule[0].groupId).toBe('group-0');
    expect(schedule[1].groupId).toBe('group-0');
    expect(schedule[2].groupId).toBe('group-0');

    // Check last 3 matches belong to Group B
    expect(schedule[3].groupId).toBe('group-1');
    expect(schedule[4].groupId).toBe('group-1');
    expect(schedule[5].groupId).toBe('group-1');

    // Formatted match IDs
    expect(schedule[0].id).toBe('match-group-0-r1-m1');
    expect(schedule[3].id).toBe('match-group-1-r1-m1');
  });
});
