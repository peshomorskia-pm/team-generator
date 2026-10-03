export interface Player {
  id: string;
  name: string;
  singles_rating: number;
  doubles_rating: number;
  singles_matches_played: number;
  singles_wins: number;
  singles_losses: number;
  doubles_matches_played: number;
  doubles_wins: number;
  doubles_losses: number;
  rating?: number;
  created_at?: string;
  updated_at?: string;
}
