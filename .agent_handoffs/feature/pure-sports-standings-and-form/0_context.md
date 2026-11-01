# Stage 0: Context & Triage Initiation (Delta Update)

## Ticket Overview
- **Branch**: `feature/pure-sports-standings-and-form`
- **Type**: PO Feedback / Quality & Usability Hardening
- **Objective**: Address user observations from live local testing of PR #79:
  1. **Remove the Podium block (`Podium.tsx`)** from `RankingsPage.tsx`. The page presents a single, clean sports standings table without duplicate top-3 cards crowding above it.
  2. **Single Source of Truth for Standings**:
     - Remove the legacy fallback to stale cached counters (`player.singles_matches_played`, `player.doubles_matches_played`) in `src/utils/standingsStats.ts`.
     - Standings, win rates, game differences, and form must be derived **100% strictly from verified matches** in the `matches` table.
     - Players with 0 actual matches will correctly show 0 matches, 0 wins, 0 losses, 0.0% win rate, and will not pollute the leaderboard with empty form pills.
  3. **Clear Column Header for Game Difference**:
     - Change the column header from cryptic `+/-` to explicit Bulgarian text: **`Геймова разлика`** (with tooltip `(спечелени - загубени геймове)`).
     - In mobile view / mobile cards, label cleanly as `Геймова разлика: +11`.
  4. **Synchronize & Resync Database Counters**:
     - Update `useMatches.ts` / `useTournaments.ts` so deleting matches or tournaments resynchronizes player counters cleanly without leaving orphaned records.

## User / PO Feedback
- User directives:
  - "Има останали топ 3 места отгоре голямото."
  - "Но интересното е как има играчи без мачове с процент успеваемост или това е проблем с данните в базата?"
  - "И още нещо в момента геймовата разлика като хедър на колоната е +/- . Реално не е ясно какво е това"
  - "Геймова разлика мисля, че е ок. ДА го сложим засега така . после ще видим как е на телефон."

## Constraints & System Protocols
- **Dual-Language Boundary**: 100% English internal reasoning, commits, handoffs, tests, and ADR; Bulgarian verbatim for UI strings ("Геймова разлика").
- **Synchronous Command Guardrail**: All `run_command` verification calls must specify `WaitMsBeforeAsync: 10000` per ADR-0041.
- **Strict Scoping**: Confined strictly to these 4 refinements.
- **Quality Gates**: All test suites must pass 100%, 0 typecheck errors, 0 lint warnings, clean build.

## Handoff Instructions for Intake Gatekeeper
- Read this context file.
- Inspect `src/pages/RankingsPage.tsx`, `src/utils/standingsStats.ts`, `src/components/rankings/RankingsTable.tsx`, `src/components/rankings/RankingsMobile.tsx`, and `src/hooks/useRankings.ts` on `feature/pure-sports-standings-and-form`.
- Verify blast radius, test requirements, and issue verdict: 🟢 GREEN, 🟡 YELLOW, or 🔴 RED.
- Output artifact to `.agent_handoffs/feature/pure-sports-standings-and-form/1_intake_gate.md`.
