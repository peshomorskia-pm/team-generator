# ADR 0004: Localization and Language Boundary

* **Status:** Accepted
* **Date:** 2026-09-29
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** Project Guidelines (`GEMINI.md`), Dual-Language Protocol (`.agents/protocols/language.md`)

---

## 1. Context and Problem Statement

The `team-generator` project operates with an international, agent-driven engineering workflow where all internal communication, reasoning, technical documentation, code comments, and automated tests are conducted in English. At the same time, the primary end-user audience for the web application is Bulgarian-speaking sports teams and organizers.

Previously, lack of explicit delineation led to ambiguity:
1. **Agent Confusion:** AI agents and developers were uncertain whether user-facing UI strings should be written in English or Bulgarian.
2. **Review Friction:** Reviewers risked flagging legitimate Bulgarian UI text as violations of the strict English language policy.
3. **Risk of Over-Engineering:** Premature introduction of complex internationalization (i18n) libraries (e.g., `react-intl`, `i18next`, or external translation dictionaries) would inflate dependency weight, overhead, and architectural complexity before multi-language support is truly required.

---

## 2. Decision Drivers

* **Clarity of Separation:** Establish a strict, unambiguous boundary between the Engineering Layer and the Application UI Layer.
* **Frictionless Review:** Enable code reviewers and agents to quickly distinguish valid Bulgarian UI copy from forbidden non-English code comments or identifiers.
* **Simplicity & Dependency-Light Design:** Prevent premature abstraction and unnecessary third-party libraries while the application serves a focused primary user base.
* **Preservation of English Engineering Standards:** Ensure 100% of code identifiers, commit messages, tests, handoff artifacts, and architecture specifications remain in English.

---

## 3. Considered Options

1. **Strict Monolingual English Across Stack & UI:**
   * Require all UI copy to be English as well.
   * *Rejected:* Incompatible with target user base requirements and local community adoption.
2. **Immediate Full i18n Abstraction (`i18next` / `react-intl`):**
   * Wrap all strings in translation keys, install translation libraries, and configure locale loaders.
   * *Rejected:* Premature optimization that adds bundle size, runtime complexity, and development friction when only Bulgarian is actively targeted.
3. **Dual-Language Boundary with Direct Bulgarian UI:**
   * Enforce English strictly across all engineering layers (code, tests, docs, reasoning) while keeping the UI directly localized in Bulgarian, with strict negative constraints against premature i18n wrappers.
   * *Accepted:* Delivers maximum simplicity, satisfies target user requirements, and maintains clean developer ergonomics.

---

## 4. Decision

We establish the **Dual-Language Boundary Protocol** ([`language.md`](file:///D:/Projects/team-generator/.agents/protocols/language.md)):

1. **Engineering Layer (Strictly English):**
   * All source code identifiers (variables, functions, types, components, files), docstrings, code comments, tests, git commits, PRs, architectural documentation (`docs/`), handoff artifacts (`.agent_handoffs/`), and agent interactions MUST strictly be in English.
2. **Application UI Layer (Bulgarian):**
   * All user-facing strings (labels, buttons, placeholders, modal messages, toast alerts) rendered to the end-user are localized in Bulgarian. Reviewers must not flag valid Bulgarian UI strings.
3. **Distant-Future i18n Roadmap & Negative Constraints:**
   * Multi-language UI support is deferred to a future roadmap.
   * **Strict Negative Constraint:** Agents and developers must NOT introduce i18n libraries or wrap strings in translation dictionaries prematurely.

---

## 5. Consequences

### Positive
* **Clear Separation of Concerns:** Eliminates ambiguity for agents and human contributors regarding language conventions.
* **Zero Review Friction:** Automated checks and reviewers will not reject or modify valid Bulgarian UI copy.
* **Lean Architecture:** Avoids premature library dependencies, translation boilerplate, and runtime overhead.
* **Consistent Codebase:** Preserves a uniform, English-only codebase and documentation foundation.

### Negative / Trade-offs
* **Deferred Refactoring:** Hardcoded Bulgarian UI strings will eventually require extraction into locale files when multi-language support is prioritized in the distant future.

---

## 6. References
* [Dual-Language Boundary Protocol](file:///D:/Projects/team-generator/.agents/protocols/language.md)
* [GEMINI.md](file:///D:/Projects/team-generator/GEMINI.md)
* [README.md](file:///D:/Projects/team-generator/README.md)
* [Architecture Specification (`2_architecture.md`)](file:///D:/Projects/team-generator/.agent_handoffs/feature/ui-localization-protocol/2_architecture.md)
