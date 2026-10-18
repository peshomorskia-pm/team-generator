# 36. Tournament Safe Deletion and Cascade Cleanup

Date: 2026-10-18
Status: Accepted

## Context

Tournament deletion in the application previously relied on a database foreign key constraint configured with `ON DELETE SET NULL` on the `matches.tournament_id` column. When a tournament was deleted, associated match history records were orphaned in the database rather than cleaned up. 

Furthermore, deleting completed or active tournaments carried a severe risk of accidental data loss without strict confirmation guardrails. Users could inadvertently destroy valuable tournament match history, statistics, and player records with a single click.

## Decision

We have implemented a comprehensive, two-pronged safety architecture for tournament deletion:

1. **Dual-Mode `DeleteTournamentModal` ([DeleteTournamentModal.tsx](file:///D:/Projects/team-generator/src/components/tournament/DeleteTournamentModal.tsx))**:
   - **Draft Tournaments**: Simple, low-friction confirmation modal featuring an amber warning banner and a straightforward single-click deletion CTA ("Изтрий").
   - **Active & Completed Tournaments**: High-security destructive warning modal featuring a red alert banner and a strict confirmation mechanism. Users are required to type the exact name of the tournament into an input field before the destructive action button ("🗑️ Изтрий безвъзвратно") is unlocked.

2. **Database-Level Cascade Deletion ([20261019000000_cascade_delete_tournament_matches.sql](file:///D:/Projects/team-generator/supabase/migrations/20261019000000_cascade_delete_tournament_matches.sql))**:
   - Updated the foreign key constraint `matches_tournament_id_fkey` from `ON DELETE SET NULL` to `ON DELETE CASCADE`.
   - Ensuring atomic, cascading deletion of all associated tournament matches and child match players (`match_players`) when a tournament is deleted. Standalone non-tournament matches (`tournament_id IS NULL`) remain unaffected.

## Consequences

### Positive
- **Zero Accidental Data Loss**: Active and completed tournaments are fully protected against accidental deletion by requiring explicit name-typing verification.
- **Clean Database State**: Cascading foreign keys eliminate orphaned tournament matches and child player records upon tournament deletion.
- **Enhanced User Experience**: Tailored confirmation flows respect the lifecycle state of the tournament (lightweight for drafts, robust for active/completed).
- **Localization Compliance**: 100% Bulgarian UI copy and accessibility attributes across all deletion modals and error/success states.

### Negative
- **Destructive Permanence**: Deleting an active or completed tournament permanently removes all associated match history and cannot be undone (mitigated by the strict confirmation requirement).
