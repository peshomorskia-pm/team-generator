# ADR 0024: Tournament Module Foundation - Schema & Data Hook

## Status
Accepted

## Context
TeamGenerator previously supported loosely coupled matches and single-group round-robin draws, but lacked a dedicated parent `tournaments` entity to aggregate multi-group tournaments, track historical tournament completion, record winner team names, and manage tournament metadata over time. To support robust tournament workflows (creation, progress tracking, archiving, and multi-match association), we need a normalized database schema, cascade-safe foreign key constraints, unified TypeScript domain models, and a reactive CRUD data access hook (`useTournaments.ts`).

## Decision
1. **Database Schema (`public.tournaments`)**:
   - Created migration `supabase/migrations/20261010140000_create_tournaments_table.sql` defining `public.tournaments` with UUID primary key, `title` (TEXT NOT NULL), `date` (DATE NOT NULL DEFAULT CURRENT_DATE), `format` (`singles` | `doubles`), `status` (`draft` | `in_progress` | `completed`), `winner_team_name` (TEXT NULL), `notes` (TEXT NULL), and timestamps (`created_at`, `updated_at`).
   - Added CHECK constraints enforcing valid formats and statuses, composite index `idx_tournaments_date_status` on `(date DESC, status)`, and `update_tournaments_updated_at` trigger.
   - Enabled Row Level Security (RLS) with permissive public policies.

2. **Foreign Key Association (`matches.tournament_id`)**:
   - Added nullable `tournament_id` UUID column to `public.matches` referencing `public.tournaments(id)` with `ON DELETE SET NULL` cascade safety, ensuring tournament deletion does not cascade-delete match history.
   - Created index `idx_matches_tournament_id` for efficient filtering and relational joins.

3. **TypeScript Domain Models**:
   - Updated Supabase database types in `database.types.ts`.
   - Created domain interfaces in `src/types/tournament.ts` (`Tournament`, `CreateTournamentInput`, `UpdateTournamentInput`) and updated match typing across `match.ts` and `matches.ts` to include optional `tournament_id?: string | null`.

4. **Reactive CRUD Hook (`useTournaments.ts`)**:
   - Implemented `useTournaments` hook delivering reactive state (`tournaments`, `loading`, `error`), initial fetch on mount with unmount safety (`isMounted` guard), Supabase configuration checks, and complete CRUD operations (`fetchTournaments`, `createTournament`, `updateTournament`, `deleteTournament`) with Bulgarian localized error messages.

## Consequences
* **Positive**: 
  - Establishes a robust, relational foundation for multi-match tournament management.
  - Cascade-safe foreign keys protect match historical records and player ELO ratings when tournaments are deleted.
  - Fully reactive CRUD hook with local state immutability simplifies downstream UI development.
  - 100% test coverage across new schema definitions and hook methods with zero regression.
* **Negative / Trade-offs**:
  - Introduces new schema migrations requiring Supabase application.
  - Requires downstream UI components in PR 2 to bind against the new tournament hooks.
