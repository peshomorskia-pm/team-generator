import { Player, Team } from '../types';

/**
 * Distributes players into teams balancing by total skill rating.
 * Uses greedy multi-way number partitioning (LPT) with secondary tie-breaker on player count.
 *
 * @param players - Array of players to distribute
 * @param numTeams - Positive number of teams to form
 * @returns Array of balanced Team objects
 */
export function balanceTeams(players: Player[], numTeams: number): Team[] {
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
    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }
    return 0;
  });

  // Distribute players greedily to the team with lowest total rating,
  // breaking ties with least number of players
  for (const player of sortedPlayers) {
    let minTeamIndex = 0;
    for (let i = 1; i < teams.length; i++) {
      const currentMinRating = teams[minTeamIndex].totalRating ?? 0;
      const candidateRating = teams[i].totalRating ?? 0;

      if (candidateRating < currentMinRating) {
        minTeamIndex = i;
      } else if (candidateRating === currentMinRating) {
        if (teams[i].players.length < teams[minTeamIndex].players.length) {
          minTeamIndex = i;
        }
      }
    }

    teams[minTeamIndex].players.push(player);
    teams[minTeamIndex].totalRating = (teams[minTeamIndex].totalRating ?? 0) + (player.rating ?? 0);
  }

  return teams;
}
