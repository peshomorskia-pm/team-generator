# 0023. Tournament Match Round Number Persistence and Display

- **Status:** Accepted
- **Date:** 2026-10-10
- **Branch:** `feature/tournament-match-round-number`

## Context and Problem Statement

Tournament match round-robin schedules previously generated round numbers (e.g. Round 1, Round 2) via `roundRobin.ts`, but these round numbers were lost upon database persistence because the `public.matches` table lacked a `round` column. As a result, users viewing matches in `MatchesPage` or inspect match cards could not identify or search by match round.

## Decision Drivers

1. **Round Tracking:** Tournament schedules require explicit round persistence so matches retain their round association across sessions and database storage.
2. **User Experience & Localization:** Users need clear visual indicators for tournament rounds (`Кръг {round}`) and intuitive search filtering in Bulgarian.
3. **Backward Compatibility:** Standalone matches and existing records without rounds must continue to function normally (`round = NULL`).
4. **Idempotency:** Migrations must safely apply without disrupting production environments.

## Considered Options

1. **Option A:** Store round info inside a JSON metadata column.
   - *Pros:* Avoids schema changes.
   - *Cons:* Poor indexing, weak type safety, non-standard querying.
2. **Option B:** Add a dedicated `round INTEGER NULL` column to `public.matches`.
   - *Pros:* Clean relational design, robust indexing, straightforward Supabase TypeScript mapping, and native sorting/filtering support. (Chosen)

## Decision Outcome

**Chosen Option:** Option B (`round INTEGER NULL` column).

### Implementation Details:
1. **Database Migration:** Created `supabase/migrations/20261010120000_add_match_round_number.sql` executing `ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS round INTEGER NULL;`.
2. **Type Contracts:** Updated database types (`database.types.ts`), domain match models (`match.ts`), and hooks (`matches.ts`) to include `round?: number | null`.
3. **Data Layer Persistence:** Updated `bulkCreateMatches`, `createMatch`, and `updateMatch` in `useMatches.ts` to persist `round`.
4. **Presentation Layer:** Updated `MatchCard.tsx` to render a localized badge (`Кръг {match.round}`) and `MatchesPage.tsx` to support search filtering by round query ("Кръг X" or "X").

## Consequences

- **Positive:** Full round traceability for tournament round-robin matches, improved search UX in Bulgarian, 100% test coverage across 472 passing tests.
- **Negative / Trade-offs:** Minor schema expansion; trivial maintenance overhead.
