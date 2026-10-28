# 0042. Mobile Viewport and Safe Area Ergonomics

## Status
Accepted

## Context
With the expansion of mobile usage on small-to-mid range devices (360px–430px viewports) across modern iOS and Android operating systems, several ergonomic and layout clipping issues were identified:
1. **System Bar & Home Indicator Occlusion**: Devices with home gesture bars (iOS Home Indicator, Android gesture bar) caused content at the bottom of the page to collide with or tuck under the fixed mobile bottom navigation bar (`MobileNav`).
2. **Horizontal Overflow on 360px Screens**: Two key control bars (`TeamSettings` formation mode selector and `MatchesPage` custom date filter) relied on inflexible horizontal flex containers that overflowed on narrow viewports ($< 380$px).
3. **Virtual Keyboard Occlusion in Modals**: In `PlayerModal`, opening on-screen virtual keyboards on mobile devices squeezed the available screen real estate, obscuring form controls and action buttons (`Отказ` / `Запази` / `Създай`) without a vertical scroll containment boundary.

## Decision
1. **Native CSS Safe Area Utilities & Dynamic AppShell Bottom Padding**:
   - Added standard safe-area utility classes (`.safe-area-bottom` and `.safe-area-top`) under `@layer utilities` in `src/assets/styles/index.css` consuming `env(safe-area-inset-*, 0px)`.
   - Updated the `<main>` container in `src/components/layout/AppShell.tsx` to utilize dynamic bottom padding:
     `pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8`.
   - Guaranteed an 8px visual buffer above the fixed 64px `MobileNav` across all gesture bar heights while reverting cleanly to desktop padding on `md:` breakpoints.

2. **Responsive CSS Grids for Tight Selectors**:
   - Refactored the formation mode selector in `src/components/team/TeamSettings.tsx` to a responsive CSS grid (`grid grid-cols-1 sm:grid-cols-2 gap-1 w-full sm:w-auto`) with full-width buttons (`w-full`), ensuring seamless stacking on 360px screens.
   - Refactored the custom date filter range in `src/pages/MatchesPage.tsx` to a 2-column responsive grid (`grid grid-cols-2 gap-2 w-full sm:w-auto`) with flexible min-width inputs (`w-full min-w-0`), preventing layout breakage on mobile.

3. **Dynamic Viewport Height & Scroll Containment for Modals**:
   - Configured `src/components/player/PlayerModal.tsx` dialog container with `max-h-[90dvh]` and `overflow-y-auto`, ensuring form fields and CTA buttons remain accessible even when virtual keyboards occupy up to 50% of the screen.

## Consequences
- **Positive**:
  - Full compliance with native iOS/Android safe area insets without hardcoded pixel compromises.
  - Zero horizontal overflow or text clipping on narrow 360px viewports.
  - Guaranteed access to modal actions under virtual keyboard activation.
  - 100% backwards compatibility with existing state management, props, and Bulgarian UI text.
- **Negative**:
  - Minor increase in CSS utility footprint in `index.css`.
