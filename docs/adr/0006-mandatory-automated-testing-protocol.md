# ADR 0006: Mandatory Automated Testing Protocol

* **Status:** Accepted
* **Date:** 2026-09-29
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** Project Guidelines (`GEMINI.md`), Architecture Specifications (`2_architecture.md`), Testing Protocol (`.agents/protocols/testing-protocol.md`)

---

## 1. Context and Problem Statement

The `team-generator` project operates under a multi-agent engineering lifecycle where multiple generations of autonomous agents create features, refactor components, and fix bugs. As the codebase expands across stateful React hooks, UI shells, algorithmic utilities, and Supabase integrations, unaccompanied code modifications introduce significant regression risks. Without strict, automated test guardrails, refactors authored by one agent generation can easily break behaviors established by previous generations without immediate detection.

A formalized, non-negotiable automated testing protocol is required to guarantee codebase stability, zero regressions, and reliable multi-agent collaboration.

---

## 2. Decision Drivers

* **Zero Regressions:** Continuous validation ensuring existing algorithmic logic (shuffling, greedy balancing, canonical history) and UI flows remain unbroken.
* **Agent System Guardrails:** Automated gates that prevent agent-authored PRs lacking verifiable test proof from advancing or merging.
* **Testing Pyramid Discipline:** Standardized testing strata (unit, hook, component, integration) to prevent both brittle over-testing and superficial under-testing.
* **Speed and Native Tooling:** Instantaneous feedback loops utilizing Vite native ESM compilation without cumbersome configuration.
* **Type Safety & Static Soundness:** Prevention of test suites bypassing TypeScript contracts or using hollow assertions.

---

## 3. Considered Options

1. **Ad-hoc / Optional Testing:**
   * Allow agents or developers to author tests only when deemed necessary.
   * *Rejected:* Consistently leads to untested code paths, compounding technical debt, and silent regression cascades across sequential agent turns.
2. **Jest / Enzyme:**
   * Traditional testing framework and enzyme shallow rendering.
   * *Rejected:* Slower execution, complex ESM/TypeScript transformation hurdles with modern Vite 6/React 19, and legacy component testing paradigms.
3. **Vitest + React Testing Library + jsdom:**
   * Modern, native Vite test runner with ESM and TypeScript support out of the box, paired with `@testing-library/react` and `@testing-library/jest-dom` for user-centric DOM interactions.
   * *Accepted:* Instantaneous test feedback, minimal configuration overhead, unified Vite config, and industry-standard user behavior assertions.

---

## 4. Decision

We establish the **Mandatory Automated Testing Protocol** ([`testing-protocol.md`](file:///D:/Projects/team-generator/.agents/protocols/testing-protocol.md)) governed by the following rules:

1. **Mandatory Test-Accompanied Development:**
   - Every new feature, logic adjustment, or bug fix MUST be accompanied by corresponding automated tests.
   - Code PRs lacking tests are automatically non-compliant and rejected at review.
2. **The Testing Pyramid:**
   - **Unit Tests:** Pure algorithmic functions, math utilities, and data transformers (`src/utils/`).
   - **Hook Tests:** Custom React business logic hooks tested via `@testing-library/react` (`src/hooks/`).
   - **Component Tests:** Interactive React components tested via user-event simulation (`src/components/`).
   - **Integration Tests:** Router page transitions and composite feature workflows (`src/pages/`).
3. **Tooling & Placement:**
   - Test Runner: **Vitest** (`npm test` / `vitest run`).
   - DOM & UI: `@testing-library/react` and `@testing-library/jest-dom` with `jsdom`.
   - File Placement: Tests reside adjacent to target files (`*.test.ts`/`*.test.tsx`) or within adjacent `__tests__/` directories.
4. **Mandatory Multi-Agent Responsibilities:**
   - **Planner:** Explicitly identifies test scopes and mandates test file deliverables in `1_plan.md`.
   - **Architect:** Specifies test blueprints, required mocks, and boundary test scenarios in `2_architecture.md`.
   - **Senior Dev:** Writes code and accompanying test suites, runs `npm test`, and logs 100% pass rates in `3_implementation.md`.
   - **Code Reviewer:** Audits diffs for missing tests, empty assertions, or skipped tests, rejecting non-compliant PRs in `4_review.md`.
   - **Document Writer:** Documents test suite presence, total test count, and pass rates in `5_documentation.md` and PR summaries.
   - **Orchestrator:** Blocks merges into `dev` or `main` if any test fails or pass rate is below 100%.

---

## 5. Consequences

### Positive:
* **High Confidence Refactors:** Agents and humans can refactor complex algorithms or UI hierarchies knowing the automated test suite will immediately flag breaking regressions.
* **Self-Documenting Code:** Tests serve as unambiguous living specifications for expected behavior, edge cases, and data schemas.
* **Deterministic Quality Gates:** Clear, objective pass/fail criteria (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`) eliminate subjective review guesswork.
* **Faster Root-Cause Analysis:** Failures are isolated to specific unit or component boundaries instantly during local verification.

### Negative / Trade-offs:
* **Initial Authoring Overhead:** Authoring test suites alongside code slightly increases token usage and implementation time per feature.
* **Mock Maintenance:** Changes to external interfaces (e.g. Supabase client) require updates to corresponding test mocks.

---

## 6. References
* [`.agents/protocols/testing-protocol.md`](file:///D:/Projects/team-generator/.agents/protocols/testing-protocol.md)
* [`.agent_handoffs/feature/automated-testing-protocol/2_architecture.md`](file:///D:/Projects/team-generator/.agent_handoffs/feature/automated-testing-protocol/2_architecture.md)
* [`GEMINI.md`](file:///D:/Projects/team-generator/GEMINI.md)
* [`README.md`](file:///D:/Projects/team-generator/README.md)
