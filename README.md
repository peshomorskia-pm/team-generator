# Team Generator

A lightweight Single Page Application (SPA) for randomly assigning players to teams. Built with HTML, vanilla JavaScript, and Tailwind CSS.

---

## Core Features

* **Advanced Shuffling:** Uses the Fisher-Yates algorithm for fair distribution.
* **State Memory:** Prevents generating the exact same team configurations consecutively.
* **Upcoming:** Backend integration via a local Supabase (PostgreSQL) stack to track match history, player ELO ratings, and performance statistics.

---

## Architecture & Agent Ecosystem

This repository employs a modular, multi-agent engineering lifecycle managed by specialized AI agent roles. Global protocols, role definitions, and architectural decisions are codified under dedicated directories:

### Directory Structure
```
team-generator/
├── .agents/
│   ├── protocols/          # Universal system rules & workflow standards
│   │   ├── git-workflow.md
│   │   ├── handoff-protocol.md
│   │   └── language.md
│   └── roles/              # Role contracts and boundary definitions
│       ├── architect.md
│       ├── code-reviewer.md
│       ├── document-writer.md
│       ├── orchestrator.md
│       ├── planner.md
│       └── senior-dev.md
├── docs/
│   └── adr/                # Architecture Decision Records
│       └── 0001-modular-agent-roles.md
├── GEMINI.md               # Master orchestration entry point and protocol index
├── index.html              # Main application entry point
├── js/                     # Application scripts and logic
└── README.md
```

### Agent Roles & Lifecycle
The agent execution follows a deterministic, sequential handoff lifecycle coordinated via `.agent_handoffs/<branch_name>/`:
1. **[Orchestrator](.agents/roles/orchestrator.md):** Coordinates requests, verifies Git SOP, and initializes context (`0_context.md`).
2. **[Planner](.agents/roles/planner.md):** Analyzes requirements and formulates high-level execution objectives (`1_plan.md`).
3. **[Architect](.agents/roles/architect.md):** Defines file structures, interfaces, and technical contracts (`2_architecture.md`).
4. **[Senior Dev](.agents/roles/senior-dev.md):** Implements code conforming strictly to architectural specifications (`3_implementation.md`).
5. **[Code Reviewer](.agents/roles/code-reviewer.md):** Independently audits changes and renders approval verdicts (`4_review.md`).
6. **[Document Writer](.agents/roles/document-writer.md):** Drafts documentation, updates ADRs, and opens Pull Requests targeting `dev` (`5_documentation.md`).

For full details on agent protocols and operating guidelines, refer to [GEMINI.md](GEMINI.md) and [ADR 0001: Modular Agent Roles and Protocols Architecture](docs/adr/0001-modular-agent-roles.md).

---

## Development & Git Workflow

* **Base Branch:** `main` (Production)
* **Integration Branch:** `dev` (Agent Development target)
* **Working Branches:** `feature/<name>` or `fix/<name>` branched from `dev`
* **Pull Requests:** All PRs must target `dev`. Direct merges to `main` are restricted.
* **Language Requirement:** All communications, reasoning, documentation, and code comments must strictly be in English.
