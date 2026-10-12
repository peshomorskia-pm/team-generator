/**
 * Player sorting utility providing deterministic Bulgarian Cyrillic collation.
 */

export interface HasPlayerName {
  name: string;
}

export const bulgarianCollator = new Intl.Collator('bg', {
  sensitivity: 'base',
  numeric: true,
});

/**
 * Standard comparator function using Bulgarian locale rules.
 * Supports comparison by name string or object with a name property.
 * Trims leading/trailing whitespace and collates case-insensitively and diacritic-insensitively.
 */
export function comparePlayerNames(
  a: string | HasPlayerName,
  b: string | HasPlayerName
): number {
  const nameA = typeof a === 'string' ? a : a.name;
  const nameB = typeof b === 'string' ? b : b.name;
  return bulgarianCollator.compare(nameA.trim(), nameB.trim());
}

/**
 * Pure function returning a new array sorted alphabetically by name according to Bulgarian collation rules.
 * Does not mutate the source array.
 */
export function sortPlayersByName<T extends HasPlayerName>(players: readonly T[]): T[] {
  return [...players].sort((p1, p2) => comparePlayerNames(p1.name, p2.name));
}
