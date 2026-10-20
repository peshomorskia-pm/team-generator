# Architectural Decision Record: Cross-Group Playoff Bracket Pairings & UI Layout Enhancements

## Status
Accepted

## Context
1. **Cross-Group Playoff Pairing Engine**: In previous tournament iterations, playoff bracket pairings were generated via naive global seeding order (e.g., Seed 1 vs Seed 4, Seed 2 vs Seed 3). In a 2-group tournament ($G=2, K=4$), this global sort frequently resulted in Group A winner playing Group A runner-up in the semifinals. Teams from the same initial group must be separated into opposite bracket halves.
2. **Player Name Layout & Viewport Collisions**: During playoff bracket rendering and group standings viewing, long doubles partner names (e.g. "Константин Константинополски") caused horizontal overflow, badge clipping, and misaligned score chips in `MatchCard.tsx` and forced single-line truncation in `GroupStandingsTable.tsx`. Additionally, fixed playoff bracket stage columns compressed card components on narrow viewports.

## Decision
1. **Part 1: Cross-Group Playoff Bracket Pairing Engine (`buildPlayoffPairings` in `src/utils/playoffs.ts`)**:
   Enforces the Cross-Group Separation Principle across all tournament configurations:
   - **$G=2, K=4$**: SF1 is $A1$ vs $B2$; SF2 is $B1$ vs $A2$.
   - **$G=4, K=8$**: QF matches are cross-group ($A1-B2, C1-D2, B1-A2, D1-C2$) feeding opposite semifinal halves.
   - **$G=3, K=4$**: Wildcard runner-up is separated from its own group winner in the Semifinals.
   - **Single Source of Truth (SSOT)**: `resolvePlayoffTeams` and `generatePlayoffMatches` both consume `buildPlayoffPairings` directly.

2. **Part 2: Comprehensive Player Name Layout & Bracket Responsiveness Enhancements**:
   - **Stacked Playoff Match Cards (`MatchCard.tsx`)**: When `effectiveIsPlayoff === true`, renders dedicated ATP/Challonge stacked vertical layout with Team 1 on top row and Team 2 on bottom row spanning full width, right-aligned scores, and player badges with `max-w-[120px] truncate` and native `title={name}` tooltips. Preserves 7-column grid for regular matches (`effectiveIsPlayoff === false`).
   - **Multiline Roster Wrapping (`GroupStandingsTable.tsx`)**: Replaced single-line `truncate` with `line-clamp-2 break-words` and `title={rosterText}` full-roster tooltips for doubles team rosters.
   - **Bracket Column Responsiveness (`TournamentPlayoffBracket.tsx`)**: Wrapped playoff stages in an outer container with `overflow-x-auto pb-4 scrollbar-thin` and enforced `w-full md:w-[340px] md:min-w-[320px] md:flex-1 shrink-0` on Quarterfinal, Semifinal, and Final stage columns.

## Consequences
- **Positive**: Same-group rematches are strictly prevented before the Final across all supported group counts ($G=2, 3, 4$). Player names never overflow or clip across standings, match cards, and bracket views. Full accessibility via native hover tooltips and horizontal scrolling on mobile/tablet viewports.
- **Negative**: Slightly increased layout structure complexity, offset by robust unit tests across 60 test files (772 passing tests).
