# 2_architecture.md: Technical Architecture Specification for Pure Sports Standings Refinements

## 1. Overview & Architectural Goals
This specification defines the architectural refinements for the pure tennis sports standings engine and UI following PO feedback. It eliminates stale cached fallbacks, introduces an Active Player Priority Gate, streamlines the page layout by unmounting the duplicate podium, and clarifies game difference labeling across desktop and mobile.

### Core Architectural Goals:
1. **Matches as Single Source of Truth**: Completely eliminate the legacy cached fallback in [standingsStats.ts](file:///D:/Projects/team-generator/src/utils/standingsStats.ts#L205-L233). If a player has 0 match rows in `matches`, their stats are strictly zeroed out (`matchesPlayed: 0, wins: 0, losses: 0, winRate: 0, gamesWon: 0, gamesLost: 0, gameDifference: 0, form: []`), preventing phantom win rates when tournaments or matches are deleted.
2. **Active Player Priority Gate**: In [sortPlayerSportsStats](file:///D:/Projects/team-generator/src/utils/standingsStats.ts#L80-L108), active participants (`matchesPlayed > 0`) strictly outrank unplayed players (`matchesPlayed === 0`), regardless of negative game differentials (e.g., a player with 0 wins, 1 loss, -4 diff ranks above an unplayed player with 0 diff).
3. **Deterministic 6-Tier Tie-Breaking Hierarchy**:
   1. Active Player Priority (`matchesPlayed > 0` vs `0`)
   2. Total Wins (descending)
   3. Win Rate % (descending, 1 decimal place)
   4. Net Game Difference (descending, `gamesWon - gamesLost`)
   5. Total Matches Played (descending)
   6. Bulgarian Alphabetical Collation (`a.name.localeCompare(b.name, 'bg')`)
4. **Podium Removal in RankingsPage**: Unmount and delete `<Podium ... />` from [RankingsPage.tsx](file:///D:/Projects/team-generator/src/pages/RankingsPage.tsx), presenting the search bar and sports standings table directly.
5. **Explicit Game Difference Labeling**:
   - Desktop: In [RankingsTable.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsTable.tsx), replace header `+/-` with `Геймова разлика` (with tooltip `title="Геймова разлика (спечелени - загубени геймове)"` and `whitespace-nowrap`).
   - Mobile: In [RankingsMobile.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsMobile.tsx), change primary stats to a 3-column grid (`М`, `П`, `З`) and render a dedicated secondary row with `Геймова разлика: +X` and `Форма`.
6. **ADR Evolution**: Update [0047-pure-sports-standings-and-form-tracking.md](file:///D:/Projects/team-generator/docs/adr/0047-pure-sports-standings-and-form-tracking.md) with these architectural decisions.

---

## 2. Directory Hierarchy & File Tree

```
team-generator/
├── docs/
│   └── adr/
│       └── 0047-pure-sports-standings-and-form-tracking.md     # [MODIFIED] Update with 6-tier hierarchy, single truth, podium removal
├── src/
│   ├── components/
│   │   └── rankings/
│   │       ├── RankingsMobile.tsx                              # [MODIFIED] 3-col grid (М, П, З) + explicit 'Геймова разлика' row
│   │       ├── RankingsTable.tsx                               # [MODIFIED] 'Геймова разлика' header with tooltip & whitespace-nowrap
│   │       └── __tests__/
│   │           ├── RankingsMobile.test.tsx                     # [MODIFIED] Assert 3-col grid & 'Геймова разлика: +X'
│   │           └── RankingsTable.test.tsx                      # [MODIFIED] Assert 'Геймова разлика' header & tooltip
│   ├── hooks/
│   │   └── __tests__/
│   │       └── useRankings.test.ts                             # [MODIFIED] Update mock matches for match-derived stats
│   ├── pages/
│   │   ├── RankingsPage.tsx                                    # [MODIFIED] Remove Podium import & render block
│   │   └── __tests__/
│   │       └── RankingsPage.test.tsx                           # [MODIFIED] Assert direct table render & absence of podium
│   └── utils/
│       ├── standingsStats.ts                                   # [MODIFIED] Remove legacy fallback, add active priority gate
│       └── __tests__/
│           └── standingsStats.test.ts                          # [MODIFIED] Test active priority gate & zeroed unplayed stats
```

---

## 3. Data Models, Schemas & Interface Contracts

Zero database schema migrations are required. Domain types in `src/types/rankings.ts` and `src/utils/standingsStats.ts` are maintained as established:

### 3.1 Unplayed Player Strict Contract
When a player has zero completed match entries in `matches`, `computePlayerSportsStats` returns:
```typescript
{
  playerId: player.id,
  name: player.name,
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  gamesWon: 0,
  gamesLost: 0,
  gameDifference: 0,
  form: [],
  rank: 0, // Assigned sequentially by sortPlayerSportsStats
}
```
*Note: Any legacy counter fields on `PlayerRow` (`singles_matches_played`, `singles_wins`, etc.) are completely ignored.*

---

## 4. Component / Module Specifications

### 4.1 Module 1: Single Source of Truth & Active Priority (`standingsStats.ts`)

#### 1. Eliminate Legacy Cached Fallback ([standingsStats.ts#L205-L233](file:///D:/Projects/team-generator/src/utils/standingsStats.ts#L205-L233))
- **Remove**: The entire fallback block reading `player.singles_matches_played`, `player.doubles_matches_played`, `singles_wins`, etc.
- **Specification**: If `playerMatchEntries.length === 0`, return strictly the zeroed stat object.

#### 2. Active Player Priority Gate in `sortPlayerSportsStats` ([standingsStats.ts#L80-L108](file:///D:/Projects/team-generator/src/utils/standingsStats.ts#L80-L108))
- **Comparator Specification**:
  ```typescript
  export function sortPlayerSportsStats(
    stats: PlayerSportsStats[]
  ): PlayerSportsStats[] {
    const sorted = [...stats].sort((a, b) => {
      // Gate 1: Active Player Priority (matchesPlayed > 0 precedes matchesPlayed === 0)
      const aActive = a.matchesPlayed > 0 ? 1 : 0;
      const bActive = b.matchesPlayed > 0 ? 1 : 0;
      if (bActive !== aActive) {
        return bActive - aActive; // Active (1) sorts before Inactive (0)
      }

      // Tier 1: Total wins descending
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      // Tier 2: Win rate % descending
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      // Tier 3: Net game difference descending
      if (b.gameDifference !== a.gameDifference) {
        return b.gameDifference - a.gameDifference;
      }
      // Tier 4: Total matches played descending
      if (b.matchesPlayed !== a.matchesPlayed) {
        return b.matchesPlayed - a.matchesPlayed;
      }
      // Tier 5: Bulgarian alphabetical collation
      return a.name.localeCompare(b.name, 'bg');
    });

    return sorted.map((stat, idx) => ({
      ...stat,
      rank: idx + 1,
    }));
  }
  ```

---

### 4.2 Module 2: Remove Podium from `RankingsPage.tsx`
- **File**: [src/pages/RankingsPage.tsx](file:///D:/Projects/team-generator/src/pages/RankingsPage.tsx)
- **Modifications**:
  1. Remove `import { Podium } from '../components/rankings/Podium';`.
  2. Remove lines 71–75:
     ```tsx
     {/* Podium for Top 3 (Shown when no search term is entered) */}
     {!loading && !searchTerm && rawRankings.length > 0 && (
       <Podium topPlayers={rawRankings.slice(0, 3)} />
     )}
     ```
  3. Keep [Podium.tsx](file:///D:/Projects/team-generator/src/components/rankings/Podium.tsx) in the component tree as an isolated, standalone component (does not break external imports).
  4. Page renders directly: Header -> Search Bar -> Standings Table / Mobile Cards.

---

### 4.3 Module 3: Explicit Game Difference Labeling

#### 1. Desktop Table ([src/components/rankings/RankingsTable.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsTable.tsx))
- **Column Header**: Replace `<th className="py-3.5 px-3 text-center w-16">+/-</th>` with:
  ```tsx
  <th
    className="py-3.5 px-3 text-center whitespace-nowrap"
    title="Геймова разлика (спечелени - загубени геймове)"
  >
    Геймова разлика
  </th>
  ```
- **Table Data Cell**: Ensure `whitespace-nowrap` on the diff cell:
  ```tsx
  <td className="py-3 px-3 text-center whitespace-nowrap">
    <span
      className={
        stat.gameDifference > 0
          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
          : stat.gameDifference < 0
          ? 'text-rose-600 dark:text-rose-400 font-semibold'
          : 'text-gray-400 font-medium'
      }
    >
      {stat.gameDifference > 0 ? `+${stat.gameDifference}` : stat.gameDifference}
    </span>
  </td>
  ```

#### 2. Mobile Cards ([src/components/rankings/RankingsMobile.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsMobile.tsx))
- **Primary Grid**: Shift from `grid-cols-4` to `grid-cols-3` displaying `М`, `П`, and `З`.
- **Secondary Detail Row**: Replace the cramped 4th column with an ergonomic flex row displaying `Геймова разлика: +X` alongside `Форма`:
  ```tsx
  {/* Primary 3-Metric Grid */}
  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
    <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl text-center">
      <span className="block text-gray-400 text-[10px] uppercase font-semibold">М</span>
      <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{stat.matchesPlayed}</span>
    </div>
    <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl text-center">
      <span className="block text-gray-400 text-[10px] uppercase font-semibold">П</span>
      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{stat.wins}</span>
    </div>
    <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl text-center">
      <span className="block text-gray-400 text-[10px] uppercase font-semibold">З</span>
      <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{stat.losses}</span>
    </div>
  </div>

  {/* Secondary Detail Row: Game Difference + Form */}
  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
    <span className="text-gray-500 dark:text-gray-400 font-medium">
      Геймова разлика:{' '}
      <span
        className={`font-bold ${
          stat.gameDifference > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : stat.gameDifference < 0
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-gray-400'
        }`}
      >
        {stat.gameDifference > 0 ? `+${stat.gameDifference}` : stat.gameDifference}
      </span>
    </span>
    <div className="flex items-center gap-1.5">
      <span className="text-gray-400 font-medium">Форма:</span>
      <FormBadge form={stat.form} />
    </div>
  </div>
  ```

---

### 4.4 Module 4: Update ADR-0047
- **File**: [docs/adr/0047-pure-sports-standings-and-form-tracking.md](file:///D:/Projects/team-generator/docs/adr/0047-pure-sports-standings-and-form-tracking.md)
- **Updates**:
  1. Section 2.1: Replace legacy fallback note with explicit confirmation that `matches` table is the exclusive single source of truth; unplayed players strictly receive 0 matches, 0 wins, and 0.0% win rate.
  2. Section 2.2: Expand to 6-Tier Tie-Breaking Hierarchy, explicitly specifying Gate 1 (Active Player Priority: `matchesPlayed > 0` vs `0`).
  3. Section 2.4: Document `RankingsTable.tsx` column header update to `Геймова разлика` with tooltip, and `RankingsMobile.tsx` 3-column + `Геймова разлика: +X` layout.
  4. Section 2.5: Document unmounting of `Podium` from `RankingsPage.tsx` for streamlined table focus.

---

## 5. Automated Test Blueprints & Scenarios

### 5.1 Unit Tests: `src/utils/__tests__/standingsStats.test.ts`
- **Blueprint 1: Active Player Priority Gate**
  - Arrange:
    - Active Player A: `matchesPlayed: 1, wins: 0, losses: 1, winRate: 0, gamesWon: 2, gamesLost: 6, gameDifference: -4`.
    - Inactive Player B: `matchesPlayed: 0, wins: 0, losses: 0, winRate: 0, gamesWon: 0, gamesLost: 0, gameDifference: 0`.
  - Act: Call `sortPlayerSportsStats([playerB, playerA])`.
  - Assert:
    - `sorted[0].playerId === 'player-a'` (Rank 1).
    - `sorted[1].playerId === 'player-b'` (Rank 2).
    - Verifies that `matchesPlayed > 0` strictly outranks `matchesPlayed === 0` even with negative game difference.
- **Blueprint 2: Elimination of Legacy Cached Fallback**
  - Arrange: Player row with legacy fields populated (`singles_matches_played: 10, singles_wins: 8, singles_losses: 2`). Empty matches array `[]`.
  - Act: Call `computePlayerSportsStats([legacyPlayer], [], 'singles')`.
  - Assert:
    - Returns strictly zeroed stats: `matchesPlayed: 0`, `wins: 0`, `losses: 0`, `winRate: 0`, `gameDifference: 0`, `form: []`.
- **Blueprint 3: Inactive Player Collation**
  - Arrange: Two players with 0 matches: "Борис" and "Ангел".
  - Act: Call `sortPlayerSportsStats([boris, angel])`.
  - Assert: "Ангел" ranks #1, "Борис" ranks #2 (Bulgarian locale collation).

### 5.2 Component Tests: `src/pages/__tests__/RankingsPage.test.tsx`
- **Blueprint 1: Podium Elimination**
  - Render `RankingsPage` with mock players and matches.
  - Assert `screen.queryByTestId('rankings-podium')` is `null` (not in the document).
  - Assert `screen.getByRole('table')` or player names render directly without waiting for a podium test id.
- **Blueprint 2: Search and Format Toggling Without Podium**
  - Filter players: Ensure search input filters table rows without checking podium visibility.
  - Toggle format: Verify Singles to Doubles format buttons toggle `aria-pressed` and update table directly.

### 5.3 Component Tests: `src/components/rankings/__tests__/RankingsTable.test.tsx`
- **Blueprint 1: Game Difference Header & Tooltip**
  - Render `RankingsTable` with mock rankings.
  - Assert:
    - Header element with text `Геймова разлика` exists in the table.
    - Header element has attribute `title="Геймова разлика (спечелени - загубени геймове)"`.
    - Header element has class `whitespace-nowrap`.
    - `screen.queryByText('+/-')` is `null` (no `+/-` column header).

### 5.4 Component Tests: `src/components/rankings/__tests__/RankingsMobile.test.tsx`
- **Blueprint 1: Mobile Layout Verification**
  - Render `RankingsMobile` with mock rankings.
  - Assert:
    - Grid columns for `М`, `П`, `З` exist.
    - Header tile `+/-` is NOT rendered in the primary grid.
    - Explicit text `Геймова разлика: +25` and `Геймова разлика: +8` is rendered in card body.
    - `Форма:` label and `FormBadge` are present in card footer.

### 5.5 Hook Tests: `src/hooks/__tests__/useRankings.test.ts`
- **Blueprint 1: Pure Match Derivation (Doubles & 6-Tier Tie-Breaks)**
  - Update tests that previously passed empty match arrays `[]` while expecting legacy player stats.
  - Supply explicit `MatchDetail[]` fixtures to test multi-player tie-breaks (Tier 1 through Tier 5) using verified completed matches.

---

## 6. Implementation Guidelines for Senior Dev

Follow this sequential checklist strictly:

1. **Update `standingsStats.ts`**:
   - Strip legacy fallback lines 205–233.
   - Insert Active Player Priority Gate at the head of `sortPlayerSportsStats` comparator.
2. **Update `standingsStats.test.ts`**:
   - Replace legacy fallback test with zeroed-out assertions.
   - Add unit test for Active Player Priority Gate (active with negative diff vs inactive with 0 diff).
3. **Update `RankingsPage.tsx` & `RankingsPage.test.tsx`**:
   - Remove `<Podium ... />` and its import from `RankingsPage.tsx`.
   - Update `RankingsPage.test.tsx` to assert absence of `rankings-podium` and verify direct table rendering.
4. **Update `RankingsTable.tsx` & `RankingsTable.test.tsx`**:
   - Replace `+/-` with `Геймова разлика`, add `title` and `whitespace-nowrap`.
   - Update `RankingsTable.test.tsx` assertions.
5. **Update `RankingsMobile.tsx` & `RankingsMobile.test.tsx`**:
   - Reconfigure mobile card to 3-column primary grid + dedicated `Геймова разлика: +X` row.
   - Update `RankingsMobile.test.tsx` assertions.
6. **Update `useRankings.test.ts`**:
   - Provide completed match fixtures where unplayed players were previously expected to inherit stats.
7. **Update ADR-0047**:
   - Edit [docs/adr/0047-pure-sports-standings-and-form-tracking.md](file:///D:/Projects/team-generator/docs/adr/0047-pure-sports-standings-and-form-tracking.md) with decisions.
8. **Verification & Quality Gate**:
   - `npm test -- --run` (all tests passing).
   - `npx tsc --noEmit` (zero errors).
   - `npm run lint` (clean).
   - `npm run build` (successful production build).

---

## 7. Next Step Handoff (Summon Senior Dev)

- **Summon Role**: Senior Dev
- **Prerequisites Satisfied**: Technical specification and test blueprints documented in [.agent_handoffs/feature/pure-sports-standings-and-form/2_architecture.md](file:///D:/Projects/team-generator/.agent_handoffs/feature/pure-sports-standings-and-form/2_architecture.md).
- **Execution Target**: Execute steps 1 through 8 in Section 6, publish `.agent_handoffs/feature/pure-sports-standings-and-form/3_implementation.md`, and notify Orchestrator.
