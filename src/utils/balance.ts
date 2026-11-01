import { Player, Team } from '../types';
import { fisherYatesShuffle } from './shuffle';

export { shuffleTeamsBalanced } from './shuffle';

/**
 * Calculates a player's win rate percentage (0.0 - 100.0) based on match format.
 * - singles: uses singles_matches_played and singles_wins; unplayed defaults to 50.0.
 * - doubles: uses doubles_matches_played and doubles_wins; unplayed defaults to 50.0.
 * - overall (undefined): aggregates singles + doubles; unplayed defaults to 50.0.
 * - explicit winRate property is respected.
 * - fallback baseline is 50.0.
 */
export function getPlayerWinRate(
  player: Player,
  format?: 'singles' | 'doubles'
): number {
  if (format === 'singles') {
    if (player.singles_matches_played !== undefined) {
      if (player.singles_matches_played > 0) {
        return Number((((player.singles_wins ?? 0) / player.singles_matches_played) * 100).toFixed(1));
      }
      return 50.0;
    }
    if (typeof player.winRate === 'number') {
      return player.winRate;
    }
    return 50.0;
  }

  if (format === 'doubles') {
    if (player.doubles_matches_played !== undefined) {
      if (player.doubles_matches_played > 0) {
        return Number((((player.doubles_wins ?? 0) / player.doubles_matches_played) * 100).toFixed(1));
      }
      return 50.0;
    }
    if (typeof player.winRate === 'number') {
      return player.winRate;
    }
    return 50.0;
  }

  const hasSingles = player.singles_matches_played !== undefined;
  const hasDoubles = player.doubles_matches_played !== undefined;

  if (hasSingles || hasDoubles) {
    const totalMatches = (player.singles_matches_played ?? 0) + (player.doubles_matches_played ?? 0);
    if (totalMatches > 0) {
      const totalWins = (player.singles_wins ?? 0) + (player.doubles_wins ?? 0);
      return Number(((totalWins / totalMatches) * 100).toFixed(1));
    }
    if (typeof player.winRate === 'number') {
      return player.winRate;
    }
    return 50.0;
  }

  if (typeof player.winRate === 'number') {
    return player.winRate;
  }

  return 50.0;
}

/**
 * Resolves effective skill metric for a player:
 * 1. Players with active match history (or explicit winRate) resolve to their format-aware win rate (0-100%).
 * 2. Unplayed registered players (0 matches played in format) resolve to 50.0% neutral baseline.
 * 3. Players with legacy rating fields and no match stats resolve to legacy ELO.
 * 4. Unrated players with no ratings and no match stats default to 0.
 */
export function getPlayerEffectiveSkill(
  player: Player,
  format?: 'singles' | 'doubles'
): number {
  const hasMatchHistory =
    (player.singles_matches_played !== undefined && player.singles_matches_played > 0) ||
    (player.doubles_matches_played !== undefined && player.doubles_matches_played > 0) ||
    typeof player.winRate === 'number';

  if (hasMatchHistory) {
    return getPlayerWinRate(player, format);
  }

  const isExplicitUnplayed =
    player.singles_matches_played === 0 ||
    player.doubles_matches_played === 0;

  if (isExplicitUnplayed) {
    return 50.0;
  }

  const hasLegacyRating =
    player.rating !== undefined ||
    player.singles_rating !== undefined ||
    player.doubles_rating !== undefined;

  if (hasLegacyRating) {
    return getPlayerRating(player, format);
  }

  return 0;
}

/**
 * Legacy rating resolver kept for backwards compatibility.
 */
export function getPlayerRating(
  player: Player,
  format?: 'singles' | 'doubles'
): number {
  if (format === 'singles') {
    return player.singles_rating ?? player.rating ?? 0;
  }
  if (format === 'doubles') {
    return player.doubles_rating ?? player.rating ?? 0;
  }
  return player.rating ?? 0;
}

/**
 * Distributes players into teams balancing by total skill rating or win rate.
 * Uses greedy multi-way number partitioning (LPT) with randomized tie-breaking
 * on candidate teams sharing the minimum rating and player count, and shuffles
 * final team groupings to avoid deterministic team ordering.
 *
 * @param players - Array of players to distribute
 * @param numTeams - Positive number of teams to form
 * @param format - Match format ('singles' | 'doubles') or boolean flag used to resolve player rating
 * @returns Array of balanced Team objects
 */
export function balanceTeams(
  players: Player[],
  numTeams: number,
  format?: 'singles' | 'doubles' | boolean
): Team[] {
  if (numTeams <= 0) {
    return [];
  }

  // Initialize teams
  const teams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Отбор ${i + 1}`,
    players: [],
    totalRating: 0,
  }));

  if (players.length === 0) {
    return teams;
  }

  const formatStr = typeof format === 'string' ? format : undefined;
  const baseSize = Math.floor(players.length / numTeams);
  const remainder = players.length % numTeams;

  // Sort players descending by effective skill (win rate or legacy rating).
  // When ratings are equal, preserve the relative order from the input array
  // (which is pre-shuffled) so that identical ratings yield varied distributions.
  const sortedPlayers = [...players].sort((a, b) => {
    const ratingA = getPlayerEffectiveSkill(a, formatStr);
    const ratingB = getPlayerEffectiveSkill(b, formatStr);
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }
    return 0;
  });

  // Distribute players greedily to eligible candidate teams with lowest total rating,
  // respecting dynamic capacity quota to guarantee max(size) - min(size) <= 1.
  for (const player of sortedPlayers) {
    const eligibleTeams = teams.filter((t) => {
      if (t.players.length < baseSize) return true;
      if (t.players.length === baseSize) {
        const expandedCount = teams.filter((team) => team.players.length === baseSize + 1).length;
        return expandedCount < remainder;
      }
      return false;
    });

    let minRating = Infinity;
    for (const team of eligibleTeams) {
      const rating = team.totalRating ?? 0;
      if (rating < minRating) {
        minRating = rating;
      }
    }

    let minPlayerCount = Infinity;
    for (const team of eligibleTeams) {
      if ((team.totalRating ?? 0) === minRating) {
        if (team.players.length < minPlayerCount) {
          minPlayerCount = team.players.length;
        }
      }
    }

    const candidates = eligibleTeams.filter(
      (t) => (t.totalRating ?? 0) === minRating && t.players.length === minPlayerCount
    );

    const chosenTeam = candidates[Math.floor(Math.random() * candidates.length)];
    const pRating = getPlayerEffectiveSkill(player, formatStr);
    chosenTeam.players.push(player);
    chosenTeam.totalRating = Number(((chosenTeam.totalRating ?? 0) + pRating).toFixed(1));
  }

  // Shuffle final team groupings so the highest-rated player or first assignment
  // is not predictably placed on the first team.
  const shuffledTeams = fisherYatesShuffle(teams);

  // Reassign IDs and names sequentially
  return shuffledTeams.map((team, index) => ({
    ...team,
    id: `team-${index + 1}`,
    name: `Отбор ${index + 1}`,
  }));
}
