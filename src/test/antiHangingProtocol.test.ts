import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Operational Anti-Hanging & Synchronous Execution Protocol Verification', () => {
  const rootDir = process.cwd();
  const geminiPath = path.resolve(rootDir, 'GEMINI.md');
  const handoffProtoPath = path.resolve(rootDir, '.agents/protocols/handoff-protocol.md');
  const seniorDevPath = path.resolve(rootDir, '.agents/roles/senior-dev.md');
  const orchestratorPath = path.resolve(rootDir, '.agents/roles/orchestrator.md');
  const adr0041Path = path.resolve(rootDir, 'docs/adr/0041-subagent-command-execution-and-anti-hanging-protocol.md');

  // Group 1: ADR-0041 Documentation Integrity
  describe('ADR-0041 Documentation Integrity', () => {
    it('AHP-01: ADR file exists at docs/adr/0041-subagent-command-execution-and-anti-hanging-protocol.md', () => {
      expect(fs.existsSync(adr0041Path)).toBe(true);
    });

    it('AHP-02: ADR status is "Accepted" and date is valid', () => {
      const content = fs.readFileSync(adr0041Path, 'utf-8');
      expect(content).toContain('**Status:** Accepted');
      expect(content).toMatch(/\*\*Date:\*\*\s*\d{4}-\d{2}-\d{2}/);
    });

    it('AHP-03: ADR documents "WaitMsBeforeAsync: 10000", "Two-Tier", and "Deadlock Watchdog"', () => {
      const content = fs.readFileSync(adr0041Path, 'utf-8');
      expect(content).toContain('WaitMsBeforeAsync: 10000');
      expect(content).toMatch(/Two-Tier/i);
      expect(content).toMatch(/Deadlock Watchdog/i);
    });
  });

  // Group 2: GEMINI.md Core System Protocols
  describe('GEMINI.md Core System Protocols', () => {
    it('AHP-04: Contains "Anti-Hanging & Synchronous Execution Protocol" in Section 1', () => {
      const content = fs.readFileSync(geminiPath, 'utf-8');
      expect(content).toContain('Anti-Hanging & Synchronous Execution Protocol');
    });

    it('AHP-05: Details "WaitMsBeforeAsync: 10000" and scoped test execution guidelines', () => {
      const content = fs.readFileSync(geminiPath, 'utf-8');
      expect(content).toContain('WaitMsBeforeAsync: 10000');
      expect(content).toMatch(/scoped\/targeted test runs/i);
    });

    it('AHP-06: Incorporates watchdog monitoring clause in Section 4 lifecycle', () => {
      const content = fs.readFileSync(geminiPath, 'utf-8');
      const section4Index = content.indexOf('## 4. Execution Protocol & User Interaction Guardrails');
      expect(section4Index).toBeGreaterThan(0);
      const section4Content = content.slice(section4Index);
      expect(section4Content).toMatch(/watchdog/i);
      expect(section4Content).toContain('3-Step Watchdog Protocol');
    });
  });

  // Group 3: Handoff Protocol Specification
  describe('Handoff Protocol Specification', () => {
    it('AHP-07: Contains Section 8 "Subagent Execution Guardrail & Anti-Hanging Watchdog Protocol"', () => {
      const content = fs.readFileSync(handoffProtoPath, 'utf-8');
      expect(content).toContain('## 8. Subagent Execution Guardrail & Anti-Hanging Watchdog Protocol');
    });

    it('AHP-08: Details 3-step watchdog recovery algorithm (Detection, Audit, Wake-Up Ping) and send_message', () => {
      const content = fs.readFileSync(handoffProtoPath, 'utf-8');
      expect(content).toContain('Detection');
      expect(content).toContain('Audit');
      expect(content).toContain('Wake-Up Ping');
      expect(content).toContain('send_message');
    });

    it('AHP-09: Mandates WaitMsBeforeAsync >= 5000 and bans sleep polling', () => {
      const content = fs.readFileSync(handoffProtoPath, 'utf-8');
      expect(content).toContain('WaitMsBeforeAsync: 10000');
      expect(content).toContain('5000');
      expect(content).toMatch(/sleep/i);
      expect(content).toMatch(/forbidden|prohibited/i);
    });
  });

  // Group 4: Senior Dev Role Specification
  describe('Senior Dev Role Specification', () => {
    it('AHP-10: Mandates WaitMsBeforeAsync: 10000 in Core Responsibilities', () => {
      const content = fs.readFileSync(seniorDevPath, 'utf-8');
      const respIndex = content.indexOf('## 4. Core Responsibilities');
      const constraintsIndex = content.indexOf('## 5. Strict Constraints & Boundaries');
      const respContent = content.slice(respIndex, constraintsIndex);
      expect(respContent).toContain('WaitMsBeforeAsync: 10000');
    });

    it('AHP-11: Specifies two-tier verification (scoped inner loop + full suite gate)', () => {
      const content = fs.readFileSync(seniorDevPath, 'utf-8');
      expect(content).toMatch(/scoped verification/i);
      expect(content).toMatch(/complete test suite/i);
    });

    it('AHP-12: Enforces prohibition of indefinite silent background task waiting in Constraints', () => {
      const content = fs.readFileSync(seniorDevPath, 'utf-8');
      const constraintsIndex = content.indexOf('## 5. Strict Constraints & Boundaries');
      const constraintsContent = content.slice(constraintsIndex);
      expect(constraintsContent).toContain('Prohibition of Indefinite Silent Background Task Waiting');
    });
  });

  // Group 5: Orchestrator Role Specification
  describe('Orchestrator Role Specification', () => {
    it('AHP-13: Specifies Active Subagent Watchdog & Deadlock Prevention responsibility', () => {
      const content = fs.readFileSync(orchestratorPath, 'utf-8');
      expect(content).toContain('Active Subagent Watchdog & Deadlock Prevention');
    });

    it('AHP-14: Details task audit (manage_task) and wake-up ping (send_message) procedure', () => {
      const content = fs.readFileSync(orchestratorPath, 'utf-8');
      expect(content).toContain('manage_task');
      expect(content).toContain('send_message');
    });

    it('AHP-15: Confirms Zero Source Code Inspection Rule compatibility', () => {
      const content = fs.readFileSync(orchestratorPath, 'utf-8');
      expect(content).toContain('Zero Source Code Inspection Rule clarification');
      expect(content).toContain('manage_task');
      expect(content).toContain('send_message');
    });
  });
});
