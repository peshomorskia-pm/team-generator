# Protocol: Sequential Handoff Protocol

## 1. Overview & Objective
This protocol governs the communication and artifact generation lifecycle between agent roles. To eliminate context bleed, minimize token consumption, and preserve an immutable, deterministic audit trail of engineering decisions, roles communicate strictly through written markdown artifacts.

## 2. Storage Location & Directory Structure
* All handoff artifacts for a given branch must reside in `.agent_handoffs/<branch_name>/`.
* The folder naming must match the active working branch name (e.g., `.agent_handoffs/feature/token-optimization/`).
* **JIT Initialization:** During initial read-only triage on `dev`, initial context and intake artifacts reside in `.agent_handoffs/draft/` or staging. Upon Just-In-Time (JIT) branch creation following a green light, `.agent_handoffs/<branch_name>/` is initialized with `0_context.md` and `1_intake_gate.md`.
* Retention policy: Handoff folders are permanently retained for historical auditability unless explicitly commanded for deletion by the user after a successful merge.

## 3. Single-Hop Delta Handoff Contract
To prevent token bloat and context window saturation, agents adhere to a strict **Single-Hop Delta Handoff**:
* Each role consumes **only the immediate predecessor's artifact**.
* Agents must **NOT** load the cumulative historical chain of artifacts unless explicitly commanded by the user.
* Predecessor roles summarize relevant context into their scoped artifact; successors rely on this delta rather than re-reading prior stages.

```mermaid
flowchart LR
    User["User Prompt"] --> Orch0["Orchestrator<br/>(0_context.md)"]
    Orch0 --> Intake["Intake Gate<br/>(1_intake_gate.md)"]
    Intake -->|Green / Cleared| Arch["Architect<br/>(2_architecture.md)"]
    Arch --> Dev["Senior Dev<br/>(3_implementation.md)"]
    Dev --> Rev["Code Reviewer<br/>(4_review.md)"]
    Rev -->|Fixes Requested (Internal QA Loop)| Dev
    Rev -->|Approved| Accept["Acceptance Gate<br/>(5_acceptance_gate.md)"]
    Accept -->|Defects Found (Internal QA Loop)| Dev
    Accept -->|Accepted| Doc["Document Writer<br/>(6_documentation.md)"]
    Doc --> OrchFinal["Orchestrator<br/>(PR & User Consent)"]
    OrchFinal -.->|PO Feedback / Rejection (External Loop)| Orch0
```

## 4. Dual Feedback Loop Protocol: External (PO) vs Internal (QA/Review)

To maintain architectural integrity and prevent unauthorized scope creep, feedback is partitioned into two strictly decoupled operational loops:

```mermaid
flowchart TD
    subgraph ExternalLoop["External PO Feedback Loop (Planning & Scoping Boundary)"]
        PO["Human User (Product Owner)"] -->|Feedback, Scope Shift, Stage 9 Rejection| Orch["Orchestrator<br/>(0_context.md)"]
        Orch -->|Triage Delta| Intake["Intake Gatekeeper<br/>(1_intake_gate.md)"]
        Intake -->|Feasibility & Scoping Delta| Arch["Architect<br/>(2_architecture.md)"]
        Arch -->|Technical Contract Delta| Dev1["Senior Dev<br/>(3_implementation.md)"]
    end

    subgraph InternalLoop["Internal Technical Review/QA Loop (Defect Remediation Boundary)"]
        Dev2["Senior Dev"] --> Rev["Code Reviewer<br/>(4_review.md)"]
        Rev -->|Fixes Requested (Adheres to 2_architecture.md)| Dev2
        Rev -->|Approved| Accept["Acceptance Gate<br/>(5_acceptance_gate.md)"]
        Accept -->|Defects Detected (Adheres to 2_architecture.md)| Dev2
        Accept -.->|Schema or Interface Discrepancy| Arch
    end
```

### Comparative Decision Matrix
| Dimension | Loop A: Internal Review / QA Loop | Loop B: External PO Feedback Loop |
|---|---|---|
| **Trigger Source** | Code Reviewer (`4_review.md`) / Acceptance Gatekeeper (`5_acceptance_gate.md`) | Human User (Product Owner) |
| **Trigger Event** | Code quality failure, lint/test failure, or UAT criteria discrepancy | User prompt, critique, refinement, scope expansion, or Stage 9 rejection |
| **Initiator** | Autonomous subagent notification | Human User / PO message |
| **Routing Sequence** | Direct re-dispatch to Senior Dev (`Dev`) | `Orchestrator` -> `Intake Gatekeeper` -> `Architect` -> `Senior Dev` |
| **Permitted Scope** | Fixes strictly conforming to the *already approved* `2_architecture.md` | Any new requirement, modified behavior, or UI adjustment |
| **Direct-to-Dev Permitted?** | **YES** (automated corrective iteration) | **STRICTLY PROHIBITED** (Zero Cowboy Delegation Rule) |
| **Escalation Path** | If fix requires schema/contract modifications -> Escalate to `Architect` | If PO rejects proposed solutions -> `Intake Gatekeeper` re-evaluates |

## 5. Handoff Step Matrix
| Sequence | Role | Input Artifact | Output Artifact | Primary Action |
|---|---|---|---|---|
| 0 | Orchestrator | User Prompt | `0_context.md` | Intercept request, verify clean branch from `dev`, define scope boundaries |
| 1 | Intake Gatekeeper | `0_context.md` | `1_intake_gate.md` | Ingest context, inspect `src/**`, evaluate feasibility, assign Green/Yellow/Red verdict |
| 2 | Architect | `1_intake_gate.md` | `2_architecture.md` | Ingest plan & constraints, design schemas, contracts, specs, file trees |
| 3 | Senior Dev | `2_architecture.md` | `3_implementation.md` | Ingest architecture, write code, run verification |
| 4 | Code Reviewer | `3_implementation.md` | `4_review.md` | Ingest implementation summary & `git diff`, audit technical quality, issue verdict |
| 5 | Acceptance Gatekeeper | `1_intake_gate.md` & `4_review.md` | `5_acceptance_gate.md` | Verify PO acceptance criteria, Bulgarian UI, and user flows against implementation |
| 6 | Document Writer | `5_acceptance_gate.md` (Accepted) | `6_documentation.md` | Ingest acceptance, update docs/ADRs, open PR targeting `dev` |
| 7 | Orchestrator | `6_documentation.md` | Final Report | Review verified PR, present to PO, halt for explicit user consent before merge |

## 6. Artifact Size Ceilings & Token Budgets
Every handoff artifact must strictly observe size ceilings to prevent runaway context expansion:

| Artifact | Role Owner | Target Token Ceiling | Max Word Count (~approx) | Scope & Focus |
|---|---|---|---|---|
| `0_context.md` | Orchestrator | 1,500 | 1,100 | User request interpretation, scope boundaries, Git state |
| `1_intake_gate.md` | Intake Gatekeeper | 2,000 | 1,500 | Feasibility verdict (🟢/🟡/🔴), acceptance criteria, technical findings |
| `2_architecture.md` | Architect | 3,000 | 2,250 | System schemas, API contracts, file tree, implementation specs |
| `3_implementation.md`| Senior Dev | 2,500 | 1,800 | Change summary, modified file links, compliance proofs |
| `4_review.md` | Code Reviewer | 1,500 | 1,100 | Diff checklist, finding analysis, formal verdict |
| `5_acceptance_gate.md` | Acceptance Gatekeeper | 2,000 | 1,500 | Business criteria verification matrix, Bulgarian UI audit, UAT flow checks |
| `6_documentation.md` | Document Writer | 2,000 | 1,500 | Docs updates log, ADR summary, PR metadata |

## 7. Lean Artifact Schema Rules
All generated handoff artifacts must follow lean authoring standards:
1. **No Requirement Re-stating:** Never copy-paste instructions, prompt transcripts, or prior artifact sections verbatim. State only new conclusions, plans, or specifications.
2. **Tables and Bullets Over Prose:** Use concise bulleted lists and markdown tables. Avoid dense explanatory prose.
3. **Actionable Outputs Only:** Focus solely on what changed, architectural specifications, test outputs, or actionable next-step transitions.
