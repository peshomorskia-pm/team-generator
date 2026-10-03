import type { MatchFormat } from './matches';

export interface Match {
  id: string;
  match_format: MatchFormat;
  team_1_score: number | null;
  team_2_score: number | null;
  played_at: string;
  created_at?: string;
  updated_at?: string;
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

export * from './matches';
