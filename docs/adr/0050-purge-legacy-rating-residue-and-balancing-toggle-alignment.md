# ADR 0050: Purge Legacy Rating Residue & Align Generator Balancing Toggle

- **Status:** Accepted
- **Date:** 2026-11-02
- **Branch:** `fix/purge-legacy-rating-residue`
- **Ticket:** Ticket 1

## Context & Problem Statement
Prior to this architecture decision, the application codebase contained residual legacy star ratings (`★`), numeric rating displays (e.g., Elo/EVAL numbers), and hardcoded rating fields (`displayTotalRating`) across various UI components (such as `GroupTeamPickerModal` and `MatchScheduleList`), clipboard export formatters, and landing page marketing copy. 

Furthermore, the team generation balancing toggle in `GeneratorPage` relied on outdated rating check logic that failed to synchronize with win-rate-based match history when generating teams for tennis and generic sports formats.

## Decision Drivers
1. **Consistency of Domain Model:** Transition fully away from legacy arbitrary star ratings / ELO numbers to win rate percentages (`{winRate}%`) and Bulgarian status badges (`Гост`, `Нов`).
2. **UI Polish & Localization:** Ensure 100% Bulgarian language compliance across all modals, schedule lists, clipboard templates, and landing page elements.
3. **Balancing Toggle Synchronization:** Align the generator balancing toggle with `resolvePlayerRating(player, format)` so registered players with match history correctly enable the balance switch.
4. **Preservation of Backwards Compatibility:** Retain database schema field definitions (`rating`, `singles_rating`, `doubles_rating`) until full schema migration in Ticket 3, avoiding premature database breaking changes.

## Considered Options
1. **Option A (Full Database Schema Purge Now):** Drop rating columns from Supabase schema immediately. *Rejected:* Violates scope boundaries for Ticket 1 and causes breaking migrations before Ticket 3.
2. **Option B (UI-Only Purge with Logic Synchronization):** Remove legacy rating chips from UI components, clipboard, and landing page, and synchronize `GeneratorPage` balancing toggle condition with `resolvePlayerRating`. *Accepted:* Clean, precise, and fully verified by test suites.

## Decision Outcome
- **Chosen Option:** Option B.
- **Implemented Changes:**
  - Removed `displayTotalRating` and star rating chips from `GroupTeamPickerModal.tsx` and `MatchScheduleList.tsx`.
  - Replaced numeric rating search query filtering with name-only search.
  - Synchronized `GeneratorPage.tsx` balancing toggle activation with `resolvePlayerRating`.
  - Updated clipboard formatters (`clipboard.ts`) to output win rate percentages and Bulgarian guest/new badges.
  - Modernized `LandingPage.tsx` marketing copy and mock player cards to display win rate percentages.
  - Updated `TeamSettings.tsx` toggle label to explicitly reference win rate percentage balancing.

## Positive Consequences
- Unified domain presentation: Win rates and Bulgarian status badges are consistently used across all player listings.
- Improved UX: Balancing toggle behaves correctly and intuitively based on player match history.
- Zero test regressions: All 69 test suites (927 tests) pass cleanly.

## Negative Consequences
- None identified.
