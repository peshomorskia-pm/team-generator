export type PlayerSource = 'registered' | 'guest';

export interface GeneratorPlayer {
  id: string; // UUID from DB for registered, or crypto.randomUUID() for guests
  name: string;
  source: PlayerSource;
  rating?: number; // DB ELO for registered, undefined for guests
  singles_rating?: number;
  doubles_rating?: number;
}

export interface DatabasePlayer {
  id: string;
  name: string;
  rating: number;
  singles_rating?: number;
  doubles_rating?: number;
}
