import { Player, Team } from '../types';
import { fisherYatesShuffle } from './shuffle';

/**
 * Distributes players into teams balancing by total skill rating.
 * Uses greedy multi-way number partitioning (LPT) with randomized tie-breaking
 * on candidate teams sharing the minimum rating and player count, and shuffles
 * final team groupings to avoid deterministic team ordering.
 *
 * @param players - Array of players to distribute
 * @param numTeams - Positive number of teams to form
 * @returns Array of balanced Team objects
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
 * Distributes players into teams balancing by total skill rating.
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

  // Sort players descending by rating (default rating 0 if undefined).
  // When ratings are equal, preserve the relative order from the input array
  // (which is pre-shuffled) so that identical ratings yield varied distributions.
  const sortedPlayers = [...players].sort((a, b) => {
    const ratingA = getPlayerRating(a, formatStr);
    const ratingB = getPlayerRating(b, formatStr);
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
    const pRating = getPlayerRating(player, formatStr);
    chosenTeam.players.push(player);
    chosenTeam.totalRating = (chosenTeam.totalRating ?? 0) + pRating;
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

