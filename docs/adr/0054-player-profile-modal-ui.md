# ADR-0054: Player Profile Presentation Modal UI

## Status
Accepted

## Context
Phase 1 established the comprehensive player profile calculation engine (`calculatePlayerProfileData`, `calculatePlayerPartnerStats`, `calculatePlayerRivalStats`, `calculatePlayerTitles`) along with robust test coverage. To deliver a complete, professional user experience in tennis and tournament management workflows, we needed a dedicated presentation modal (`PlayerProfileModal.tsx`) that renders rich player statistics, rankings, form history, interactive format scoping tabs, specialty analytics cards (favorite partner, top rival, tournament trophies), and a chronological match timeline with 100% Bulgarian localized copy and mobile-optimized touch ergonomics.

## Decision
1. **Component Architecture (`PlayerProfileModal.tsx`)**:
   - Implemented as a polished modal dialog (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="player-profile-title"`) supporting backdrop dismissal, `Escape` key listener, and `max-h-[90dvh] overflow-y-auto` view constraints.
   - Accepts `isOpen`, `onClose`, and either `playerId` or direct `player` object with optional match list override.

2. **Format Scope Segmented Navigation**:
   - Features interactive tabs for **„Всички“** (default), **„По двойки“**, and **„Поединично“** with `role="tablist"` and `aria-selected` state.
   - Dynamically filters the summary metrics grid (`Изиграни`, `Победи`, `Загуби`, `Успеваемост`, `Геймова разлика`) and chronological match history.

3. **Specialty Analytics & Trophies**:
   - **Partner Card („Любим партньор“)**: Highlights tandem stats and win rate percentage, with a clean empty state fallback (`Няма изиграни мачове по двойки`).
   - **Rival Card („Най-чест съперник“)**: Highlights head-to-head encounter stats, with friendly fallback (`Няма регистрирани съперници`).
   - **Tournament Trophies („🏆 Титли“)**: Displays championship badges when titles exist, seamlessly hiding when 0 titles are won.

4. **Chronological Perspective Match Timeline**:
   - Renders formatted match cards in descending date order (`bg-BG` locale), displaying context (`Приятелска среща` or tournament title), stage badge (`Финал`, `Полуфинал`, `1/4-финал`, `Групова фаза`), outcome pill (`Победа` / `Загуба`), partner/opponents, and game score with perspective highlighting.

5. **Accessibility & Mobile Touch Ergonomics**:
   - All interactive touch targets (close button, tabs, backdrop) enforce minimum `44x44px` dimensions.
   - Strict adherence to the Dual-Language Boundary Protocol with 100% Bulgarian copy and zero untranslated strings.

## Consequences
- **Positive**: Delivers an engaging, transparent player analytics dashboard accessible from any player list or match card across the application.
- **Negative / Trade-offs**: Requires rich match history data for optimal display; handled gracefully via comprehensive empty states for brand new unranked players.
