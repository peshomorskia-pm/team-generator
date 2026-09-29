# ADR 0005: App Shell, Client-Side Routing, and Theme Management Architecture

* **Status:** Accepted
* **Date:** 2026-09-29
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** Project Guidelines (`GEMINI.md`), Technical Specs (`2_architecture.md`)

---

## 1. Context and Problem Statement

The `team-generator` application initially started as a single-page view inside `src/App.tsx` where generator logic, state, and UI controls were concentrated in a single file. As the application expands to support future capabilities (player management, match tracking, league rankings), the system requires:
1. Client-side routing to navigate seamlessly without page reloads.
2. A unified, responsive layout shell (`AppShell`) providing persistent navigation on desktop and mobile viewports.
3. Centralized theme management (light/dark) persisted across sessions and applied globally to the DOM.
4. Clean separation of page views (`/`, `/generator`, `/players`, `/matches`, `/rankings`, `*`).

---

## 2. Decision Drivers

* **Navigation Fluidity:** Fast client-side routing compatible with React 19 SPA architecture without full reloads.
* **Responsive Layout Ergonomics:** Desktop top navigation bar combined with an intuitive mobile fixed bottom navigation bar avoiding UI clipping.
* **State Encapsulation:** Decouple global theme state from individual page controllers and persist preference cleanly in `localStorage`.
* **Clean Code Structure:** Extract feature views into dedicated page components under `src/pages/` while preserving existing generator functionality.
* **Dual-Language Boundary Compliance:** Keep all UI copy directly in Bulgarian while keeping architecture, code, and documentation in English.

---

## 3. Considered Options

1. **Hash-Based or Custom State Routing:**
   * Hand-roll tab/route switching with React state.
   * *Rejected:* Unscalable, lacks standard URL deep linking and browser history support.
2. **TanStack Router:**
   * Modern TypeScript-first routing solution.
   * *Rejected:* Adds larger surface area, code generation requirements, and overhead not needed for current project scope.
3. **`react-router-dom` (v7):**
   * Standard client-side routing library with declarative `Routes`, `Route`, `Outlet`, `NavLink`, and React 19 compatibility.
   * *Accepted:* Industry standard, straightforward integration, and battle-tested ecosystem.

---

## 4. Decision

We implemented:
1. **Routing:** Installed `react-router-dom` (v7) and configured the centralized route tree in `src/App.tsx` using `<BrowserRouter>`, wrapping child routes within `<AppShell>`.
2. **App Shell Architecture:**
   - Desktop (`md:` and above): Sticky top `Navbar` with logo, inline `NavLink` elements with active highlighting, and a theme toggle button.
   - Mobile (< `md`): Top minimal header with logo and theme toggle; fixed bottom `MobileNav` bar with Lucide icons and compact labels.
   - Main container with responsive padding (`pb-20 md:pb-8`) ensuring content does not collide with the fixed bottom bar.
3. **Theme Management:**
   - Created `ThemeContext` and `useTheme` hook with persistence under key `team_generator_theme` in `localStorage`.
   - Theme changes dynamically toggle the `dark` class on `document.documentElement` (`<html>`), enabling Tailwind's `dark:` utility variants globally.
   - Initial state gracefully falls back to system preference via `window.matchMedia('(prefers-color-scheme: dark)')`.
4. **Page Partitioning:**
   - Landing Page (`/`): Marketing hero, graphic visual representation of team balancing, 3 feature cards, and CTAs.
   - Generator Page (`/generator`): Preserved existing player input, team settings, and generation logic.
   - Placeholders (`/players`, `/matches`, `/rankings`): Consistent themed empty state placeholders in Bulgarian.
   - Not Found (`*`): 404 error page with action button back to home (`/`).

---

## 5. Consequences

### Positive:
* Extensible foundation for upcoming features (players database, match schedule, league rankings).
* Seamless responsive user experience across both desktop and mobile devices.
* Fast, flicker-free theme switching persisted in `localStorage`.
* Full compliance with the Dual-Language Boundary protocol.

### Negative / Trade-offs:
* Added `react-router-dom` dependency (~4 packages audited).
* Added route nesting requiring proper navigation tests.

---

## 6. References
* [`.agent_handoffs/feature/app-shell-routing-landing/2_architecture.md`](file:///D:/Projects/team-generator/.agent_handoffs/feature/app-shell-routing-landing/2_architecture.md)
* [`.agents/protocols/language.md`](file:///D:/Projects/team-generator/.agents/protocols/language.md)
* [`docs/adr/0004-localization-and-language-boundary.md`](file:///D:/Projects/team-generator/docs/adr/0004-localization-and-language-boundary.md)
