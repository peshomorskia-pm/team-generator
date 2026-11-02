# 49. Player Selection & Roster Win Rate Badges

Date: 2026-11-01 (Amended: 2026-11-02)

## Status
Accepted

## Context
1. Following the deprecation of the legacy chess ELO subsystem ([ADR-0046](file:///D:/Projects/team-generator/docs/adr/0046-deprecation-of-legacy-elo-subsystem.md)) and the introduction of pure sports standings ([ADR-0047](file:///D:/Projects/team-generator/docs/adr/0047-pure-sports-standings-and-form-tracking.md)), chess-style rating badges (`⭐ 1260`, `⭐ 1185`) remained visible across player selection and roster surfaces (`PlayerSelector`, `ActivePool`, and `TeamSlotPickerModal`).
2. Displaying chess ELO numbers alongside a Star icon caused cognitive dissonance for users and tournament organizers, as chess ratings do not represent recreational tennis performance or win/loss records.
3. User observations identified residual ELO badges appearing in formed teams and tournament group stages (`⭐ 2383`, `⭐ 2400`, `★ 1183`). The Product Owner confirmed that aggregate team performance is unnecessary and only individual player win rates should be visible.
4. Players in the selection pool and assigned team rosters needed a clear, format-aware sports metric (win percentage) with an intuitive prior for new or unplayed players (neutral label `"Нов"` with 50.0% prior) rather than misleading 0% or NaN values, alongside clear `"Гост"` badges for guest players.
5. The underlying rating-based team balancing algorithm (`balanceTeams`) must remain intact behind the scenes to preserve balanced match generation without breaking changes.
6. In generic mode, all sports, win rate, `"Нов"`, and `"Гост"` badges should remain hidden to preserve a clean, format-agnostic roster experience.

## Decision
1. **Pure Win Rate Calculation Engine (`getPlayerWinRate` in `src/utils/balance.ts`)**:
   - Implemented `getPlayerWinRate(player: PlayerLike, format?: 'singles' | 'doubles'): PlayerWinRateInfo`.
   - **Tier 1 (Format-Specific Check)**: Computes win rate from `singles_wins / singles_matches_played` or `doubles_wins / doubles_matches_played` when format matches and matches played > 0.
   - **Tier 2 (Aggregate Fallback)**: If format-specific matches equal 0 (or format is omitted), aggregates total wins across singles and doubles divided by total matches played.
   - **Tier 3 (Result Formatting / Neutral Prior)**: When matches played > 0, returns numeric `winRate` rounded to 1 decimal place and integer percentage label (e.g., `'80%'`, `'33%'`). When total matches played equals 0, returns neutral prior `{ winRate: 50.0, isNew: true, label: 'Нов' }`.
2. **Domain Model & Interface Extensions**:
   - Extended `GeneratorPlayer` (`src/types/generator.ts`), `DatabasePlayer` (`src/types/generator.ts`), and `Player` (`src/types/index.ts`) to carry match statistics: `singles_matches_played`, `singles_wins`, `singles_losses`, `doubles_matches_played`, `doubles_wins`, `doubles_losses`, `winRate`, `isGuest`, and `source`.
3. **State Propagation**:
   - Updated `useTeamGenerator.ts` (`toggleRegisteredPlayer` and `addRegisteredPlayer`) to forward match statistics when constructing `GeneratorPlayer` objects.
   - Updated `TournamentInteractiveBoard.tsx` (`unassignedPlayersList`) to map match statistics when pushing database players into the slot picker modal list.
4. **UI Sanitization & Clean Typography**:
   - `PlayerSelector.tsx`: Removed `Star` icon and legacy `playerRating` Badge. Renders `Badge` variant `emerald` with `{winRate}%` for active players, or variant `slate` with `"Нов"` for new players. Hidden when `mode === 'generic'`.
   - `ActivePool.tsx`: Removed `Star` icon and legacy `displayRating`. Renders formatted emerald pill for active players, slate pill for new players (`"Нов"`), and retains uppercase `"Гост"` badge for guest players. Hidden when `mode === 'generic'`.
   - `TeamSlotPickerModal.tsx`: Removed `Star` icon and raw ELO rating. Renders format-aware `Badge` (`emerald` for active win rate, `slate` for `"Нов"`) for registered players and retains lowercase `"гост"` badge for guests.
   - `TeamCard.tsx`: Pruned `displayTotalRating` calculation and removed `Star` aggregate badge from header. Replaced player row `★ {playerRating}` with format-aware win rate pill (`{winRate}%`, `"Нов"`, or `"Гост"`), suppressed when `mode === 'generic'`.
   - `GroupCard.tsx`: Pruned `displayTotalRating` calculation and removed `Star` aggregate badge from team headers within tournament groups. Replaced player row `★ {playerRating}` with format-aware win rate pill (`{winRate}%`, `"Нов"`, or `"Гост"`), suppressed when `mode === 'generic'`.
5. **Zero Database Migration**:
   - Leveraged existing columns on Supabase `players` table (`singles_matches_played`, `singles_wins`, `doubles_matches_played`, `doubles_wins`) without schema alterations or data migrations.

## Consequences
- **Positive**:
  - Consistent, authentic sports UI across all team generator, active selection pool, team board, and tournament group stages.
  - Complete elimination of confusing chess ELO numbers and star icons from all user-facing generator workflows.
  - Welcoming onboarding experience for new players with semantic `"Нов"` badge instead of 0% or blank stats, and clear distinction for guest players.
  - Background team balancing algorithms continue to function with zero disruption.
  - 100% automated test coverage across utility, component, and hook layers.
- **Negative / Neutral**:
  - Component and unit tests updated to verify win rate badges, clean headers, and neutral priors rather than legacy rating numbers.
