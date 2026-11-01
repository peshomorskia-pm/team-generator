# 48. Generator Win Rate Balancing and Rankings Column Alignment

Date: 2026-11-01

## Status
Accepted

## Context
1. Following the deprecation of legacy chess ELO ratings (ADR-0046) and the introduction of pure sports standings (ADR-0047), the team generator balancing algorithm required alignment with format-aware sports statistics (win rate percentage `0.0% - 100.0%`).
2. Balancing doubles and singles tennis matches based on match win rates requires an equitable neutral baseline for registered unplayed players (0 matches in format) and casual guests, avoiding skew from arbitrary 0% ratings.
3. Generator player pools must support snake/inversion pairing (e.g. pairing a high-win-rate player with a low-win-rate player in doubles) while strictly respecting team capacity limits (`baseSize` and remainder quota) under extreme skill disparities.
4. Existing test suites, backwards-compatible legacy ELO fixtures, and unrated players without match records must continue to function without regressions.
5. In the rankings table (`RankingsTable.tsx`), the "Успеваемост" column exhibited visual horizontal jitter (zigzag effect across rows) caused by variable-length percentage labels, non-monospaced glyphs, and non-uniform progress bar track widths.

## Decision

1. **Format-Aware Win Rate Resolver (`src/utils/balance.ts`)**:
   - Implemented `getPlayerWinRate(player, format)`:
     - For `singles`: Resolves `(singles_wins / singles_matches_played) * 100` when `singles_matches_played > 0`; otherwise returns the neutral `50.0%` baseline.
     - For `doubles`: Resolves `(doubles_wins / doubles_matches_played) * 100` when `doubles_matches_played > 0`; otherwise returns the neutral `50.0%` baseline.
     - For undefined/overall: Aggregates total wins over total matches played; defaults to `50.0%` if unplayed.
     - Supports explicit `player.winRate` overrides.
   - Implemented `getPlayerEffectiveSkill(player, format)`:
     - Coordinates win rate resolution for players with active match history (`singles_matches_played > 0 || doubles_matches_played > 0 || typeof winRate === 'number'`).
     - Maps explicit unplayed registered players (`matches_played === 0`) to the `50.0%` baseline.
     - Gracefully falls back to legacy ratings (`getPlayerRating`) when match counters are absent, or `0` for unrated players.

2. **Greedy Multi-Way Partitioning with Strict Quotas (`balanceTeams`)**:
   - Updates `balanceTeams` in `src/utils/balance.ts` to pre-sort candidates descending by `getPlayerEffectiveSkill(player, format)`.
   - Distributes candidates greedily to eligible teams minimizing `totalRating` and player count, strictly enforcing capacity constraints (`max(size) - min(size) <= 1`).
   - Accumulates team total ratings rounded to 1 decimal place.
   - Preserves randomized tie-breaking and post-generation Fisher-Yates team shuffling to prevent predictable slotting.
   - Exported pure helper `shuffleTeamsBalanced` in `src/utils/shuffle.ts` and re-exported in `src/utils/balance.ts`.

3. **Generator Hook Integration (`src/hooks/useTeamGenerator.ts`)**:
   - Updated `resolvePlayerRating` to prioritize format-aware win rates when match statistics exist.
   - Extended `toggleRegisteredPlayer` and `addRegisteredPlayer` to preserve match counters (`singles_matches_played`, `singles_wins`, `singles_losses`, `doubles_matches_played`, `doubles_wins`, `doubles_losses`, and `winRate`) from `DatabasePlayer` to `GeneratorPlayer`.
   - Updated `calculateTeamRating` to round accumulated team ratings cleanly to 1 decimal place.

4. **Rankings Table Column Monospace & Linear Alignment (`src/components/rankings/RankingsTable.tsx`)**:
   - Standardized column header to uppercase `УСПЕВАЕМОСТ` with fixed width `w-40`, centered text (`text-center`), and `whitespace-nowrap`.
   - Standardized cell content with centered alignment (`text-center flex justify-center gap-3`).
   - Fixed progress track width (`w-16 sm:w-20 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden shrink-0`).
   - Fixed percentage label width with monospaced tabular numerals (`w-14 tabular-nums text-right font-bold shrink-0`).
   - Guarantees percentage symbols and decimal points align vertically across all rows without horizontal zigzag.

## Consequences

- **Positive**:
  - Generator produces fair, competitive team pairings based on real match performance.
  - Neutral 50.0% baseline treats new registered players equitably without distorting match generator balance.
  - Zero regressions: all existing legacy rating tests and unrated mock fixtures pass 100%.
  - Rankings table displays crisp, uniform, jitter-free visual alignment across all screen sizes.
- **Negative / Neutral**:
  - Hook mappings must maintain all match counters between database and generator models.
