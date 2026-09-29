# Team Generator

A lightweight Single Page Application (SPA) for randomly assigning players to teams. Built with HTML, vanilla JavaScript, and Tailwind CSS.

---

## Core Features

* **Advanced Shuffling:** Uses the Fisher-Yates algorithm for fair distribution.
* **State Memory:** Prevents generating the exact same team configurations consecutively.
* **Upcoming:** Backend integration via a local Supabase (PostgreSQL) stack to track match history, player ELO ratings, and performance statistics.

---

## Architecture & Agent Ecosystem

This repository employs a modular, multi-agent engineering lifecycle managed by specialized AI agent roles. Global protocols, role definitions, progressive disclosure skills, and architectural decisions are codified under dedicated directories:

### Directory Structure
```
team-generator/
├── .agents/
│   ├── protocols/          # Universal system rules & workflow standards
│   │   ├── git-workflow.md
│   │   ├── handoff-protocol.md
│   │   └── language.md
│   ├── roles/              # Role contracts and boundary definitions
│   │   ├── architect.md
│   │   ├── code-reviewer.md
│   │   ├── document-writer.md
│   │   ├── orchestrator.md
│   │   ├── planner.md
│   │   └── senior-dev.md
│   └── skills/             # On-demand progressive disclosure execution skills
│       └── skill-template.md
├── docs/
│   └── adr/                # Architecture Decision Records
│       ├── 0001-modular-agent-roles.md
│       └── 0002-token-optimization-strategy.md
├── GEMINI.md               # Master orchestration entry point and protocol index
├── index.html              # Main application entry point
├── js/                     # Application scripts and logic
└── README.md
```

### Agent Roles & Lifecycle
The agent execution follows a deterministic, sequential handoff lifecycle coordinated via `.agent_handoffs/<branch_name>/`:
1. **[Orchestrator](.agents/roles/orchestrator.md) (`pro`/`flash`):** Coordinates requests, verifies Git SOP, and initializes context (`0_context.md`).
2. **[Planner](.agents/roles/planner.md) (`flash`):** Analyzes requirements and formulates high-level execution objectives (`1_plan.md`).
3. **[Architect](.agents/roles/architect.md) (`pro`):** Defines file structures, interfaces, and technical contracts (`2_architecture.md`).
4. **[Senior Dev](.agents/roles/senior-dev.md) (`inherit`/`flash`):** Implements code conforming strictly to architectural specifications (`3_implementation.md`).
5. **[Code Reviewer](.agents/roles/code-reviewer.md) (`flash`):** Independently audits changes via diff analysis and renders approval verdicts (`4_review.md`).
6. **[Document Writer](.agents/roles/document-writer.md) (`flash_lite`):** Drafts documentation, updates ADRs, and opens Pull Requests targeting `dev` (`5_documentation.md`).

---

## Token Optimization & Lean Protocols

To prevent context bloat and optimize operational compute costs, all agent interactions observe the **Token Optimization Architecture**:
* **Model Tiering:** Tasks are routed to cost-proportional models (`pro` for architecture, `flash` for planning/development/review, `flash_lite` for documentation).
* **Single-Hop Delta Handoff:** Agents only load the immediate predecessor's artifact rather than accumulating historical context chains.
* **Artifact Size Ceilings:** Strict token budgets (1,500 - 3,000 tokens) are enforced per handoff step.
* **Diff-Based Auditing:** Code reviews inspect `git diff` output with bounded window fallbacks (max 20 lines) to avoid loading entire files.
* **Progressive Disclosure Skills:** Operational runbooks reside in `.agents/skills/` and are retrieved on demand.

For full details, refer to [GEMINI.md](GEMINI.md), [ADR 0001: Modular Agent Roles](docs/adr/0001-modular-agent-roles.md), and [ADR 0002: Token Optimization Strategy](docs/adr/0002-token-optimization-strategy.md).

---

## Development & Git Workflow

* **Base Branch:** `main` (Production)
* **Integration Branch:** `dev` (Agent Development target)
* **Working Branches:** `feature/<name>` or `fix/<name>` branched from `dev`
* **Pull Requests:** All PRs must target `dev`. Direct merges to `main` are restricted.
* **Language Requirement:** All communications, reasoning, documentation, and code comments must strictly be in English.
