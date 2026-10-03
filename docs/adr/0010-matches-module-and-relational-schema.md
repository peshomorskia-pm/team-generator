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

* **Option A Relational Schema:** Separate `matches` header table and `match_players` line items table with foreign keys, cascading deletes, and strict check constraints, enhanced with nullable scores for upcoming fixtures.
* **Participant Integrity:** Ensure every row in `match_players` is exclusively either a registered player (`player_id IS NOT NULL AND guest_name IS NULL`) or a guest (`player_id IS NULL AND guest_name IS NOT NULL`).
* **Advanced Roster Selection (`PlayerCombobox`):** Accessible keystroke typeahead with instant click selection, cross-team player exclusion (`(в другия отбор)`), and guest name addition.
* **Date-Aware Validation:** Past fixtures require non-negative scores; today and future fixtures allow empty (`null`) scores for scheduling or require complete score pairs.
* **Multi-Dimensional Filtering & Stats:** Combined status tabs, period dropdowns, and text search, accompanied by sport-agnostic aggregate statistics ("Общо", "Изиграни", "Предстоящи").
* **Comprehensive Automated Testing:** 100% pass rate across all test suites (235 tests across 30 files) covering database contracts, hooks, custom combobox, modal validation, and page routing.

---

## 3. Decision

1. **Relational Database Schema (`supabase/migrations/20261003000000_create_matches_tables.sql` & `supabase/migrations/20261003010000_allow_nullable_match_scores.sql`):**
   - `matches`: Primary key `id` (UUID), `team1_score` (integer >= 0, nullable), `team2_score` (integer >= 0, nullable), `status` (text: 'completed', 'in_progress', 'cancelled'), `notes` (text, optional), `created_at`, `updated_at`.
   - `match_players`: Primary key `id` (UUID), foreign key `match_id` (`REFERENCES matches(id) ON DELETE CASCADE`), `team_number` (integer: 1 or 2), foreign key `player_id` (`REFERENCES players(id) ON DELETE SET NULL`, optional), `guest_name` (text, optional).
   - Check Constraint `check_participant`: `CHECK ((player_id IS NOT NULL AND guest_name IS NULL) OR (player_id IS NULL AND guest_name IS NOT NULL))`.
   - Descending performance indexes on `created_at`.
   - Auto-updated `updated_at` trigger via `update_modified_column()`.

2. **Frontend Architecture & Components (`src/components/match/`, `src/pages/MatchesPage.tsx`, `src/hooks/useMatches.ts`):**
   - `useMatches`: Manages loading state, pessimistic/optimistic CRUD mutations, error handling, and Supabase client integration supporting nullable scores.
   - `MatchesPage`: Live dashboard featuring aggregate statistics summary (`MatchesStatSummary`), combined multi-dimensional filters (status tabs: "Всички", "Изиграни", "Предстоящи"; period dropdown: "Всички периоди", "Тази седмица", "Този месец"), and search query intersection.
   - `MatchCard`: Displays team rosters, scores (or `- : -` for upcoming fixtures), status badges ("Предстоящ"), and action triggers.
   - `MatchModal`: Comprehensive creation and editing modal featuring date-aware validation (past matches mandate scores; today/future allow empty scores or complete pairs), local calendar day calculations, and guest addition.
   - `PlayerCombobox`: Accessible typeahead component (`role="combobox"`, `role="listbox"`, `role="option"`) providing real-time search filtering, instant click selection, keyboard navigation, and cross-team exclusion (`(в другия отбор)`).
   - `DeleteMatchModal`: Safe confirmation dialog preventing accidental deletions.

3. **Localization & Language Boundary:**
   - Strict adherence to the language protocol: English for code, schemas, types, hooks, and tests; Bulgarian for all user-facing UI copy, modals, empty states, combobox tags, and validation alerts.

---

## 4. Consequences

### Positive
- **Robust Relational Integrity:** Clear normalized separation between match metadata and participant line items with automatic cleanup (`CASCADE`) and preservation (`SET NULL`).
- **Flexible Match Scheduling & Rosters:** Seamlessly supports upcoming fixtures (`- : -`) alongside completed matches, with cross-team player exclusion and guest support.
- **Thorough Verification:** 235 tests across 30 test files passing with zero mock bypasses or skipped assertions.
- **Clean Separation of Concerns:** Modular component structure matching previous application standards.

### Negative
- **Database Complexity:** Joining `matches` and `match_players` requires careful query construction or nested Supabase select syntax.
