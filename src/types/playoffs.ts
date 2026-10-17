import type { Team } from './index';
import type { MatchFormat } from './matches';

export type PlayoffFinalistsCount = 2 | 4 | 8;
export type PlayoffStage = 'qf' | 'sf' | 'final';

export interface PlayoffQualifier {
  teamId: string;
  teamName: string;
  seed: number; // 1-indexed overall seed (1 to K)
  isWildcard: boolean;
  groupOrigin: string; // e.g. 'Група А'
  rankInGroup: number;
  played: number;
  pointsPerMatch: number;
  gameDiffPerMatch: number;
  gamesWonPerMatch: number;
}

export interface PlayoffPairing {
  matchIndex: number;
  stage: PlayoffStage;
  team1: PlayoffQualifier;
  team2: PlayoffQualifier;
}

export interface PlayoffResolutionResult {
  finalistsCount: PlayoffFinalistsCount;
  qualifiers: PlayoffQualifier[];
  qualifierMap: Map<string, PlayoffQualifier>;
  pairings: PlayoffPairing[];
}

export interface PlayoffMatchNode {
  nodeId: string; // e.g. 'qf-1', 'sf-1', 'final'
  matchId: string; // UUID corresponding to public.matches.id
  stage: PlayoffStage;
  stageLabel: string; // '1/4-финал' | 'Полуфинал' | 'Финал'
  round: number; // 1 (QF), 2 (SF), 3 (Final)
  matchIndex: number;
  nextMatchNodeId: string | null;
  nextMatchSlot: 'team_1' | 'team_2' | null;
  feederNodeIds?: [string, string] | null;
}

export interface TournamentPlayoffTree {
  finalistsCount: PlayoffFinalistsCount;
  generatedAt: string;
  nodes: PlayoffMatchNode[];
}

export interface TournamentPlayoffState {
  finalistsCount: PlayoffFinalistsCount;
  tree: TournamentPlayoffTree;
}

export interface GeneratePlayoffMatchesParams {
  tournamentId: string;
  format: MatchFormat;
  qualifiers: PlayoffQualifier[];
  teams: Team[];
}
