# 2_architecture.md: Technical Architecture Specification for Pure Sports Standings and Form Tracking

## 1. Overview & Architectural Goals
This specification establishes a pure tennis sports statistics engine and form tracking subsystem. Replacing legacy ELO numbers and medal emojis, it introduces a deterministic 5-tier sports standings hierarchy (Wins, Win Rate %, Game Difference, Matches Played, Bulgarian Collation) and a 5-match visual form indicator.

### Core Architectural Goals:
1. **Pure Sports Standings Engine (`standingsStats.ts`)**: Standalone, purely functional statistics calculator computing match records, game differences across multi-set/single-set matches, and chronological last-5 match form.
2. **Deterministic 5-Tier Tie-Breaking**: Enforce a strict hierarchical sorting order:
   1. `wins` (descending)
   2. `winRate` (descending, 1 decimal place: e.g. `81.3%`)
   3. `gameDifference` (descending, `gamesWon - gamesLost`)
   4. `matchesPlayed` (descending)
   5. Bulgarian alphabetical name collation (`a.name.localeCompare(b.name, 'bg')`)
3. **Form Pill Indicator (`FormBadge.tsx`)**: Compact component rendering the player's last 5 match outcomes (`П` in emerald green, `З` in rose red, `-` neutral placeholder).
4. **Emoji Elimination & Clean Typography**: Completely replace medal emojis (`🥇`, `🥈`, `🥉`) and trophy icon clutter in rank columns with clean numeric typography (`1`, `2`, `3` or `#1`, `#2`, `#3`) across all tables, mobile cards, podiums, and player lists.
5. **Zero Schema Migration**: Reuses existing Supabase `players`, `matches`, and `match_players` tables with client-side parallel fetching and sub-millisecond in-memory aggregation.

---

## 2. Directory Hierarchy & File Tree

```
team-generator/
├── docs/
│   └── adr/
│       └── 0047-pure-sports-standings-and-form-tracking.md     # [NEW] Architecture Decision Record
├── src/
│   ├── components/
│   │   └── rankings/
│   │       ├── FormBadge.tsx                                   # [NEW] 5-match form pill indicator
│   │       ├── Podium.tsx                                      # [MODIFIED] Clean text titles, record, zero emojis
│   │       ├── RankingsMobile.tsx                              # [MODIFIED] Clean rank #, stats row, FormBadge
│   │       ├── RankingsTable.tsx                               # [MODIFIED] Columns: #, Играч, М, П, З, Успеваемост, +/-, Форма
│   │       └── __tests__/
│   │           ├── FormBadge.test.tsx                          # [NEW] Form badge rendering & tooltip tests
│   │           ├── Podium.test.tsx                             # [MODIFIED] Assert clean numbering & record format
│   │           ├── RankingsMobile.test.tsx                     # [NEW] Assert clean # rank, stats & form row
│   │           └── RankingsTable.test.tsx                      # [NEW] Assert columns, clean #, FormBadge presence
│   ├── hooks/
│   │   ├── useRankings.ts                                      # [MODIFIED] Parallel fetch, computePlayerSportsStats integration
│   │   └── __tests__/
│   │       └── useRankings.test.ts                             # [MODIFIED] 5-tier sort, gameDiff & form assertions
│   ├── types/
│   │   └── rankings.ts                                         # [MODIFIED] Extend RankingStats, export RankedPlayer
│   └── utils/
│       ├── standingsStats.ts                                   # [NEW] Pure calculation & 5-tier sorting engine
│       └── __tests__/
│           └── standingsStats.test.ts                          # [NEW] Comprehensive unit test suite
```

---

## 3. Data Models, Schemas & Interface Contracts

### 3.1 Domain Types ([src/types/rankings.ts](file:///D:/Projects/team-generator/src/types/rankings.ts))
```typescript
import type { Player } from './player';

export type FormOutcome = 'W' | 'L';

export interface RankingStats {
  rank: number;
  player: Player;
  rating: number; // Backward compatibility fallback (1200)
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // Percentage rounded to 1 decimal place (e.g. 81.3)
  gamesWon: number;
  gamesLost: number;
  gameDifference: number; // gamesWon - gamesLost
  form: FormOutcome[]; // Last up to 5 match outcomes, oldest-to-newest
}

export type RankedPlayer = RankingStats;
```

### 3.2 Sports Engine Contracts ([src/utils/standingsStats.ts](file:///D:/Projects/team-generator/src/utils/standingsStats.ts))
```typescript
import type { PlayerRow } from '../types/database.types';
import type { MatchDetail, MatchFormat } from '../types/matches';
import type { Player } from '../types/player';
import type { FormOutcome } from '../types/rankings';

export interface PlayerSportsStats {
  playerId: string;
  name: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // 0.0 - 100.0 (rounded to 1 decimal place)
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
  form: FormOutcome[]; // Chronological (oldest -> newest, max 5)
  rank: number;
}

export interface GameDifferenceResult {
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
}

/**
 * Calculates games won, lost, and net difference for a specific team in a match.
 * Sums multi-set scores or falls back to casual single set scores.
 */
export function calculateGameDifference(
  match: {
    sets?: { team_1_score: number; team_2_score: number }[] | null;
    team_1_score?: number | null;
    team_2_score?: number | null;
  },
  teamSide: 1 | 2 | 'team_1' | 'team_2'
): GameDifferenceResult;

/**
 * Aggregates player statistics from completed matches for a given format.
 * Sorts player matches chronologically (played_at asc) to extract last 5 outcomes.
 */
export function computePlayerSportsStats(
  players: (PlayerRow | Player)[],
  matches: MatchDetail[],
  format?: MatchFormat
): PlayerSportsStats[];

/**
 * Sorts PlayerSportsStats strictly adhering to the 5-tier sports hierarchy
 * and assigns sequential 1-based ranks (1, 2, 3...).
 */
export function sortPlayerSportsStats(
  stats: PlayerSportsStats[]
): PlayerSportsStats[];
```

### 3.3 UI Component Contracts
```typescript
// src/components/rankings/FormBadge.tsx
export interface FormBadgeProps {
  form: FormOutcome[];
  maxItems?: number; // Default: 5
  className?: string;
}

// src/components/rankings/RankingsTable.tsx
export interface RankingsTableProps {
  rankings: RankingStats[];
}

// src/components/rankings/RankingsMobile.tsx
export interface RankingsMobileProps {
  rankings: RankingStats[];
}

// src/components/rankings/Podium.tsx
export interface PodiumProps {
  topPlayers: RankingStats[];
}
```

---

## 4. Component / Module Specifications

### 4.1 Pure Sports Standings Engine (`standingsStats.ts`)
1. **`calculateGameDifference(match, teamSide)`**:
   - If `sets` array is non-empty, sum `s.team_1_score` and `s.team_2_score`.
   - Else fallback to `team_1_score` and `team_2_score` (default to 0 if null/undefined).
   - If `teamSide === 1` or `'team_1'`, `gamesWon = t1`, `gamesLost = t2`.
   - If `teamSide === 2` or `'team_2'`, `gamesWon = t2`, `gamesLost = t1`.
   - `gameDifference = gamesWon - gamesLost`.
2. **`computePlayerSportsStats(players, matches, format)`**:
   - Filter `matches` by `resolveMatchFormat(m) === format` if `format` is provided.
   - Only consider completed matches (`getMatchOutcome(m).isCompleted === true`).
   - For each player:
     - Find all matches containing player in `m.match_players` (`mp.player_id === player.id`).
     - Sort matched matches chronologically by `played_at` ascending (fallback to `created_at` or `id`).
     - For each completed match:
       - Determine player's team side (`mp.team_side`).
       - Outcome: `getMatchOutcome(m).winner === mp.team_side ? 'W' : 'L'`.
       - Add to game difference via `calculateGameDifference(m, mp.team_side)`.
     - Extract `form = outcomes.slice(-5)`.
     - `matchesPlayed = wins + losses`.
     - `winRate = matchesPlayed > 0 ? Number(((wins / matchesPlayed) * 100).toFixed(1)) : 0`.
     - **Graceful Backward Fallback**: If player has 0 match rows in `matches` but has pre-existing player row statistics (`singles_matches_played > 0`), read `matchesPlayed` and `wins` from player row with `gameDifference: 0` and `form: []`.
3. **`sortPlayerSportsStats(stats)`**:
   - Sort strictly by comparator:
     ```typescript
     if (b.wins !== a.wins) return b.wins - a.wins;
     if (b.winRate !== a.winRate) return b.winRate - a.winRate;
     if (b.gameDifference !== a.gameDifference) return b.gameDifference - a.gameDifference;
     if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
     return a.name.localeCompare(b.name, 'bg');
     ```
   - Map sorted array to assign sequential `rank: index + 1`.

### 4.2 Hook Integration (`useRankings.ts`)
- Use `Promise.all` in `fetchRankings` and `useEffect` to load both `players` and `matches` with joined `match_players`.
- Compute `PlayerSportsStats[]` using `computePlayerSportsStats(players, matches, format)`.
- Sort using `sortPlayerSportsStats`.
- Map into `RankingStats[]`:
  ```typescript
  {
    rank: s.rank,
    player: domainPlayer,
    rating: isSingles ? (p.singles_rating ?? 1200) : (p.doubles_rating ?? 1200),
    matchesPlayed: s.matchesPlayed,
    wins: s.wins,
    losses: s.losses,
    winRate: s.winRate,
    gamesWon: s.gamesWon,
    gamesLost: s.gamesLost,
    gameDifference: s.gameDifference,
    form: s.form,
  }
  ```
- Search filtering (`searchTerm`) filters `rawRankings` by player name while preserving each player's calculated `rank`.

### 4.3 Form Pill Component (`FormBadge.tsx`)
- Container: `flex items-center gap-1` with `aria-label="Форма от последните 5 мача"`.
- Calculates padding: `paddingCount = Math.max(0, maxItems - form.length)`.
- Renders `paddingCount` neutral empty placeholder pills first (or trailing, preserving 5 total slots):
  - Pill classes: `w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 select-none`.
  - Content: `-` (or `·`). Tooltip/Title: `Няма изигран мач`.
- Renders `form` outcomes (from oldest to newest):
  - `'W'`: `bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800`. Content: `П`. Tooltip/Title: `Победа`.
  - `'L'`: `bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-300 dark:border-rose-800`. Content: `З`. Tooltip/Title: `Загуба`.

### 4.4 Standings Table Overhaul (`RankingsTable.tsx`)
- Table Headers:
  - `#`: `py-3.5 px-3 text-center w-12 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400`
  - `Играч`: `py-3.5 px-4 text-left`
  - `М`: `py-3.5 px-3 text-center w-14`
  - `П`: `py-3.5 px-3 text-center w-14 text-emerald-600 dark:text-emerald-400`
  - `З`: `py-3.5 px-3 text-center w-14 text-rose-600 dark:text-rose-400`
  - `Успеваемост`: `py-3.5 px-4 text-right w-28`
  - `+/-`: `py-3.5 px-3 text-center w-16`
  - `Форма`: `py-3.5 px-4 text-center w-36`
- Table Body Rows:
  - Rank cell: Clean typography `<span className="font-bold text-gray-700 dark:text-gray-300 w-10 text-center inline-block">{stat.rank}</span>`. NO medal emojis (`🥇🥈🥉`) and no medal icons.
  - Wins: `<span className="font-semibold text-emerald-600 dark:text-emerald-400">{stat.wins}</span>`.
  - Losses: `<span className="font-semibold text-rose-600 dark:text-rose-400">{stat.losses}</span>`.
  - Win Rate: `<span className="font-bold text-gray-900 dark:text-white">{stat.winRate}%</span>` (with optional mini progress bar).
  - Difference: `<span className={stat.gameDifference > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : stat.gameDifference < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-gray-400 font-medium'}>{stat.gameDifference > 0 ? `+${stat.gameDifference}` : stat.gameDifference}</span>`.
  - Form: `<FormBadge form={stat.form} />`.

### 4.5 Mobile Rankings Cards (`RankingsMobile.tsx`)
- Card Header: Clean rank `#${stat.rank}` (bold text, no emoji), Player avatar and name, Win rate badge pill (`${stat.winRate}%`).
- Card Body: Clean stat grid (4 columns):
  - `М: ${stat.matchesPlayed}`
  - `П: ${stat.wins}` (emerald)
  - `З: ${stat.losses}` (rose)
  - `+/-: ${stat.gameDifference > 0 ? `+${stat.gameDifference}` : stat.gameDifference}`
- Card Footer: `<div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60"><span className="text-xs text-gray-400 font-medium">Форма:</span><FormBadge form={stat.form} /></div>`.

### 4.6 Podium Sanitization (`Podium.tsx`)
- Pedestals: Clean numbers `1`, `2`, `3` (no emojis).
- Titles: `1-во място` / `Шампион`, `2-ро място`, `3-то място`.
- Record: `${player.wins}П - ${player.losses}З (${player.winRate}%)`.
- Optional net games difference indicator: `+/-: ${player.gameDifference > 0 ? `+${player.gameDifference}` : player.gameDifference}`.
- Zero medal emojis guaranteed.

---

## 5. Automated Test Blueprints & Scenarios

### 5.1 Unit Tests: `src/utils/__tests__/standingsStats.test.ts`
- **Scenario 1: `calculateGameDifference`**
  - Multi-set match: Set 1 (6-4), Set 2 (3-6), Set 3 (7-5). Team 1: 16 won, 15 lost (+1). Team 2: 15 won, 16 lost (-1).
  - Casual single-set score: `team_1_score: 9, team_2_score: 4`. Team 1: +5 diff; Team 2: -5 diff.
  - Zero/unplayed match: scores `null` -> `gamesWon: 0, gamesLost: 0, gameDifference: 0`.
- **Scenario 2: `computePlayerSportsStats`**
  - Aggregates wins, losses, matches played, win rate rounded to 1 decimal place (e.g. 13 wins in 16 matches -> `81.3%`).
  - Correctly chronological form extraction: 8 matches played -> extracts last 5 in oldest-to-newest order.
  - Player with 0 matches -> `matchesPlayed: 0, wins: 0, losses: 0, winRate: 0, gameDifference: 0, form: []`.
  - Filters matches by format (`'singles'` vs `'doubles'`).
- **Scenario 3: `sortPlayerSportsStats` (5-Tier Tie-Breaking)**
  - Tier 1: Player with 12 wins beats Player with 10 wins (regardless of win rate).
  - Tier 2: Tied wins (10 wins each) -> Player with 83.3% beats Player with 71.4%.
  - Tier 3: Tied wins & win rate (10 wins, 80.0%) -> Player with +18 diff beats Player with +10 diff.
  - Tier 4: Tied wins, win rate, & diff -> Player with 15 matches beats Player with 12 matches.
  - Tier 5: All stats tied -> Bulgarian alphabetical sort (`'Ангел'` ranks before `'Борис'`).
  - Assigns 1-based sequential ranks `1, 2, 3...`.

### 5.2 Component Tests: `src/components/rankings/__tests__/FormBadge.test.tsx`
- Renders 5 pills for full form array `['W', 'W', 'L', 'W', 'L']` (3 `П`, 2 `З`).
- Renders green styling and title `"Победа"` for `'W'`.
- Renders red styling and title `"Загуба"` for `'L'`.
- Renders empty placeholders with `"-"` and title `"Няма изигран мач"` when `form.length < 5` (e.g., 2 matches -> 2 pills + 3 placeholders).
- Handles empty form array (`[]`) by rendering 5 neutral placeholders.

### 5.3 Hook Tests: `src/hooks/__tests__/useRankings.test.ts`
- Fetches both `players` and `matches` on mount.
- Calculates and sorts rankings using pure sports statistics engine.
- Switches between `'singles'` and `'doubles'` formats dynamically re-evaluating game differences and form.
- Search term filtering preserves original rank position numbers.
- Handles offline / unconfigured Supabase gracefully.

### 5.4 Component Integration Tests: `RankingsTable.test.tsx` & `RankingsMobile.test.tsx`
- Asserts all table headers exist (`#`, `Играч`, `М`, `П`, `З`, `Успеваемост`, `+/-`, `Форма`).
- Asserts clean numeric typography for rank column with zero medal emojis (`🥇`, `🥈`, `🥉`).
- Asserts `FormBadge` renders for each player row.
- Asserts mobile cards render `#1` format, stats line, and form indicator.

---

## 6. Implementation Guidelines for Senior Dev

Follow these sequential steps strictly:

1. **ADR-0047 Authoring**:
   - Create [docs/adr/0047-pure-sports-standings-and-form-tracking.md](file:///D:/Projects/team-generator/docs/adr/0047-pure-sports-standings-and-form-tracking.md) documenting context, decisions (5-tier tie break, form tracking, emoji removal), and consequences.
2. **Domain Type Extension**:
   - Update [src/types/rankings.ts](file:///D:/Projects/team-generator/src/types/rankings.ts) to add `gamesWon`, `gamesLost`, `gameDifference`, and `form: FormOutcome[]`. Export `RankedPlayer = RankingStats`.
3. **Pure Standings Engine & Unit Tests**:
   - Implement [src/utils/standingsStats.ts](file:///D:/Projects/team-generator/src/utils/standingsStats.ts) with `calculateGameDifference`, `computePlayerSportsStats`, and `sortPlayerSportsStats`.
   - Implement test suite [src/utils/__tests__/standingsStats.test.ts](file:///D:/Projects/team-generator/src/utils/__tests__/standingsStats.test.ts) covering all scenarios in Section 5.1.
4. **FormBadge Component & Unit Tests**:
   - Implement [src/components/rankings/FormBadge.tsx](file:///D:/Projects/team-generator/src/components/rankings/FormBadge.tsx) adhering to Section 4.3.
   - Implement test suite [src/components/rankings/__tests__/FormBadge.test.tsx](file:///D:/Projects/team-generator/src/components/rankings/__tests__/FormBadge.test.tsx).
5. **Hook Integration**:
   - Update [src/hooks/useRankings.ts](file:///D:/Projects/team-generator/src/hooks/useRankings.ts) to query both `players` and completed `matches`, delegating aggregation and sorting to `standingsStats.ts`.
   - Update [src/hooks/__tests__/useRankings.test.ts](file:///D:/Projects/team-generator/src/hooks/__tests__/useRankings.test.ts).
6. **UI Overhaul & Zero-Emoji Cleanup**:
   - Overhaul [src/components/rankings/RankingsTable.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsTable.tsx) with clean `#` typography, `+/-`, and `FormBadge`.
   - Overhaul [src/components/rankings/RankingsMobile.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsMobile.tsx).
   - Review and update [src/components/rankings/Podium.tsx](file:///D:/Projects/team-generator/src/components/rankings/Podium.tsx) and [src/components/rankings/__tests__/Podium.test.tsx](file:///D:/Projects/team-generator/src/components/rankings/__tests__/Podium.test.tsx).
   - Add/update tests in [RankingsTable.test.tsx](file:///D:/Projects/team-generator/src/components/rankings/__tests__/RankingsTable.test.tsx) and [RankingsMobile.test.tsx](file:///D:/Projects/team-generator/src/components/rankings/__tests__/RankingsMobile.test.tsx).
7. **Verification & Quality Gates**:
   - Run `npm test -- --run` (all existing + new tests must pass).
   - Run `npx tsc --noEmit` (0 type errors).
   - Run `npm run lint` (0 lint warnings/errors).
   - Run `npm run build` (successful production build).

---

## 7. Next Step Handoff (Summon Senior Dev)

- **Summon Role**: Senior Dev
- **Action**: Ingest [.agent_handoffs/feature/pure-sports-standings-and-form/2_architecture.md](file:///D:/Projects/team-generator/.agent_handoffs/feature/pure-sports-standings-and-form/2_architecture.md) and execute implementation steps 1 through 7.
- **Output Artifact**: `.agent_handoffs/feature/pure-sports-standings-and-form/3_implementation.md`.
