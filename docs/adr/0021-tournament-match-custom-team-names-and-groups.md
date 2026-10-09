# 21. Tournament Match Custom Team Names and Groups

Date: 2026-10-10
Status: Accepted

## Context

Previously, tournament match generation from the team generator (`GeneratorPage`) persisted matches with generic default team names (`'Отбор 1'`, `'Отбор 2'`) and lacked any association with tournament groups (e.g. "Група А", "Група Б"). When users saved tournament match schedules to the central matches view (`MatchesPage`), all match cards appeared identical with respect to team header titles, making it impossible to distinguish between different matches within a tournament or identify group affiliations.

Furthermore, the database schema (`public.matches`) did not contain columns to store custom team names or group identifiers per match row, and search filtering on `/matches` only inspected player and guest names.

## Decision

We have introduced comprehensive database, type, hook, and UI enhancements to support custom team names and group associations:

1. **Database Schema & Migration**:
   - Added nullable columns `team_1_name`, `team_2_name`, and `group_name` to `public.matches`.
   - Created an idempotent migration script (`supabase/migrations/20261010000000_add_match_team_names_and_group.sql`) with safe fallback backfills (`COALESCE(team_1_name, 'Отбор 1')`).

2. **TypeScript Type Definitions**:
   - Extended `MatchRow`, `MatchInsert`, `MatchUpdate` in `src/types/database.types.ts`.
   - Extended domain types `Match`, `MatchDetail`, `MatchFormData`, `CreateMatchInput`, and `UpdateMatchInput` in `src/types/match.ts` and `src/types/matches.ts`.

3. **Tournament Bulk Persistence**:
   - Updated `bulkCreateMatches` in `src/hooks/useMatches.ts` to map generated tournament team names (`item.team1.name`, `item.team2.name`) and group names (`item.groupName ?? null`) into the Supabase insertion payload.

4. **Dynamic UI Rendering & Group Badges**:
   - Enhanced `MatchCard.tsx` to dynamically render `{match.team_1_name || 'Отбор 1'}` and `{match.team_2_name || 'Отбор 2'}`.
   - Added an outline `<Badge>` component rendering group names (e.g., `[ Група А ]`) when `match.group_name` is present.

5. **Search Filter Expansion**:
   - Extended search filtering in `MatchesPage.tsx` to evaluate `group_name`, `team_1_name`, and `team_2_name` alongside player and guest names.

## Consequences

- **Positive**: Tournament schedules saved from `GeneratorPage` now preserve exact team names and group affiliations, providing clear visual differentiation on `MatchesPage`.
- **Positive**: Users can search and filter matches instantly by group name or custom team name.
- **Positive**: Full backward compatibility is maintained for legacy matches without custom team names or group associations.
- **Positive**: 100% test pass rate across 461 tests in 42 files.
