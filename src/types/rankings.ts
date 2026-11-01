import type { Player } from './player';

export type FormOutcome = 'W' | 'L';

export interface RankingStats {
  rank: number;
  player: Player;
  rating: number; // Backward compatibility fallback (1200)
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // Percentage rounded to 1 decimal place (e.g. 81.3)
  gamesWon: number;
  gamesLost: number;
  gameDifference: number; // gamesWon - gamesLost
  form: FormOutcome[]; // Last up to 5 match outcomes, oldest-to-newest
}

export type RankedPlayer = RankingStats;
