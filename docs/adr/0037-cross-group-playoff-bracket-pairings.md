# Architectural Decision Record: Cross-Group Playoff Bracket Pairings

## Status
Accepted

## Context
In previous tournament iterations, playoff bracket pairings were generated via naive global seeding order (e.g., Seed 1 vs Seed 4, Seed 2 vs Seed 3). In a 2-group tournament ($G=2, K=4$), this global sort frequently resulted in Group A winner playing Group A runner-up in the semifinals, and Group B winner playing Group B runner-up. In competitive sports and tournament structures, teams from the same initial group must be separated into opposite bracket halves so they can only meet in the Final.

Furthermore, discrepancies existed between the preview helper `resolvePlayoffTeams` and the database generation utility `generatePlayoffMatches`, causing occasional mismatches between predicted preview brackets and final generated matches.

## Decision
1. **Implemented `buildPlayoffPairings` in `src/utils/playoffs.ts`**:
   Enforces the Cross-Group Separation Principle across all tournament configurations:
   - **$G=2, K=4$**: SF1 is $A1$ vs $B2$; SF2 is $B1$ vs $A2$.
   - **$G=4, K=8$**: QF matches are cross-group ($A1-B2, C1-D2, B1-A2, D1-C2$) feeding opposite semifinal halves.
   - **$G=3, K=4$**: Wildcard runner-up is separated from its own group winner in the Semifinals.
   - **General Conflict Resolution Pass**: Arbitrary group counts are evaluated by `eliminateSameGroupConflicts` to guarantee zero same-group matchups prior to the Final.

2. **Single Source of Truth (SSOT)**:
   `resolvePlayoffTeams` and `generatePlayoffMatches` both consume `buildPlayoffPairings` directly, ensuring 100% parity between preview brackets and database records.

## Consequences
- **Positive**: Same-group rematches are strictly prevented before the Final across all supported group counts ($G=2, 3, 4$). 100% determinism and parity between preview and database generation.
- **Negative**: Slightly increased complexity in pairing logic, offset by robust unit tests (`playoffs.test.ts`).
