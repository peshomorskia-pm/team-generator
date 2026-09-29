# Team Generator

A scalable Single Page Application (SPA) for randomly assigning and balancing players into competitive teams. Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Vitest**, alongside **Supabase** backend integration.

---

## Core Features & Architecture

* **Advanced Shuffling:** Fisher-Yates shuffle algorithm for fair, randomized distribution ([`shuffle.ts`](file:///D:/Projects/team-generator/src/utils/shuffle.ts)).
* **LPT Greedy Balancing:** Optimizes team rating balance across player skill inputs ([`balance.ts`](file:///D:/Projects/team-generator/src/utils/balance.ts)).
* **Anti-Repetition Cache:** Canonical history fingerprinting prevents generating consecutive identical team configurations ([`history.ts`](file:///D:/Projects/team-generator/src/utils/history.ts)).
* **Type-Safe Component Hierarchy:** Built with React 19 functional components and strict TypeScript contracts.
* **Persistent Backend Ready:** Structured for local Supabase (PostgreSQL) stack integration to track match history, player ELO ratings, and performance stats.

---

## Getting Started & NPM Scripts

### Prerequisites
* Node.js (v18+ recommended)
* npm

### Installation
```bash
npm install
```

### Available Scripts
* **`npm run dev`**: Start the local Vite development server with Hot Module Replacement (HMR).
* **`npm run build`**: Type-check (`tsc -b`) and bundle the application for production into `dist/`.
* **`npm run preview`**: Locally preview the production build.
* **`npm run typecheck`**: Run TypeScript static type checking without emitting files (`tsc --noEmit`).
* **`npm test`**: Run the Vitest unit test suite across core algorithm modules.
* **`npm run lint`**: Run ESLint across `src/` to enforce code quality standards.

---

## Project Directory Structure

```
team-generator/
├── .agent_handoffs/        # Multi-agent sequential handoff artifacts
├── .agents/                # Modular agent roles, protocols, and execution skills
├── docs/                   # Documentation and Architecture Decision Records (ADRs)
│   └── adr/
│       ├── 0001-modular-agent-roles.md
│       ├── 0002-token-optimization-strategy.md
│       └── 0003-tech-stack-selection.md
├── src/                    # React application source code
│   ├── assets/styles/      # Tailwind CSS entry points
│   ├── components/         # Modular UI components (PlayerInput, TeamCard, TeamSettings, etc.)
│   ├── hooks/              # Custom business logic hooks (useTeamGenerator)
│   ├── types/              # TypeScript domain contracts (Player, Team, etc.)
│   ├── utils/              # Pure algorithmic utilities (shuffle, balance, history)
│   ├── App.tsx             # Root application component
│   └── main.tsx            # React DOM mounting entry point
├── index.html              # HTML entry point
├── package.json            # Project dependencies and npm scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

---

## Modular Agent Ecosystem

This repository employs a modular, multi-agent engineering lifecycle managed by specialized AI agent roles. Global protocols, role definitions, progressive disclosure skills, and architectural decisions are codified under dedicated directories:

### Agent Roles & Lifecycle
1. **[Orchestrator](.agents/roles/orchestrator.md) (`pro`/`flash`):** Coordinates requests, verifies Git SOP, and initializes context (`0_context.md`).
2. **[Planner](.agents/roles/planner.md) (`flash`):** Analyzes requirements and formulates high-level execution objectives (`1_plan.md`).
3. **[Architect](.agents/roles/architect.md) (`pro`):** Defines file structures, interfaces, and technical contracts (`2_architecture.md`).
4. **[Senior Dev](.agents/roles/senior-dev.md) (`inherit`/`flash`):** Implements code conforming strictly to architectural specifications (`3_implementation.md`).
5. **[Code Reviewer](.agents/roles/code-reviewer.md) (`flash`):** Independently audits changes via diff analysis and renders approval verdicts (`4_review.md`).
6. **[Document Writer](.agents/roles/document-writer.md) (`flash_lite`):** Drafts documentation, updates ADRs, and opens Pull Requests targeting `dev` (`5_documentation.md`).

For full details, refer to [GEMINI.md](GEMINI.md), [ADR 0001](docs/adr/0001-modular-agent-roles.md), [ADR 0002](docs/adr/0002-token-optimization-strategy.md), and [ADR 0003](docs/adr/0003-tech-stack-selection.md).

---

## Development & Git Workflow

* **Base Branch:** `main` (Production)
* **Integration Branch:** `dev` (Agent Development target)
* **Working Branches:** `feature/<name>` or `fix/<name>` branched from `dev`
* **Pull Requests:** All PRs must target `dev`. Direct merges to `main` are restricted.
* **Language Requirement:** All communications, reasoning, documentation, and code comments must strictly be in English.
