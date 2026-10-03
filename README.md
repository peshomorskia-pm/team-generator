# Team Generator

[![Production Deployment](https://img.shields.io/badge/Production-Live-success?logo=vercel&logoColor=white)](https://team-generator-psi.vercel.app)
[![Vercel Status](https://img.shields.io/badge/Hosted%20On-Vercel-black?logo=vercel)](https://team-generator-psi.vercel.app)
[![Database](https://img.shields.io/badge/Database-Supabase%20Cloud-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

A scalable Multi-Page Application (SPA) with a responsive App Shell, client-side routing, and light/dark theme support for randomly assigning and balancing players into competitive teams. Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, **React Router v7**, **Vitest**, **happy-dom**, and **React Testing Library**, alongside **Supabase** backend integration.

* **Live Production Application:** [https://team-generator-psi.vercel.app](https://team-generator-psi.vercel.app)

---

## Core Features & Architecture

* **Advanced Shuffling:** Fisher-Yates shuffle algorithm for fair, randomized distribution ([`shuffle.ts`](file:///D:/Projects/team-generator/src/utils/shuffle.ts)).
* **LPT Greedy Balancing:** Optimizes team rating balance across player skill inputs ([`balance.ts`](file:///D:/Projects/team-generator/src/utils/balance.ts)).
* **Anti-Repetition Cache:** Canonical history fingerprinting prevents generating consecutive identical team configurations ([`history.ts`](file:///D:/Projects/team-generator/src/utils/history.ts)).
* **Hybrid Team Generator (Stage 3):** Combines registered database players with transient session guests (`activePool`), supporting bulk/single guest adding, unrated guest rating balancing, and zero-mutation database guarantees.
* **Responsive App Shell & Client-Side Routing:** Built with React Router v7 and an App Shell featuring desktop header (`Navbar`), mobile bottom bar (`MobileNav`), and responsive padding.
* **Light/Dark Theme Persistence:** Dynamic theme switching synchronized with `document.documentElement` (`<html>`) and persisted in `localStorage`.
* **Localized User Interface:** The application UI is localized in Bulgarian for the primary user base, while development and engineering adhere to strict English standards.
* **Type-Safe Component Hierarchy:** Built with React 19 functional components and strict TypeScript contracts.
* **Persistent Backend Ready:** Structured for local Supabase (PostgreSQL) stack integration to track match history, player ELO ratings, and performance stats.

---

## Routing Paths & Navigation

* **`/`** — Landing Page (Hero, feature highlights, balance visual, and primary CTA)
* **`/generator`** — Team Generator (Player management, team settings, greedy balancing & shuffling)
* **`/players`** — Players Database (Production CRUD management interface with search filtering, ELO rating tiers, responsive desktop table / mobile cards, and accessible modals)
* **`/matches`** — Match History & Tracker (Live CRUD management for match records, nullable scores for upcoming fixtures `- : -`, participant rosters with `PlayerCombobox` cross-team exclusion, multi-dimensional filters, and stat aggregation summaries)
* **`/rankings`** — League Rankings / Leaderboard (Themed placeholder for ELO player standings)
* **`*`** — 404 Not Found (Error page with navigation back to home)

---

## Deployment & Production Architecture

The production application is deployed on the **Vercel Edge Network** with a cloud-managed PostgreSQL database hosted on **Supabase Cloud**.

* **Live Production URL:** [https://team-generator-psi.vercel.app](https://team-generator-psi.vercel.app)

### Vercel SPA Hosting & Client-Side Routing
The application is bundled using Vite and deployed to Vercel as a client-side Single Page Application (SPA). Because React Router v7 utilizes the HTML5 History API for path-based navigation (`/`, `/generator`, `/players`, `/matches`, `/rankings`), direct deep-linking or page refreshes require a server rewrite to avoid HTTP 404 responses.

This rewrite rule is configured in the root [`vercel.json`](file:///D:/Projects/team-generator/vercel.json):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
All incoming deep route requests are routed to `index.html`, allowing React Router v7 to handle client-side routing natively without requiring 404 error page redirects.

### Supabase Cloud Datastore
Persistent relational data (`players`, `matches`, and `match_players` tables) is hosted in a production **Supabase Cloud (PostgreSQL)** project. Database schema migrations stored in `supabase/migrations/` maintain exact schema parity between local Docker containers and the cloud environment.

### Environment Configuration: Local vs. Production
Runtime credentials are isolated across environments:

| Environment | Scope / Host | Configuration Target | Configured Keys |
|---|---|---|---|
| **Local Development** | Local Docker Supabase (`http://127.0.0.1:54321`) | `.env.local` (untracked) | `VITE_SUPABASE_URL`<br>`VITE_SUPABASE_ANON_KEY` |
| **Production** | Vercel Edge Platform & Supabase Cloud | Vercel Environment Variables | `VITE_SUPABASE_URL`<br>`VITE_SUPABASE_ANON_KEY` |

* **Local Development:** Run `cp .env.example .env.local` and populate keys generated by `npm run db:status`.
* **Production Deployment:** Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project settings dashboard. Vite injects these variables during the automated production build.

### Legacy Deprecation: Retirement of GitHub Pages
The initial static deployment hosted on **GitHub Pages** has been permanently retired and unpublished:
* **Rationale:** GitHub Pages lacks native rewrite rules for client-side routing (requiring brittle 404 redirect workarounds) and does not natively support serverless environment variable management during continuous deployments.
* **Status:** Deprecated and unpublished. All traffic, documentation, and external references are migrated to the primary Vercel deployment ([https://team-generator-psi.vercel.app](https://team-generator-psi.vercel.app)). See [ADR 0012](docs/adr/0012-production-deployment-vercel-supabase-cloud.md) for full context.

---

## Getting Started & NPM Scripts

### Prerequisites
* Node.js (v18+ recommended)
* npm
* **Docker Desktop** (required for running local Supabase container infrastructure)

### Installation
```bash
npm install
```

### Local Supabase Environment Setup
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate `.env.local` with your Supabase project URL and anon key (automatically provided when running local Supabase via Docker).
3. Start local Supabase and apply migrations & seed data:
   ```bash
   npm run db:start
   npm run db:reset
   ```

### Database Schema & Migrations (`players` & `matches` Tables)
* **Migration Paths:** 
  - [`supabase/migrations/20261002000000_create_players_table.sql`](file:///D:/Projects/team-generator/supabase/migrations/20261002000000_create_players_table.sql)
  - [`supabase/migrations/20261003000000_create_matches_tables.sql`](file:///D:/Projects/team-generator/supabase/migrations/20261003000000_create_matches_tables.sql)
  - [`supabase/migrations/20261003010000_allow_nullable_match_scores.sql`](file:///D:/Projects/team-generator/supabase/migrations/20261003010000_allow_nullable_match_scores.sql)
* **Seed Script:** [`supabase/seed.sql`](file:///D:/Projects/team-generator/supabase/seed.sql) (populates initial sample players with realistic ELO ratings).
* **TypeScript Types:** [`src/types/database.types.ts`](file:///D:/Projects/team-generator/src/types/database.types.ts), [`src/types/match.ts`](file:///D:/Projects/team-generator/src/types/match.ts).

#### `matches` & `match_players` Relational Schema (Option A)
- **`matches`**: Header table tracking `id`, `team1_score` (nullable), `team2_score` (nullable), `status`, `notes`, `created_at`, `updated_at`.
- **`match_players`**: Line items table linking participants to matches via foreign keys (`match_id` with `ON DELETE CASCADE`, `player_id` with `ON DELETE SET NULL`), team number, and guest name, enforced by check constraint `check_participant`.

* **Row Level Security (RLS):** Enabled on public tables with permissive local development policies.
* **Client Integration:** Strongly typed Supabase client initialized in [`src/lib/supabase.ts`](file:///D:/Projects/team-generator/src/lib/supabase.ts).

### Available Scripts
* **`npm run dev`**: Start the local Vite development server with Hot Module Replacement (HMR).
* **`npm run build`**: Type-check (`tsc -b`) and bundle the application for production into `dist/`.
* **`npm run preview`**: Locally preview the production build.
* **`npm run typecheck`**: Run TypeScript static type checking without emitting files (`tsc --noEmit`).
* **`npm test`**: Run the Vitest automated test suite (`vitest run`).
* **`npm run test:coverage`**: Run Vitest with V8 coverage collection (`vitest run --coverage`), achieving >90% test coverage.
* **`npm run lint`**: Run ESLint across `src/` to enforce code quality standards.
* **`npm run db:start`**: Start local Supabase Docker containers (API, PostgreSQL, Studio, Inbucket).
* **`npm run db:stop`**: Stop local Supabase Docker containers.
* **`npm run db:status`**: Check status and access URLs of local Supabase services.
* **`npm run db:reset`**: Reset local database state, re-run migrations, and execute `supabase/seed.sql`.
* **`npm run db:types`**: Generate TypeScript database types from local Supabase schema.

For detailed operational runbooks and troubleshooting, refer to [.agents/skills/supabase-docker/SKILL.md](file:///D:/Projects/team-generator/.agents/skills/supabase-docker/SKILL.md).


---

## Automated Testing & Quality Gates

This project enforces a strict [Mandatory Automated Testing Protocol](.agents/protocols/testing-protocol.md) using **Vitest**, **happy-dom**, and **React Testing Library**. All new features and bug fixes must be accompanied by comprehensive tests across the testing pyramid (unit, hook, component, and integration), achieving 90%+ test coverage.

### Running Tests
```bash
# Run all automated test suites (245 tests across 31 files)
npm test

# Run tests with V8 coverage report (>90% overall coverage)
npm run test:coverage

# Run tests in watch mode during development
npx vitest

# Run tests with UI interface
npx vitest --ui
```

### Mandatory Quality Gates
Before any pull request can be approved and merged into `dev`:
1. **`npm test`**: 100% test pass rate across all suites (295/295 tests across 36 files passing).
2. **`npm run test:coverage`**: >90% overall line and statement coverage.
3. **`npm run typecheck`**: Zero TypeScript static compilation errors (`tsc --noEmit`).
4. **`npm run lint`**: Zero ESLint warnings or errors (`eslint src`).
5. **`npm run build`**: Clean production build compilation without warnings.

---

## Project Directory Structure

```
team-generator/
├── .agent_handoffs/        # Multi-agent sequential handoff artifacts
├── .agents/                # Modular agent roles, protocols, and execution skills
│   ├── protocols/          # Global system protocols (testing, language, git, handoffs)
│   └── roles/              # Specialist agent role definitions
├── docs/                   # Documentation and Architecture Decision Records (ADRs)
│   └── adr/
│       ├── 0001-modular-agent-roles.md
│       ├── 0002-token-optimization-strategy.md
│       ├── 0003-tech-stack-selection.md
│       ├── 0004-localization-and-language-boundary.md
│       ├── 0005-app-shell-routing-and-theming.md
│       ├── 0006-mandatory-automated-testing-protocol.md
│       ├── 0007-strict-scoping-and-code-health-auditor.md
│       ├── 0008-orchestrator-planner-investigation-boundary.md
│       ├── 0009-stage-3-hybrid-generator-and-transient-guests.md
│       ├── 0010-matches-module-and-relational-schema.md
│       ├── 0011-generator-match-integration.md
│       └── 0012-production-deployment-vercel-supabase-cloud.md
├── src/                    # React application source code
│   ├── assets/styles/      # Tailwind CSS entry points
│   ├── components/         # Modular UI components
│   │   ├── layout/         # AppShell, Navbar, MobileNav, PlaceholderPage
│   │   ├── match/          # Match components (MatchCard, MatchModal, DeleteMatchModal, MatchesStatSummary)
│   │   ├── player/         # Player modals (PlayerModal, DeletePlayerModal)
│   │   ├── ui/             # Reusable UI primitives (Badge, Alert, ThemeToggle, Button, Input, index.ts)
│   │   └── ...             # PlayerInput, TeamCard, TeamSettings, etc.
│   ├── context/            # React Context providers (ThemeContext)
│   ├── hooks/              # Custom business logic hooks (useTeamGenerator, usePlayers, useMatches, useTheme)
│   ├── pages/              # Route views (LandingPage, GeneratorPage, PlayersPage, MatchesPage, RankingsPage, NotFoundPage)
│   ├── types/              # TypeScript domain contracts (Player, Team, Match, Database, etc.)
│   ├── utils/              # Pure algorithmic utilities (shuffle, balance, history)
│   ├── App.tsx             # Root routing tree & AppShell wrapper
│   └── main.tsx            # React DOM mounting entry point
├── supabase/
│   ├── migrations/         # Supabase PostgreSQL schema migrations
│   │   ├── 20261002000000_create_players_table.sql
│   │   ├── 20261003000000_create_matches_tables.sql
│   │   └── 20261003010000_allow_nullable_match_scores.sql
│   └── seed.sql            # Initial sample data seed script
├── index.html              # HTML entry point
├── package.json            # Project dependencies and npm scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vercel.json             # Vercel SPA rewrite routing configuration
└── vite.config.ts          # Vite configuration
```

---

## Modular Agent Ecosystem

This repository employs a modular, multi-agent engineering lifecycle managed by specialized AI agent roles. Global protocols, role definitions, progressive disclosure skills, and architectural decisions are codified under dedicated directories:

### Agent Roles & Lifecycle
1. **[Orchestrator](.agents/roles/orchestrator.md) (`pro`/`flash`):** Agile PM & Release Gatekeeper. Zero source code access. Coordinates requests, verifies Git SOP, and initializes context (`0_context.md`) before any code inspection occurs.
2. **[Planner](.agents/roles/planner.md) (`flash`):** Technical Lead & first-responder codebase inspector. Scopes features, triages defects, and formulates high-level execution objectives (`1_plan.md`).
3. **[Architect](.agents/roles/architect.md) (`pro`):** Defines file structures, interfaces, and technical contracts (`2_architecture.md`).
4. **[Senior Dev](.agents/roles/senior-dev.md) (`inherit`/`flash`):** Implements code conforming strictly to architectural specifications (`3_implementation.md`).
5. **[Code Reviewer](.agents/roles/code-reviewer.md) (`flash`):** Independently audits changes via diff analysis and renders approval verdicts (`4_review.md`).
6. **[Document Writer](.agents/roles/document-writer.md) (`flash_lite`):** Drafts documentation, updates ADRs, and opens Pull Requests targeting `dev` (`5_documentation.md`).
7. **[Code Health Auditor](.agents/roles/code-health-auditor.md) (`flash`):** Performs read-only static analysis to identify technical debt, test coverage gaps, dead code, weak typings, and UI componentization candidates (`docs/proposals/`).

For full details, refer to [GEMINI.md](GEMINI.md), [ADR 0001](docs/adr/0001-modular-agent-roles.md), [ADR 0002](docs/adr/0002-token-optimization-strategy.md), [ADR 0003](docs/adr/0003-tech-stack-selection.md), [ADR 0004](docs/adr/0004-localization-and-language-boundary.md), [ADR 0005](docs/adr/0005-app-shell-routing-and-theming.md), [ADR 0006](docs/adr/0006-mandatory-automated-testing-protocol.md), [ADR 0007](docs/adr/0007-strict-scoping-and-code-health-auditor.md), [ADR 0008](docs/adr/0008-orchestrator-planner-investigation-boundary.md), [ADR 0009](docs/adr/0009-stage-3-hybrid-generator-and-transient-guests.md), [ADR 0010](docs/adr/0010-matches-module-and-relational-schema.md), [ADR 0011](docs/adr/0011-generator-match-integration.md), and [ADR 0012](docs/adr/0012-production-deployment-vercel-supabase-cloud.md).

---

## Development & Git Workflow

* **Base Branch:** `main` (Production)
* **Integration Branch:** `dev` (Agent Development target)
* **Working Branches:** `feature/<name>` or `fix/<name>` branched from `dev`
* **Pull Requests:** All PRs must target `dev`. Direct merges to `main` are restricted.
* **Strict Feature Scoping:** All feature and bugfix PRs must strictly modify only files required for the ticket objective. Opportunistic cleanups, reformatting, or out-of-scope refactoring are prohibited on feature branches.
* **Dual-Language Boundary:** All communications, reasoning, documentation, automated tests, and code comments must strictly be in English ([`language.md`](file:///D:/Projects/team-generator/.agents/protocols/language.md)). The application UI is presented in Bulgarian. Premature i18n abstractions are strictly avoided.

---

## Maintenance & Code Health Inspections

To maintain codebase health and proactively resolve technical debt without polluting feature diffs:
* **On-Demand Inspections:** Manually invoke the `code-health-auditor` on demand:
  ```text
  @code-health-auditor Run a code health audit on the [directory/module/project] focusing on [all/specific focus area]. Generate a proposal in docs/proposals/.
  ```
* **Proposal Review:** The auditor performs a read-only scan (zero production edits) and generates a report in `docs/proposals/code-health-YYYY-MM-DD.md`.
* **Isolated Refactoring:** Users review proposals and create isolated `refactor/` or `chore/` tickets for execution in a clean, dedicated cycle.
