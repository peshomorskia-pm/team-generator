# 30. Alphabetical Player Sorting

## Status
Accepted

## Context
Players were previously retrieved from Supabase and rendered in order of creation (`created_at`) or descending rating, creating confusion when looking for players across various parts of the application. Users requested that wherever players appear, they should be sorted in strict alphabetical order (Bulgarian Cyrillic А-Я).

## Decision
1. Implemented centralized Bulgarian Cyrillic collation via `Intl.Collator('bg', { sensitivity: 'base', numeric: true })` in `src/utils/playerSort.ts`.
2. Updated `usePlayers.ts` queries to `.order('name', { ascending: true })` and sorted local state deterministically.
3. Ensured defense-in-depth alphabetical order across:
   - `PlayersPage.tsx`
   - `PlayerSelector.tsx`
   - `ActivePool.tsx`
   - `TeamSlotPickerModal.tsx`
   - `PlayerCombobox.tsx`
   - `TournamentInteractiveBoard.tsx`
4. Strictly preserved rating-based algorithms in `balance.ts` and rankings.

## Consequences
- **Positive:** Predictable, intuitive player discovery across all views and modals in Bulgarian Cyrillic.
- **Positive:** Zero regressions in rating calculations or tournament leaderboard rankings.
- **Negative:** None.
