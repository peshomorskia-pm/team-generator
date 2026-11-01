# Stage 0: Context & Triage Initiation

## Ticket Overview
- **Branch**: `feature/pure-sports-standings-and-form`
- **Type**: Feature / Rankings & Performance Statistics Overhaul
- **Objective**: 
  1. Implement a pure sports statistics engine (Wins, Losses, Win Rate %, Game Difference, and 5-match Form tracker) replacing legacy ELO sorting.
  2. Overhaul the Standings Table (`RankingsTable.tsx` / `RankingsMobile.tsx` / `RankingsPage.tsx`):
     - Display columns: **#** | **Играч** | **М** (Мачове) | **П** (Победи) | **З** (Загуби) | **Успеваемост %** | **Форма** (посл. 5 мача).
     - Strict ranking hierarchy: Wins (desc) -> Win Rate % (desc) -> Game Difference (+/- desc) -> Matches Played (desc) -> Alphabetical.
     - Position numbers: Clean numbers `1`, `2`, `3`... **without medal emojis (NO 🥇 🥈 🥉)** in table, podium, and player cards.
  3. Overhaul Podium (`Podium.tsx`):
     - Remove emojis from cards. Display clean text titles: `1-во място`, `2-ро място`, `3-то място`.
     - Display match win stats: e.g. `16 мача • 81.3% победи` (or `XП - YЗ (Z%)`).
  4. Overhaul Player Cards (`PlayerCard.tsx` / `PlayersPage.tsx`):
     - Remove rank medal emojis (e.g. `🥇 1-во място` -> `1-во място` or `#1`).
     - Display match counts, wins, losses, and win rate %.
  5. Form Indicator Component:
     - Render 5 compact badges/dots representing the last 5 completed matches for each player (green `П` for win, red `З` for loss).

## User / PO Constraints & Approvals
- User explicit request: "Вариант Б мисля, че ми харесва най много. ... Само няма нужда да има емотикон пред 1 2 3 . В картата на играча също да няма емотикон за мястото. ... давай".
- Strict scoping: focus entirely on standings calculations, table layout, form pills, podium clean numbers, and player cards. Zero unrelated changes.
- Dual-Language boundary: 100% English internal code, comments, tests, commits, and ADR; Bulgarian verbatim for UI strings ("М", "П", "З", "Успеваемост", "Форма", "1-во място").
- Quality Gates: all test suites must pass 100%, 0 typecheck errors, 0 lint warnings, clean build.

## Handoff Instructions for Intake Gatekeeper
- Read this context file.
- Inspect `src/hooks/useRankings.ts`, `src/components/rankings/RankingsTable.tsx`, `src/components/rankings/RankingsMobile.tsx`, `src/components/rankings/Podium.tsx`, `src/pages/RankingsPage.tsx`, `src/components/player/PlayerCard.tsx`, and `src/pages/PlayersPage.tsx` in read-only mode on `dev`.
- Check how match history is loaded or can be aggregated to determine game differences and the last 5 match outcomes per player.
- Verify blast radius, test requirements, and issue verdict: 🟢 GREEN, 🟡 YELLOW, or 🔴 RED.
- Output artifact to `.agent_handoffs/feature/pure-sports-standings-and-form/1_intake_gate.md`.
