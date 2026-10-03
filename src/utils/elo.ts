import type { MatchFormat } from '../types/match';

export const DEFAULT_RATING = 1200;
export const K_FACTOR = 32;

/**
 * Calculates the expected score for player/team A facing player/team B.
 * Standard logistic formula: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculates the ELO delta for player/team A.
 * K = 32
 * S = 1 for win, 0 for loss, 0.5 for draw
 */
export function calculateEloDelta(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  scoreB: number,
  kFactor: number = K_FACTOR
): number {
  const expectedA = calculateExpectedScore(ratingA, ratingB);
  let actualA = 0.5;
  if (scoreA > scoreB) {
    actualA = 1;
  } else if (scoreA < scoreB) {
    actualA = 0;
  }
  return Math.round(kFactor * (actualA - expectedA));
}

/**
 * Calculates average rating for a team roster.
 * Missing/guest/invalid ratings default to provisional 1200.
 */
export function getTeamAverageRating(ratings: (number | null | undefined)[]): number {
  if (ratings.length === 0) {
    return DEFAULT_RATING;
  }

  const normalized = ratings.map((r) =>
    typeof r === 'number' && Number.isFinite(r) ? r : DEFAULT_RATING
  );

  const sum = normalized.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / normalized.length) * 100) / 100;
}

export interface CalculateMatchEloParams {
  format?: MatchFormat;
  team1Ratings: (number | null | undefined)[];
  team2Ratings: (number | null | undefined)[];
  score1: number;
  score2: number;
  kFactor?: number;
}

export interface MatchEloResult {
  team1EffectiveRating: number;
  team2EffectiveRating: number;
  team1Delta: number;
  team2Delta: number;
}

/**
 * Computes ratings changes for a match.
 * For singles or doubles, averages respective team ratings and computes deltas.
 */
export function calculateMatchElo({
  team1Ratings,
  team2Ratings,
  score1,
  score2,
  kFactor = K_FACTOR,
}: CalculateMatchEloParams): MatchEloResult {
  const team1EffectiveRating = getTeamAverageRating(team1Ratings);
  const team2EffectiveRating = getTeamAverageRating(team2Ratings);

  const team1Delta = calculateEloDelta(
    team1EffectiveRating,
    team2EffectiveRating,
    score1,
    score2,
    kFactor
  );
  const team2Delta = calculateEloDelta(
    team2EffectiveRating,
    team1EffectiveRating,
    score2,
    score1,
    kFactor
  );

  return {
    team1EffectiveRating,
    team2EffectiveRating,
    team1Delta,
    team2Delta,
  };
}
