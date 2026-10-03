import type { PlayerRow } from '../types/database.types';
import type { MatchDetail, MatchFormat, MatchPlayerDetail } from '../types/matches';
import type { Player } from '../types/player';
import { calculateMatchElo, DEFAULT_RATING } from './elo';

export interface RecalculationResult {
  updatedPlayers: Player[];
  updatedMatchPlayers: MatchPlayerDetail[];
  updatedMatches: MatchDetail[];
}

/**
 * Determines whether a match should be treated as doubles based on roster size or format field.
 */
export function resolveMatchFormat(match: {
  match_format?: MatchFormat | string | null;
  match_players?: { team_side: 'team_1' | 'team_2' }[];
}): MatchFormat {
  const team1Count = match.match_players?.filter((p) => p.team_side === 'team_1').length ?? 0;
  const team2Count = match.match_players?.filter((p) => p.team_side === 'team_2').length ?? 0;

  if (team1Count > 1 || team2Count > 1) {
    return 'doubles';
  }

  if (match.match_format === 'doubles') {
    return 'doubles';
  }

  return 'singles';
}

export interface RecalculateRatingsOptions {
  initialBaselines?: boolean;
}

/**
 * Deterministically recalculates all player ratings and match snapshots
 * by replaying matches chronologically from a baseline of 1200.
 */
export function recalculateRatings(
  matches: MatchDetail[],
  players: (Player | PlayerRow)[],
  options?: RecalculateRatingsOptions
): RecalculationResult {
  // 1. Initialize player map with clean baselines (or existing if initialBaselines is set)
  const playerMap = new Map<string, Player>();

  for (const p of players) {
    const useInitial = Boolean(options?.initialBaselines);
    playerMap.set(p.id, {
      id: p.id,
      name: p.name,
      singles_rating: useInitial ? (p.singles_rating ?? p.rating ?? DEFAULT_RATING) : DEFAULT_RATING,
      doubles_rating: useInitial ? (p.doubles_rating ?? p.rating ?? DEFAULT_RATING) : DEFAULT_RATING,
      rating: useInitial ? (p.singles_rating ?? p.rating ?? DEFAULT_RATING) : DEFAULT_RATING,
      singles_matches_played: useInitial ? (p.singles_matches_played ?? 0) : 0,
      singles_wins: useInitial ? (p.singles_wins ?? 0) : 0,
      singles_losses: useInitial ? (p.singles_losses ?? 0) : 0,
      doubles_matches_played: useInitial ? (p.doubles_matches_played ?? 0) : 0,
      doubles_wins: useInitial ? (p.doubles_wins ?? 0) : 0,
      doubles_losses: useInitial ? (p.doubles_losses ?? 0) : 0,
      created_at: p.created_at,
      updated_at: p.updated_at,
    });
  }

  // Helper to ensure a player exists in the map
  const getOrCreatePlayer = (id: string, name?: string): Player => {
    let existing = playerMap.get(id);
    if (!existing) {
      existing = {
        id,
        name: name || 'Играч',
        singles_rating: DEFAULT_RATING,
        doubles_rating: DEFAULT_RATING,
        rating: DEFAULT_RATING,
        singles_matches_played: 0,
        singles_wins: 0,
        singles_losses: 0,
        doubles_matches_played: 0,
        doubles_wins: 0,
        doubles_losses: 0,
      };
      playerMap.set(id, existing);
    }
    return existing;
  };

  // 2. Separate completed and upcoming matches
  const completedMatches: MatchDetail[] = [];
  const upcomingMatches: MatchDetail[] = [];

  for (const m of matches) {
    if (m.team_1_score !== null && m.team_2_score !== null) {
      completedMatches.push(m);
    } else {
      upcomingMatches.push(m);
    }
  }

  // 3. Sort completed matches chronologically (ascending)
  completedMatches.sort((a, b) => {
    const timeA = new Date(a.played_at).getTime();
    const timeB = new Date(b.played_at).getTime();
    if (timeA !== timeB) return timeA - timeB;

    const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (createA !== createB) return createA - createB;

    return (a.id ?? '').localeCompare(b.id ?? '');
  });

  const allUpdatedMatchPlayers: MatchPlayerDetail[] = [];
  const updatedCompletedMatches: MatchDetail[] = [];

  // 4. Chronologically replay matches
  for (const match of completedMatches) {
    const format = resolveMatchFormat(match);
    const score1 = match.team_1_score!;
    const score2 = match.team_2_score!;

    const t1Participants = match.match_players.filter((p) => p.team_side === 'team_1');
    const t2Participants = match.match_players.filter((p) => p.team_side === 'team_2');

    const getParticipantRating = (p: MatchPlayerDetail): number => {
      if (!p.player_id) return DEFAULT_RATING;
      const player = getOrCreatePlayer(p.player_id, p.players?.name);
      return format === 'doubles' ? player.doubles_rating : player.singles_rating;
    };

    const team1Ratings = t1Participants.map(getParticipantRating);
    const team2Ratings = t2Participants.map(getParticipantRating);

    const { team1Delta, team2Delta } = calculateMatchElo({
      format,
      team1Ratings,
      team2Ratings,
      score1,
      score2,
    });

    const team1Won = score1 > score2;
    const team2Won = score2 > score1;

    // Process Team 1 players
    const updatedT1: MatchPlayerDetail[] = t1Participants.map((p) => {
      if (!p.player_id) {
        return {
          ...p,
          rating_before: null,
          rating_after: null,
        };
      }

      const player = getOrCreatePlayer(p.player_id, p.players?.name);
      const ratingBefore = format === 'doubles' ? player.doubles_rating : player.singles_rating;
      const ratingAfter = ratingBefore + team1Delta;

      if (format === 'doubles') {
        player.doubles_rating = ratingAfter;
        player.doubles_matches_played += 1;
        if (team1Won) player.doubles_wins += 1;
        else if (team2Won) player.doubles_losses += 1;
      } else {
        player.singles_rating = ratingAfter;
        player.rating = ratingAfter;
        player.singles_matches_played += 1;
        if (team1Won) player.singles_wins += 1;
        else if (team2Won) player.singles_losses += 1;
      }

      return {
        ...p,
        rating_before: ratingBefore,
        rating_after: ratingAfter,
      };
    });

    // Process Team 2 players
    const updatedT2: MatchPlayerDetail[] = t2Participants.map((p) => {
      if (!p.player_id) {
        return {
          ...p,
          rating_before: null,
          rating_after: null,
        };
      }

      const player = getOrCreatePlayer(p.player_id, p.players?.name);
      const ratingBefore = format === 'doubles' ? player.doubles_rating : player.singles_rating;
      const ratingAfter = ratingBefore + team2Delta;

      if (format === 'doubles') {
        player.doubles_rating = ratingAfter;
        player.doubles_matches_played += 1;
        if (team2Won) player.doubles_wins += 1;
        else if (team1Won) player.doubles_losses += 1;
      } else {
        player.singles_rating = ratingAfter;
        player.rating = ratingAfter;
        player.singles_matches_played += 1;
        if (team2Won) player.singles_wins += 1;
        else if (team1Won) player.singles_losses += 1;
      }

      return {
        ...p,
        rating_before: ratingBefore,
        rating_after: ratingAfter,
      };
    });

    const updatedMatchPlayers = [...updatedT1, ...updatedT2];
    allUpdatedMatchPlayers.push(...updatedMatchPlayers);

    updatedCompletedMatches.push({
      ...match,
      match_format: format,
      match_players: updatedMatchPlayers,
    });
  }

  // 5. Clean up upcoming matches (ratings null)
  const updatedUpcomingMatches: MatchDetail[] = upcomingMatches.map((m) => {
    const format = resolveMatchFormat(m);
    const updatedPlayers = m.match_players.map((p) => ({
      ...p,
      rating_before: null,
      rating_after: null,
    }));
    allUpdatedMatchPlayers.push(...updatedPlayers);
    return {
      ...m,
      match_format: format,
      match_players: updatedPlayers,
    };
  });

  const allUpdatedMatches = [...updatedCompletedMatches, ...updatedUpcomingMatches].sort(
    (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  );

  return {
    updatedPlayers: Array.from(playerMap.values()),
    updatedMatchPlayers: allUpdatedMatchPlayers,
    updatedMatches: allUpdatedMatches,
  };
}
