# ADR 0032: Dual Feedback Loops and Zero Cowboy Delegation Rule

## Status
Accepted

## Context
During team-generator development iterations, the human Product Owner (PO) provided direct critiques and requirement modifications during Stage 9 (Hard Stop for Consent). Occasionally, the Orchestrator agent bypassed the Intake Gatekeeper and Architect roles, directly dispatching feedback to the Senior Developer ("cowboy delegation"). This bypassed architectural validation, scope analysis, and technical intake gating, leading to protocol drift and unvetted specification changes.

We needed a rigorous architectural codification separating external human PO feedback loops from internal technical review/QA loops, establishing a strict "Zero Cowboy Delegation" rule.

## Decision
We formally decoupled the **Dual Feedback Loop Topology**:

1. **Loop A (Internal Technical Review/QA Loop):**
   - Autonomous defect remediation loop between Senior Dev, Code Reviewer (`4_review.md`), and Acceptance Gatekeeper (`5_acceptance_gate.md`).
   - Restricted exclusively to fixing bugs, lint errors, test failures, or polish items that strictly adhere to the approved architecture contract (`2_architecture.md`).

2. **Loop B (External PO Feedback Loop):**
   - Any prompt, critique, scope adjustment, or requirement change from the human user/PO must strictly traverse the complete planning pipeline:
     `Orchestrator -> Intake Gatekeeper -> Architect -> Senior Dev`.
   - **Zero Cowboy Delegation Rule:** Direct Orchestrator-to-Senior Dev delegation of user feedback is strictly prohibited.

3. **Protocol & Role Harmonization:**
   - Synchronized artifact sequences and role boundaries across `GEMINI.md`, `orchestrator.md`, `architect.md`, `code-reviewer.md`, `document-writer.md`, and `handoff-protocol.md`.

## Consequences
- **Positive:** Guaranteed architectural review and risk assessment for all user/PO feedback; eliminated unvetted scope creep; maintained high velocity for internal Loop A QA fixes while securing strict governance for Loop B.
- **Negative:** Slightly increased procedural overhead for handling user feedback requests, ensuring robust quality and traceability.
