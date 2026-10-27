import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Supabase Keep-Alive Workflow & ADR Verification', () => {
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/supabase-keepalive.yml');
  const adrPath = path.resolve(process.cwd(), 'docs/adr/0038-supabase-keepalive-workflow.md');

  describe('Workflow Configuration & Security Specifications', () => {
    it('WF-01: verifies workflow file exists at expected path', () => {
      expect(fs.existsSync(workflowPath)).toBe(true);
    });

    it('WF-02: verifies twice-daily cron schedule trigger configuration', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      expect(workflowContent).toMatch(/cron:\s*['"]0 7,19 \* \* \*['"]/);
    });

    it('WF-03: verifies workflow_dispatch trigger for manual execution', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      expect(workflowContent).toContain('workflow_dispatch:');
    });

    it('WF-04: verifies strict least-privilege permissions configuration', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      expect(workflowContent).toMatch(/permissions:\s+contents:\s+read/);
    });

    it('WF-05: verifies dual secret fallback for SUPABASE_URL and VITE_SUPABASE_URL', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      expect(workflowContent).toContain('SUPABASE_URL: ${{ secrets.SUPABASE_URL || secrets.VITE_SUPABASE_URL }}');
    });

    it('WF-06: verifies dual secret fallback for SUPABASE_ANON_KEY and VITE_SUPABASE_ANON_KEY', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      expect(workflowContent).toContain('SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY || secrets.VITE_SUPABASE_ANON_KEY }}');
    });

    it('WF-07: verifies missing secret guardrail and actionable diagnostic instructions', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      expect(workflowContent).toContain('-z "${SUPABASE_URL:-}"');
      expect(workflowContent).toContain('-z "${SUPABASE_ANON_KEY:-}"');
      expect(workflowContent).toContain('Missing Supabase credentials in repository secrets!');
      expect(workflowContent).toContain('exit 1');
    });

    it('WF-08: verifies lightweight read query targeting PostgREST players endpoint', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      expect(workflowContent).toContain('/rest/v1/players?select=id&limit=1');
    });

    it('WF-09: verifies curl safety flags, timeout, and HTTP status code capture', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      expect(workflowContent).toContain('-s -o /dev/null -w "%{http_code}"');
      expect(workflowContent).toContain('--max-time 15');
    });

    it('WF-10: verifies acceptance criteria for HTTP 200 and 206 status codes', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      expect(workflowContent).toContain('[ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "206" ]');
    });

    it('WF-11: verifies error logging and non-zero exit code upon unexpected status', () => {
      const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
      expect(workflowContent).toContain('::error::Supabase keep-alive failed with HTTP status: $HTTP_STATUS');
      expect(workflowContent).toContain('exit 1');
    });
  });

  describe('ADR-0038 Documentation Integrity', () => {
    it('ADR-01: verifies ADR-0038 documentation file exists', () => {
      expect(fs.existsSync(adrPath)).toBe(true);
    });

    it('ADR-02: verifies ADR status and context regarding 7-day pause rule and twice-daily cadence', () => {
      const adrContent = fs.readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Status');
      expect(adrContent).toContain('Accepted');
      expect(adrContent).toMatch(/7\s*(?:consecutive\s*)?days|7-day/i);
      expect(adrContent).toMatch(/twice-daily|twice\s+daily|12-hour/i);
    });

    it('ADR-03: verifies step-by-step GitHub Secrets configuration instructions', () => {
      const adrContent = fs.readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('Settings');
      expect(adrContent).toContain('Secrets and variables');
      expect(adrContent).toContain('Actions');
      expect(adrContent).toContain('SUPABASE_URL');
      expect(adrContent).toContain('SUPABASE_ANON_KEY');
    });
  });
});
