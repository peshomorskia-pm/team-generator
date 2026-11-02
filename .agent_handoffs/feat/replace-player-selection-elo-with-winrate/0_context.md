# Stage 0: Context & Triage Initiation (Delta Update)

## Ticket Overview
- **Branch**: `feat/replace-player-selection-elo-with-winrate`
- **Type**: PO Feedback / Quality & Consistency Hardening
- **Objective**: 
  1. Address user observation: "след като вкарам играчите в отборите има елота" (in tournament groups / interactive board / team cards).
  2. **In Team Card Header (`TeamCard.tsx`)**:
     - Remove the aggregate rating badge (`⭐ 2383`, `⭐ 2400`) completely per user decision: "Мисля, че няма нужда от средна успеваемост за отбора. Само на отделните играчи."
     - Header presents cleanly: team index pill (`1`), team name (`Отбор 2`), and action buttons (shuffle/delete).
  3. **For individual players within the team (`TeamCard.tsx`)**:
     - Remove the legacy chess ELO stars (`★ 1183`, `★ 1200`, `★ 1260`, `★ 1154`).
     - Render the pure sports win rate badge: `{winRate}%` (e.g. `100%`, `80%`) or `"Нов"` for players with 0 matches, exactly matching the selection list.

## User / PO Requirements
- User critique: "след като вкарам играчите в отборите има елота" (screenshot shows `⭐ 2383` on Отбор 2 and `★ 1183`, `★ 1200` on players).
- User decision: "Мисля, че няма нужда от средна успеваемост за отбора. Само на отделните играчи. Какво смяташ? ... да".
- Result:
  - Team header: NO aggregate rating / percentage number.
  - Team players: format-aware win rate badge (`{winRate}%` or `"Нов"`) replacing legacy stars.

## Constraints & System Protocols
- **Dual-Language Boundary**: 100% English internal code, comments, tests, commits, and ADR; Bulgarian verbatim for UI strings ("Нов", "Гост", "Отбор").
- **Synchronous Command Guardrail**: All `run_command` verification calls must specify `WaitMsBeforeAsync: 10000` per ADR-0041.
- **Strict Scoping**: Confined strictly to `TeamCard.tsx` and associated tests/props. Zero unrelated edits.
- **Quality Gates**: All test suites must pass 100%, 0 typecheck errors, 0 lint warnings, clean build.

## Handoff Instructions for Intake Gatekeeper
- Read this context file.
- Inspect `src/components/team/TeamCard.tsx`, its consumers (e.g. `TournamentInteractiveBoard.tsx`, `GeneratorPage.tsx`), and `src/components/team/__tests__/TeamCard.test.tsx`.
- Check where `totalRating` and `player.rating` are rendered in `TeamCard.tsx`.
- Verify blast radius, test requirements, and issue verdict: 🟢 GREEN, 🟡 YELLOW, or 🔴 RED.
- Output artifact to `.agent_handoffs/feat/replace-player-selection-elo-with-winrate/1_intake_gate.md`.
