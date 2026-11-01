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
import type { Tournament, TournamentMatch } from '../types/tournament';
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

/**
 * Safeguard against same-group pairings in initial round matches.
 * Performs swaps between pairing opponents where valid cross-group combinations exist.
 */
function eliminateSameGroupConflicts(pairings: PlayoffPairing[]): void {
  for (let i = 0; i < pairings.length; i++) {
    const p1 = pairings[i];
    if (
      p1.team1.groupOrigin &&
      p1.team2.groupOrigin &&
      p1.team1.groupOrigin === p1.team2.groupOrigin
    ) {
      for (let j = 0; j < pairings.length; j++) {
        if (i === j) continue;
        const p2 = pairings[j];
        if (
          p1.team1.groupOrigin !== p2.team2.groupOrigin &&
          p2.team1.groupOrigin !== p1.team2.groupOrigin
        ) {
          const temp = p1.team2;
          p1.team2 = p2.team2;
          p2.team2 = temp;
          break;
        }
      }
    }
  }
}

/**
 * Ensures higher-seeded team (smaller seed number) is in team1 slot for each initial round match.
 */
function ensureHigherSeedInTeam1(pairings: PlayoffPairing[]): void {
  for (const p of pairings) {
    if (p.team1.seed > 0 && p.team2.seed > 0 && p.team1.seed > p.team2.seed) {
      const temp = p.team1;
      p.team1 = p.team2;
      p.team2 = temp;
    }
  }
}

/**
 * Resolves deterministic cross-group playoff pairings for Round 1 of the bracket.
 * Guarantees that teams qualifying from the same group are separated into opposite
 * halves of the bracket whenever possible.
 *
 * @param qualifiers Sorted list of playoff qualifiers (seeds 1 to K)
 * @param finalistsCount Number of playoff spots K in {2, 4, 8}
 * @param groupCount Total number of tournament groups G
 * @returns Array of PlayoffPairing objects for Round 1
 */
export function buildPlayoffPairings(
  qualifiers: PlayoffQualifier[],
  finalistsCount: PlayoffFinalistsCount | number,
  groupCount?: number
): PlayoffPairing[] {
  const K = finalistsCount as PlayoffFinalistsCount;
  if (!qualifiers || qualifiers.length === 0 || K < 2) {
    return [];
  }

  const distinctGroups = new Set(
    qualifiers.map((q) => q.groupOrigin).filter((origin) => Boolean(origin && origin.trim()))
  );
  const G = groupCount && groupCount > 0 ? groupCount : (distinctGroups.size || 1);

  const getSeed = (s: number): PlayoffQualifier =>
    qualifiers.find((q) => q.seed === s) || {
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

  const pairings: PlayoffPairing[] = [];

  if (K === 2) {
    pairings.push({
      matchIndex: 0,
      stage: 'final',
      team1: getSeed(1),
      team2: getSeed(2),
    });
    return pairings;
  }

  if (K === 4) {
    if (G === 2) {
      // 2 Groups, 4 Finalists (AC-1)
      const w1 = getSeed(1);
      const w2 = getSeed(2);
      let ra = w1.groupOrigin
        ? qualifiers.find((q) => q.groupOrigin === w1.groupOrigin && q.seed !== w1.seed)
        : undefined;
      let rb = w2.groupOrigin
        ? qualifiers.find(
            (q) => q.groupOrigin === w2.groupOrigin && q.seed !== w2.seed && q.teamId !== ra?.teamId
          )
        : undefined;
      if (!ra) ra = getSeed(3);
      if (!rb) rb = getSeed(4);

      pairings.push({
        matchIndex: 0,
        stage: 'sf',
        team1: w1,
        team2: rb,
      });
      pairings.push({
        matchIndex: 1,
        stage: 'sf',
        team1: w2,
        team2: ra,
      });
    } else if (G === 3) {
      // 3 Groups, 4 Finalists (1 Wildcard) (AC-3)
      const w1 = getSeed(1);
      const w2 = getSeed(2);
      const w3 = getSeed(3);
      const wc = qualifiers.find((q) => q.isWildcard) ?? getSeed(4);

      if (wc.groupOrigin && wc.groupOrigin === w1.groupOrigin) {
        // Branch A: Wildcard is from Seed 1's group -> SF1: W1 vs W3, SF2: W2 vs WC
        pairings.push({
          matchIndex: 0,
          stage: 'sf',
          team1: w1,
          team2: w3,
        });
        pairings.push({
          matchIndex: 1,
          stage: 'sf',
          team1: w2,
          team2: wc,
        });
      } else {
        // Branch B: No conflict with Seed 1 -> SF1: W1 vs WC, SF2: W2 vs W3
        pairings.push({
          matchIndex: 0,
          stage: 'sf',
          team1: w1,
          team2: wc,
        });
        pairings.push({
          matchIndex: 1,
          stage: 'sf',
          team1: w2,
          team2: w3,
        });
      }
    } else {
      // G >= 4 or G === 1
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
    }

    eliminateSameGroupConflicts(pairings);
    ensureHigherSeedInTeam1(pairings);
    return pairings;
  }

  if (K === 8) {
    if (G === 4) {
      // 4 Groups, 8 Finalists (AC-2)
      const w1 = getSeed(1);
      const w2 = getSeed(2);
      const w3 = getSeed(3);
      const w4 = getSeed(4);

      const findRunnerUp = (
        groupOrigin: string,
        fallbackSeed: number,
        excludedIds: Set<string>
      ) => {
        if (!groupOrigin) return getSeed(fallbackSeed);
        return (
          qualifiers.find(
            (q) => q.groupOrigin === groupOrigin && q.seed > 4 && !excludedIds.has(q.teamId)
          ) ||
          qualifiers.find(
            (q) => q.groupOrigin === groupOrigin && q.rankInGroup > 1 && !excludedIds.has(q.teamId)
          ) ||
          getSeed(fallbackSeed)
        );
      };

      const usedIds = new Set<string>([w1.teamId, w2.teamId, w3.teamId, w4.teamId]);
      const ra = findRunnerUp(w1.groupOrigin, 8, usedIds);
      usedIds.add(ra.teamId);
      const rb = findRunnerUp(w2.groupOrigin, 7, usedIds);
      usedIds.add(rb.teamId);
      const rc = findRunnerUp(w3.groupOrigin, 6, usedIds);
      usedIds.add(rc.teamId);
      const rd = findRunnerUp(w4.groupOrigin, 5, usedIds);

      // Top Half: QF1 (A1 vs B2), QF2 (C1 vs D2)
      pairings.push({
        matchIndex: 0,
        stage: 'qf',
        team1: w1,
        team2: rb,
      });
      pairings.push({
        matchIndex: 1,
        stage: 'qf',
        team1: w3,
        team2: rd,
      });

      // Bottom Half: QF3 (B1 vs A2), QF4 (D1 vs C2)
      pairings.push({
        matchIndex: 2,
        stage: 'qf',
        team1: w2,
        team2: ra,
      });
      pairings.push({
        matchIndex: 3,
        stage: 'qf',
        team1: w4,
        team2: rc,
      });
    } else {
      // Fallback K=8: Standard seeded pairings
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

    eliminateSameGroupConflicts(pairings);
    ensureHigherSeedInTeam1(pairings);
    return pairings;
  }

  return pairings;
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

  const pairings = buildPlayoffPairings(allQualifiers, K, G);

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

  const pairings = buildPlayoffPairings(params.qualifiers, K, params.groupCount);
  const matches: TournamentMatch[] = [];

  for (const node of nodes) {
    let team1: Team;
    let team2: Team;

    if (node.round === 1) {
      const pairing = pairings.find(
        (p) => p.stage === node.stage && p.matchIndex === node.matchIndex
      );
      team1 = getTeamObj(pairing?.team1);
      team2 = getTeamObj(pairing?.team2);
    } else {
      // Downstream feeder placeholders
      const feeder1Index = node.feederNodeIds ? Number(node.feederNodeIds[0].split('-')[1]) || 1 : 1;
      const feeder2Index = node.feederNodeIds ? Number(node.feederNodeIds[1].split('-')[1]) || 2 : 2;
      const feederLabel = node.stage === 'final' ? 'Полуфинал' : '1/4-финал';
      team1 = { id: `tbd-${node.feederNodeIds?.[0] || '1'}`, name: `Победител от ${feederLabel} ${feeder1Index}`, players: [] };
      team2 = { id: `tbd-${node.feederNodeIds?.[1] || '2'}`, name: `Победител от ${feederLabel} ${feeder2Index}`, players: [] };
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

export type ChampionPlayerInput = string | { id?: string; name: string };

/**
 * Formats champion team name and player roster into an ergonomic display string.
 * - If players.length === 0: returns trimmed championTeamName.
 * - If roster exactly matches championTeamName (e.g. singles "Данков"): returns "Данков".
 * - If default team name (starts with "Отбор", e.g. "Отбор 5"): returns "Данков, Йов (Отбор 5)".
 * - If custom team name (e.g. "Асове"): returns "Данков, Йов (Асове)".
 */
export function formatChampionDisplay(
  championTeamName: string | null | undefined,
  players: ChampionPlayerInput[] = []
): string {
  const trimmedTeam = championTeamName ? championTeamName.trim() : '';
  if (!trimmedTeam) return '';

  const playerNames = players
    .map((p) => (typeof p === 'string' ? p : p?.name))
    .map((n) => (n ?? '').trim())
    .filter(Boolean);

  if (playerNames.length === 0) {
    return trimmedTeam;
  }

  const rosterStr = playerNames.join(', ');
  if (rosterStr.toLowerCase() === trimmedTeam.toLowerCase()) {
    return rosterStr;
  }

  return `${rosterStr} (${trimmedTeam})`;
}

/**
 * Resolves player display names for tournament champion using a 4-tier fallback:
 * 1. Final match winning side match_players.
 * 2. tournament.draft_state.teams matching championTeamName.
 * 3. Preceding playoff or group match records involving championTeamName with match_players.
 * 4. Graceful fallback to empty array [].
 */
export function resolveChampionPlayers(
  championTeamName: string | null | undefined,
  finalMatch: MatchDetail | undefined,
  tournament: Tournament,
  playoffMatches: MatchDetail[] = [],
  groupMatches: MatchDetail[] = []
): string[] {
  if (!championTeamName) return [];

  const targetName = championTeamName.trim().toLowerCase();

  // Tier 1: Final match winning side match_players
  if (finalMatch?.match_players && finalMatch.match_players.length > 0) {
    const isTeam1 = finalMatch.team_1_name?.trim().toLowerCase() === targetName;
    const isTeam2 = finalMatch.team_2_name?.trim().toLowerCase() === targetName;
    const targetSide = isTeam1 ? 'team_1' : isTeam2 ? 'team_2' : null;

    if (targetSide) {
      const names = finalMatch.match_players
        .filter((p) => p.team_side === targetSide)
        .map((p) => (p.players?.name || p.guest_name || '').trim())
        .filter(Boolean);

      if (names.length > 0) {
        return Array.from(new Set(names));
      }
    }
  }

  // Tier 2: tournament.draft_state.teams
  const draftTeams = tournament.draft_state?.teams;
  if (Array.isArray(draftTeams) && draftTeams.length > 0) {
    const matchedTeam = draftTeams.find(
      (t) => t.name?.trim().toLowerCase() === targetName
    );
    if (matchedTeam && Array.isArray(matchedTeam.players) && matchedTeam.players.length > 0) {
      const names = matchedTeam.players
        .map((p) => p.name?.trim())
        .filter(Boolean);

      if (names.length > 0) {
        return Array.from(new Set(names));
      }
    }
  }

  // Tier 3: Preceding playoff or group matches
  const allMatches = [...playoffMatches, ...groupMatches];
  for (const m of allMatches) {
    if (!m.match_players || m.match_players.length === 0) continue;
    const isTeam1 = m.team_1_name?.trim().toLowerCase() === targetName;
    const isTeam2 = m.team_2_name?.trim().toLowerCase() === targetName;
    const targetSide = isTeam1 ? 'team_1' : isTeam2 ? 'team_2' : null;

    if (targetSide) {
      const names = m.match_players
        .filter((p) => p.team_side === targetSide)
        .map((p) => (p.players?.name || p.guest_name || '').trim())
        .filter(Boolean);

      if (names.length > 0) {
        return Array.from(new Set(names));
      }
    }
  }

  // Tier 4: Fallback
  return [];
}

