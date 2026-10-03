# ADR 0014: Dual ELO Player Representation and Format-Aware Team Balancing

* **Status:** Accepted
* **Date:** 2026-10-03
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer

---

## 1. Context and Problem Statement
Following the implementation of Stage 5 Tennis Rankings and ELO Leaderboard with separate Singles and Doubles ratings, the application displayed only general/singles rating in the Players tab (`/players`), and the Team Generator balanced teams using only a single rating without format context. Users need to clearly see both Singles and Doubles ELO on player cards and have the Team Generator balance teams according to the chosen match format (Singles 1v1 vs Doubles 2v2).

---

## 2. Decision
1. **Players Management (`/players` & `PlayerModal`)**:
   - Both Singles ELO (🎾 `singles_rating`) and Doubles ELO (👥 `doubles_rating`) are displayed on desktop table rows and mobile player cards.
   - `PlayerModal` provides dedicated numeric inputs with boundary validations for General ELO, Singles ELO, and Doubles ELO, defaulting new players to 1200.
2. **Team Generator (`/generator` & `TeamSettings`)**:
   - Introduced a format segmented pill selector: **Поединично** (Singles) vs **По двойки** (Doubles).
   - In `balance.ts`, greedy balancing resolves player ratings based on the active format (`singles_rating` when Singles is active, `doubles_rating` when Doubles is active).
   - `ActivePool` and `TeamCard` components display the active format's rating and calculate team totals accordingly.
   - When clicking **"Запиши като мач"**, the active format is forwarded via `initialFormat` to `MatchModal`.

---

## 3. Consequences
### Positive
- Unified format consistency across Players, Generator, Matches, and Rankings modules.
- Players are balanced according to their format-specific skill levels (singles vs doubles).
- Seamless flow from generating teams to recording matches with pre-selected format.
- 310 automated tests passing across 36 test suites (100% pass rate).
