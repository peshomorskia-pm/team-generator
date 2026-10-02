# ADR 0009: Stage 3 Hybrid Generator and Transient Guest Management

* **Status:** Accepted
* **Date:** 2026-10-02
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** Project Guidelines (`GEMINI.md`), Architecture Specifications (`2_architecture.md`), Role Definitions (`.agents/roles/`)

---

## 1. Context and Problem Statement

The Team Generator application initially supported generating teams exclusively from registered players persisted in the Supabase `players` table. However, real-world team generation scenarios frequently involve spontaneous "guest" or casual players who are not registered in the persistent database and should not be saved permanently.

The requirement was to implement a **Hybrid Team Generator (Stage 3)** that allows combining registered database players with transient guest players in a unified active pool (`activePool`), while ensuring guest players remain purely session-only and never trigger Supabase backend mutations.

---

## 2. Decision Drivers

* **Transient Guest Lifecycle:** Guests must exist only in client-side React state for the duration of the session and must not trigger any database insert, update, or delete operations.
* **Seamless Pool Combination:** Users need an intuitive interface to select registered players from the database and quickly add single or bulk guest names (comma or newline separated).
* **Algorithmic Compatibility:** Rating balancing (LPT greedy balancing) and randomization (Fisher-Yates shuffle) must handle unrated guest players gracefully (defaulting unrated guest ratings to `0` or neutral).
* **Dual-Language Boundary:** All UI labels, placeholders, buttons, and status alerts must be 100% in Bulgarian, while all internal code, types, hooks, algorithms, and tests remain 100% in English.
* **Comprehensive Automated Testing:** Full test coverage across unit, hook, component, and integration test suites adhering to the Mandatory Automated Testing Protocol.

---

## 3. Decision

1. **Transient Guest State & Data Model:**
   - Introduced `ActivePlayer` union type (`PlayerRow | TransientGuest`) in [`src/types/generator.ts`](file:///D:/Projects/team-generator/src/types/generator.ts).
   - Transient guests have `id` (generated via `crypto.randomUUID()` or RFC4122 v4 fallback), `name`, `rating: null`, and `isGuest: true`.
2. **Component Architecture:**
   - Created modular generator components under `src/components/generator/`:
     - `PlayerSelector.tsx`: Registered database player selection with search filter and toggle controls.
     - `GuestInput.tsx`: Single and bulk guest input (handling comma/newline separation and blank pruning).
     - `ActivePool.tsx`: Unified active pool display distinguishing registered players (`indigo` badge with ELO) from guest players (`slate` badge with chip).
     - `TeamSettings.tsx`, `TeamCard.tsx`: Team configuration and display.
3. **Hook & Business Logic (`useTeamGenerator`):**
   - Manages `activePool`, selected player IDs, team count, history fingerprinting, and generation logic.
   - Explicitly guarantees zero Supabase mutation calls (`createPlayer`, `updatePlayer`, `deletePlayer`) during guest operations or hybrid team generation.
4. **Localization & Styling:**
   - 100% Bulgarian UI copy across all generator views.
   - Tailwind CSS dark mode parity (`dark:bg-slate-800`, `dark:border-slate-700`, etc.).

---

## 4. Consequences

### Positive
- **High Flexibility:** Users can instantly mix registered league regulars with casual drop-in guests without cluttering the persistent database.
- **Strict Data Integrity:** Zero accidental database mutations for session-only guest players.
- **Robust Test Coverage:** 165 tests across 23 test suites passing with 100% success rate and >90% coverage.
- **Clean Architecture:** Strict adherence to modular componentization and dual-language boundary.

### Negative
- **Ephemeral Data:** Guest players do not persist across browser refreshes or page navigation, which is intentionally desired for transient guests.
