# ADR 0041: Subagent Command Execution and Operational Anti-Hanging Protocol

* **Status:** Accepted
* **Date:** 2026-10-28
* **Deciders:** Orchestrator, Intake Gatekeeper, Architect, Senior Dev, Code Reviewer, Acceptance Gatekeeper
* **Consulted:** Project Guidelines (`GEMINI.md`), Sequential Handoff Protocol

---

## 1. Context and Problem Statement
During multi-agent workflow executions, subagents invoking CLI verification tools (`npm test`, `vitest`, `npm run typecheck`, `npm run lint`) frequently entered indefinite `waiting_for_dependents` hanging states. 

Root cause analysis identified two primary factors:
1. Low default synchronous timeouts (`WaitMsBeforeAsync < 5000ms`) caused normal test commands to be prematurely demoted into asynchronous background tasks (`task-<id>`).
2. Reactive system notification drops or network disconnects left subagents idling indefinitely while waiting for background task exit signals, requiring manual human intervention to break the hang.

---

## 2. Decision Drivers
* **Deterministic Execution:** Subagents must complete verification cycles reliably without silent timeouts or orphaned tasks.
* **Rapid Inner Loops:** Keep iterative test runs synchronous (<3-5 seconds) to eliminate background process thrashing.
* **Automated Deadlock Recovery:** Enable the Orchestrator to detect and revive hung subagents autonomously without human Product Owner intervention.
* **Strict Verification Quality:** Preserve 100% test pass rates and full-suite verification before handoff transitions.

---

## 3. Considered Options
1. **Option 1 (Status Quo - Unbounded Async Execution):** Rely on default `WaitMsBeforeAsync` settings and unmonitored reactive notifications. *(Rejected: Causes frequent deadlocks and abandoned agent turns).*
2. **Option 2 (Polling Sleep Loops):** Instruct subagents to run bash/PowerShell `sleep` commands or poll `manage_task(Action='status')`. *(Rejected: Violates core anti-polling guidelines, wastes tokens, and risks infinite loops).*
3. **Option 3 (Tiered Synchronous Execution + Orchestrator Watchdog):** Mandate `WaitMsBeforeAsync: 10000` on all verification calls, recommend scoped test paths for inner loops, and empower the Orchestrator with an active 3-step Watchdog Protocol (`Detect -> Audit -> Wake-Up Ping`). *(Accepted).*

---

## 4. Decision
We have established the **Subagent Command Execution and Operational Anti-Hanging Protocol**:
1. **Mandatory Synchronous Parameters:** Every `run_command` invocation for test, lint, typecheck, or build MUST configure `WaitMsBeforeAsync: 10000`.
2. **Two-Tier Verification Strategy:**
   - *Inner Loop:* Targeted scoped tests (`npx vitest run <path>`) for immediate synchronous feedback (<3s).
   - *Outer Gate:* Full test suite (`npm test`, `npm run typecheck`, `npm run lint`) before publishing handoffs.
3. **Orchestrator Deadlock Watchdog Protocol:**
   - Orchestrator monitors subagent turns exceeding expected latency (>90s).
   - Audits tasks via `manage_task(Action='list')`.
   - Sends a wake-up ping (`send_message`) to break stalled `waiting_for_dependents` states.
4. **Protocol Harmonization:** Codified across `GEMINI.md`, `handoff-protocol.md`, `senior-dev.md`, and `orchestrator.md`.

---

## 5. Consequences
* **Positive:**
  - Complete elimination of silent background task deadlocks during development cycles.
  - Sub-second to 3-second feedback loops during development via scoped test execution.
  - Autonomous self-healing agent pipelines without requiring human PO intervention.
* **Negative:**
  - Slightly more verbose command parameters required for `run_command`.
  - Full suite verification that exceeds 10 seconds will occasionally spawn background tasks, which are now safely governed by the Watchdog protocol.

---

## 6. Compliance Verification
Compliance is enforced via an automated test suite ([src/test/antiHangingProtocol.test.ts](file:///D:/Projects/team-generator/src/test/antiHangingProtocol.test.ts)) verifying ADR presence, required MADR headers, and protocol synchronization across all role specifications.
