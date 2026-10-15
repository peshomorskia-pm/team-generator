# ADR 0033: Group Standings and Schedule Reset Warning

## Status
Accepted

## Context
In tennis and tournament modes, organizers partition teams into round-robin groups and generate match schedules. Previously, modifying group rosters (removing teams, moving teams between groups, redrawing or auto-filling groups) silently wiped out any existing generated schedules without warning, resulting in accidental data loss for users. Furthermore, tournament organizers required live group standings with deterministic tie-breaker calculations to determine group rankings and prepare for subsequent playoff brackets.

## Decision
1. **Schedule Reset Guard (`ScheduleResetModal` & `useScheduleResetGuard`)**:
   - Implemented `ScheduleResetModal` component presenting a clear Bulgarian warning ("Предупреждение за промяна на групите" / "Внимание: Програмата на мачовете вече е генерирана...").
   - Implemented `useScheduleResetGuard` custom hook that intercepts group mutation actions whenever `schedule.length > 0`, holding the requested action in queue until the user explicitly confirms ("Продължи") or cancels ("Отказ" / Escape / backdrop click).
2. **Pure Standings Engine (`src/utils/standings.ts`)**:
   - Developed `calculateGroupStandings` pure calculation utility aggregating matches into group standings.
   - Computes played (`М`), wins (`П`), losses (`З`), game difference (`+/-`), and points (`Т`: 1 point per win).
   - Guarantees complete roster presence (zeroing out teams with 0 matches played).
3. **5-Tier Deterministic Tie-Breaker Hierarchy**:
   - Implemented deterministic tie-breaking logic:
     1. Points (`Т`)
     2. Head-to-Head (`Хед-ту-хед` / direct match or mini-table)
     3. Game Difference (`+/-`)
     4. Games Won (`спечелени геймове`)
     5. Bulgarian alphabetical locale comparison (`localeCompare('bg')`).
4. **Group Standings UI (`GroupStandingsTable.tsx`)**:
   - Created responsive table with 7 columns (`#`, `Отбор`, `М`, `П`, `З`, `+/-`, `Т`) and visual emerald playoff spot badges for the top 2 positions.
   - Integrated live standings into `TournamentDetailPage.tsx` reacting instantly to match score updates.

## Consequences
- **Positive**: Eliminates accidental schedule loss through robust guardrails; provides tournament organizers with instant, real-time standings and deterministic tie-breaking; maintains 100% Bulgarian localization for end users.
- **Negative**: Adds minor confirmation modal friction when intentional group modifications are made after schedule generation.
