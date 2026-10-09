import type { Team, TournamentGroup, TournamentMatch, TournamentRound } from '../types';

/**
 * Pure function implementing the Berger circle algorithm for generating
 * round-robin tournament schedules for a group of teams.
 *
 * Characteristics:
 * - If N < 2: returns empty array [].
 * - If N is odd: adds a dummy team placeholder (null) to represent byes.
 * - Rotates elements around index 0 across rounds (circle method).
 * - Matches per round: floor(N / 2).
 * - Total rounds: N is even ? N - 1 : N.
 * - Deterministic, pure function without side-effects.
 *
 * @param group - Tournament group with teams
 * @returns Array of TournamentRound
 */
export function generateGroupRoundRobin(group: TournamentGroup): TournamentRound[] {
  if (!group || !group.teams || group.teams.length < 2) {
    return [];
  }

  const teams = [...group.teams];
  const isOdd = teams.length % 2 !== 0;
  const participants: (Team | null)[] = isOdd ? [...teams, null] : [...teams];
  const numParticipants = participants.length;
  const numRounds = numParticipants - 1;
  const half = numParticipants / 2;

  const rounds: TournamentRound[] = [];
  let current = [...participants];

  for (let r = 0; r < numRounds; r++) {
    const roundNumber = r + 1;
    let byeTeam: Team | undefined = undefined;

    // Detect bye team in this round if any
    for (let i = 0; i < half; i++) {
      const t1 = current[i];
      const t2 = current[numParticipants - 1 - i];

      if (t1 === null && t2 !== null) {
        byeTeam = t2;
      } else if (t2 === null && t1 !== null) {
        byeTeam = t1;
      }
    }

    // Generate matches for this round
    const matches: TournamentMatch[] = [];
    let matchIdx = 1;
    for (let i = 0; i < half; i++) {
      const t1 = current[i];
      const t2 = current[numParticipants - 1 - i];

      if (t1 !== null && t2 !== null) {
        matches.push({
          id: `match-${group.id}-r${roundNumber}-m${matchIdx}`,
          groupId: group.id,
          groupName: group.name,
          round: roundNumber,
          team1: t1,
          team2: t2,
          byeTeam,
        });
        matchIdx++;
      }
    }

    rounds.push({
      roundNumber,
      matches,
      byeTeam,
    });

    // Berger circle rotation: index 0 remains fixed, remaining rotate clockwise
    const fixed = current[0];
    const rest = current.slice(1);
    const last = rest[rest.length - 1];
    const shifted = [last, ...rest.slice(0, rest.length - 1)];
    current = [fixed, ...shifted];
  }

  return rounds;
}

/**
 * Aggregates and returns all tournament matches across all provided groups,
 * sorted by group and round order.
 *
 * @param groups - Array of tournament groups
 * @returns Flattened array of TournamentMatch
 */
export function generateTournamentSchedule(groups: TournamentGroup[]): TournamentMatch[] {
  if (!groups || groups.length === 0) {
    return [];
  }

  const matches: TournamentMatch[] = [];

  for (const group of groups) {
    const rounds = generateGroupRoundRobin(group);
    for (const round of rounds) {
      matches.push(...round.matches);
    }
  }

  return matches;
}
