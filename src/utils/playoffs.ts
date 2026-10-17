import type { Team } from '../types';
import type { MatchDetail, MatchFormData } from '../types/matches';
import type { GroupStanding, GroupStandingRow } from '../types/standings';
import type {
  PlayoffFinalistsCount,
  PlayoffQualifier,
  PlayoffPairing,
  PlayoffResolutionResult,
  PlayoffMatchNode,
  TournamentPlayoffTree,
  GeneratePlayoffMatchesParams,
} from '../types/playoffs';
import type { TournamentMatch } from '../types/tournament';
import { getMatchOutcome } from './standings';

/**
 * Returns available finalists options K in {2, 4, 8} based on group count and total teams.
 * Options are capped by totalTeams.
 */
export function getAvailableFinalistOptions(
  groupCount: number,
  totalTeams: number
): PlayoffFinalistsCount[] {
  if (totalTeams < 2 || groupCount < 1) {
    return [];
  }

  let candidates: PlayoffFinalistsCount[] = [];

  if (groupCount === 1) {
    candidates = [2];
  } else if (groupCount === 2) {
    candidates = totalTeams >= 4 ? [2, 4] : [2];
  } else if (groupCount === 3) {
    candidates = totalTeams >= 4 ? [4] : [2];
  } else if (groupCount === 4) {
    candidates = totalTeams >= 8 ? [4, 8] : [4];
  } else {
    // groupCount >= 5
    if (totalTeams >= 8) {
      candidates = [8];
    } else if (totalTeams >= 4) {
      candidates = [4];
    } else {
      candidates = [2];
    }
  }

  return candidates.filter((k) => k <= totalTeams);
}

export const getAvailableFinalistsOptions = getAvailableFinalistOptions;

/**
 * Resolves the default finalist count for a given group count and total teams.
 */
export function getDefaultFinalistsCount(
  groupCount: number,
  totalTeams: number
): PlayoffFinalistsCount {
  const available = getAvailableFinalistOptions(groupCount, totalTeams);
  if (available.length === 0) return 2;

  let ideal: PlayoffFinalistsCount = 2;
  if (groupCount === 1) ideal = 2;
  else if (groupCount === 2 || groupCount === 3) ideal = 4;
  else ideal = 8;

  if (available.includes(ideal)) return ideal;
  return available[available.length - 1];
}

/**
 * Checks if a match belongs to the playoff stage based on its group_name.
 */
export function isPlayoffMatch(match: { group_name?: string | null }): boolean {
  if (!match.group_name) return false;
  return /^(1\/4-финал|полуфинал|финал)/i.test(match.group_name.trim());
}

/**
 * Checks if a team name is a placeholder for bracket feeder matches.
 */
export function isPlaceholderTeam(name?: string | null): boolean {
  if (!name) return true;
  return /^(победител от|tbd)/i.test(name.trim());
}

/**
 * Extracts unique tournament teams and their player rosters from match history
 * and/or draft state. Guarantees full team objects with player lists even when
 * tournament.draft_state is null or cleared upon saving matches.
 */
export function extractTournamentTeams(
  matches: MatchDetail[],
  draftTeams?: Team[] | null
): Team[] {
  const teamsByName = new Map<string, Team>();

  if (draftTeams && Array.isArray(draftTeams)) {
    for (const t of draftTeams) {
      if (t && t.name) {
        const key = t.name.trim();
        teamsByName.set(key, {
          ...t,
          players: t.players ? [...t.players] : [],
        });
      }
    }
  }

  for (const match of matches) {
    const processTeamSide = (teamName: string | null | undefined, side: 'team_1' | 'team_2') => {
      if (!teamName || isPlaceholderTeam(teamName)) return;
      const key = teamName.trim();
      const matchPlayers = (match.match_players || []).filter((p) => p.team_side === side);
      const players = matchPlayers.map((p) => ({
        id: p.player_id ?? '',
        name: p.players?.name ?? p.guest_name ?? 'Играч',
        is_guest: !p.player_id,
      }));

      if (teamsByName.has(key)) {
        const existing = teamsByName.get(key)!;
        if (existing.players.length === 0 && players.length > 0) {
          existing.players = players;
        }
      } else {
        teamsByName.set(key, {
          id: key,
          name: key,
          players,
        });
      }
    };

    processTeamSide(match.team_1_name, 'team_1');
    processTeamSide(match.team_2_name, 'team_2');
  }

  return Array.from(teamsByName.values());
}

/**
 * Comparator for cross-group ranking using normalized metrics:
 * 1. points / (played || 1) DESC
 * 2. gameDiff / (played || 1) DESC
 * 3. gamesWon / (played || 1) DESC
 * 4. teamName.localeCompare(other, 'bg') ASC
 */
function compareNormalized(
  a: { played: number; points: number; gameDiff: number; gamesWon: number; teamName: string },
  b: { played: number; points: number; gameDiff: number; gamesWon: number; teamName: string }
): number {
  const aPlayed = a.played || 1;
  const bPlayed = b.played || 1;

  const aPts = a.points / aPlayed;
  const bPts = b.points / bPlayed;
  if (Math.abs(aPts - bPts) > 1e-9) {
    return bPts - aPts;
  }

  const aDiff = a.gameDiff / aPlayed;
  const bDiff = b.gameDiff / bPlayed;
  if (Math.abs(aDiff - bDiff) > 1e-9) {
    return bDiff - aDiff;
  }

  const aWon = a.gamesWon / aPlayed;
  const bWon = b.gamesWon / bPlayed;
  if (Math.abs(aWon - bWon) > 1e-9) {
    return bWon - aWon;
  }

  return a.teamName.localeCompare(b.teamName, 'bg');
}

interface RankedCandidate {
  groupName: string;
  rankInGroup: number;
  row: GroupStandingRow;
}

/**
 * Resolves playoff qualifiers (direct and wildcards), seeds, and opening pairings.
 */
export function resolvePlayoffTeams(
  groupStandings: GroupStanding[],
  finalistsCount: number
): PlayoffResolutionResult {
  const K = finalistsCount as PlayoffFinalistsCount;
  const G = groupStandings.length;

  if (G === 0 || K < 2) {
    return {
      finalistsCount: K,
      qualifiers: [],
      qualifierMap: new Map(),
      pairings: [],
    };
  }

  const S_base = Math.floor(K / G);
  const W = K - G * S_base;

  const directQualifiers: PlayoffQualifier[] = [];
  const wildcardQualifiers: PlayoffQualifier[] = [];

  if (S_base > 0) {
    // 1. Direct spots: Rank 1 teams across groups, then Rank 2 teams, etc.
    for (let r = 0; r < S_base; r++) {
      const rankTeams: RankedCandidate[] = [];
      for (const group of groupStandings) {
        if (group.rows && group.rows[r]) {
          rankTeams.push({
            groupName: group.groupName,
            rankInGroup: r + 1,
            row: group.rows[r],
          });
        }
      }

      // Sort teams of this rank using normalized criteria
      rankTeams.sort((a, b) => compareNormalized(a.row, b.row));

      for (const item of rankTeams) {
        const played = item.row.played;
        const normPlayed = played || 1;
        directQualifiers.push({
          teamId: item.row.teamId,
          teamName: item.row.teamName,
          seed: 0, // assigned below
          isWildcard: false,
          groupOrigin: item.groupName,
          rankInGroup: item.rankInGroup,
          played,
          pointsPerMatch: played > 0 ? item.row.points / normPlayed : 0,
          gameDiffPerMatch: played > 0 ? item.row.gameDiff / normPlayed : 0,
          gamesWonPerMatch: played > 0 ? item.row.gamesWon / normPlayed : 0,
        });
      }
    }

    // 2. Wildcard spots: Candidates at rank S_base + 1
    if (W > 0) {
      const wildcardPool: RankedCandidate[] = [];
      for (const group of groupStandings) {
        if (group.rows && group.rows[S_base]) {
          wildcardPool.push({
            groupName: group.groupName,
            rankInGroup: S_base + 1,
            row: group.rows[S_base],
          });
        }
      }

      wildcardPool.sort((a, b) => compareNormalized(a.row, b.row));

      const selectedWildcards = wildcardPool.slice(0, W);
      for (const item of selectedWildcards) {
        const played = item.row.played;
        const normPlayed = played || 1;
        wildcardQualifiers.push({
          teamId: item.row.teamId,
          teamName: item.row.teamName,
          seed: 0, // assigned below
          isWildcard: true,
          groupOrigin: item.groupName,
          rankInGroup: item.rankInGroup,
          played,
          pointsPerMatch: played > 0 ? item.row.points / normPlayed : 0,
          gameDiffPerMatch: played > 0 ? item.row.gameDiff / normPlayed : 0,
          gamesWonPerMatch: played > 0 ? item.row.gamesWon / normPlayed : 0,
        });
      }
    }
  } else {
    // Under-allocation (K < G): S_base === 0
    // All Rank 1 teams from each group are pooled as candidates
    const candidatePool: RankedCandidate[] = [];
    for (const group of groupStandings) {
      if (group.rows && group.rows[0]) {
        candidatePool.push({
          groupName: group.groupName,
          rankInGroup: 1,
          row: group.rows[0],
        });
      }
    }

    candidatePool.sort((a, b) => compareNormalized(a.row, b.row));

    const selected = candidatePool.slice(0, K);
    for (const item of selected) {
      const played = item.row.played;
      const normPlayed = played || 1;
      wildcardQualifiers.push({
        teamId: item.row.teamId,
        teamName: item.row.teamName,
        seed: 0,
        isWildcard: true,
        groupOrigin: item.groupName,
        rankInGroup: item.rankInGroup,
        played,
        pointsPerMatch: played > 0 ? item.row.points / normPlayed : 0,
        gameDiffPerMatch: played > 0 ? item.row.gameDiff / normPlayed : 0,
        gamesWonPerMatch: played > 0 ? item.row.gamesWon / normPlayed : 0,
      });
    }
  }

  // Combine and assign seeds 1 to K
  const allQualifiers = [...directQualifiers, ...wildcardQualifiers].slice(0, K);
  allQualifiers.forEach((q, idx) => {
    q.seed = idx + 1;
  });

  const qualifierMap = new Map<string, PlayoffQualifier>();
  for (const q of allQualifiers) {
    qualifierMap.set(q.teamId, q);
    if (q.teamName && !qualifierMap.has(q.teamName)) {
      qualifierMap.set(q.teamName, q);
    }
  }

  // Bracket pairings
  const pairings: PlayoffPairing[] = [];
  const getSeed = (s: number): PlayoffQualifier =>
    allQualifiers.find((q) => q.seed === s) || {
      teamId: `tbd-seed-${s}`,
      teamName: `Поставено лице ${s}`,
      seed: s,
      isWildcard: false,
      groupOrigin: '',
      rankInGroup: 1,
      played: 0,
      pointsPerMatch: 0,
      gameDiffPerMatch: 0,
      gamesWonPerMatch: 0,
    };

  if (K === 2) {
    pairings.push({
      matchIndex: 0,
      stage: 'final',
      team1: getSeed(1),
      team2: getSeed(2),
    });
  } else if (K === 4) {
    pairings.push({
      matchIndex: 0,
      stage: 'sf',
      team1: getSeed(1),
      team2: getSeed(4),
    });
    pairings.push({
      matchIndex: 1,
      stage: 'sf',
      team1: getSeed(2),
      team2: getSeed(3),
    });
  } else if (K === 8) {
    pairings.push({
      matchIndex: 0,
      stage: 'qf',
      team1: getSeed(1),
      team2: getSeed(8),
    });
    pairings.push({
      matchIndex: 1,
      stage: 'qf',
      team1: getSeed(4),
      team2: getSeed(5),
    });
    pairings.push({
      matchIndex: 2,
      stage: 'qf',
      team1: getSeed(2),
      team2: getSeed(7),
    });
    pairings.push({
      matchIndex: 3,
      stage: 'qf',
      team1: getSeed(3),
      team2: getSeed(6),
    });
  }

  return {
    finalistsCount: K,
    qualifiers: allQualifiers,
    qualifierMap,
    pairings,
  };
}

/**
 * Generates single-elimination playoff bracket nodes with UUIDs and downstream links.
 */
export function generatePlayoffBracketNodes(
  _qualifiers: PlayoffQualifier[],
  finalistsCount: number
): PlayoffMatchNode[] {
  const K = finalistsCount as PlayoffFinalistsCount;

  if (K === 2) {
    return [
      {
        nodeId: 'final',
        matchId: crypto.randomUUID(),
        stage: 'final',
        stageLabel: 'Финал',
        round: 1,
        matchIndex: 0,
        nextMatchNodeId: null,
        nextMatchSlot: null,
      },
    ];
  }

  if (K === 4) {
    const finalId = crypto.randomUUID();
    return [
      {
        nodeId: 'sf-1',
        matchId: crypto.randomUUID(),
        stage: 'sf',
        stageLabel: 'Полуфинал',
        round: 1,
        matchIndex: 0,
        nextMatchNodeId: 'final',
        nextMatchSlot: 'team_1',
      },
      {
        nodeId: 'sf-2',
        matchId: crypto.randomUUID(),
        stage: 'sf',
        stageLabel: 'Полуфинал',
        round: 1,
        matchIndex: 1,
        nextMatchNodeId: 'final',
        nextMatchSlot: 'team_2',
      },
      {
        nodeId: 'final',
        matchId: finalId,
        stage: 'final',
        stageLabel: 'Финал',
        round: 2,
        matchIndex: 0,
        nextMatchNodeId: null,
        nextMatchSlot: null,
        feederNodeIds: ['sf-1', 'sf-2'],
      },
    ];
  }

  // K === 8
  const sf1Id = crypto.randomUUID();
  const sf2Id = crypto.randomUUID();
  const finalId = crypto.randomUUID();

  return [
    {
      nodeId: 'qf-1',
      matchId: crypto.randomUUID(),
      stage: 'qf',
      stageLabel: '1/4-финал',
      round: 1,
      matchIndex: 0,
      nextMatchNodeId: 'sf-1',
      nextMatchSlot: 'team_1',
    },
    {
      nodeId: 'qf-2',
      matchId: crypto.randomUUID(),
      stage: 'qf',
      stageLabel: '1/4-финал',
      round: 1,
      matchIndex: 1,
      nextMatchNodeId: 'sf-1',
      nextMatchSlot: 'team_2',
    },
    {
      nodeId: 'qf-3',
      matchId: crypto.randomUUID(),
      stage: 'qf',
      stageLabel: '1/4-финал',
      round: 1,
      matchIndex: 2,
      nextMatchNodeId: 'sf-2',
      nextMatchSlot: 'team_1',
    },
    {
      nodeId: 'qf-4',
      matchId: crypto.randomUUID(),
      stage: 'qf',
      stageLabel: '1/4-финал',
      round: 1,
      matchIndex: 3,
      nextMatchNodeId: 'sf-2',
      nextMatchSlot: 'team_2',
    },
    {
      nodeId: 'sf-1',
      matchId: sf1Id,
      stage: 'sf',
      stageLabel: 'Полуфинал',
      round: 2,
      matchIndex: 0,
      nextMatchNodeId: 'final',
      nextMatchSlot: 'team_1',
      feederNodeIds: ['qf-1', 'qf-2'],
    },
    {
      nodeId: 'sf-2',
      matchId: sf2Id,
      stage: 'sf',
      stageLabel: 'Полуфинал',
      round: 2,
      matchIndex: 1,
      nextMatchNodeId: 'final',
      nextMatchSlot: 'team_2',
      feederNodeIds: ['qf-3', 'qf-4'],
    },
    {
      nodeId: 'final',
      matchId: finalId,
      stage: 'final',
      stageLabel: 'Финал',
      round: 3,
      matchIndex: 0,
      nextMatchNodeId: null,
      nextMatchSlot: null,
      feederNodeIds: ['sf-1', 'sf-2'],
    },
  ];
}

/**
 * Builds TournamentMatch entries and the playoff tree structure.
 */
export function generatePlayoffMatches(
  params: GeneratePlayoffMatchesParams & { finalistsCount?: PlayoffFinalistsCount }
): { matches: TournamentMatch[]; tree: TournamentPlayoffTree } {
  const K = (params.finalistsCount || (params.qualifiers.length >= 8 ? 8 : params.qualifiers.length >= 4 ? 4 : 2)) as PlayoffFinalistsCount;
  const nodes = generatePlayoffBracketNodes(params.qualifiers, K);

  const getTeamObj = (q?: PlayoffQualifier): Team => {
    if (!q) {
      return { id: '', name: 'TBD', players: [] };
    }
    const found = params.teams.find(
      (t) =>
        t.id === q.teamId ||
        t.name === q.teamName ||
        (t.name && q.teamName && t.name.trim() === q.teamName.trim())
    );
    if (found) {
      return {
        ...found,
        players: found.players ? [...found.players] : [],
      };
    }
    return {
      id: q.teamId,
      name: q.teamName,
      players: [],
    };
  };

  const getQualifierBySeed = (seed: number): PlayoffQualifier | undefined =>
    params.qualifiers.find((q) => q.seed === seed);

  const matches: TournamentMatch[] = [];

  for (const node of nodes) {
    let team1: Team;
    let team2: Team;

    if (K === 2) {
      team1 = getTeamObj(getQualifierBySeed(1));
      team2 = getTeamObj(getQualifierBySeed(2));
    } else if (K === 4) {
      if (node.nodeId === 'sf-1') {
        team1 = getTeamObj(getQualifierBySeed(1));
        team2 = getTeamObj(getQualifierBySeed(4));
      } else if (node.nodeId === 'sf-2') {
        team1 = getTeamObj(getQualifierBySeed(2));
        team2 = getTeamObj(getQualifierBySeed(3));
      } else {
        // Final
        team1 = { id: 'tbd-sf-1', name: 'Победител от Полуфинал 1', players: [] };
        team2 = { id: 'tbd-sf-2', name: 'Победител от Полуфинал 2', players: [] };
      }
    } else {
      // K === 8
      if (node.nodeId === 'qf-1') {
        team1 = getTeamObj(getQualifierBySeed(1));
        team2 = getTeamObj(getQualifierBySeed(8));
      } else if (node.nodeId === 'qf-2') {
        team1 = getTeamObj(getQualifierBySeed(4));
        team2 = getTeamObj(getQualifierBySeed(5));
      } else if (node.nodeId === 'qf-3') {
        team1 = getTeamObj(getQualifierBySeed(2));
        team2 = getTeamObj(getQualifierBySeed(7));
      } else if (node.nodeId === 'qf-4') {
        team1 = getTeamObj(getQualifierBySeed(3));
        team2 = getTeamObj(getQualifierBySeed(6));
      } else if (node.nodeId === 'sf-1') {
        team1 = { id: 'tbd-qf-1', name: 'Победител от 1/4-финал 1', players: [] };
        team2 = { id: 'tbd-qf-2', name: 'Победител от 1/4-финал 2', players: [] };
      } else if (node.nodeId === 'sf-2') {
        team1 = { id: 'tbd-qf-3', name: 'Победител от 1/4-финал 3', players: [] };
        team2 = { id: 'tbd-qf-4', name: 'Победител от 1/4-финал 4', players: [] };
      } else {
        // Final
        team1 = { id: 'tbd-sf-1', name: 'Победител от Полуфинал 1', players: [] };
        team2 = { id: 'tbd-sf-2', name: 'Победител от Полуфинал 2', players: [] };
      }
    }

    matches.push({
      id: node.matchId,
      groupId: node.stage,
      groupName: node.stageLabel,
      round: node.round,
      team1,
      team2,
    });
  }

  return {
    matches,
    tree: {
      finalistsCount: K,
      generatedAt: new Date().toISOString(),
      nodes,
    },
  };
}

/**
 * Propagates the winner of a completed playoff match to the downstream feeder slot,
 * or safely reverts to placeholder if the match is no longer completed.
 */
export function propagatePlayoffWinner(params: {
  completedMatch: MatchDetail;
  allMatches: MatchDetail[];
  tree: TournamentPlayoffTree;
}): { updatedMatch: MatchFormData; matchId: string } | null {
  const currentNode = params.tree.nodes.find(
    (n) => n.matchId === params.completedMatch.id
  );
  if (!currentNode || !currentNode.nextMatchNodeId || !currentNode.nextMatchSlot) {
    return null;
  }

  const nextNode = params.tree.nodes.find(
    (n) => n.nodeId === currentNode.nextMatchNodeId
  );
  if (!nextNode) return null;

  const nextMatch = params.allMatches.find((m) => m.id === nextNode.matchId);
  if (!nextMatch) return null;

  const outcome = getMatchOutcome(params.completedMatch);
  const hasWinner =
    outcome.isCompleted &&
    (outcome.winner === 'team_1' || outcome.winner === 'team_2');

  const slot = currentNode.nextMatchSlot;

  // Placeholder fallback label
  const placeholderLabel =
    currentNode.stage === 'qf'
      ? `Победител от 1/4-финал ${currentNode.matchIndex + 1}`
      : `Победител от Полуфинал ${currentNode.matchIndex + 1}`;

  let newTeam1Name = nextMatch.team_1_name;
  let newTeam2Name = nextMatch.team_2_name;
  let newTeam1Players = (nextMatch.match_players || [])
    .filter((p) => p.team_side === 'team_1')
    .map((p) => ({
      player_id: p.player_id ?? undefined,
      guest_name: p.player_id ? undefined : (p.guest_name ?? p.players?.name ?? undefined),
    }));
  let newTeam2Players = (nextMatch.match_players || [])
    .filter((p) => p.team_side === 'team_2')
    .map((p) => ({
      player_id: p.player_id ?? undefined,
      guest_name: p.player_id ? undefined : (p.guest_name ?? p.players?.name ?? undefined),
    }));

  if (hasWinner) {
    const winningSide = outcome.winner!;
    const winningTeamName =
      winningSide === 'team_1'
        ? params.completedMatch.team_1_name
        : params.completedMatch.team_2_name;
    const winningPlayers = (params.completedMatch.match_players || [])
      .filter((p) => p.team_side === winningSide)
      .map((p) => ({
        player_id: p.player_id ?? undefined,
        guest_name: p.player_id ? undefined : (p.guest_name ?? p.players?.name ?? undefined),
      }));

    if (slot === 'team_1') {
      newTeam1Name = winningTeamName;
      newTeam1Players = winningPlayers;
    } else {
      newTeam2Name = winningTeamName;
      newTeam2Players = winningPlayers;
    }
  } else {
    // Revert slot to placeholder and clear players
    if (slot === 'team_1') {
      newTeam1Name = placeholderLabel;
      newTeam1Players = [];
    } else {
      newTeam2Name = placeholderLabel;
      newTeam2Players = [];
    }
  }

  // If match was reverted or slot changed, invalidate any score on nextMatch
  const shouldResetScore = !hasWinner;

  const updatedMatch: MatchFormData = {
    match_format: nextMatch.match_format,
    team_1_score: shouldResetScore ? null : nextMatch.team_1_score,
    team_2_score: shouldResetScore ? null : nextMatch.team_2_score,
    played_at: nextMatch.played_at,
    team_1_players: newTeam1Players,
    team_2_players: newTeam2Players,
    team_1_name: newTeam1Name,
    team_2_name: newTeam2Name,
    group_name: nextMatch.group_name,
    round: nextMatch.round,
    tournament_id: nextMatch.tournament_id,
    sets: shouldResetScore ? null : nextMatch.sets,
  };

  return {
    updatedMatch,
    matchId: nextMatch.id,
  };
}
