import { describe, it, expect } from 'vitest';
import { calculateGroupStandings, calculateAllGroupStandings, formatMatchScoreDisplay } from '../standings';
import type { StandingsMatchInput } from '../../types/standings';

describe('calculateGroupStandings Engine', () => {
  // Scenario 1: Unplayed group (0 matches completed)
  it('includes all group teams with zeroed stats when no matches are completed', () => {
    const teams = ['Отбор В', 'Отбор А', 'Отбор Б', 'Отбор Г'];
    const matches: StandingsMatchInput[] = [
      { team_1_name: 'Отбор В', team_2_name: 'Отбор А', team_1_score: null, team_2_score: null },
      { team_1_name: 'Отбор Б', team_2_name: 'Отбор Г', team_1_score: null, team_2_score: null },
    ];

    const standings = calculateGroupStandings(teams, matches);

    expect(standings).toHaveLength(4);
    standings.forEach((row) => {
      expect(row.played).toBe(0);
      expect(row.won).toBe(0);
      expect(row.lost).toBe(0);
      expect(row.gamesWon).toBe(0);
      expect(row.gamesLost).toBe(0);
      expect(row.gameDiff).toBe(0);
      expect(row.points).toBe(0);
    });

    // Sorted by Bulgarian alphabetical order
    expect(standings.map((r) => r.teamName)).toEqual([
      'Отбор А',
      'Отбор Б',
      'Отбор В',
      'Отбор Г',
    ]);
    expect(standings.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  // Scenario 2: Standard ranking by points
  it('ranks teams correctly based on points won', () => {
    const teams = ['Отбор А', 'Отбор Б', 'Отбор В'];
    const matches: StandingsMatchInput[] = [
      // Team A beats Team B
      { team_1_name: 'Отбор А', team_2_name: 'Отбор Б', team_1_score: 6, team_2_score: 3 },
      // Team A beats Team C
      { team_1_name: 'Отбор А', team_2_name: 'Отбор В', team_1_score: 6, team_2_score: 2 },
      // Team B beats Team C
      { team_1_name: 'Отбор Б', team_2_name: 'Отбор В', team_1_score: 6, team_2_score: 4 },
    ];

    const standings = calculateGroupStandings(teams, matches);

    expect(standings[0].teamName).toBe('Отбор А');
    expect(standings[0].points).toBe(2);
    expect(standings[0].won).toBe(2);
    expect(standings[0].lost).toBe(0);
    expect(standings[0].rank).toBe(1);

    expect(standings[1].teamName).toBe('Отбор Б');
    expect(standings[1].points).toBe(1);
    expect(standings[1].won).toBe(1);
    expect(standings[1].lost).toBe(1);
    expect(standings[1].rank).toBe(2);

    expect(standings[2].teamName).toBe('Отбор В');
    expect(standings[2].points).toBe(0);
    expect(standings[2].won).toBe(0);
    expect(standings[2].lost).toBe(2);
    expect(standings[2].rank).toBe(3);
  });

  // Scenario 3: 2-team tie-break via direct head-to-head
  it('breaks 2-team point tie using direct head-to-head match result', () => {
    const teams = ['Отбор А', 'Отбор Б'];
    const matches: StandingsMatchInput[] = [
      { team_1_name: 'Отбор А', team_2_name: 'Отбор Б', team_1_score: 4, team_2_score: 6 },
    ];

    const standings = calculateGroupStandings(teams, matches);

    expect(standings[0].teamName).toBe('Отбор Б');
    expect(standings[0].points).toBe(1);
    expect(standings[0].rank).toBe(1);

    expect(standings[1].teamName).toBe('Отбор А');
    expect(standings[1].points).toBe(0);
    expect(standings[1].rank).toBe(2);
  });

  it('correctly prioritizes H2H winner when two teams are tied on points', () => {
    const teams = ['Отбор А', 'Отбор Б', 'Отбор В', 'Отбор Г'];

    // Points:
    // Team Г: 3 points
    // Team Б: 2 points (beat C, beat A)
    // Team А: 1 point (beat C)
    // Let's adjust so A and B have EQUAL points:
    // Matches:
    // A beats D (6-0) -> A has 1 win
    // B beats D (6-0) -> B has 1 win
    // Direct match: B beats A (6-4) -> B has 2 wins, A has 1 win.
    // To have A and B tied on points:
    // Say A beats C (6-0).
    // D beats B (6-0).
    // Direct match: B beats A (6-4).
    // D beats C.
    // Points:
    // A: beat C (1 pt). Lost to B (0 pt). Total: 1 pt.
    // B: beat A (1 pt). Lost to D (0 pt). Total: 1 pt.
    // Direct match: B beat A.
    // Even though A might have better overall score diff against C (e.g. +6) than B against D (-6),
    // Tier 2 H2H demands B ranks above A!
    const matchesEqualPoints: StandingsMatchInput[] = [
      { team_1_name: 'Отбор А', team_2_name: 'Отбор В', team_1_score: 6, team_2_score: 0 }, // A diff: +6
      { team_1_name: 'Отбор Г', team_2_name: 'Отбор Б', team_1_score: 6, team_2_score: 1 }, // B diff: -5
      { team_1_name: 'Отбор А', team_2_name: 'Отбор Б', team_1_score: 4, team_2_score: 6 }, // B beat A! A diff +4, B diff -3
    ];

    const standings = calculateGroupStandings(teams, matchesEqualPoints);
    const rowA = standings.find((r) => r.teamName === 'Отбор А')!;
    const rowB = standings.find((r) => r.teamName === 'Отбор Б')!;

    expect(rowA.points).toBe(1);
    expect(rowB.points).toBe(1);
    expect(rowA.gameDiff).toBe(4); // 10 scored, 6 conceded = +4
    expect(rowB.gameDiff).toBe(-3); // 7 scored, 10 conceded = -3

    // Despite rowA having +4 diff vs rowB having -3 diff, rowB ranks higher due to H2H!
    expect(rowB.rank).toBeLessThan(rowA.rank);
  });

  // Scenario 4: 3-team circular tie-break (A beat B, B beat C, C beat A)
  it('resolves 3-team circular tie using game difference (+/-)', () => {
    const teams = ['Отбор А', 'Отбор Б', 'Отбор В'];
    const matches: StandingsMatchInput[] = [
      // A beat B (6-2) -> A: gamesWon 6, gamesLost 2. B: gamesWon 2, gamesLost 6
      { team_1_name: 'Отбор А', team_2_name: 'Отбор Б', team_1_score: 6, team_2_score: 2 },
      // B beat C (6-4) -> B: gamesWon 6, gamesLost 4. C: gamesWon 4, gamesLost 6
      { team_1_name: 'Отбор Б', team_2_name: 'Отбор В', team_1_score: 6, team_2_score: 4 },
      // C beat A (7-5) -> C: gamesWon 7, gamesLost 5. A: gamesWon 5, gamesLost 7
      { team_1_name: 'Отбор В', team_2_name: 'Отбор А', team_1_score: 7, team_2_score: 5 },
    ];

    // Stats:
    // A: 1 win, 1 loss, points = 1. gamesWon = 6 + 5 = 11, gamesLost = 2 + 7 = 9. diff = +2
    // B: 1 win, 1 loss, points = 1. gamesWon = 2 + 6 = 8, gamesLost = 6 + 4 = 10. diff = -2
    // C: 1 win, 1 loss, points = 1. gamesWon = 4 + 7 = 11, gamesLost = 6 + 5 = 11. diff = 0
    const standings = calculateGroupStandings(teams, matches);

    expect(standings).toHaveLength(3);
    expect(standings[0].teamName).toBe('Отбор А');
    expect(standings[0].gameDiff).toBe(2);
    expect(standings[0].rank).toBe(1);

    expect(standings[1].teamName).toBe('Отбор В');
    expect(standings[1].gameDiff).toBe(0);
    expect(standings[1].rank).toBe(2);

    expect(standings[2].teamName).toBe('Отбор Б');
    expect(standings[2].gameDiff).toBe(-2);
    expect(standings[2].rank).toBe(3);
  });

  // Scenario 5: Games won tie-break when gameDiff is also equal
  it('breaks tie via total games won when points, H2H, and gameDiff are identical', () => {
    // Team X and Team Y did not play each other (or tied H2H).
    // Both have 1 win, 1 loss, same gameDiff (+2).
    // Team X: won 12-10 (diff +2, gamesWon = 12)
    // Team Y: won 8-6 (diff +2, gamesWon = 8)
    const teams = ['Отбор X', 'Отбор Y', 'Отбор Z1', 'Отбор Z2'];
    const matches: StandingsMatchInput[] = [
      { team_1_name: 'Отбор X', team_2_name: 'Отбор Z1', team_1_score: 12, team_2_score: 10 },
      { team_1_name: 'Отбор Y', team_2_name: 'Отбор Z2', team_1_score: 8, team_2_score: 6 },
    ];

    const standings = calculateGroupStandings(teams, matches);
    const rowX = standings.find((r) => r.teamName === 'Отбор X')!;
    const rowY = standings.find((r) => r.teamName === 'Отбор Y')!;

    expect(rowX.points).toBe(1);
    expect(rowY.points).toBe(1);
    expect(rowX.gameDiff).toBe(2);
    expect(rowY.gameDiff).toBe(2);
    expect(rowX.gamesWon).toBe(12);
    expect(rowY.gamesWon).toBe(8);

    expect(rowX.rank).toBeLessThan(rowY.rank);
  });

  // Scenario 6: Bulgarian alphabetical fallback
  it('breaks final tie deterministically using Bulgarian locale comparison', () => {
    const teams = ['Борис', 'Антон'];
    // Neither has played any match or identical stats
    const standings = calculateGroupStandings(teams, []);

    expect(standings[0].teamName).toBe('Антон');
    expect(standings[0].rank).toBe(1);
    expect(standings[1].teamName).toBe('Борис');
    expect(standings[1].rank).toBe(2);
  });

  it('infers team roster automatically if empty teams array is supplied', () => {
    const matches: StandingsMatchInput[] = [
      { team_1_name: 'Отбор 1', team_2_name: 'Отбор 2', team_1_score: 6, team_2_score: 3 },
    ];

    const standings = calculateGroupStandings([], matches);
    expect(standings).toHaveLength(2);
    expect(standings[0].teamName).toBe('Отбор 1');
    expect(standings[1].teamName).toBe('Отбор 2');
  });

  it('calculates all groups correctly with calculateAllGroupStandings', () => {
    const groups = [
      { name: 'Група А', teams: ['А1', 'А2'] },
      { name: 'Група Б', teams: ['Б1', 'Б2'] },
    ];
    const matches: StandingsMatchInput[] = [
      { group_name: 'Група А', team_1_name: 'А1', team_2_name: 'А2', team_1_score: 6, team_2_score: 1 },
      { group_name: 'Група Б', team_1_name: 'Б1', team_2_name: 'Б2', team_1_score: 2, team_2_score: 6 },
    ];

    const allStandings = calculateAllGroupStandings(groups, matches);

    expect(allStandings).toHaveLength(2);
    expect(allStandings[0].groupName).toBe('Група А');
    expect(allStandings[0].rows[0].teamName).toBe('А1');
    expect(allStandings[0].rows[0].points).toBe(1);

    expect(allStandings[1].groupName).toBe('Група Б');
    expect(allStandings[1].rows[0].teamName).toBe('Б2');
    expect(allStandings[1].rows[0].points).toBe(1);
  });

  // Scenario 7: Multi-Set Games Aggregation vs Won Sets
  it('correctly calculates points and aggregates games for multi-set tennis matches', () => {
    const teams = ['Отбор 1', 'Отбор 2'];
    const matches: StandingsMatchInput[] = [
      {
        team_1_name: 'Отбор 1',
        team_2_name: 'Отбор 2',
        team_1_score: 2, // 2 sets won
        team_2_score: 1, // 1 set won
        sets: [
          { set_number: 1, team_1_score: 1, team_2_score: 6 },
          { set_number: 2, team_1_score: 7, team_2_score: 6 },
          { set_number: 3, team_1_score: 7, team_2_score: 6 },
        ],
      },
    ];

    const standings = calculateGroupStandings(teams, matches);

    expect(standings).toHaveLength(2);
    const row1 = standings.find((r) => r.teamName === 'Отбор 1')!;
    const row2 = standings.find((r) => r.teamName === 'Отбор 2')!;

    // Team 1 won the match (2 sets to 1) -> won = 1, points = 1
    expect(row1.won).toBe(1);
    expect(row1.lost).toBe(0);
    expect(row1.points).toBe(1);
    expect(row1.gamesWon).toBe(15);
    expect(row1.gamesLost).toBe(18);
    expect(row1.gameDiff).toBe(-3);

    // Team 2 lost -> won = 0, points = 0
    expect(row2.won).toBe(0);
    expect(row2.lost).toBe(1);
    expect(row2.points).toBe(0);
    expect(row2.gamesWon).toBe(18);
    expect(row2.gamesLost).toBe(15);
    expect(row2.gameDiff).toBe(3);

    // Team 1 is ranked #1 because points take priority over game difference
    expect(row1.rank).toBe(1);
    expect(row2.rank).toBe(2);
  });

  // Scenario 8: Head-to-Head Multi-Set Resolution
  it('resolves head-to-head tie between two teams using multi-set outcome', () => {
    const teams = ['Отбор А', 'Отбор Б', 'Отбор В', 'Отбор Г'];
    // Team C wins 2 matches (2 points): beats A and beats D
    // Team D loses both matches (0 points)
    // Direct match: Team A beats Team B in 3 sets (2 sets to 1: 1-6, 7-6, 7-6)
    // Team B beats Team D (6-0) -> Team B ends with 1 point
    // Team A lost to Team C (0-6) -> Team A ends with 1 point
    // Both Team A and Team B are tied on exactly 1 point each.
    const matches: StandingsMatchInput[] = [
      {
        team_1_name: 'Отбор В',
        team_2_name: 'Отбор А',
        team_1_score: 6,
        team_2_score: 0,
      },
      {
        team_1_name: 'Отбор В',
        team_2_name: 'Отбор Г',
        team_1_score: 6,
        team_2_score: 0,
      },
      {
        team_1_name: 'Отбор Б',
        team_2_name: 'Отбор Г',
        team_1_score: 6,
        team_2_score: 0,
      },
      {
        team_1_name: 'Отбор А',
        team_2_name: 'Отбор Б',
        team_1_score: 2,
        team_2_score: 1,
        sets: [
          { set_number: 1, team_1_score: 1, team_2_score: 6 },
          { set_number: 2, team_1_score: 7, team_2_score: 6 },
          { set_number: 3, team_1_score: 7, team_2_score: 6 },
        ],
      },
    ];

    const standings = calculateGroupStandings(teams, matches);
    const rowA = standings.find((r) => r.teamName === 'Отбор А')!;
    const rowB = standings.find((r) => r.teamName === 'Отбор Б')!;

    expect(rowA.points).toBe(1);
    expect(rowB.points).toBe(1);
    // Despite rowA having -9 gameDiff and rowB having +5 gameDiff,
    // Team A beat Team B in H2H multi-set match, so Team A must rank above Team B!
    expect(rowA.rank).toBeLessThan(rowB.rank);
  });

  // Scenario 9: formatMatchScoreDisplay formatting
  it('formats single and multi-set match scores correctly', () => {
    expect(
      formatMatchScoreDisplay({
        team_1_score: 6,
        team_2_score: 4,
        sets: null,
      })
    ).toBe('6 : 4');

    expect(
      formatMatchScoreDisplay({
        team_1_score: 2,
        team_2_score: 1,
        sets: [
          { set_number: 1, team_1_score: 6, team_2_score: 4 },
          { set_number: 2, team_1_score: 3, team_2_score: 6 },
          { set_number: 3, team_1_score: 10, team_2_score: 7 },
        ],
      })
    ).toBe('6:4, 3:6, 10:7');

    expect(
      formatMatchScoreDisplay({
        team_1_score: null,
        team_2_score: null,
      })
    ).toBe('- : -');
  });
});
