# 45. Tournament Header Champion Roster and Banner Cleanup

Date: 2026-11-01

## Status
Accepted

## Context
In the previous implementation of playoff brackets and tournament completion:
1. When a playoff final match was completed, a prominent yellow champion banner (`playoff-champion-banner`) was rendered above the playoff bracket in `TournamentPlayoffBracket.tsx`.
2. This banner introduced visual clutter and duplicate celebration messaging within the bracket view.
3. In contrast, the persistent tournament header card in `TournamentDetailPage.tsx` only displayed a minimal champion badge with the team name (`🏆 Шампион: {tournament.winner_team_name}`), omitting the athlete roster.
4. Champion athlete resolution logic was coupled inside `TournamentPlayoffBracket.tsx` rather than living as a reusable domain utility.

## Decision
1. **Banner Elimination**:
   - Completely remove the `playoff-champion-banner` and `playoff-champion-roster` JSX block from `TournamentPlayoffBracket.tsx`.
   - Remove unused icons (`Sparkles`, `CheckCircle2`, `User`) and unused memoized state variables (`isFinalCompleted`, `championPlayers`, `championTeamName`).
   - Bracket renders cleanly directly into the multi-stage stage columns.

2. **Utility Consolidation**:
   - Extract `resolveChampionPlayers` into `src/utils/playoffs.ts` alongside existing playoff domain helpers.
   - Implement `formatChampionDisplay(championTeamName, players)` in `src/utils/playoffs.ts` providing ergonomic display formatting:
     - Formats team name with roster in parentheses: `"Данков, Йов (Отбор 5)"` or `"Данков, Йов (Асове)"`.
     - Handles singles cleanly without redundancy: if roster matches team name, outputs `"Иван Иванов"` rather than `"Иван Иванов (Иван Иванов)"`.
     - Falls back gracefully to trimmed team name when players list is empty (`"Отбор 1"`).
     - Handles empty/null/undefined team names safely (returns `""`).
   - Retain backward compatibility via re-export in `TournamentPlayoffBracket.tsx`: `export { resolveChampionPlayers, formatChampionDisplay } from '../../utils/playoffs'`.

3. **Elevated Header Card Showcase**:
   - Enhance the header card in `TournamentDetailPage.tsx` with `data-testid="tournament-header-champion-badge"`.
   - Calculate `finalMatch` and `effectiveChampionTeamName` reactively from completed final match outcome, falling back to `tournament.winner_team_name`.
   - Resolve champion athletes with 4-tier fallback: final match winning side players -> draft state teams -> preceding match players -> empty array.
   - Render formatted champion string in the persistent header card.

## Consequences
- **Positive**:
  - Eliminates visual clutter in the playoff bracket tab.
  - Elevates champion recognition to the persistent header card visible across all tabs and scrolls.
  - Pure presentation refactor with zero database schema changes or API modifications.
  - Reusable and testable pure functions in `playoffs.ts`.
- **Negative / Neutral**:
  - Tests expecting `playoff-champion-banner` in the bracket were updated to verify its absence and assert the enriched header badge instead.
