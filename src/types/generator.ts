export type PlayerSource = 'registered' | 'guest';
export type TeamFormationMode = 'auto' | 'manual';

export interface GeneratorPlayer {
  id: string; // UUID from DB for registered, or crypto.randomUUID() for guests
  name: string;
  source: PlayerSource;
  rating?: number; // DB ELO for registered, undefined for guests
  singles_rating?: number;
  doubles_rating?: number;
  singles_matches_played?: number;
  singles_wins?: number;
  singles_losses?: number;
  doubles_matches_played?: number;
  doubles_wins?: number;
  doubles_losses?: number;
  winRate?: number;
}

export interface DatabasePlayer {
  id: string;
  name: string;
  rating: number;
  singles_rating?: number;
  doubles_rating?: number;
  singles_matches_played?: number;
  singles_wins?: number;
  singles_losses?: number;
  doubles_matches_played?: number;
  doubles_wins?: number;
  doubles_losses?: number;
  winRate?: number;
}
