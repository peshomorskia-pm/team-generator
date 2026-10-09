import type { Team, TournamentGroup } from '../types';
import { fisherYatesShuffle } from './shuffle';

export const BULGARIAN_CYRILLIC_ALPHABET = [
  'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З',
  'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П',
  'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч',
  'Ш', 'Щ', 'Ъ', 'Ю', 'Я',
];

/**
 * Calculates tournament group sizes according to amateur tennis guidelines:
 * - N < 3: empty
 * - N = 3, 4, 5: 1 single group
 * - N >= 6: groups of size 3 or 4, with R groups of size 4 and G - R groups of size 3,
 *   where G = ceil(N / 4), B = floor(N / G), R = N % G.
 */
export function calculateGroupSizes(n: number): number[] {
  if (n < 3) {
    return [];
  }

  if (n === 3 || n === 4 || n === 5) {
    return [n];
  }

  const G = Math.ceil(n / 4);
  const B = Math.floor(n / G);
  const R = n % G;

  const sizes: number[] = [];
  for (let i = 0; i < R; i++) {
    sizes.push(B + 1);
  }
  for (let i = 0; i < G - R; i++) {
    sizes.push(B);
  }

  return sizes;
}

/**
 * Generates Cyrillic group naming (e.g. 'Група А', 'Група Б', ...).
 */
export function getBulgarianGroupLabel(index: number): string {
  const letter = BULGARIAN_CYRILLIC_ALPHABET[index] ?? String(index + 1);
  return `Група ${letter}`;
}

/**
 * Pure function to partition an array of teams into tournament groups.
 * Does not mutate the source teams array.
 */
export function partitionIntoGroups(teams: Team[]): TournamentGroup[] {
  if (!teams || teams.length < 3) {
    return [];
  }

  const sizes = calculateGroupSizes(teams.length);
  const groups: TournamentGroup[] = [];
  let cursor = 0;

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    groups.push({
      id: `group-${i}`,
      name: getBulgarianGroupLabel(i),
      teams: teams.slice(cursor, cursor + size),
    });
    cursor += size;
  }

  return groups;
}

/**
 * Shuffles teams via Fisher-Yates and partitions them into tournament groups.
 */
export function drawTournamentGroups(teams: Team[]): TournamentGroup[] {
  if (!teams || teams.length < 3) {
    return [];
  }

  const shuffled = fisherYatesShuffle(teams);
  return partitionIntoGroups(shuffled);
}
