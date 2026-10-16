import type { Team } from '../types';
import type { GroupStandingRow, GroupStanding, StandingsMatchInput } from '../types/standings';
import type { MatchSet } from '../types/match';

export interface MatchOutcome {
  isCompleted: boolean;
  winner: 'team_1' | 'team_2' | 'draw' | null;
  team1GamesWon: number;
  team2GamesWon: number;
  team1SetsWon: number;
  team2SetsWon: number;
}

export function getMatchOutcome(m: StandingsMatchInput): MatchOutcome {
  // 1. Multi-set evaluation if sets array is present and non-empty
  if (m.sets && m.sets.length > 0) {
    let t1Sets = 0;
    let t2Sets = 0;
    let t1Games = 0;
    let t2Games = 0;

    for (const s of m.sets) {
      t1Games += s.team_1_score;
      t2Games += s.team_2_score;
      if (s.team_1_score > s.team_2_score) t1Sets += 1;
      else if (s.team_2_score > s.team_1_score) t2Sets += 1;
    }

    const winner = t1Sets > t2Sets ? 'team_1' : t2Sets > t1Sets ? 'team_2' : 'draw';
    return {
      isCompleted: true,
      winner,
      team1GamesWon: t1Games,
      team2GamesWon: t2Games,
      team1SetsWon: t1Sets,
      team2SetsWon: t2Sets,
    };
  }

  // 2. Legacy fallback for single-set or historical score records
  const isCompleted =
    m.team_1_score !== null &&
    m.team_1_score !== undefined &&
    typeof m.team_1_score === 'number' &&
    !Number.isNaN(m.team_1_score) &&
    m.team_2_score !== null &&
    m.team_2_score !== undefined &&
    typeof m.team_2_score === 'number' &&
    !Number.isNaN(m.team_2_score);

  if (!isCompleted) {
    return {
      isCompleted: false,
      winner: null,
      team1GamesWon: 0,
      team2GamesWon: 0,
      team1SetsWon: 0,
      team2SetsWon: 0,
    };
  }

  const s1 = m.team_1_score!;
  const s2 = m.team_2_score!;
  const winner = s1 > s2 ? 'team_1' : s2 > s1 ? 'team_2' : 'draw';

  return {
    isCompleted: true,
    winner,
    team1GamesWon: s1,
    team2GamesWon: s2,
    team1SetsWon: s1 > s2 ? 1 : 0,
    team2SetsWon: s2 > s1 ? 1 : 0,
  };
}

export function formatMatchScoreDisplay(match: {
  team_1_score: number | null;
  team_2_score: number | null;
  sets?: MatchSet[] | null;
}): string {
  if (match.sets && match.sets.length > 0) {
    return match.sets.map((s) => `${s.team_1_score}:${s.team_2_score}`).join(', ');
  }
  if (match.team_1_score !== null && match.team_2_score !== null) {
    return `${match.team_1_score} : ${match.team_2_score}`;
  }
  return '- : -';
}

/**
 * Normalizes an entry from teams parameter into an id and name.
 */
function normalizeTeam(t: Team | string): { id: string; name: string } {
  if (typeof t === 'string') {
    return { id: t, name: t };
  }
  return { id: t.id, name: t.name };
}

/**
 * Resolves a tie between exactly 2 teams using head-to-head match results.
 * Falls back to gameDiff, gamesWon, and Bulgarian alphabetical order.
 */
function resolveTwoTeamTie(
  a: GroupStandingRow,
  b: GroupStandingRow,
  matches: StandingsMatchInput[]
): GroupStandingRow[] {
  let aWins = 0;
  let bWins = 0;

  for (const m of matches) {
    const outcome = getMatchOutcome(m);
    if (!outcome.isCompleted) {
      continue;
    }

    const t1 = m.team_1_name;
    const t2 = m.team_2_name;

    if (t1 === a.teamName && t2 === b.teamName) {
      if (outcome.winner === 'team_1') aWins++;
      else if (outcome.winner === 'team_2') bWins++;
    } else if (t1 === b.teamName && t2 === a.teamName) {
      if (outcome.winner === 'team_1') bWins++;
      else if (outcome.winner === 'team_2') aWins++;
    }
  }

  if (aWins > bWins) return [a, b];
  if (bWins > aWins) return [b, a];

  // Tier 3: Overall Game Difference
  if (a.gameDiff !== b.gameDiff) {
    return a.gameDiff > b.gameDiff ? [a, b] : [b, a];
  }

  // Tier 4: Total Games Won
  if (a.gamesWon !== b.gamesWon) {
    return a.gamesWon > b.gamesWon ? [a, b] : [b, a];
  }

  // Tier 5: Bulgarian locale alphabetical fallback
  return a.teamName.localeCompare(b.teamName, 'bg') <= 0 ? [a, b] : [b, a];
}

/**
 * Resolves a tie between 3 or more teams.
 * Computes a mini-table among tied teams. If circular, falls through to overall stats.
 */
function resolveMultiTeamTie(
  teams: GroupStandingRow[],
  matches: StandingsMatchInput[]
): GroupStandingRow[] {
  const teamNames = new Set(teams.map((t) => t.teamName));
  const miniPoints = new Map<string, number>();
  for (const t of teams) {
    miniPoints.set(t.teamName, 0);
  }

  // Count head-to-head points among only the tied teams
  for (const m of matches) {
    const outcome = getMatchOutcome(m);
    if (!outcome.isCompleted) {
      continue;
    }

    const t1 = m.team_1_name;
    const t2 = m.team_2_name;

    if (t1 && t2 && teamNames.has(t1) && teamNames.has(t2)) {
      if (outcome.winner === 'team_1') {
        miniPoints.set(t1, (miniPoints.get(t1) ?? 0) + 1);
      } else if (outcome.winner === 'team_2') {
        miniPoints.set(t2, (miniPoints.get(t2) ?? 0) + 1);
      }
    }
  }

  // Check if mini-points differ
  const distinctPoints = new Set(miniPoints.values());
  const isCircular = distinctPoints.size <= 1;

  if (isCircular) {
    // Circular tie: sort by Tier 3 (gameDiff), Tier 4 (gamesWon), Tier 5 (alphabetical)
    return [...teams].sort((a, b) => {
      if (b.gameDiff !== a.gameDiff) {
        return b.gameDiff - a.gameDiff;
      }
      if (b.gamesWon !== a.gamesWon) {
        return b.gamesWon - a.gamesWon;
      }
      return a.teamName.localeCompare(b.teamName, 'bg');
    });
  }

  // Partition by mini-points descending
  const miniGroupMap = new Map<number, GroupStandingRow[]>();
  for (const t of teams) {
    const pts = miniPoints.get(t.teamName) ?? 0;
    const list = miniGroupMap.get(pts) || [];
    list.push(t);
    miniGroupMap.set(pts, list);
  }

  const sortedPts = Array.from(miniGroupMap.keys()).sort((a, b) => b - a);
  const result: GroupStandingRow[] = [];

  for (const pts of sortedPts) {
    const subCluster = miniGroupMap.get(pts)!;
    if (subCluster.length === 1) {
      result.push(subCluster[0]);
    } else if (subCluster.length === 2) {
      result.push(...resolveTwoTeamTie(subCluster[0], subCluster[1], matches));
    } else {
      result.push(...resolveMultiTeamTie(subCluster, matches));
    }
  }

  return result;
}

/**
 * Break ties among a cluster of teams adhering to the 5-tier tie-breaking algorithm.
 */
function breakTies(
  cluster: GroupStandingRow[],
  matches: StandingsMatchInput[]
): GroupStandingRow[] {
  if (cluster.length <= 1) return cluster;

  // Tier 1: Group by points descending
  const pointsMap = new Map<number, GroupStandingRow[]>();
  for (const row of cluster) {
    const list = pointsMap.get(row.points) || [];
    list.push(row);
    pointsMap.set(row.points, list);
  }

  const sortedPoints = Array.from(pointsMap.keys()).sort((a, b) => b - a);
  const result: GroupStandingRow[] = [];

  for (const pts of sortedPoints) {
    const subCluster = pointsMap.get(pts)!;
    if (subCluster.length === 1) {
      result.push(subCluster[0]);
    } else if (subCluster.length === 2) {
      result.push(...resolveTwoTeamTie(subCluster[0], subCluster[1], matches));
    } else {
      result.push(...resolveMultiTeamTie(subCluster, matches));
    }
  }

  return result;
}

/**
 * Calculates deterministic standings for a single group of teams given a list of matches.
 * Roster can be specified explicitly as Team[] or string[], or auto-inferred from matches if empty.
 */
export function calculateGroupStandings(
  teams: (Team | string)[],
  matches: StandingsMatchInput[]
): GroupStandingRow[] {
  // 1. Roster extraction
  const rosterMap = new Map<string, { id: string; name: string }>();

  if (teams && teams.length > 0) {
    for (const item of teams) {
      const norm = normalizeTeam(item);
      rosterMap.set(norm.name, norm);
    }
  } else {
    for (const m of matches) {
      if (m.team_1_name && !rosterMap.has(m.team_1_name)) {
        rosterMap.set(m.team_1_name, { id: m.team_1_name, name: m.team_1_name });
      }
      if (m.team_2_name && !rosterMap.has(m.team_2_name)) {
        rosterMap.set(m.team_2_name, { id: m.team_2_name, name: m.team_2_name });
      }
    }
  }

  // 2. Initialize zeroed rows
  const rowsMap = new Map<string, GroupStandingRow>();
  for (const [, team] of rosterMap.entries()) {
    rowsMap.set(team.name, {
      rank: 0,
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      lost: 0,
      gamesWon: 0,
      gamesLost: 0,
      gameDiff: 0,
      points: 0,
    });
  }

  // 3. Process completed matches
  for (const m of matches) {
    const outcome = getMatchOutcome(m);
    if (!outcome.isCompleted) {
      continue;
    }

    const t1 = m.team_1_name ? rowsMap.get(m.team_1_name) : undefined;
    const t2 = m.team_2_name ? rowsMap.get(m.team_2_name) : undefined;

    if (!t1 || !t2) {
      continue;
    }

    t1.played += 1;
    t2.played += 1;

    t1.gamesWon += outcome.team1GamesWon;
    t1.gamesLost += outcome.team2GamesWon;

    t2.gamesWon += outcome.team2GamesWon;
    t2.gamesLost += outcome.team1GamesWon;

    if (outcome.winner === 'team_1') {
      t1.won += 1;
      t1.points += 1;
      t2.lost += 1;
    } else if (outcome.winner === 'team_2') {
      t2.won += 1;
      t2.points += 1;
      t1.lost += 1;
    }

    t1.gameDiff = t1.gamesWon - t1.gamesLost;
    t2.gameDiff = t2.gamesWon - t2.gamesLost;
  }

  const initialRows = Array.from(rowsMap.values());

  // 4. Multi-tier deterministic tie-break sorting
  const sorted = breakTies(initialRows, matches);

  // 5. Assign 1-indexed ranks
  return sorted.map((row, idx) => ({
    ...row,
    rank: idx + 1,
  }));
}

/**
 * Partitions matches by group_name and returns standings for all detected or specified groups.
 */
export function calculateAllGroupStandings(
  groups: { id?: string; name: string; teams?: (Team | string)[] }[],
  matches: StandingsMatchInput[]
): GroupStanding[] {
  let groupsToProcess = groups;

  if (!groupsToProcess || groupsToProcess.length === 0) {
    const groupNameSet = new Set<string>();
    for (const m of matches) {
      if (m.group_name) {
        groupNameSet.add(m.group_name);
      }
    }
    const sortedGroupNames = Array.from(groupNameSet).sort((a, b) =>
      a.localeCompare(b, 'bg')
    );
    groupsToProcess = sortedGroupNames.map((name) => ({
      id: name,
      name,
    }));
  }

  return groupsToProcess.map((grp) => {
    const groupMatches = matches.filter(
      (m) =>
        (m.group_name || '') === grp.name ||
        m.group_name === grp.name ||
        (grp.id && (m as { groupId?: string }).groupId === grp.id)
    );

    const rows = calculateGroupStandings(grp.teams ?? [], groupMatches);

    return {
      groupId: grp.id || grp.name,
      groupName: grp.name,
      rows,
    };
  });
}
