# Protocol: Strict English Language Policy

## 1. Overview & Objective
This protocol establishes the universal language policy for the entire repository, codebase, agent interactions, and documentation. Its objective is to maintain strict clarity, consistency, and standard compliance across all system components.

## 2. Core Rule
**ALL communication, internal reasoning, terminal commands, code comments, commit messages, documentation, and user-agent interactions MUST strictly be in English.**

## 3. Negative Constraints
* Under NO circumstances may any agent use Bulgarian, Spanish, or any language other than English.
* If a user prompts or asks a question in a language other than English (e.g., Bulgarian), the agent MUST acknowledge and respond strictly in English.
* Non-English text is strictly prohibited in:
  - Agent thought processes and reasoning
  - Agent messages and responses
  - Source code comments, docstrings, variable/identifier names, and commit messages
  - Handoff artifacts (`.agent_handoffs/`)
  - Project documentation (`docs/`, `README.md`, `GEMINI.md`)

## 4. Enforcement & Compliance
* **Code Reviewer Responsibility:** The Code Reviewer must audit diffs and reject any pull request, code change, or documentation containing non-English content.
* **Orchestrator Responsibility:** The Orchestrator must enforce the English-only policy when interfacing with the user and coordinating subagents.
* Any violation results in an immediate failure of validation, requiring remediation before proceeding.
