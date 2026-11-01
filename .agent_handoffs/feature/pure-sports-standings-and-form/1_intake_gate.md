# 1_intake_gate.md

## 1. Triage Verdict
**🟢 GREEN (Clear to Proceed / Без ограничения)**

### Executive Summary
The transition to a pure sports statistics engine (Wins, Losses, Win Rate %, Game Difference, and 5-match Form tracker) is **100% feasible** within the current application architecture. The deprecation of the legacy ELO subsystem (ADR-0046) in the preceding cycle cleanly decoupled rankings from rating deltas. All required match data (scores, multi-set structures, participant sides, and timestamps) is already fully modeled and persisted in Supabase (`matches` and `match_players` tables). No database schema migrations or backend mutations are required. All 863 existing automated tests pass, and TypeScript/ESLint checks pass with 0 errors.

---

## 2. Business Feasibility & Acceptance Criteria

### Feasibility Assessment
- **Domain Integrity:** Replaces chess-like ELO numbers with standard tennis league standings metrics: Matches Played (**М**), Wins (**П**), Losses (**З**), Win Percentage (**Успеваемост %**), Game Difference (**+/-**), and Recent Form (**Форма** - last 5 completed matches).
- **Sorting Logic:** Enforces a deterministic 5-tier sports hierarchy:
  1. Wins (`wins` desc)
  2. Win Rate % (`winRate` desc)
  3. Game Difference (`gameDiff` desc)
  4. Total Matches Played (`matchesPlayed` desc)
  5. Alphabetical fallback (Bulgarian collation `localeCompare(..., 'bg')`)
- **Emoji Cleanliness:** Verifies that no medal emojis (`🥇`, `🥈`, `🥉`) are rendered across tables, podiums, or player cards; replaces them with clean numeric indicators (`1`, `2`, `3` or `#1`, `#2`, `#3`) and clean localized text (`1-во място`, `2-ро място`, `3-то място`).

### Acceptance Criteria Checklist
- [ ] **AC-01 (Domain Type Extension):** Extend `RankingStats` in [src/types/rankings.ts](file:///D:/Projects/team-generator/src/types/rankings.ts) to include `gamesWon: number`, `gamesLost: number`, `gameDiff: number`, and `form: Array<'W' | 'L'>`.
- [ ] **AC-02 (Match Outcomes & Statistics Engine):** Update [src/hooks/useRankings.ts](file:///D:/Projects/team-generator/src/hooks/useRankings.ts) to query both `players` and completed `matches` (with `match_players`) in parallel. Aggregate games won/lost and chronological match results for singles and doubles formats using [src/utils/standings.ts](file:///D:/Projects/team-generator/src/utils/standings.ts) and [src/utils/matchFormat.ts](file:///D:/Projects/team-generator/src/utils/matchFormat.ts).
- [ ] **AC-03 (Strict 5-Tier Sorting Hierarchy):** In [src/hooks/useRankings.ts](file:///D:/Projects/team-generator/src/hooks/useRankings.ts), sort players by: Wins (desc) -> Win Rate % (desc) -> Game Difference (desc) -> Matches Played (desc) -> Bulgarian Alphabetical name.
- [ ] **AC-04 (5-Match Form Tracker):** Compute the last up to 5 completed match outcomes per player (`'W'` or `'L'`) ordered chronologically from oldest to newest (or newest-to-oldest per visual standard). Render compact form badges (`П` in green, `З` in red, or neutral dot for unplayed slots).
- [ ] **AC-05 (Rankings Table Layout):** In [src/components/rankings/RankingsTable.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsTable.tsx), display columns:
  - `#` (Clean number without medal emojis)
  - `Играч` (Avatar and player name)
  - `М` (Matches played)
  - `П` (Wins, highlighted green)
  - `З` (Losses, highlighted red)
  - `Успеваемост %` (Progress bar + percentage)
  - `Форма` (5 outcome indicators)
- [ ] **AC-06 (Mobile Rankings Cards):** In [src/components/rankings/RankingsMobile.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsMobile.tsx), display clean rank `#` (no emojis), player name, statistics grid (`М`, `П-З`, `Успеваемост %`), and the 5-match form row.
- [ ] **AC-07 (Podium Refinement):** In [src/components/rankings/Podium.tsx](file:///D:/Projects/team-generator/src/components/rankings/Podium.tsx), display clean titles (`1-во място` / `Шампион`, `2-ро място`, `3-то място`), clean numeric pedestals (`1`, `2`, `3`), and match summary string (`XП - YЗ (Z%)`), ensuring zero emoji icons.
- [ ] **AC-08 (Player Card / List Audit):** Verify [src/pages/PlayersPage.tsx](file:///D:/Projects/team-generator/src/pages/PlayersPage.tsx) renders clean non-emoji badges if rankings are referenced.
- [ ] **AC-09 (Quality Gates):** 100% unit and integration test coverage (`vitest run`), 0 TypeScript typecheck errors (`tsc --noEmit`), 0 ESLint warnings (`npm run lint`), and successful production build (`npm run build`).

---

## 3. Codebase Inspection & Technical Findings

### 3.1 Existing Implementations & Extension Points
1. **[src/hooks/useRankings.ts](file:///D:/Projects/team-generator/src/hooks/useRankings.ts):**
   - Currently only queries `supabase.from('players').select('*')`.
   - Reads pre-aggregated fields (`singles_wins`, `singles_losses`, `singles_matches_played`).
   - Extension Point: Add a query for `matches` with joined `match_players` (`id, match_format, team_1_score, team_2_score, sets, played_at, match_players(...)`), allowing dynamic computation of `gameDiff` and `form: Array<'W' | 'L'>`.
2. **[src/types/rankings.ts](file:///D:/Projects/team-generator/src/types/rankings.ts):**
   - Contains minimal `RankingStats` interface (`rank`, `player`, `rating`, `matchesPlayed`, `wins`, `losses`, `winRate`).
   - Extension Point: Add optional or required `gamesWon`, `gamesLost`, `gameDiff`, and `form: Array<'W' | 'L'>`.
3. **[src/utils/standings.ts](file:///D:/Projects/team-generator/src/utils/standings.ts):**
   - Provides battle-tested `getMatchOutcome(m)` which parses multi-set scores (`sets: MatchSet[]`) as well as legacy single sets, returning `team1GamesWon`, `team2GamesWon`, and `winner`.
   - Readily usable by `useRankings.ts` to accumulate game differences and match win/loss outcomes per player.
4. **[src/utils/matchFormat.ts](file:///D:/Projects/team-generator/src/utils/matchFormat.ts):**
   - Provides `resolveMatchFormat(match)`, cleanly differentiating singles from doubles matches based on player counts and metadata.
5. **[src/components/rankings/RankingsTable.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsTable.tsx) & [RankingsMobile.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsMobile.tsx):**
   - Currently displays `Място`, `Играч`, `Мачове`, `П-З`, `Победи %`.
   - `getRankBadge` uses Lucide SVG icons (`Trophy`, `Medal`, `Award`) wrapped around digits. Per PO constraint, medal emojis (`🥇 🥈 🥉`) must remain strictly absent, and clean numbered badges or digits must be standard across all screen sizes.
   - Extension Point: Update table headers to Bulgarian abbreviations `М`, `П`, `З`, `Успеваемост %`, `Форма`.
6. **[src/components/rankings/Podium.tsx](file:///D:/Projects/team-generator/src/components/rankings/Podium.tsx):**
   - Displays clean text `Шампион` / `2-ро място` / `3-то място` and pedestal digits `1`, `2`, `3`. Free of emojis.

### 3.2 Blast Radius Analysis
- **Direct Blast Radius:**
  - `src/types/rankings.ts`
  - `src/hooks/useRankings.ts`
  - `src/components/rankings/RankingsTable.tsx`
  - `src/components/rankings/RankingsMobile.tsx`
  - `src/components/rankings/Podium.tsx`
  - (Optional New Component) `src/components/rankings/FormBadge.tsx`
- **Zero Impact (Isolated):**
  - Database schema (`supabase/migrations/**`): untouched.
  - Match recording (`src/hooks/useMatches.ts`, `MatchModal.tsx`): untouched.
  - Tournament engine & playoffs (`TournamentInteractiveBoard.tsx`, `TournamentPlayoffBracket.tsx`): untouched.
  - Team balancing & shuffling (`balance.ts`, `shuffle.ts`): untouched.

---

## 4. Constraints, Risks & Trade-Offs

### Constraints & Edge Cases
1. **Players with Zero Matches:**
   - Players with no completed matches must default to `matchesPlayed: 0`, `wins: 0`, `losses: 0`, `winRate: 0`, `gameDiff: 0`, and `form: []`.
   - In form rendering, empty slots should display subtle placeholder dashes or empty circles to preserve horizontal alignment.
2. **Form Order Orientation:**
   - International standard (e.g. UEFA / Premier League): left-to-right is oldest to newest (left: 5 matches ago -> right: most recent).
   - Alternatively, newest on left. Left-to-right (oldest -> newest) is recommended with a clear title or tooltip indicating chronological flow.
3. **Database Performance:**
   - Client-side calculation over all matches is lightning-fast (< 5ms for hundreds of matches) and avoids any heavy server-side materialized views or migrations.

---

## 5. Architectural Objectives & Roadmap

1. **Step 1 (Architecture & ADR):**
   - Author ADR-0047 (`docs/adr/0047-pure-sports-standings-and-form.md`) defining the 5-tier tie-breaking algorithm, form outcome calculation, and UI component contracts.
2. **Step 2 (Hook & Domain Extension):**
   - Update `RankingStats` interface in `src/types/rankings.ts`.
   - Update `useRankings.ts` to fetch matches and aggregate `gameDiff` and `form: Array<'W' | 'L'>`.
   - Implement the strict 5-tier sorting hierarchy.
3. **Step 3 (Form Indicator & Table Components):**
   - Create or embed `FormBadge` component rendering 5 compact colored pills (`П` green, `З` red).
   - Overhaul `RankingsTable.tsx` with columns `#`, `Играч`, `М`, `П`, `З`, `Успеваемост %`, `Форма`.
   - Update `RankingsMobile.tsx` and `Podium.tsx` ensuring clean numbered indicators and zero emojis.
4. **Step 4 (Test Coverage & Verification):**
   - Expand `src/hooks/__tests__/useRankings.test.ts` to test 5-tier tie breaks, game differences, and form tracking.
   - Add component tests for table columns, form indicators, and mobile card layouts.
   - Execute full validation suite (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`).
