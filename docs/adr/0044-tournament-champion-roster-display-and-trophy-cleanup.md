# 0044. Tournament Champion Roster Display and Match Trophy Cleanup

## Status
Accepted

## Context
Following tournament play-testing and user feedback on playoff presentations, three visual ergonomics and hierarchy deficiencies were identified:
1. **Match-Level Trophy Icon Dilution**: In `MatchCard.tsx` (both regular 7-column layout and playoff stacked layout), winning teams were rendered with an amber `<Trophy />` icon next to the team title. Displaying trophy icons on every single individual match winner (including regular group matches and early bracket rounds) significantly diluted the perceived prestige and visual weight of the overall tournament championship trophy.
2. **Missing Champion Player Roster in Celebration Banner**: When a tournament concludes or its final match completes, `TournamentPlayoffBracket.tsx` renders a celebratory golden banner (`playoff-champion-banner`). However, it displayed only the team title (`🏆 {championTeamName}`) without identifying the actual players who won the title. In tennis tournaments (especially doubles), players and spectators expect the winning athletes' names to be celebrated prominently on the championship banner.
3. **Narrow Card Sizing on Mobile Rankings Podium**: In `Podium.tsx`, 1st, 2nd, and 3rd place podium cards used fixed `max-w-[260px] w-full` and `max-w-[240px] w-full` wrappers across all screen widths. On mobile viewports (< 640px) where the podium shifts from a 3-column row to a vertical stacked flex column, these fixed pixel caps prevented cards from expanding to fill the available screen width (typically 360px–430px), causing artificial card squeezing.

## Decision
1. **MatchCard Trophy Removal and Hierarchy Clean-Up**:
   - In `MatchCard.tsx`, remove the `<Trophy />` icon rendered next to winning team names in both stacked playoff team rows and standard grid team headers.
   - Remove the unused `Trophy` import from `lucide-react` in `MatchCard.tsx`.
   - Retain winning team visual emphasis through emerald typography (`text-emerald-600` / `text-emerald-700`), row background tint (`bg-emerald-50/70`), and emerald score badges.
   - Preserve stage badges (e.g. `🏆 Финал`) in match headers, which use literal emoji badges.

2. **Champion Banner Player Roster Resolution and Badges**:
   - In `TournamentPlayoffBracket.tsx`, introduce a robust player resolution strategy (`resolveChampionPlayers`) that determines champion athletes using multi-tier fallback:
     1. Match players registered on the winning side of the completed final match (`finalMatch.match_players`).
     2. Team roster matching `championTeamName` in `tournament.draft_state.teams`.
     3. Preceding playoff or group match records involving `championTeamName` with populated `match_players`.
     4. Graceful empty array fallback (`[]`) for draftless or mock tournaments.
   - In the golden champion banner (`playoff-champion-banner`), render resolved player names as distinct translucent badges/pills featuring a `User` icon from `lucide-react` with high-contrast styling against the gold gradient background (`bg-slate-950/15 text-slate-950 border-slate-950/10 backdrop-blur-xs`).
   - If no players are resolved, omit the roster container gracefully without broken layout.

3. **Responsive Mobile Podium Card Sizing**:
   - In `Podium.tsx`, adjust container class strings from fixed `max-w-[240px] w-full` to responsive `w-full sm:max-w-[240px]` for 2nd and 3rd place cards.
   - Adjust 1st place card wrapper from `max-w-[260px] w-full` to `w-full sm:max-w-[260px]`.
   - On viewports `< 640px`, cards expand to fill full container width in vertical stacking; on desktop viewports (`>= 640px`), the 3-column fixed widths remain intact.

## Consequences
- **Positive**:
  - Championship trophy iconography is exclusively reserved for the tournament champion banner and overall rankings, eliminating visual dilution.
  - Champion players receive prominent recognition on the celebration banner with clear athlete pills.
  - Resilient player resolution ensures champion roster displays reliably across varied data states (direct final match players, draft state, or earlier matches).
  - Rankings podium displays cleanly and comfortably across both mobile and desktop screens.
  - Zero database schema migrations, API modifications, or RPC changes.
- **Negative / Considerations**:
  - Existing unit test assertions targeting `winner-trophy-team-1` in `MatchCard.test.tsx` require updates to assert winner class styling and absence of the trophy test ID.
