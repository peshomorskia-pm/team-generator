# Architectural Decision Record: Player Profile Navigation & Integration

## Status
Accepted

## Context
Phase 3 requires establishing end-to-end interactive player profile navigation across both the Rankings (`/rankings`) and Players (`/players`) directories. Users need the ability to click any player row or card (on both desktop and mobile layouts) to inspect a comprehensive sports record via `PlayerProfileModal`. Furthermore, management actions within the Players directory (Edit and Delete) must maintain strict event isolation, and keyboard accessibility (Enter/Space triggers) with Bulgarian localization must be fully supported.

## Decision
1. **Interactive Row & Card Bindings**:
   - Enhanced `RankingsTable` rows and `RankingsMobile` cards with `role="button"`, `tabIndex={0}`, `aria-label`, hover states, and keyboard event handlers (`onKeyDown` handling Enter and Space with `e.preventDefault()`).
   - Integrated `RankingsPage` with `useMatches` and rank mapping (`singlesRankMap`, `doublesRankMap` computed via `computePlayerSportsStats`) to seamlessly invoke `PlayerProfileModal`.
2. **Players Directory & Event Isolation**:
   - Updated `PlayersPage` desktop rows and mobile cards to support click-to-profile navigation.
   - Strictly isolated management action buttons (Edit `✏️`, Delete `🗑️`) using `e.stopPropagation()` to prevent profile modal leakage when performing CRUD operations.
3. **Accessibility & Localization**:
   - Implemented descriptive Bulgarian ARIA labels (`Преглед на профила на ...`, `Редактирай ...`, `Изтрий ...`) and badge semantics (`Нов`, `#{rank} поединично`, `#{rank} по двойки`).

## Consequences
- **Positive**: Complete UI and navigation parity across directories; robust keyboard and mobile touch support; zero regressions across 977 unit and integration tests.
- **Negative**: Slight increase in event handling complexity on rows/cards, mitigated cleanly with strict event propagation checks.
