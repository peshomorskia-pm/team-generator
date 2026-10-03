import type { Player } from './player';

export interface RankingStats {
  rank: number;
  player: Player;
  rating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // percentage (0-100)
}
