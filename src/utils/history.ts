import { Team } from '../types';

const STORAGE_KEY = 'team_generator_matchup_history';
const memoryHistory = new Set<string>();

/**
 * Computes a canonical deterministic fingerprint string for a set of teams.
 * Players within each team are sorted by ID/name, and teams are sorted by their first player.
 */
export function generateTeamsFingerprint(teams: Team[]): string {
  const normalizedTeams = teams
    .map((team) =>
      [...team.players]
        .map((p) => p.name.trim().toLowerCase())
        .sort((a, b) => a.localeCompare(b))
    )
    .sort((a, b) => {
      const firstA = a[0] ?? '';
      const firstB = b[0] ?? '';
      return firstA.localeCompare(firstB);
    });

  return JSON.stringify(normalizedTeams);
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
        if (Array.isArray(parsed)) {
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

/**
 * Checks whether a given team lineup has already been generated in the provided history.
 */
export function isDuplicateMatchup(teams: Team[], history: Set<string>): boolean {
  if (history.size === 0 || teams.length === 0) {
    return false;
  }
  const fingerprint = generateTeamsFingerprint(teams);
  return history.has(fingerprint);
}

/**
 * Clears cached matchup history (useful for tests or reset actions).
 */
export function clearMatchupHistory(): void {
  memoryHistory.clear();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
