# 0052. Domain Type Unification & Mobile Touch Targets

- **Status:** Accepted
- **Date:** 2026-11-03
- **Branch:** `refactor/types-and-mobile-touch-targets`

## Context & Problem Statement
The legacy codebase contained tightly coupled rating structures (`rating: number`, `singles_rating`, `doubles_rating`) across domain types (`Player`, `MatchPlayer`, `RankingStats`), often forcing synthetic fallback defaults (e.g. `?? 1200`) into ranking hooks even when players had no match history. Furthermore, mobile touch targets across modal close buttons (`X`), player card action buttons, and tournament stepper buttons fell short of the WCAG 2.1 SC 2.5.5 minimum 44x44px interactive bounding box requirement.

## Decision Drivers
1. **Model Cleanliness:** Make rating fields optional (`rating?: number`) across all domain models and remove artificial `1200` rating injection in `useRankings.ts`.
2. **Simplified CRUD Signatures:** Streamline player creation and update mutations (`createPlayer(name: string)`, `updatePlayer(id: string, name: string)`) while relying on Supabase schema defaults (`1200.00`).
3. **Accessibility Compliance (WCAG 2.1 SC 2.5.5):** Upgrade all modal close buttons and mobile interactive buttons across the application to a minimum of 44x44px with proper Bulgarian `aria-label` attributes.
4. **Test Suite Robustness:** Ensure 100% test pass rate across 923 unit and integration tests with zero typecheck or lint errors.

## Considered Options
1. *Keep synthetic defaults and manual rating injection.* (Rejected: pollutes pure sports standings calculation with arbitrary rating defaults).
2. *Retain small 24px/32px modal close buttons.* (Rejected: fails touch ergonomics and accessibility standards on mobile viewports).

## Decision Outcome
- **Accepted.** Domain types were unified, rating optionality was established, mutation APIs were streamlined, and all modal close buttons and mobile touch action targets were successfully upgraded to 44x44px (`min-w-[44px] min-h-[44px]`).
