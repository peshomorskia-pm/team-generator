# ADR-0053: Player Profile Data & Calculation Engine

## Status
Accepted

## Context
Phase 1 of the Player Profiles & Personal Match History roadmap requires a robust, pure, and deterministic calculation engine to aggregate historical player stats, performance trends, match timelines, partner chemistry, rivalries, and tournament titles. 

Key architectural requirements:
1. **Pure Calculation Module:** Zero UI or network side-effects. Take raw tournaments, matches, and players as input; output fully typed, calculated profile structures.
2. **SSOT Adherence:** Reuse existing calculation utilities (e.g., `calculateGameDifference` from `src/utils/standingsStats.ts`) to avoid duplicate logic.
3. **Format Breakdowns:** Aggregate stats across `all`, `singles`, and `doubles` formats with strict win-rate rounding and neutral `50.0%` prior for zero matches.
4. **Partner & Rival Analytics:** Deterministic tie-breaking hierarchies (win rate %, total matches, wins, alphabetical Bulgarian collation via `localeCompare('bg')`).
5. **Tournament Titles Tracking:** Accurate detection of won finals (`stage === 'final'`) with deduplication across tournament IDs.
6. **Robust Edge Case Handling:** Safe parsing of guest participants, incomplete matches, perspective-aware score displays, and Bulgarian stage names (`финал`, `полуфинал`, `група`, etc.).

## Decision
1. **Implemented [src/utils/playerProfileStats.ts](file:///D:/Projects/team-generator/src/utils/playerProfileStats.ts):**
   - Exported pure helper and main entry-point functions: `computePlayerProfileStats`, `calculatePlayerProfileData`, and backward-compatible aliases.
   - Designed comprehensive TypeScript contracts: `PlayerProfileStats`, `PlayerTimelineItem`, `PlayerPartnerStat`, `PlayerRivalStat`, `PlayerTournamentTitle`.
2. **Tested via [src/utils/__tests__/playerProfileStats.test.ts](file:///D:/Projects/team-generator/src/utils/__tests__/playerProfileStats.test.ts):**
   - Created a 25-scenario unit test suite covering empty profiles, singles/doubles isolation, tie-breaks, guest handling, and game difference calculations.

## Consequences
- **Positive:** Clean separation of concerns, 100% test coverage for player stats calculation, zero UI coupling, fully localized Bulgarian support and collation.
- **Negative / Trade-offs:** Computation happens on-demand; for extremely large tournaments dataset (>10,000 matches), memoization or pre-aggregation may be introduced in future phases.
