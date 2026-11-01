# 46. Deprecation of Legacy ELO Subsystem

Date: 2026-11-01

## Status
Accepted

## Context
1. The application originally featured a chess-style logistic ELO rating system (1200 default rating, K=32) introduced in ADR-0013 and ADR-0014.
2. In practice for casual and recreational tennis tournaments, chess-style rating points (`1200 т.`, `+15`, `-10` delta chips) proved confusing and ill-suited for participants and organizers.
3. The deterministic ELO recalculation engine (`eloRecalculation.ts`) and Supabase RPC trigger (`recalculate_all_elo`) imposed unnecessary replay complexity on match writes and deletions.
4. Player standings are more naturally and intuitively represented by standard sports metrics: win percentage (`winRate`), total wins, and total matches played.
5. In preparation for a dedicated sports statistics engine, the legacy chess ELO subsystem required complete deprecation across both client state mutations and UI presentations without breaking the existing database schema.

## Decision
1. **Engine Deprecation and Deletion**:
   - Deleted `src/utils/elo.ts` (chess ELO math, logistic expected score formula, K-factor calculation).
   - Deleted `src/utils/eloRecalculation.ts` (deterministic rating replay engine).
   - Deleted obsolete test suites `src/utils/__tests__/elo.test.ts` and `src/utils/__tests__/eloRecalculation.test.ts`.

2. **Utility Extraction (`matchFormat.ts`)**:
   - Extracted `resolveMatchFormat` into a standalone, lightweight utility in `src/utils/matchFormat.ts` with dedicated unit test suite `src/utils/__tests__/matchFormat.test.ts`.
   - Preserved identical format resolution semantics (resolving to `'doubles'` if roster participants > 1 or format is explicitly `'doubles'`, otherwise `'singles'`).

3. **Decoupled Match Persistence (`useMatches.ts`)**:
   - Removed all ELO calculation logic, rating deltas, and Supabase RPC `'recalculate_all_elo'` calls.
   - Match player rows record `rating_before: null` and `rating_after: null`.
   - Replaced replay engine with a lean match statistics accumulator tallying `singles_matches_played`, `singles_wins`, `singles_losses`, `doubles_matches_played`, `doubles_wins`, and `doubles_losses` on the `players` table without modifying rating columns.

4. **Pure Sports Rankings Ordering (`useRankings.ts`)**:
   - Standings ranking sorts players primarily by win percentage (`winRate`), followed by total wins (`wins`), total matches played (`matchesPlayed`), and alphabetical name ascending.

5. **Presentation Sanitization**:
   - `MatchCard.tsx`: Removed rating delta calculation and chips (`+15`, `-10`).
   - `Podium.tsx`: Removed `1200 т.` rating pills; displays place title (`Шампион`, `2-ро място`, `3-то място`), player name, and match record (`9П - 1З (90%)`).
   - `RankingsTable.tsx` & `RankingsMobile.tsx`: Removed legacy `Рейтинг` columns and points badges.
   - `RankingsPage.tsx`: Updated Bulgarian subtitle to `"Класиране и статистика на играчите"`.
   - `PlayersPage.tsx`: Removed desktop table `Рейтинг` column, mobile dual ELO badges, and deleted obsolete `getRatingBadgeVariant`.
   - `PlayerModal.tsx`: Removed 3 rating input fields and validations, presenting a clean player name form.

6. **Database Schema Compatibility**:
   - Preserved column nullability and default values (`DEFAULT 1200.00`) in the Supabase schema for zero downtime and backward database client compatibility.

## Consequences
- **Positive**:
  - Intuitive, clean Bulgarian UI focused on player match records rather than chess ELO points.
  - Simplified match creation, update, and deletion lifecycle without replay overhead or RPC coupling.
  - Clean architecture preparing the application for future tennis sports statistics engines.
  - Zero database downtime and zero data loss.
- **Negative / Neutral**:
  - Test suites asserting legacy ELO values and input fields updated to verify pure match records and clean UI forms.
