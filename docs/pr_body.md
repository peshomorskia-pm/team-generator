## Summary
Implements global App Shell layout, client-side routing, and landing page architecture for the Team Generator SPA.

### Key Changes:
1. **Client-Side Routing (`react-router-dom` v7):**
   - Configured route tree for `/` (Landing), `/generator` (Team Generator), `/players`, `/matches`, `/rankings` (placeholders), and `*` (404 Not Found).
2. **Responsive App Shell (`AppShell`, `Navbar`, `MobileNav`):**
   - Sticky desktop top bar and fixed mobile bottom navigation bar with active route highlighting (`NavLink`) and responsive padding (`pb-20 md:pb-8`).
3. **Theme Management (`ThemeContext`, `useTheme`):**
   - Light/dark mode state persisted in `localStorage` and synchronized with `document.documentElement.classList` and system preferences.
4. **Landing Page Experience (`LandingPage`):**
   - Feature-rich landing hero section, visual team balancing simulator graphic, 3 key feature cards, and bottom CTA banner.
5. **Documentation & ADR 0005:**
   - Authored ADR 0005, updated `README.md`, and generated execution handoff report `5_documentation.md`.

### Verification:
- All 15 unit tests pass (`npm test`).
- Typecheck (`tsc --noEmit`), linting (`eslint`), and production build (`vite build`) complete with zero errors.
