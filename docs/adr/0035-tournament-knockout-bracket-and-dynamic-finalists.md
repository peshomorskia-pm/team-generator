# ADR 0035: Tournament Knockout Bracket and Dynamic Finalists

## Status
Accepted

## Context
Tournament organizers required the flexibility to configure how many teams advance from group stage standings to knockout playoffs (e.g., 2, 4, or 8 finalists) depending on available time and court slots. The qualification engine needed to be robust across arbitrary group counts $G$ and team counts $N$, handling base qualifiers per group as well as wildcard resolution for top second-place teams based on normalized metrics ($pts/m$, $diff/m$, $won/m$, with Bulgarian locale tie-breaking). Furthermore, organizers needed a visual playoff bracket supporting multi-stage elimination (`1/4-финали`, `Полуфинали`, `Финал`), placeholder match management, downstream winner propagation, and celebratory champion declaration.

## Decision
1. **Playoff Finalists Selector (`PlayoffFinalistsSelector.tsx`):**
   - Positioned directly above group standings tables inside `TournamentDetailPage.tsx`.
   - Offers dynamic options clamped to $\{2, 4, 8\}$ based on total teams and group count.
   - Locks configuration once playoff matches have been generated.

2. **Pure Playoff Resolver (`src/utils/playoffs.ts`):**
   - Implements `resolvePlayoffTeams` to calculate base qualifiers ($\lfloor K/G \rfloor$ per group) and normalized wildcards.
   - Normalizes points, game differential, and matches won per match played.
   - Sorts candidates deterministically using `localeCompare(..., 'bg')`.

3. **Standings & Visual Badges (`GroupStandingsTable.tsx`):**
   - Displays emerald `[Плейофи]` badges for direct qualifiers and purple `[⭐ Плейофи (Wildcard)]` badges for wildcard recipients.

4. **Tournament Playoff Bracket (`TournamentPlayoffBracket.tsx` & `useMatches.ts`):**
   - Pre-generates the complete knockout tree with placeholder names.
   - Renders responsive multi-stage columns (`1/4-финали`, `Полуфинали`, `Финал`).
   - Implements an unplayed match warning modal before bracket generation.
   - Automatically propagates winners from SF to Final and crowns the champion upon Final completion.

5. **PO Refinements (Oct 2026):**
   - **Standings Rosters:** Render player names (comma-delimited) under team names in the standings table roster column.
   - **Robust Roster Reconstruction (`extractTournamentTeams`):** Reconstruct team rosters from group matches and draft state, eliminating `"Няма играчи"` in playoff brackets.
   - **Streamlined Match Cards:** Suppress redundant format (`По двойки`) and round (`Кръг X`) badges on playoff cards while highlighting stage badges (`🏆 Финал`).

## Consequences
- **Positive:** Full flexibility for tournament organizers with mathematically sound qualification logic, player roster visibility, and clean Bulgarian UI localization.
- **Negative:** Slightly increased state complexity in tournament matching workflows, managed cleanly via immutable utility helpers and React hooks.

