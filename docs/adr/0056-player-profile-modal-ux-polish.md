# Architectural Decision Record (ADR-0056): Player Profile Modal UX Polish & Tournament Name Resolution

## Metadata
- **Status:** Accepted
- **Ticket:** Player Profile Modal UX Polish (`fix/player-profile-modal-polish`)
- **Date:** 2026-11-04
- **Branch:** `fix/player-profile-modal-polish`
- **Target Branch:** `dev`

---

## Context & Problem Statement
The player profile modal (`PlayerProfileModal.tsx`) serves as the comprehensive analytics and history view for individual players across doubles and singles formats. Prior to this enhancement, several UX inconsistencies, redundant UI elements, and localization issues existed:
1. **Header Clutter:** The top header container contained rank badges and a form strip alongside the player avatar, name, and close button, violating clean modal header design patterns.
2. **Tab Inefficiencies:** Three tabs (`"all"`, `"doubles"`, `"singles"`) created redundant calculations and bloated navigation. Furthermore, the `"all"` tab lacked a clear contextual sub-header indicating format-specific rankings and recent form.
3. **Cryptic Chemistry Formatting:** Favorite partner and rival cards displayed rigid, cryptic strings such as `(4П - 0З, 100%)` instead of natural Bulgarian phrasing.
4. **Raw UUID Exposure & Disconnected Tournament Data:** Tournament names were frequently unresolved or missing in `RankingsPage` and `PlayersPage`, resulting in raw UUID exposure or fallback to generic text.
5. **Timeline Badge Noise:** The match timeline included a noisy `"Приятелска среща"` badge and redundant secondary tournament indicators.

---

## Decision
We implement a comprehensive UX polish and tournament data connection across the player profile ecosystem:

1. **Header Simplification:**
   - Purged rank badges and top form strip from the modal header container.
   - Retained exclusively the player avatar (`data-testid="player-avatar"`), player name (`h2#player-profile-title`), and the 44x44px touch-target close button (`aria-label="Затвори"`).

2. **Two-Format Tab Architecture & Context Bar:**
   - Restricted tabs strictly to `'doubles'` and `'singles'` (defaulting to `'doubles'`), completely eliminating the `"all"` tab.
   - Introduced a dedicated format context sub-header bar (`data-testid="format-context-bar"`) rendering the active format's rank badge (e.g. `#{rank} по двойки` / `#{rank} поединично` or `"Нов"` for unranked players) and the active 5-match `FormBadge` sequence.

3. **Natural Bulgarian Partner & Rival Phrasing:**
   - Replaced cryptic match stats with natural Bulgarian inflected strings via `formatRecordSummary`:
     `{count} {count === 1 ? 'мач' : 'мача'} • {wins} {wins === 1 ? 'победа' : 'победи'}, {losses} {losses === 1 ? 'загуба' : 'загуби'}`.
   - Ensured robust pluralization handling across 1 vs. multiple matches, wins, and losses.

4. **Tournament Data Connection & UUID Suppression:**
   - Hooked `useTournaments()` in both `RankingsPage.tsx` and `PlayersPage.tsx`, passing tournament maps into `PlayerProfileModal`.
   - Implemented `resolveTournamentName` helper to format clean titles (`"Турнир ({formattedDate})"` or `"Турнир"`) and strictly suppress raw UUID exposure.

5. **Timeline & Championship Badge Streamlining:**
   - Eliminated the redundant `"Приятелска среща"` badge.
   - Consolidated tournament match badges into a single clean indicator `{tournamentName} • {stageLabel}` (or `{tournamentName}`).
   - Friendly matches display zero tournament badges.

---

## Consequences
- **Positive:**
  - Exceptional mobile and desktop UX with uncluttered headers and clear contextual rank/form bars.
  - 100% natural Bulgarian localization across all partner chemistry cards, match timelines, and stat grids.
  - Zero raw UUID leakage across rankings and player history views.
  - Fully verified test suite (48/48 profile and utils tests passing, 70/70 test suites overall).
- **Negative / Trade-offs:**
  - Requires callers (`RankingsPage`, `PlayersPage`) to pass active tournaments down to `PlayerProfileModal`, managed cleanly via custom hooks.
