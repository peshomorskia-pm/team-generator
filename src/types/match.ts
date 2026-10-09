import type { MatchFormat } from './matches';

export interface Match {
  id: string;
  match_format: MatchFormat;
  team_1_score: number | null;
  team_2_score: number | null;
  played_at: string;
  created_at?: string;
  updated_at?: string;
  team_1_name?: string | null;
  team_2_name?: string | null;
  group_name?: string | null;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  player_id: string | null;
  guest_name: string | null;
  team: 'team_1' | 'team_2';
  rating_before: number | null;
  rating_after: number | null;
}

export interface CreateMatchInput {
  match_format?: MatchFormat;
  team_1_score: number | null;
  team_2_score: number | null;
  played_at: string;
  team_1_players: { player_id?: string; guest_name?: string }[];
  team_2_players: { player_id?: string; guest_name?: string }[];
  team_1_name?: string | null;
  team_2_name?: string | null;
  group_name?: string | null;
}

export interface UpdateMatchInput {
  match_format?: MatchFormat;
  team_1_score?: number | null;
  team_2_score?: number | null;
  played_at?: string;
  team_1_players?: { player_id?: string; guest_name?: string }[];
  team_2_players?: { player_id?: string; guest_name?: string }[];
  team_1_name?: string | null;
  team_2_name?: string | null;
  group_name?: string | null;
}

export * from './matches';
