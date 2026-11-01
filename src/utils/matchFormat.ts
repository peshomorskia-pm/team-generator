import type { MatchFormat } from '../types/matches';

export interface ResolveMatchFormatInput {
  match_format?: MatchFormat | string | null;
  match_players?: { team_side: 'team_1' | 'team_2' }[];
}

/**
 * Determines whether a match is 'doubles' or 'singles'.
 * If either team side has > 1 participant, or match_format === 'doubles', resolves to 'doubles'.
 * Defaults to 'singles'.
 */
export function resolveMatchFormat(match: ResolveMatchFormatInput): MatchFormat {
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
