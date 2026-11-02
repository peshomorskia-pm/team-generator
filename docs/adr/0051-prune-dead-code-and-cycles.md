# Architectural Decision Record (ADR) 0051: Dead Code Removal & Modular Decoupling

## Status
- **Status:** Approved & Implemented
- **Date:** 2026-11-02
- **Ticket:** Ticket 2 (`chore/prune-dead-code-and-cycles`)
- **Author:** Architecture / Core Engineering Team

---

## Context & Problem Statement

As the `team-generator` project evolved through multiple rapid iterations (including sports win-rate badges, ELO residue purging, and match scoring engines), several code quality issues accumulated:
1. **Orphaned Dead Components & Props:**
   - `PlaceholderPage.tsx`, `PlayerList.tsx`, and `PlayerInput.tsx` remained in the codebase without active routes or component references.
   - The `PlayerInputProps` interface in `src/types/index.ts` was dead code.
2. **Circular Dependency Between Utilities:**
   - A circular dependency existed between `src/utils/shuffle.ts` and `src/utils/balance.ts`. `shuffle.ts` depended on or was intertwined with balancing logic, creating fragile module loading order and tight coupling.
3. **Unused Export Residue:**
   - `formatMatchScoreDisplay` in `src/utils/standings.ts` was an unused helper function with corresponding dead test coverage.

---

## Decision Drivers

1. **Maintainability & Clean Architecture:** Remove unused components and helper functions to reduce cognitive load and bundle clutter.
2. **Strict Module Decoupling:** Break circular dependencies by ensuring that `shuffle.ts` acts as a pure, generic utility leaf (`fisherYatesShuffle<T>`), while domain-specific balancing logic (`shuffleTeamsBalanced`) resides entirely within `balance.ts`.
3. **Type Safety & Build Cleanliness:** Ensure 100% strict TypeScript compilation, zero ESLint warnings/errors, and complete test suite coverage.

---

## Considered Options

1. **Option A: Keep dead components and retain circular module imports.** (Rejected: Leads to bloated bundles, circular dependency warnings, and maintenance confusion.)
2. **Option B: Partial pruning (remove components only without touching utility cycles).** (Rejected: Fails to address core architectural tech debt identified in code health audits.)
3. **Option C: Comprehensive dead code pruning & pure leaf module extraction (ADR-0051).** (Selected: Cleanly removes unused components, extracts pure `fisherYatesShuffle`, relocates `shuffleTeamsBalanced` to `balance.ts`, and prunes dead helpers.)

---

## Detailed Design & Changes

### 1. Dead Component & Interface Removal
- **Deleted Files:**
  - `src/components/layout/PlaceholderPage.tsx`
  - `src/components/player/PlayerList.tsx`
  - `src/components/player/PlayerInput.tsx`
  - `src/components/player/__tests__/PlayerInput.test.tsx`
- **Pruned Types:**
  - Removed `PlayerInputProps` from `src/types/index.ts`.

### 2. Circular Dependency Resolution (`shuffle.ts` vs `balance.ts`)
- **`src/utils/shuffle.ts`:** Refactored into a pure, generic utility leaf exporting `fisherYatesShuffle<T>(array: T[]): T[]`. It has zero module imports and zero domain dependencies.
- **`src/utils/balance.ts`:** Now hosts the concrete implementation of `shuffleTeamsBalanced` and imports `fisherYatesShuffle` from `./shuffle`. This completely breaks the circular dependency.

### 3. Standings Helper Pruning
- **`src/utils/standings.ts`:** Removed the unused `formatMatchScoreDisplay` helper.
- **`src/utils/__tests__/standings.test.ts`:** Removed Scenario 9 test case associated with the pruned helper.

---

## Consequences & Verification

- **Positive:**
  - Zero circular dependencies across utility modules.
  - Reduced bundle size and cleaner directory structure.
  - 100% test suite pass rate (68 test suites, 922 tests passing).
  - Clean TypeScript strict typecheck and ESLint audit.
- **Negative / Trade-offs:**
  - None identified.
