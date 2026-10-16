# ADR 0034: Tournament Compact Score Modal and Multi-Set Scoring

## Status
Accepted

## Context
The generic `MatchModal` caused unnecessary operational friction in tournament contexts because it exposed date pickers, format selectors, and player roster pickers that are irrelevant when simply entering scores for pre-scheduled tournament matches. Furthermore, tournament matches were constrained to single-set integer scores, lacking progressive multi-set tennis scoring (e.g. 1 set vs best of 3 sets). Finally, tournament match cards were vulnerable to accidental individual deletion, which could break group round-robin tournament integrity.

## Decision
1. **Dedicated `TournamentScoreModal`**: Created a specialized compact score modal (`src/components/tournament/TournamentScoreModal.tsx`) focused exclusively on score entry, showing tournament group, round, team names, and roster subtitles without extraneous date/format/player selectors.
2. **Dynamic Multi-Set Scoring**:
   - Initialized matches with Set 1 by default.
   - Supported progressive addition of Set 2 and conditional deciding Set 3 when tied 1-1 in sets.
   - Implemented strict validation forbidding drawn sets (e.g. `6:6`) and unfinished 1-1 ties.
3. **Tournament Match Deletion Protection**:
   - Added `hideDelete` prop to `MatchCard` (`src/components/match/MatchCard.tsx`), passing `hideDelete={true}` in `TournamentDetailPage` to prevent individual match deletion while preserving deletion on generic `MatchesPage`.
4. **Standings & Multi-Set Elo Engine**:
   - Added `sets JSONB` column to the `matches` database table.
   - Updated `getMatchOutcome` and standings calculation in `src/utils/standings.ts` to award match wins and Elo by sets won while aggregating total games won/lost for group tie-breaking.

## Consequences
- **Positive**: Streamlined score entry workflow for tournament organizers; robust multi-set tennis scoring support; eliminated accidental deletion of tournament group matches; backward compatible with legacy single-set match records.
- **Negative**: Requires database schema migration (`20261016000000_add_sets_to_matches.sql`) in deployed environments.
