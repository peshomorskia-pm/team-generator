# ADR 0003: React 19, TypeScript, Vite, Tailwind CSS, and Vitest Stack Selection

* **Status:** Accepted
* **Date:** 2026-09-29
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** Project Guidelines (`GEMINI.md`), Technical Architecture (`2_architecture.md`)

---

## 1. Context and Problem Statement

The `team-generator` project originated as a lightweight prototype built with vanilla HTML, CSS, and plain JavaScript. As the application expanded to support advanced player balancing (LPT greedy algorithms), deterministic history fingerprinting for anti-repetition, dynamic team settings, theme toggling, clipboard formatting, and planned persistence via Supabase, the monolithic vanilla script approach exhibited significant limitations:
1. **Lack of Type Safety:** Dynamic runtime errors, untyped player ratings, and implicit props made refactoring fragile.
2. **UI Scalability:** Managing complex DOM updates, modal states, player input tags, and responsive layouts in vanilla JS led to verbose boilerplate.
3. **Testing & Quality Control:** Absence of automated unit tests and static type checking increased the risk of regressions during algorithm tuning.
4. **Build & Bundling Overhead:** Lack of an optimized asset pipeline restricted modern componentization and fast HMR feedback loops.

---

## 2. Decision Drivers

* **Type Safety & Maintainability:** Adopt static typing via TypeScript (`strict: true`) to catch interface mismatches, ensure clean component contracts, and prevent runtime null/undefined errors.
* **Component-Driven Architecture:** Leverage React 19 for modular, reactive UI composition (`src/components/`, `src/hooks/`).
* **High Performance Tooling:** Utilize Vite for instant Hot Module Replacement (HMR) and optimized production bundling.
* **Utility-First Styling:** Adopt Tailwind CSS for responsive, maintainable styling adhering to the dark theme design system.
* **Rigorous Quality Assurance:** Integrate Vitest for fast unit testing of pure algorithms (Fisher-Yates shuffle, LPT balance, history fingerprinting), ESLint for linting, and `tsc` for type-checking.
* **Backend Readiness:** Establish a robust foundation ready for Supabase integration (match history, player ELO, leaderboards).

---

## 3. Considered Options

1. **Retain Vanilla JavaScript / HTML:**
   * *Rejected:* Unscalable for complex state management, algorithmic enhancements, and robust test suites.
2. **React 18 + Create React App (CRA) / Webpack:**
   * *Rejected:* CRA is deprecated; Webpack configuration is slow and bloated compared to modern Vite tooling.
3. **React 19 + TypeScript + Vite + Tailwind CSS + Vitest:**
   * *Accepted:* Delivers cutting-edge React 19 capabilities, lightning-fast Vite build times, robust TypeScript checking, utility styling, and native Vitest execution.

---

## 4. Decision

We have officially migrated the codebase to a modern React 19 + TypeScript + Vite + Tailwind CSS + Vitest stack alongside Supabase integration.

### Technology Stack Summary:
* **Framework:** React 19 (`react`, `react-dom`)
* **Language:** TypeScript 5.9 (Strict mode enabled, `npm run typecheck`)
* **Build Tool:** Vite 8 (`npm run dev`, `npm run build`)
* **Styling:** Tailwind CSS 3 & PostCSS (`src/assets/styles/`)
* **Icons:** Lucide React (`lucide-react`)
* **Testing:** Vitest (`npm test`, 100% test pass rate across shuffle, balance, and history suites)
* **Linting:** ESLint (`npm run lint`)
* **Backend/Database:** Supabase (`supabase`)

---

## 5. Consequences

### Positive
* **100% Type Safety:** Strict TypeScript interfaces across all components (`TeamCard`, `TeamSettings`, `PlayerInput`), hooks (`useTeamGenerator`), and utility functions.
* **Blazing-Fast Development:** Vite provides near-instant server start and sub-millisecond HMR updates.
* **Tested Pure Logic:** Comprehensive unit test suite in Vitest guarantees reliability of core balancing and shuffle algorithms.
* **Modular Codebase:** Clean separation of concerns into `src/components/`, `src/hooks/`, `src/utils/`, and `src/types/`.

### Negative / Trade-offs
* **Build Pipeline Complexity:** Introduction of Node.js tooling, TypeScript compilers, and bundlers replaces zero-config HTML/JS.
* **Learning Curve:** Developers must adhere to React 19 hooks patterns and TypeScript strict typing rules.

---

## 6. References
* [React 19 Documentation](https://react.dev/)
* [Vite Documentation](https://vite.dev/)
* [TypeScript Documentation](https://www.typescriptlang.org/)
* [Vitest Documentation](https://vitest.dev/)
* [Technical Architecture Specification (`2_architecture.md`)](file:///D:/Projects/team-generator/.agent_handoffs/feature/setup-react-typescript-stack/2_architecture.md)
