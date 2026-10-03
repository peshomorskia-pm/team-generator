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
 * @param format - Match format ('singles' | 'doubles') used to resolve player rating
 * @returns Array of balanced Team objects
 */
export function balanceTeams(
  players: Player[],
  numTeams: number,
  format?: 'singles' | 'doubles'
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

  // Sort players descending by rating (default rating 0 if undefined).
  // When ratings are equal, preserve the relative order from the input array
  // (which is pre-shuffled) so that identical ratings yield varied distributions.
  const sortedPlayers = [...players].sort((a, b) => {
    const ratingA = getPlayerRating(a, format);
    const ratingB = getPlayerRating(b, format);
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }
    return 0;
  });

  // Distribute players greedily to candidate teams with lowest total rating,
  // breaking ties with least number of players and randomizing among identical candidates.
  for (const player of sortedPlayers) {
    let minRating = Infinity;
    for (const team of teams) {
      const rating = team.totalRating ?? 0;
      if (rating < minRating) {
        minRating = rating;
      }
    }

    let minPlayerCount = Infinity;
    for (const team of teams) {
      if ((team.totalRating ?? 0) === minRating) {
        if (team.players.length < minPlayerCount) {
          minPlayerCount = team.players.length;
        }
      }
    }

    const candidates = teams.filter(
      (t) => (t.totalRating ?? 0) === minRating && t.players.length === minPlayerCount
    );

    const chosenTeam = candidates[Math.floor(Math.random() * candidates.length)];
    const pRating = getPlayerRating(player, format);
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

