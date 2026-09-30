# ADR 0008: Formalizing the Orchestrator-Planner Investigation Boundary

* **Status:** Accepted
* **Date:** 2026-09-30
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** Project Guidelines (`GEMINI.md`), Architecture Specifications (`2_architecture.md`), Role Definitions (`.agents/roles/`)

---

## 1. Context and Problem Statement

In previous iterations of the multi-agent engineering lifecycle, the boundary between the Orchestrator and Planner roles lacked strict technical isolation. The Orchestrator occasionally inspected application source files (`src/**`) during initial intake to clarify technical scope before delegating to the Planner.

This led to several critical inefficiencies:
1. **Token Exhaustion & Context Pollution:** Loading large source files or file listings into the Orchestrator's context caused unnecessary token consumption on high-level coordination turns.
2. **Role Ambiguity & Boundary Blurring:** The boundary between project coordination (Agile PM) and technical system analysis (Technical Lead) became blurred.
3. **Inconsistent Defect Triage:** Defect and bug fix requests lacked an explicit root-cause exploration protocol, sometimes deferring deep diagnostics until the Architect or Senior Dev phases.

---

## 2. Decision Drivers

* **Token Efficiency:** Keep Orchestrator context lean by strictly preventing source code ingestion during workflow initialization.
* **Separation of Concerns:** Codify the paradigm where the User acts as Product Owner (PO), Orchestrator acts as Agile Project Manager & Release Gatekeeper, and Planner acts as Technical Lead.
* **First-Responder Codebase Authority:** Centralize codebase inspection, technical feasibility checks, and defect triage in the Planner role.
* **Predictable Handoffs:** Ensure `0_context.md` captures business objectives cleanly, delegating all code-level analysis to `1_plan.md`.

---

## 3. Decision

1. **Enforce "Zero Source Code Inspection Rule" for Orchestrator:**
   - The Orchestrator is **strictly prohibited** from viewing, reading, grepping, or inspecting application source files (e.g., `src/**`, `app/**`, `public/**`).
   - The Orchestrator strictly executes a linear SOP: Receive User Request -> Git Branch Setup -> Initialize `0_context.md` -> Immediately summon Planner.
2. **Authorize Planner as First-Responder Codebase Inspector:**
   - The Planner is designated as the **Technical Lead & First-Responder Code Analyst**.
   - The Planner has full authority to view, search, and analyze `src/**` using `view_file`, `git grep`, and related exploration tools.
3. **Formalize Bug Triage & Root Cause Exploration Protocol:**
   - For bug fix requests, the Planner executes a 4-step protocol:
     1. Locate offending code in `src/**`.
     2. Analyze dependencies and impact.
     3. Establish reproduction strategies.
     4. Formulate strict test requirements and test scopes to guide Senior Dev.
4. **Codify User-as-PO & Planner-as-Tech-Lead Model:**
   - Reflected throughout `.agents/roles/orchestrator.md`, `.agents/roles/planner.md`, `GEMINI.md`, and `README.md`.

---

## 4. Consequences

### Positive
- **Drastic Reduction in Orchestrator Token Usage:** Zero source code ingestion keeps Orchestrator turns compact and fast.
- **Clear Separation of Concerns:** Clear demarcation between workflow/process gating (Orchestrator) and technical leadership/scoping (Planner).
- **Early Defect Localization:** Root causes and reproduction strategies are identified upfront by the Planner, producing higher quality test scopes for the Senior Dev.
- **Consistent Audit Trail:** Technical rationale and exploration findings are codified systematically in `1_plan.md`.

### Negative
- **Initial Delegation Hop:** If a user request requires immediate technical clarification, the Orchestrator must still hand off to the Planner to inspect code rather than answering ad-hoc. This trade-off is deliberate and mitigated by immediate Planner invocation under Tier `flash`.
