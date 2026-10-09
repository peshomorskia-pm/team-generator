# 0016. Decoupling Tennis vs Generic Modes in Team Generator

Date: 2026-10-09  
Status: Accepted  
Branch: `feature/generator-tennis-vs-generic-modes`

## Context

The team generator started as a general-purpose team partitioning utility (`[ 🎲 Универсален ]`), supporting arbitrary team counts and group sizes balanced by generic player ratings (`player.rating`). With the introduction of tennis club management features, tennis-specific workflows (`[ 🎾 Тенис ]`) were added, encompassing:
- Tennis formats: **Doubles (По двойки)** and **Singles (Поединично)**.
- Specialized tennis ELO ratings (`doubles_rating`, `singles_rating`).
- Strict capacity constraints (e.g. exactly 2 players per team in doubles, exactly 1 in singles).
- Coaching guidance prompts in Bulgarian for odd player counts and minimum threshold violations.
- Direct bridging ("Запиши като мач") to prefill a match recording modal when exactly two teams are generated in Tennis mode.

As these features evolved, several friction points and leaky abstractions emerged:
1. **Rating Leakage**: Generic mode was inadvertently influenced or decorated by tennis ratings or format badges (`doubles_rating`, `singles_rating`), violating mode purity.
2. **Coaching Prompt Mismatch**: Bulgarian warning banners and toasts for odd doubles counts or insufficient player thresholds did not precisely match Product Owner (PO) phrasing.
3. **UX Overlap**: Manual team count inputs and format toggle pills conflicted when switching between Tennis (which has strict size rules) and Generic mode (which relies on user-specified team counts or group sizes).
4. **Match Recording Scope**: The "Запиши като мач" bridge leaked into Generic mode or multi-team tennis generation, whereas it is strictly valid only for 2-team Tennis matches.

## Decision

We introduce a robust, decoupled mode architecture cleanly separating **Tennis Mode** from **Generic Mode**:

1. **Top-Level Mode Switcher (`TeamSettings.tsx`)**:
   - Provides a segmented button switcher: `[ 🎾 Тенис ]` vs `[ 🎲 Универсален ]` (defaulting to `'tennis'`).
   - Preserves active pool selections across mode toggles.

2. **Tennis Mode (`mode === 'tennis'`)**:
   - Format toggle pills: **По двойки** (default) and **Поединично**.
   - **Doubles Mode**:
     - Requires minimum 4 players (`"Нужни са поне 4 играчи за игра по двойки."`).
     - Enforces even player counts; odd counts trigger the exact Bulgarian coaching prompt: `"Добавете още 1 играч за пълни двойки"`.
     - Strictly enforces team capacity `maxCapacity = 2` (`numTeams = activePool.length / 2`) in balancing (`balance.ts`), preventing 3v1 imbalances.
     - Balances by `doubles_rating`.
   - **Singles Mode**:
     - Requires minimum 2 players (`"Нужни са поне 2-ма играчи за сформиране на сингъл срещи"`).
     - Generates `activePool.length` teams of 1 player.
     - Balances by `singles_rating`.
   - **Match Bridge (`TeamList.tsx`)**:
     - "Запиши като мач" button is gated strictly to Tennis mode when `teams.length === 2`, prefilling [MatchModal.tsx](file:///D:/Projects/team-generator/src/components/match/MatchModal.tsx).

3. **Generic Mode (`mode === 'generic'`)**:
   - Hides tennis format toggle pills and tennis-specific validation banners.
   - Displays manual configuration inputs: `"Брой отбори"` and `"(или) Брой играчи в отбор"`.
   - **Rating Isolation**: Introduces `effectiveFormat` abstraction ensuring Generic mode strictly evaluates `player.rating` (defaulting to 0) across balancing computations and UI badges (`ActivePool`, `PlayerSelector`, `TeamCard`). Tennis ratings are completely isolated.
   - **Match Bridge Suppression**: "Запиши като мач" is strictly hidden in Generic mode.

## Consequences

### Positive
- **Clean Separation of Concerns**: Tennis logic (ELO ratings, format constraints, match bridge) is completely decoupled from Generic team generation.
- **PO Specification Alignment**: All Bulgarian coaching prompts, warning banners, toasts, and UI labels strictly adhere to requirements.
- **Robust Test Coverage**: 36 test suites (327 tests passing at 100%) verify all edge cases, rating isolation, and multi-mode workflows.
- **Future Compatibility**: Lays a clean foundation for Stage 2 & 3 club workflows without architectural debt.

### Negative
- Slightly more complex state management in `useTeamGenerator` and UI components to handle conditional validation rules per mode.
