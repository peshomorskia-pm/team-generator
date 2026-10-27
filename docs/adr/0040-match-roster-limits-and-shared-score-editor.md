# 0040. Match Roster Limits and Shared Tennis Score Editor

## Status
Accepted

## Context
Previously, `MatchModal.tsx` allowed arbitrary participant counts per team (e.g., 3 players in Team 1 and 5 players in Team 2 in a doubles match, or multiple players in singles). Furthermore, tennis score input logic was duplicated between `TournamentScoreModal.tsx` and `MatchModal.tsx`, and the 3rd set (super tiebreak) UI suffered from excessive stepper buttons (`-`/`+`) and tiebreak preset chips that cluttered the interface on mobile and desktop screens.

## Decision
1. **Strict Roster Capacity Enforcement in `MatchModal.tsx`**:
   - Enforced exact capacity limits based on match format: exactly 1 player per team for singles (`format === 'singles'`), and exactly 2 players per team for doubles (`format === 'doubles'`).
   - Added interactive input locking and visual status badges (`Пълен състав 1/1` / `Пълен състав 2/2`) when capacity is reached.
   - Implemented form validation blocking invalid rosters with clear Bulgarian error messages.

2. **Extracted Reusable `TennisScoreEditor.tsx` Component**:
   - Extracted core tennis score management into `src/components/match/TennisScoreEditor.tsx`.
   - Consumed by both `TournamentScoreModal.tsx` and `MatchModal.tsx` to achieve zero copy-paste code sharing and consistent UX.

3. **De-cluttered Set 3 Tiebreak UX**:
   - Removed all stepper buttons (`-`/`+`) and tiebreak preset chips from Set 3.
   - Delivered clean, centered numeric inputs while retaining robust validation (`validateSuperTiebreak`: $\ge 10$ points, $\ge 2$ difference).

## Consequences
- **Positive**:
  - Zero duplicate scoring code across tournament and casual match modals.
  - Bulletproof match roster integrity adhering strictly to tennis rules.
  - Simplified, distraction-free score entry on all viewports.
- **Negative**:
  - Minor strictness added to match creation forms requiring explicit team participant counts.
