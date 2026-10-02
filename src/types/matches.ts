import type { Database } from './database.types';

export type MatchRow = Database['public']['Tables']['matches']['Row'];
export type MatchPlayerRow = Database['public']['Tables']['match_players']['Row'];

export interface MatchPlayerDetail extends MatchPlayerRow {
  players?: { id: string; name: string } | null;
}

export interface MatchDetail extends MatchRow {
  match_players: MatchPlayerDetail[];
}

export interface MatchFormData {
  team_1_score: number | null;
  team_2_score: number | null;
  played_at: string; // ISO date string
  team_1_players: { player_id?: string; guest_name?: string }[];
  team_2_players: { player_id?: string; guest_name?: string }[];
}
