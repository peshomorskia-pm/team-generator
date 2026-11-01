# 47. Pure Sports Standings and Form Tracking

Date: 2026-11-01

## Status
Accepted

## Context
1. Following the deprecation of legacy chess ELO ratings (ADR-0046), player rankings needed a robust, industry-standard sports standing hierarchy.
2. In tennis tournaments and leagues, standings are determined primarily by match victories, percentage efficiency, game differentials, and match participation.
3. Users and players expect immediate, deterministic tie-breaking without ambiguity or volatile rating fluctuations.
4. Form tracking (the visual representation of a player's recent outcomes, e.g., the last 5 matches) provides critical context regarding player momentum and recent performance.
5. In order to create a modern, professional, and accessible UI, medal emojis (`🥇`, `🥈`, `🥉`) and icon clutter in ranking tables and cards must be replaced with crisp numeric typography (`#1`, `#2`, `#3`).

## Decision
1. **Pure Sports Standings Engine (`src/utils/standingsStats.ts`)**:
   - Created a standalone, functional calculation engine independent of UI or persistence logic.
   - Implemented `calculateGameDifference`: Computes games won, lost, and net differential (`gamesWon - gamesLost`) supporting both multi-set matches (`sets` array) and casual single-set scorelines (`team_1_score`, `team_2_score`).
   - Implemented `computePlayerSportsStats`: Traverses completed matches chronologically by `played_at`, extracting match outcomes (`W` / `L`), aggregating total games won/lost, win percentage rounded to 1 decimal place, and slicing the last 5 chronological outcomes for form.
   - `matches` table is the exclusive Single Source of Truth. Stale legacy counter fallbacks are completely eliminated; players with zero matches in the `matches` table strictly receive 0 matches, 0 wins, 0 losses, 0.0% win rate, and empty form.

2. **Deterministic 6-Tier Tie-Breaking Hierarchy (`sortPlayerSportsStats`)**:
   - **Gate 1**: Active Player Priority (`matchesPlayed > 0` strictly outranks `matchesPlayed === 0`, regardless of negative game differentials).
   - **Tier 1**: Total Wins (`wins` descending).
   - **Tier 2**: Win Rate % (`winRate` descending, rounded to 1 decimal place).
   - **Tier 3**: Net Game Difference (`gameDifference` descending).
   - **Tier 4**: Total Matches Played (`matchesPlayed` descending).
   - **Tier 5**: Bulgarian Alphabetical Name Collation (`a.name.localeCompare(b.name, 'bg')`).
   - Assigns 1-based sequential ranks (`1, 2, 3...`).

3. **Form Badge Component (`src/components/rankings/FormBadge.tsx`)**:
   - Renders a 5-pill chronological sequence.
   - Wins (`W`): emerald badge with label `П` and tooltip `"Победа"`.
   - Losses (`L`): rose badge with label `З` and tooltip `"Загуба"`.
   - Empty/Unplayed slots: neutral dashed badge with label `-` and tooltip `"Няма изигран мач"`.

4. **Zero-Emoji Clean Typography & Explicit Game Difference Labeling**:
   - `RankingsTable.tsx`: Clean tabular layout featuring columns `#`, `Играч`, `М`, `П`, `З`, `Успеваемост`, `Геймова разлика` (with tooltip "Геймова разлика (спечелени - загубени геймове)" and `whitespace-nowrap`), and `Форма`. Clean numeric typography replacing medal icons in the rank column.
   - `RankingsMobile.tsx`: Mobile card format with `#1` rank header, 3-metric primary grid (`М`, `П`, `З`), and dedicated secondary row featuring `Геймова разлика: +X` alongside `Форма`.
   - `Podium.tsx`: Clean place titles (`Шампион`, `2-ро място`, `3-то място`), numeric pedestals `1`, `2`, `3`, and match record format (`XП - YЗ (Z%)`). Unmounted from `RankingsPage.tsx` to streamline page focus directly onto the standings table and search filter.

5. **Hook Decoupling (`useRankings.ts`)**:
   - Parallel fetching of players and matches with joined `match_players`.
   - Standings computation fully delegated to `standingsStats.ts`.
   - Search filtering preserves original calculated rank order.

6. **Zero Schema Migration**:
   - In-memory calculation over existing Supabase tables (`players`, `matches`, `match_players`) ensuring zero downtime and instant deployment.

## Consequences
- **Positive**:
  - Deterministic, authentic sports standings matching professional tennis regulations.
  - Highly responsive, informative form pills indicating recent momentum.
  - Consistent, clean typography without emoji rendering inconsistencies across devices.
  - 100% test coverage with comprehensive unit and component test suites.
- **Negative / Neutral**:
  - Requires parallel retrieval of matches alongside players in `useRankings`.
