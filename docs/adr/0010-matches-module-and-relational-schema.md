# ADR 0010: Matches Module and Relational Schema (Option A)

* **Status:** Accepted
* **Date:** 2026-10-03
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** Project Guidelines (`GEMINI.md`), Architecture Specifications (`2_architecture.md`), Role Definitions (`.agents/roles/`)

---

## 1. Context and Problem Statement

Following the successful implementation of the Team Generator and Hybrid Transient Guest model (Stage 3), the application required a fully functional **Matches Module (Stage 4)** to record match results, track team scores, maintain match statistics (wins, losses, draws, win rates), and persist match history in Supabase (PostgreSQL).

The challenge was to design a robust relational schema that supports matches between two teams where each team can comprise any combination of registered database players (`player_id`) and transient guests (`guest_name`), without violating referential integrity or introducing complex polymorphic anti-patterns.

---

## 2. Decision Drivers

* **Option A Relational Schema:** Separate `matches` header table and `match_players` line items table with foreign keys, cascading deletes, and strict check constraints.
* **Participant Integrity:** Ensure every row in `match_players` is exclusively either a registered player (`player_id IS NOT NULL AND guest_name IS NULL`) or a guest (`player_id IS NULL AND guest_name IS NOT NULL`).
* **Match Lifecycle & History:** Support creating, editing, viewing, and deleting matches with real-time state synchronization (`useMatches` hook).
* **Responsive & Themed UI:** Full Tailwind CSS dark mode support, mobile-friendly layouts, and 100% Bulgarian localization for all user-facing strings.
* **Comprehensive Automated Testing:** 100% pass rate across all test suites (216 tests across 29 files) covering database contracts, hooks, modal validation, and page routing.

---

## 3. Decision

1. **Relational Database Schema (`supabase/migrations/20261003000000_create_matches_tables.sql`):**
   - `matches`: Primary key `id` (UUID), `team1_score` (integer >= 0), `team2_score` (integer >= 0), `status` (text: 'completed', 'in_progress', 'cancelled'), `notes` (text, optional), `created_at`, `updated_at`.
   - `match_players`: Primary key `id` (UUID), foreign key `match_id` (`REFERENCES matches(id) ON DELETE CASCADE`), `team_number` (integer: 1 or 2), foreign key `player_id` (`REFERENCES players(id) ON DELETE SET NULL`, optional), `guest_name` (text, optional).
   - Check Constraint `check_participant`: `CHECK ((player_id IS NOT NULL AND guest_name IS NULL) OR (player_id IS NULL AND guest_name IS NOT NULL))`.
   - Descending performance indexes on `created_at`.
   - Auto-updated `updated_at` trigger via `update_modified_column()`.

2. **Frontend Architecture & Components (`src/components/match/`, `src/pages/MatchesPage.tsx`, `src/hooks/useMatches.ts`):**
   - `useMatches`: Manages loading state, optimistic/pessimistic CRUD mutations, error handling, and Supabase client integration.
   - `MatchesPage`: Live dashboard featuring aggregate statistics summary (`MatchesStatSummary`), search/filter by player or guest, and match cards.
   - `MatchCard`: Displays team rosters, scores, win/draw indicators, and action triggers.
   - `MatchModal`: Comprehensive creation and editing modal with player selection, team roster management, guest input, and cross-team collision validation.
   - `DeleteMatchModal`: Safe confirmation dialog preventing accidental deletions.

3. **Localization & Language Boundary:**
   - Strict adherence to the language protocol: English for code, schemas, types, hooks, and tests; Bulgarian for all user-facing UI copy, modals, empty states, and validation alerts.

---

## 4. Consequences

### Positive
- **Robust Relational Integrity:** Clear normalized separation between match metadata and participant line items with automatic cleanup (`CASCADE`) and preservation (`SET NULL`).
- **Flexible Match Rosters:** Seamlessly supports matches featuring registered league players, transient guests, or mixed team compositions.
- **Thorough Verification:** 216 tests across 29 test files passing with zero mock bypasses or skipped assertions.
- **Clean Separation of Concerns:** Modular component structure matching previous application standards.

### Negative
- **Database Complexity:** Joining `matches` and `match_players` requires careful query construction or nested Supabase select syntax.
