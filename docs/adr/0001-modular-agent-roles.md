# ADR 0001: Modular Agent Roles and Protocols Architecture

* **Status:** Accepted
* **Date:** 2026-09-29
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** Project Guidelines (`GEMINI.md`)

---

## 1. Context and Problem Statement

Initially, all AI agent instructions, operational rules, Git branching and pull request guidelines, language constraints, and 6 distinct agent role specifications (Orchestrator, Planner, Architect, Senior Developer, Code Reviewer, Document Writer) were aggregated within a single, monolithic [GEMINI.md](file:///D:/Projects/team-generator/GEMINI.md) file.

This monolithic approach presented several key challenges:
1. **Context Window Inefficiency:** Individual agents were required to ingest a bloated master document containing extensive instructions irrelevant to their scoped tasks.
2. **Weak Role Boundaries:** Monolithic guidelines made strict behavioral enforcement and negative constraints harder to isolate per agent execution step.
3. **Maintainability Friction:** Modifying or extending a single role's workflow or adding a shared protocol required modifying the root rule file, increasing the risk of unintended protocol drifts or regressions.

---

## 2. Decision Drivers

* **Separation of Concerns:** Separate global operational rules (protocols) from role-specific mandates and schemas.
* **Token & Context Optimization:** Enable agents to focus on their designated role contract and immediate handoff artifacts.
* **Strict Boundary Enforcement:** Establish clear negative constraints (e.g. Code Reviewer cannot edit code; Senior Dev cannot modify architectural designs; Document Writer cannot modify application logic).
* **Deterministic Handoff Lifecycle:** Ensure traceable transitions and persistent audit trails through structured handoff artifacts (`0_context.md` through `5_documentation.md`).
* **Preservation of Non-Negotiable Rules:** Preserve the universal English requirement and strict Git branch flow (`main` -> `dev` -> `feature/fix`).

---

## 3. Considered Options

1. **Keep Monolithic `GEMINI.md`:** Maintain all instructions in one file.
   * *Rejected:* Unscalable as team roles and architectural rules expand.
2. **Partial Modularization (Inline Roles with External Protocols):** Keep role definitions in `GEMINI.md` but extract Git and language rules into separate files.
   * *Rejected:* Does not solve the role boundary ambiguity or prompt bloat for individual agents.
3. **Full Modular Architecture (`.agents/` Directory Structure):** Decompose the system into `.agents/protocols/` (shared invariants), `.agents/roles/` (role contracts), and a streamlined root [GEMINI.md](file:///D:/Projects/team-generator/GEMINI.md) hub.
   * *Accepted:* Delivers complete decoupling, clear role schemas, and clean architectural alignment.

---

## 4. Decision

We have transitioned the agent operating model into a modular `.agents/` ecosystem:

```
team-generator/
├── .agent_handoffs/
│   └── <branch_name>/
│       ├── 0_context.md
│       ├── 1_plan.md
│       ├── 2_architecture.md
│       ├── 3_implementation.md
│       ├── 4_review.md
│       └── 5_documentation.md
├── .agents/
│   ├── protocols/
│   │   ├── git-workflow.md
│   │   ├── handoff-protocol.md
│   │   └── language.md
│   └── roles/
│       ├── architect.md
│       ├── code-reviewer.md
│       ├── document-writer.md
│       ├── orchestrator.md
│       ├── planner.md
│       └── senior-dev.md
├── docs/
│   └── adr/
│       └── 0001-modular-agent-roles.md
└── GEMINI.md (Root Orchestration Hub)
```

### Key Elements of the Decision:
1. **Core Protocols (`.agents/protocols/`):**
   * [language.md](file:///D:/Projects/team-generator/.agents/protocols/language.md): Universal English language requirement across all interactions, reasoning, tools, and code comments.
   * [git-workflow.md](file:///D:/Projects/team-generator/.agents/protocols/git-workflow.md): Git branching SOP (`main` -> `dev` -> `feature/fix`), pull requests targeting `dev`, and git worktree isolation.
   * [handoff-protocol.md](file:///D:/Projects/team-generator/.agents/protocols/handoff-protocol.md): Sequential artifact chaining contract in `.agent_handoffs/<branch_name>/`.
2. **Modular Role Contracts (`.agents/roles/`):**
   * Each role adheres to a standardized 7-section schema: Identity & Purpose, Shared Protocols Reference, Inputs & Prerequisites, Core Responsibilities, Strict Constraints & Boundaries, Output Artifact Contract, and Next Transition.
3. **Refactored Root Hub ([GEMINI.md](file:///D:/Projects/team-generator/GEMINI.md)):**
   * Acts as a concise entry point indexing core protocols, referencing role definitions, and enforcing user consent guardrails before merge.

---

## 5. Consequences

### Positive
* **Clear Role Boundaries:** Strict negative constraints are codified directly within each role contract, preventing unauthorized code modification or architecture deviations.
* **Deterministic Auditability:** Execution steps leave standard handoff artifacts (`0_context.md` through `5_documentation.md`), making multi-agent workflows transparent and auditable.
* **Maintainability & Extensibility:** New roles or modified protocols can be added or updated independently without breaking existing configurations.
* **Reduced Prompt Overhead:** Subagents only need to load the root hub, their specific role specification, and the required handoff artifacts.

### Negative / Trade-offs
* **File Management Overhead:** Developers and agents must maintain multiple documentation files and ensure relative paths remain aligned across specifications.
* **Strict Discipline Requirement:** Roles must rigorously adhere to their input/output contracts to avoid breaking the sequential handoff chain.

---

## 6. References
* [GEMINI.md](file:///D:/Projects/team-generator/GEMINI.md)
* [.agents/protocols/git-workflow.md](file:///D:/Projects/team-generator/.agents/protocols/git-workflow.md)
* [.agents/protocols/handoff-protocol.md](file:///D:/Projects/team-generator/.agents/protocols/handoff-protocol.md)
* [.agents/protocols/language.md](file:///D:/Projects/team-generator/.agents/protocols/language.md)
* [2_architecture.md](file:///D:/Projects/team-generator/.agent_handoffs/feature/modular-agent-roles/2_architecture.md)
* [4_review.md](file:///D:/Projects/team-generator/.agent_handoffs/feature/modular-agent-roles/4_review.md)
