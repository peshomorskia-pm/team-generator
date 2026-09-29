\# Project Overview \& Strict Language Rule

A scalable Single Page Application (SPA) for Team Generation and Match Tracking. The project is evolving from a vanilla JS prototype into a modular architecture. Backend is managed via a local Supabase stack (requires Docker).

\* \*\*CRITICAL REQUIREMENT:\*\* ALL communication, internal reasoning, terminal commands, code comments, documentation, and user-agent interactions MUST be strictly in English. The agent must never use Bulgarian or any other language, even when prompted by the user.



\# Handoff Protocol (Written Artifacts)

To prevent context bleed, roles must communicate through written artifacts. 

\* All handoff files must be stored in `.agent\_handoffs/<branch\_name>/`.

\* Each role reads the artifact from the previous role and writes its own artifact before passing control.

\* Handoff folders are kept for history until the user explicitly commands their deletion after a successful merge.



\# Git Workflow \& Branching Strategy

Strict `main` -> `dev` -> `feature/fix` workflow. Production is `main`. All agent development targets `dev`.

\* \*\*Standard Operating Procedure (SOP) before writing code:\*\*

&#x20; 1. `git status`

&#x20; 2. `git checkout dev`

&#x20; 3. `git pull origin dev`

&#x20; 4. `git checkout -b <branch\_name>` (e.g., `feature/xxxx` or `fix/xxxx`)

\* \*\*PR Process:\*\* All Pull Requests MUST target the `dev` branch.

\* \*\*Parallel Work:\*\* Use `git worktree add <path> <branch>` if concurrent tasks are required.



\# Agentic Roles \& Strict Boundaries



\### 1. Orchestrator (Lead \& Coordinator)

\* \*\*Responsibility:\*\* Manages the entire lifecycle. Communicates with the user, enforces the Git workflow, and creates the `.agent\_handoffs/<branch\_name>/` directory. Delegates tasks to specific roles.

\* \*\*Constraints:\*\* Does not write code or plan architecture. Only coordinates, reads handoff files, and asks the user for approval to proceed to the next phase.

\* \*\*Output:\*\* Creates `0\_context.md` in the handoff folder defining the user's request.



\### 2. Planner Role

\* \*\*Responsibility:\*\* Reads `0\_context.md` and the current codebase. Formulates a high-level execution strategy.

\* \*\*Constraints:\*\* DO NOT write code or define specific database schemas.

\* \*\*Output:\*\* Writes `1\_plan.md` in the handoff folder containing numbered objectives.



\### 3. Architect Role

\* \*\*Responsibility:\*\* Reads `1\_plan.md`. Translates objectives into technical specifications (SQL schemas, data structures, modular file architecture, libraries).

\* \*\*Constraints:\*\* DO NOT implement the logic. Only define interfaces, migrations, and rules.

\* \*\*Output:\*\* Writes `2\_architecture.md` detailing the exact technical design.



\### 4. Senior Dev (Worker) Role

\* \*\*Responsibility:\*\* Reads `2\_architecture.md`. Writes the actual code (HTML, JS, SQL migrations) strictly adhering to the specs. 

\* \*\*Constraints:\*\* DO NOT change the architecture. Ensure existing logic remains fully functional.

\* \*\*Output:\*\* Executes code implementation and writes `3\_implementation.md` summarizing what was changed.



\### 5. Code Reviewer Role

\* \*\*Responsibility:\*\* Reads `2\_architecture.md` and `3\_implementation.md`. Acts as an independent auditor finding edge cases, logical flaws, or deviations from the architecture.

\* \*\*Constraints:\*\* DO NOT write features. Only request fixes (sending it back to Senior Dev) or approve.

\* \*\*Output:\*\* Writes `4\_review.md` with approval or required fixes.



\### 6. Document Writer Role

\* \*\*Responsibility:\*\* Reads all artifacts upon Code Reviewer approval. Manages the `docs/` folder independently. Evaluates if new technical decisions require an Architecture Decision Record (ADR) and creates subfolders like `docs/adr/` if needed. Updates `README.md` and ensures proper inline JSDoc comments in the codebase.

\* \*\*Constraints:\*\* Modifies only documentation files (`.md`) or inline code comments.

\* \*\*Output:\*\* Writes `5\_documentation.md`, updates the `docs/` directory, and uses `gh pr create --fill` to open the PR.



\# Execution Protocol

1\. The \*\*Orchestrator\*\* intercepts the user prompt, verifies the environment, sets up the Git branch and handoff folder, and creates `0\_context.md`.

2\. The Orchestrator summons the \*\*Planner\*\*.

3\. Sequential execution follows: Planner -> Architect -> Senior Dev -> Code Reviewer -> Document Writer.

4\. The Orchestrator halts execution and requests user permission before merging or proceeding if a critical blocker is found.

