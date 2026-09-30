import { Team } from '../types';

const STORAGE_KEY = 'team_generator_matchup_history';
const memoryHistory = new Set<string>();

/**
 * Computes a canonical deterministic fingerprint string for a set of teams.
 * Players within each team are sorted by normalized name and joined into a team roster signature.
 * Team roster signatures are sorted lexicographically, making the fingerprint
 * order-agnostic for both player order within teams and team order in the list.
 */
export function generateTeamsFingerprint(teams: Team[]): string {
  const teamSignatures = teams
    .map((team) =>
      [...team.players]
        .map((p) => p.name.trim().toLowerCase())
        .sort((a, b) => a.localeCompare(b))
        .join('|')
    )
    .sort((a, b) => a.localeCompare(b));

  return JSON.stringify(teamSignatures);
}

/**
 * Checks whether two team configurations are equivalent, ignoring player order
 * within teams and team order in the array.
 */
export function areTeamConfigsEqual(teamsA: Team[], teamsB: Team[]): boolean {
  return generateTeamsFingerprint(teamsA) === generateTeamsFingerprint(teamsB);
}


/**
 * Validates that an unknown value is an array of strings.
 */
export function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((item) => typeof item === 'string');
}

/**
 * Retrieves the set of previous matchup fingerprints.
 */
export function getPreviousMatchups(): Set<string> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isStringArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch {
      // Fallback to in-memory history if localStorage parsing fails
    }
  }
  return new Set(memoryHistory);
}

/**
 * Caches a team matchup fingerprint in the history.
 */
export function saveMatchup(teams: Team[]): void {
  const fingerprint = generateTeamsFingerprint(teams);
  memoryHistory.add(fingerprint);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const current = getPreviousMatchups();
      current.add(fingerprint);
      // Keep up to 50 recent matchups
      const list = Array.from(current).slice(-50);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore localStorage write failures (e.g. quota exceeded)
    }
  }
}
