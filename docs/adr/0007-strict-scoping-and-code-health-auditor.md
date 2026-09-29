# ADR 0007: Strict Feature Scoping & Dedicated Code Health Auditor

* **Status:** Accepted
* **Date:** 2026-09-30
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer, Code Health Auditor
* **Consulted:** Project Guidelines (`GEMINI.md`), Architecture Specifications (`2_architecture.md`), Role Definitions (`.agents/roles/`)

---

## 1. Context and Problem Statement

Opportunistic refactoring during feature development causes diff pollution, increases regression risks, and complicates code reviews. At the same time, technical debt and code health must be managed systematically.

When autonomous or human engineers engage in "while-I-am-here" drive-by refactoring or formatting changes, PR diffs become cluttered with unrelated file touches. This dilutes the signal for code reviewers, bypasses localized test boundaries, and complicates `git bisect` or rollback procedures if a bug is introduced.

At the same time, codebases accumulate technical debt—such as duplicate Tailwind utility clusters, unmemoized expensive calculations, untyped `any` signatures, and dead code. Banning drive-by refactoring without providing a structured discovery mechanism risks stagnation and growing debt.

---

## 2. Decision Drivers

* **Zero Diff Pollution:** Ensure every PR contains solely the code strictly necessary to fulfill the ticket's stated acceptance criteria.
* **Review Velocity and Clarity:** Facilitate quick, confident diff reviews by Code Reviewers without noise or unrelated edits.
* **Systematic Debt Management:** Proactively identify code smells, performance bottlenecks, and weak types on an explicit, scheduled or on-demand cadence.
* **Safe Isolation:** Guarantee that refactoring efforts occur on dedicated `refactor/` or `chore/` branches with focused regression suites.

---

## 3. Decision

1. **Enforce Strict Feature Scoping Across Core Engineering Roles:**
   - **Senior Dev:** Must only modify files explicitly required to implement the current ticket's requirements. DO NOT touch, reformat, refactor, or "clean up" files or code outside the ticket boundary. Pre-commit diff verification is mandatory.
   - **Code Reviewer:** Mandated to reject any PR that includes modifications outside the defined feature scope or contains unrelated code cleanups and formatting changes.
   - **Architect:** Must maintain componentization and abstraction strictly within feature boundaries and refrain from proposing cross-feature refactoring during feature design phases.
2. **Introduce Dedicated Read-Only Code Health Auditor:**
   - A specialized agent role (`code-health-auditor`, Tier: `flash`) that conducts read-only static analysis scans.
   - Strictly prohibited from directly modifying, creating, or deleting application production code (ZERO production edits).
   - Scans 5 key focus areas:
     1. Duplicate Tailwind class clusters / UI componentization candidates.
     2. Performance bottlenecks (missing memoization, expensive loops).
     3. Dead code / unreachable code.
     4. Weak TypeScript typings (`any` types, missing interfaces).
     5. Test suite health, quality, and coverage gaps (untested modules, skipped tests, missing boundary assertions).
3. **Manual Trigger & Proposal-to-Ticket Workflow:**
   - The Code Health Auditor is triggered manually by user prompt (`@code-health-auditor Run a code health audit...`).
   - Audit findings are compiled into `docs/proposals/code-health-YYYY-MM-DD.md`.
   - The user selects approved recommendations and creates isolated `refactor/` or `chore/` tickets, executing them through the standard scoped development lifecycle.

---

## 4. Consequences

### Positive
- **Clean, Predictable Diffs:** Code reviews are fast, focused, and free from incidental modifications.
- **Lower Regression Risk:** Changes are tightly encapsulated to the feature under test.
- **Transparent Debt Tracking:** Technical debt is cataloged with concrete locations and proposals in version-controlled documents (`docs/proposals/`).
- **Auditable Quality Improvements:** Refactoring is executed with deliberate tickets, automated test accompanying development, and full peer review.

### Negative
- **Discipline Overhead:** Requires engineers and agents to resist opportunistic "quick fixes" while working on features.
- **Ticketing Overhead:** Requires spawning separate branches and tickets for cleanups rather than committing them in-line.
