# Protocol: Dual-Language Boundary Protocol

## 1. Overview & Objective
This protocol establishes the formal Dual-Language Boundary across the codebase, multi-agent interactions, documentation, and the application interface. It delineates engineering-layer communication from end-user UI presentation to eliminate confusion and maintain strict quality standards.

## 2. Engineering Layer (Strictly English)
* **Scope:** Source code identifiers (variables, types, functions, classes, components, files), directory names, internal documentation (`docs/`, `.agents/`, `README.md`, `GEMINI.md`), code comments, docstrings, terminal commands, commit messages, pull requests, automated test cases, agent reasoning, and developer/agent interactions.
* **Rule:** ALL internal engineering communication, artifacts, and codebase infrastructure MUST strictly be written in English.
* **Enforcement:** 
  - Code reviews must audit diffs and reject any pull request, code comment, or identifier using non-English text.
  - Agents must conduct all reasoning and messaging strictly in English, even when prompted in another language.

## 3. Application UI Layer (Bulgarian)
* **Scope:** Any text rendered to the end-user on the user interface, including buttons, form labels, input placeholders, toasts, modal dialogs, status badges, and error messages displayed directly to users.
* **Rule:** The primary target language for the application user interface is Bulgarian. UI copy and user-facing strings must remain in Bulgarian.
* **Enforcement:** 
  - Developers and Code Reviewers must not flag, "correct", or translate valid Bulgarian UI text into English.
  - UI copy must maintain natural, idiomatic Bulgarian suited for sports/team balancing workflows.

## 4. Distant-Future i18n Roadmap & Negative Constraints
* **Roadmap:** English UI localization and multi-language internationalization (i18n) frameworks are designated as distant-future, low-priority roadmap items.
* **Strict Negative Constraints:**
  - **NO Premature i18n Frameworks:** DO NOT introduce or install i18n libraries (such as `react-intl`, `i18next`, `next-i18next`, etc.) prematurely.
  - **NO Translation Wrappers or Key Lookups:** DO NOT refactor or replace hardcoded Bulgarian UI strings with translation keys, dictionaries, or wrapper abstraction components until explicitly instructed in a future architectural roadmap.
  - Keep the application code direct, simple, and dependency-light.

## 5. Compliance & Audit Checklist
1. Identifiers, logic, comments, and tests are 100% in English.
2. User-facing text rendered in components is in Bulgarian.
3. No foreign dependencies or dictionary abstractions exist for i18n.
4. Any violation detected during review requires remediation before merge.
