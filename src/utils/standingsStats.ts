import type { PlayerRow } from '../types/database.types';
import type { MatchDetail, MatchFormat } from '../types/matches';
import type { Player } from '../types/player';
import type { FormOutcome } from '../types/rankings';
import { resolveMatchFormat } from './matchFormat';
import { getMatchOutcome } from './standings';

export interface PlayerSportsStats {
  playerId: string;
  name: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // 0.0 - 100.0 (rounded to 1 decimal place)
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
  form: FormOutcome[]; // Chronological (oldest -> newest, max 5)
  rank: number;
}

export interface GameDifferenceResult {
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
}

/**
 * Calculates games won, lost, and net difference for a specific team in a match.
 * Sums multi-set scores or falls back to casual single set scores.
 */
export function calculateGameDifference(
  match: {
    sets?: { team_1_score: number; team_2_score: number }[] | null;
    team_1_score?: number | null;
    team_2_score?: number | null;
  },
  teamSide: 1 | 2 | 'team_1' | 'team_2'
): GameDifferenceResult {
  let gamesWon = 0;
  let gamesLost = 0;

  if (match.sets && match.sets.length > 0) {
    let t1 = 0;
    let t2 = 0;
    for (const s of match.sets) {
      t1 += s.team_1_score ?? 0;
      t2 += s.team_2_score ?? 0;
    }
    if (teamSide === 1 || teamSide === 'team_1') {
      gamesWon = t1;
      gamesLost = t2;
    } else {
      gamesWon = t2;
      gamesLost = t1;
    }
  } else {
    const t1 = match.team_1_score ?? 0;
    const t2 = match.team_2_score ?? 0;
    if (teamSide === 1 || teamSide === 'team_1') {
      gamesWon = t1;
      gamesLost = t2;
    } else {
      gamesWon = t2;
      gamesLost = t1;
    }
  }

  return {
    gamesWon,
    gamesLost,
    gameDifference: gamesWon - gamesLost,
  };
}

/**
 * Sorts PlayerSportsStats strictly adhering to the 5-tier sports hierarchy
 * and assigns sequential 1-based ranks (1, 2, 3...).
 */
export function sortPlayerSportsStats(
  stats: PlayerSportsStats[]
): PlayerSportsStats[] {
  const sorted = [...stats].sort((a, b) => {
    // Tier 1: Total wins descending
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    // Tier 2: Win rate % descending
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    // Tier 3: Net game difference descending
    if (b.gameDifference !== a.gameDifference) {
      return b.gameDifference - a.gameDifference;
    }
    // Tier 4: Total matches played descending
    if (b.matchesPlayed !== a.matchesPlayed) {
      return b.matchesPlayed - a.matchesPlayed;
    }
    // Tier 5: Bulgarian alphabetical collation
    return a.name.localeCompare(b.name, 'bg');
  });

  return sorted.map((stat, idx) => ({
    ...stat,
    rank: idx + 1,
  }));
}

/**
 * Aggregates player statistics from completed matches for a given format.
 * Sorts player matches chronologically (played_at asc) to extract last 5 outcomes.
 */
export function computePlayerSportsStats(
  players: (PlayerRow | Player)[],
  matches: MatchDetail[],
  format?: MatchFormat
): PlayerSportsStats[] {
  const isSingles = format !== 'doubles';

  // Filter matches matching format (if provided) and ensure completed
  const relevantCompletedMatches = matches.filter((m) => {
    if (format && resolveMatchFormat(m) !== format) {
      return false;
    }
    return getMatchOutcome(m).isCompleted;
  });

  const rawStats: PlayerSportsStats[] = players.map((player) => {
    // Find all completed matches where this player participated
    const playerMatchEntries: {
      match: MatchDetail;
      teamSide: 'team_1' | 'team_2';
      timeValue: number;
    }[] = [];

    for (const m of relevantCompletedMatches) {
      const mp = m.match_players?.find((p) => p.player_id === player.id);
      if (mp && (mp.team_side === 'team_1' || mp.team_side === 'team_2')) {
        const timeValue = m.played_at
          ? new Date(m.played_at).getTime()
          : m.created_at
          ? new Date(m.created_at).getTime()
          : 0;
        playerMatchEntries.push({
          match: m,
          teamSide: mp.team_side,
          timeValue,
        });
      }
    }

    // If player has matches in the matches table
    if (playerMatchEntries.length > 0) {
      // Sort chronologically ascending (oldest first)
      playerMatchEntries.sort((a, b) => {
        if (a.timeValue !== b.timeValue) {
          return a.timeValue - b.timeValue;
        }
        return a.match.id.localeCompare(b.match.id);
      });

      let wins = 0;
      let losses = 0;
      let gamesWon = 0;
      let gamesLost = 0;
      const outcomes: FormOutcome[] = [];

      for (const entry of playerMatchEntries) {
        const outcome = getMatchOutcome(entry.match);
        const won = outcome.winner === entry.teamSide;
        if (won) {
          wins += 1;
          outcomes.push('W');
        } else {
          losses += 1;
          outcomes.push('L');
        }

        const diff = calculateGameDifference(entry.match, entry.teamSide);
        gamesWon += diff.gamesWon;
        gamesLost += diff.gamesLost;
      }

      const matchesPlayed = wins + losses;
      const winRate =
        matchesPlayed > 0 ? Number(((wins / matchesPlayed) * 100).toFixed(1)) : 0;
      const form = outcomes.slice(-5);

      return {
        playerId: player.id,
        name: player.name,
        matchesPlayed,
        wins,
        losses,
        winRate,
        gamesWon,
        gamesLost,
        gameDifference: gamesWon - gamesLost,
        form,
        rank: 0,
      };
    }

    // Graceful backward fallback if player has 0 match rows
    const legacyMatchesPlayed = isSingles
      ? ('singles_matches_played' in player ? player.singles_matches_played ?? 0 : 0)
      : ('doubles_matches_played' in player ? player.doubles_matches_played ?? 0 : 0);
    const legacyWins = isSingles
      ? ('singles_wins' in player ? player.singles_wins ?? 0 : 0)
      : ('doubles_wins' in player ? player.doubles_wins ?? 0 : 0);
    const legacyLosses = isSingles
      ? ('singles_losses' in player ? player.singles_losses ?? 0 : 0)
      : ('doubles_losses' in player ? player.doubles_losses ?? 0 : 0);

    if (legacyMatchesPlayed > 0) {
      const winRate = Number(
        ((legacyWins / legacyMatchesPlayed) * 100).toFixed(1)
      );
      return {
        playerId: player.id,
        name: player.name,
        matchesPlayed: legacyMatchesPlayed,
        wins: legacyWins,
        losses: legacyLosses,
        winRate,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        form: [],
        rank: 0,
      };
    }

    return {
      playerId: player.id,
      name: player.name,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      gamesWon: 0,
      gamesLost: 0,
      gameDifference: 0,
      form: [],
      rank: 0,
    };
  });

  return sortPlayerSportsStats(rawStats);
}
