# 1_intake_gate.md: Intake & Feasibility Assessment

## 1. Triage Verdict: 🟢 GREEN (Clear to Proceed)
**Executive Summary**: The requested refinements from live PO feedback are 100% technically feasible within the current architecture. The root cause of the "phantom win rate on unplayed players" issue was definitively diagnosed: lines 205–233 of [standingsStats.ts](file:///D:/Projects/team-generator/src/utils/standingsStats.ts) provided a legacy fallback to stale cached columns on `players`, which lingered after matches or tournaments were deleted. Removing this fallback and unmounting [Podium.tsx](file:///D:/Projects/team-generator/src/components/rankings/Podium.tsx) from [RankingsPage.tsx](file:///D:/Projects/team-generator/src/pages/RankingsPage.tsx) establishes the `matches` table as the single source of truth for sports standings, while standardizing game difference labels across desktop and mobile.

---

## 2. Business Feasibility & Acceptance Criteria

### AC-01: Standings Derived Exclusively from Verified Matches
- **Given** registered players in the database who have zero recorded matches in the `matches` table (or whose matches were deleted),
- **When** the Rankings page is rendered in Singles or Doubles format,
- **Then** those players MUST strictly display:
  - `М` (Matches): `0`
  - `П` (Wins): `0`
  - `З` (Losses): `0`
  - `Успеваемост` (Win Rate): `0.0%`
  - `Геймова разлика` (Game Difference): `0`
  - `Форма` (Form): empty (no pills rendered).

### AC-02: Active Player Ranking Priority Over Inactive Players
- **Given** an active player with matches played but negative game difference (e.g., 0 wins, 1 loss, game diff -4), and an inactive player with 0 matches played (game diff 0),
- **When** `sortPlayerSportsStats` sorts the standings table,
- **Then** the active player with `matchesPlayed > 0` MUST rank ahead of the unplayed player with `matchesPlayed === 0`, ensuring 0-match players settle at the bottom of the table.

### AC-03: Elimination of Top-3 Podium from RankingsPage
- **Given** a user navigates to `/rankings`,
- **When** the page renders,
- **Then** the duplicate [Podium.tsx](file:///D:/Projects/team-generator/src/components/rankings/Podium.tsx) banner is completely absent; the page directly displays the search bar and the sports standings table without redundant champion cards.

### AC-04: Explicit Bulgarian Header for Game Difference (Desktop)
- **Given** the desktop table view in [RankingsTable.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsTable.tsx),
- **When** viewing the column headers,
- **Then** the column header for game difference MUST display verbatim text **`Геймова разлика`** with an accessible title/tooltip `Геймова разлика (спечелени - загубени геймове)`, replacing the cryptic `+/-`.

### AC-05: Clean Mobile Card Layout for Game Difference
- **Given** the mobile card view in [RankingsMobile.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsMobile.tsx),
- **When** inspecting player cards on mobile viewports,
- **Then** the game difference MUST be legibly displayed as **`Геймова разлика: +X`** (or `-X` / `0`), avoiding cramped 4-column tile overflow.

### AC-06: Database Counter Resynchronization on Deletion
- **Given** match or tournament deletions in [useMatches.ts](file:///D:/Projects/team-generator/src/hooks/useMatches.ts) or [useTournaments.ts](file:///D:/Projects/team-generator/src/hooks/useTournaments.ts),
- **When** a deletion occurs,
- **Then** cached counters on `players` are updated to match the remaining verified matches, preventing orphaned counter drift.

---

## 3. Codebase Inspection & Technical Findings

1. **Root Cause Analysis ([standingsStats.ts](file:///D:/Projects/team-generator/src/utils/standingsStats.ts#L205-L233))**:
   - `computePlayerSportsStats` checked `legacyMatchesPlayed > 0` against `player.singles_matches_played` when a player had 0 rows in `matches`.
   - When a tournament was deleted, PostgreSQL's `ON DELETE CASCADE` dropped the `matches` rows, but `players.singles_matches_played` was not cleared in the client state.
   - Consequently, the legacy fallback created "phantom" stat objects with non-zero wins and 100% win rate despite having 0 matches in the database.

2. **Rankings Page Layout ([RankingsPage.tsx](file:///D:/Projects/team-generator/src/pages/RankingsPage.tsx#L71-L75))**:
   - Lines 71–75 render `<Podium topPlayers={rawRankings.slice(0, 3)} />`.
   - Removing this block eliminates UI clutter and duplicate rendering of top 3 players above the table.

3. **Table & Mobile Headers**:
   - [RankingsTable.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsTable.tsx#L34-L36): Column header currently hardcodes `+/-` with `w-16`. Width should be adjusted to fit `Геймова разлика` with tooltip.
   - [RankingsMobile.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsMobile.tsx#L62-L78): Currently uses a 4-column grid (`М`, `П`, `З`, `+/-`). Replacing `+/-` with full text in a 1/4 column tile causes text truncation or wrapping; a dedicated row or 3-col + detail layout solves this cleanly.

4. **Blast Radius & Affected Test Suites**:
   - [RankingsPage.tsx](file:///D:/Projects/team-generator/src/pages/RankingsPage.tsx) & [RankingsPage.test.tsx](file:///D:/Projects/team-generator/src/pages/__tests__/RankingsPage.test.tsx): Update assertions that expect `rankings-podium`.
   - [standingsStats.ts](file:///D:/Projects/team-generator/src/utils/standingsStats.ts) & [standingsStats.test.ts](file:///D:/Projects/team-generator/src/utils/__tests__/standingsStats.test.ts): Replace legacy fallback test with zeroed-out assertions; add active vs unplayed sorting test.
   - [RankingsTable.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsTable.tsx) & [RankingsTable.test.tsx](file:///D:/Projects/team-generator/src/components/rankings/__tests__/RankingsTable.test.tsx): Header text assertion changes from `+/-` to `/геймова разлика/i`.
   - [RankingsMobile.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsMobile.tsx) & [RankingsMobile.test.tsx](file:///D:/Projects/team-generator/src/components/rankings/__tests__/RankingsMobile.test.tsx): Card content assertion changes to `Геймова разлика: ...`.
   - [useRankings.test.ts](file:///D:/Projects/team-generator/src/hooks/__tests__/useRankings.test.ts): Update mock tests that previously omitted `matches` and relied on legacy player columns.

---

## 4. Constraints, Risks & Evaluated Technical Proposals

### Technical Proposal A: Active vs Unplayed Player Sorting
- **Problem**: When a player has 0 matches played, their game difference is 0. If Player A played 1 match and lost 2–6 (game diff -4), comparing `gameDifference` would cause unplayed Player B (diff 0) to rank above active Player A (-4).
- **Option 1 (Recommended)**: Add an **Active Player Priority Gate** to `sortPlayerSportsStats`. Players with `matchesPlayed > 0` strictly sort ahead of players with `matchesPlayed === 0`. Among unplayed players, sort alphabetically by Bulgarian locale.
  - *Pros*: Natural sports hierarchy. Active players never drop below inactive participants.
  - *Cons*: Slight adjustment to comparator logic.
- **Option 2**: Filter unplayed players from `RankingsPage` entirely.
  - *Pros*: Shortest leaderboard.
  - *Cons*: Users may wonder why newly created players do not appear until their first match.

### Technical Proposal B: Mobile Card Layout for Game Difference
- **Option 1 (Recommended)**: Adopt a 3-column primary stat grid (`М`, `П`, `З`), followed by a dedicated secondary flex row:
  ```tsx
  <div className="flex items-center justify-between pt-2 border-t ...">
    <span className="text-xs text-gray-500">Геймова разлика: <span className="font-bold ...">+11</span></span>
    <div className="flex items-center gap-1.5"><span className="text-xs text-gray-400">Форма:</span><FormBadge form={stat.form} /></div>
  </div>
  ```
  - *Pros*: Completely eliminates text wrapping on narrow screens; perfectly legible; matches PO verbatim feedback.
  - *Cons*: Minor JSX restructuring of card body.
- **Option 2**: Retain 4-column grid, but shorten label in header tile to `Гейм +/-` and tooltip.
  - *Pros*: Maintains symmetric 4-tile grid.
  - *Cons*: Does not satisfy PO's request for explicit "Геймова разлика" phrasing.

---

## 5. Architectural Objectives & Roadmap

The Architect (`2_architecture.md`) and Implementer should follow this sequential execution plan:

1. **Milestone 1: Single Source of Truth in `standingsStats.ts`**:
   - Strip lines 205–233 (legacy fallback) from `computePlayerSportsStats`.
   - Add active player sorting priority (`matchesPlayed > 0`) to `sortPlayerSportsStats`.
   - Update `standingsStats.test.ts` to assert 0 matches/wins/winRate for unplayed players.

2. **Milestone 2: UI Modernization in `RankingsPage.tsx`**:
   - Unmount and remove `<Podium ... />` from `RankingsPage.tsx`.
   - Retain `Podium.tsx` as an isolated component or deprecate safely without breaking imports.
   - Update `RankingsPage.test.tsx`.

3. **Milestone 3: Desktop & Mobile Game Difference Labeling**:
   - In `RankingsTable.tsx`: Update `+/-` header to `Геймова разлика` with descriptive `title`.
   - In `RankingsMobile.tsx`: Reorganize card stats to 3 columns (`М`, `П`, `З`) with dedicated `Геймова разлика: ...` row.
   - Update `RankingsTable.test.tsx` and `RankingsMobile.test.tsx`.

4. **Milestone 4: Tournament / Match Resync & Integration Testing**:
   - Ensure `useTournaments.ts` cleans up cached player counters upon tournament deletion.
   - Update `useRankings.test.ts` with complete match mock fixtures.
   - Run full test suite (`npm test`) and typecheck (`npm run typecheck`) to verify zero regressions.
