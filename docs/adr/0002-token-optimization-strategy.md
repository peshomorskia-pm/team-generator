# ADR 0002: Token Optimization Strategy & Lean Handoff Architecture

* **Status:** Accepted
* **Date:** 2026-09-29
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** [2_architecture.md](file:///D:/Projects/team-generator/.agent_handoffs/feature/token-optimization/2_architecture.md), [GEMINI.md](file:///D:/Projects/team-generator/GEMINI.md), [ADR 0001](file:///D:/Projects/team-generator/docs/adr/0001-modular-agent-roles.md)

---

## 1. Context and Problem Statement

Following the introduction of modular agent roles in [ADR 0001](file:///D:/Projects/team-generator/docs/adr/0001-modular-agent-roles.md), multi-agent chains began exhibiting symptoms of context saturation and token inefficiency:
1. **Cumulative Context Bleed:** Specialist roles loaded cumulative histories of all prior artifacts (`0_context.md` through `N`), carrying redundant prompt and reasoning baggage into downstream tasks.
2. **Whole-File Review Overhead:** Code reviewers consumed entire source files into context to evaluate small, localized changes.
3. **Uniform Compute Inefficiency:** Routine tasks (documentation, diff syntax checks, milestone planning) utilized expensive frontier models unnecessarily.
4. **Runbook Bloat:** Operational procedures and runbooks were statically bundled into agent prompts rather than loaded when needed.

---

## 2. Decision Drivers

* **Token Consumption & Cost Optimization:** Minimize prompt token counts and recurring API operational expenditures.
* **Context Hygiene:** Ensure each agent receives only high-signal, relevant task context.
* **Bounded Artifact Sizes:** Prevent runaway document length through explicit token and word limits.
* **Targeted Code Inspection:** Restrict review mechanics to localized changes and git diffs.
* **Progressive Disclosure:** Isolate specialized procedures into on-demand skills.

---

## 3. Considered Options

1. **Retain Cumulative Multi-Hop Context:** Agents continue to ingest all previous artifacts from the feature branch.
   * *Rejected:* Causes linear token growth per handoff step and increases hallucinations due to conflicting context.
2. **Heuristic Token Truncation:** Automatically trim prompt history with arbitrary token cuts.
   * *Rejected:* Unpredictable loss of critical architectural constraints and schemas.
3. **Structured Token Optimization Architecture:** Implement Model Tiering, Single-Hop Delta Handoffs, Strict Artifact Ceilings, Diff-Based Auditing, and Progressive Disclosure Skills.
   * *Accepted:* Provides deterministic context control while preserving architectural rigor.

---

## 4. Decision

We have codified five token optimization pillars across the repository:

### 1. Model Tiering Policy
Compute tiers are strictly allocated based on task complexity:
* **Planner (`flash`):** High-level roadmap decomposition and repository inspection.
* **Architect (`pro`):** System architecture, schema contracts, and complex design reasoning.
* **Senior Dev (`inherit` / `flash`):** Implementation, test runs, and syntax validation.
* **Code Reviewer (`flash`):** Diff auditing, compliance checks, and syntax verification.
* **Document Writer (`flash_lite`):** Documentation updates, ADR drafting, and PR creation.
* **Orchestrator (`pro` / `flash`):** Flow coordination, git hygiene, and final user consent.

### 2. Single-Hop Delta Handoff Protocol
Agents consume **only the immediate predecessor's artifact**:
* `Planner` reads only `0_context.md`.
* `Architect` reads only `1_plan.md`.
* `Senior Dev` reads only `2_architecture.md`.
* `Code Reviewer` reads only `3_implementation.md` and `git diff`.
* `Document Writer` reads only `4_review.md`.

### 3. Artifact Size Ceilings & Token Budgets
Hard token and word count targets are established:
* `0_context.md`: <= 1,500 tokens (~1,100 words)
* `1_plan.md`: <= 2,000 tokens (~1,500 words)
* `2_architecture.md`: <= 3,000 tokens (~2,250 words)
* `3_implementation.md`: <= 2,500 tokens (~1,800 words)
* `4_review.md`: <= 1,500 tokens (~1,100 words)
* `5_documentation.md`: <= 2,000 tokens (~1,500 words)

### 4. Diff-Based Auditing
The Code Reviewer is restricted to reviewing changes via `git diff HEAD` or `git diff dev...HEAD`. Whole-file reads are prohibited; context fallbacks are limited to at most 20 surrounding lines with explicit `StartLine` and `EndLine` constraints.

### 5. Progressive Disclosure Skills (`.agents/skills/`)
Specialized execution procedures (e.g. database migrations, testing harnesses, complex rebasing) are decoupled into modular skill files loaded on demand.

---

## 5. Consequences

### Positive
* **Substantial Token Reductions:** Single-hop ingestion and diff reviews reduce context window consumption by up to 60-80% in late-stage handoffs.
* **Higher Model Attention:** Smaller, high-signal inputs improve reasoning quality and reduce omission errors.
* **Proportional Cost Scaling:** Leveraging `flash` and `flash_lite` tiers for non-architectural roles significantly reduces compute costs.

### Negative / Trade-offs
* **Handoff Quality Dependency:** Each role's artifact must be self-contained and sufficiently detailed to guide its immediate successor without requiring back-references.

---

## 6. References
* [2_architecture.md](file:///D:/Projects/team-generator/.agent_handoffs/feature/token-optimization/2_architecture.md)
* [GEMINI.md](file:///D:/Projects/team-generator/GEMINI.md)
* [.agents/protocols/handoff-protocol.md](file:///D:/Projects/team-generator/.agents/protocols/handoff-protocol.md)
* [.agents/roles/code-reviewer.md](file:///D:/Projects/team-generator/.agents/roles/code-reviewer.md)
* [.agents/skills/skill-template.md](file:///D:/Projects/team-generator/.agents/skills/skill-template.md)
