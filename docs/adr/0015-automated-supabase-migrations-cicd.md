# ADR 0015: Automated Supabase Migrations CI/CD Pipeline

* **Status:** Accepted
* **Date:** 2026-10-06
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** Project Guidelines (`GEMINI.md`), Architecture Specifications (`2_architecture.md`), Role Definitions (`.agents/roles/`)

---

## 1. Context and Problem Statement

Database migrations in `supabase/migrations/` define the relational schema for `players`, `matches`, and `match_players`. Historically, applying these migrations to the production Supabase Cloud project (`ctmusfnyftdrjopumwcw`) required manual developer intervention via local CLI commands (`supabase db push`) or ad-hoc SQL Editor execution.

Manual execution introduces critical operational risks:
1. **Schema Drift:** Migrations merged to `main` could be forgotten or delayed, leaving the production database schema out of sync with the live application frontend.
2. **Human Error:** Developers running manual CLI commands against production risk misconfigurations or applying uncommitted/stale schema changes.
3. **Auditability & Traceability:** Lack of automated deployment logs tied directly to commit hashes and merge events.

An automated, reliable CI/CD pipeline is required to synchronize schema migrations automatically to Supabase Cloud upon merge to `main`.

---

## 2. Decision Drivers

* **Single Source of Truth:** Schema migrations committed to version control must be the authoritative source applied to production.
* **Automation & Reliability:** Eliminate manual deployment steps when schema changes merge to `main`.
* **Zero Disruption to Existing Workflows:** Only trigger pipeline execution when migration files (`supabase/migrations/**`) are modified.
* **Secure Credential Handling:** Protect production database access tokens and passwords using GitHub Actions encrypted secrets without exposing them in repositories or logs.
* **Manual Recovery Path:** Provide an on-demand trigger mechanism (`workflow_dispatch`) for hotfixes or re-runs.

---

## 3. Considered Options

1. **Option 1 (Chosen): Automated GitHub Actions Pipeline with Supabase CLI (`supabase/setup-cli`)**
   * Trigger on pushes to `main` filtered strictly to `supabase/migrations/**`, plus manual `workflow_dispatch`.
   * Securely link the project using repository secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`.
   * Apply pending migrations via `supabase db push`.
2. **Option 2: Manual Developer CLI Deployments (`supabase db push` locally)**
   * Developers locally authenticate and run `supabase link` and `supabase db push`.
   * *Rejected:* Prone to human error, schema drift, credential distribution hazards across developer machines, and inconsistent deployment history.
3. **Option 3: Manual SQL Copy-Paste in Supabase Web Dashboard**
   * Manually copy migration SQL files and execute in the web dashboard SQL editor.
   * *Rejected:* Completely bypasses migration tracking metadata, risks partial execution failures, and defeats version control guarantees.

---

## 4. Decision Outcome

We decided to implement an automated Continuous Delivery pipeline via GitHub Actions in [`.github/workflows/supabase-migrations.yml`](../../.github/workflows/supabase-migrations.yml).

### Implementation Details

1. **Target Project & Secrets Contract:**
   * **Project Reference:** `ctmusfnyftdrjopumwcw` (Supabase Cloud).
   * **`SUPABASE_DB_PASSWORD`:** PostgreSQL database password stored as an encrypted GitHub Actions secret.
   * *Note on Tokens:* Personal access tokens (`SUPABASE_ACCESS_TOKEN`) and `supabase link` were eliminated in favor of direct connection via the Supabase Session Pooler (`--db-url`), completely bypassing Management API permission constraints and rate limits.

2. **Trigger Configuration:**
   * **`push` to `main`**: Path-filtered strictly to `supabase/migrations/**` to avoid redundant runner execution for frontend-only commits.
   * **`workflow_dispatch`**: Enables manual pipeline execution from GitHub Actions UI.

3. **Least Privilege Execution:**
   * Workflow runner: `ubuntu-latest`.
   * Runner permissions scoped strictly to `contents: read`.

4. **Pipeline Steps:**
   * Checkout repository via `actions/checkout@v4`.
   * Setup official CLI via `supabase/setup-cli@v1` pinned to version `2.118.0`.
   * Repair baseline migration history if needed (`supabase migration repair --status applied ... --db-url "$DB_URL"`).
   * Push schema migrations via `supabase db push --db-url "$DB_URL"`.

---

## 5. Consequences

### Positive
* **Automated Delivery:** Production database migrations deploy automatically on merge to `main`.
* **Schema Synchronization:** Eliminates schema drift between version control and production Supabase Cloud.
* **Audit Trail:** Every migration push is recorded in GitHub Actions run history with associated commits and logs.
* **Controlled Access:** Eliminates the need to distribute production database passwords to all developers' workstations.

### Negative / Operational Caveats
* **Secret Management:** Requires configuring and rotating `SUPABASE_DB_PASSWORD` in repository secrets.
* **Destructive Migration Risk:** Requires rigorous code review for destructive schema migrations (e.g., column drops or table alterations) before merging to `main`.
* **Runner Dependency:** Depends on GitHub Actions and Supabase API availability during merges.
