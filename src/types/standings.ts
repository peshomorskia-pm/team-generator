import type { MatchSet } from './match';

export interface GroupStandingRow {
  rank: number; // 1-indexed position (1, 2, 3...)
  teamId: string; // Team identifier or name
  teamName: string; // Human-readable team name
  played: number; // М (Matches played)
  won: number; // П (Wins)
  lost: number; // З (Losses)
  gamesWon: number; // Games / points scored
  gamesLost: number; // Games / points conceded
  gameDiff: number; // +/- (gamesWon - gamesLost)
  points: number; // Т (1 point per match win, 0 for loss)
}

export interface GroupStanding {
  groupId: string; // e.g., 'group-0' or group name
  groupName: string; // e.g., 'Група А'
  rows: GroupStandingRow[];
}

export type GroupStandingsResult = GroupStanding;

export interface StandingsMatchInput {
  id?: string;
  team_1_name?: string | null;
  team_2_name?: string | null;
  team_1_score?: number | null;
  team_2_score?: number | null;
  group_name?: string | null;
  completed?: boolean;
  sets?: MatchSet[] | null;
}
