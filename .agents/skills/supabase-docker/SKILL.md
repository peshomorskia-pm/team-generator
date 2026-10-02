---
name: supabase-docker
description: Local Docker-based Supabase infrastructure operations and CLI runbook.
---

# Skill: Supabase Docker Operations & CLI Runbook

## 1. Overview & Name
- **Name:** `supabase-docker`
- **Category:** Infrastructure & Database Operations
- **Description:** Local Docker-based Supabase infrastructure operations and CLI runbook.

## 2. Trigger
Specify the exact conditions or tasks that trigger loading this skill into context via Progressive Disclosure:
- **Trigger Condition:** Managing local Supabase instance lifecycle, generating TypeScript definitions, running database migrations, or resetting local database state.
- **Target Roles:** Orchestrator, Senior Dev

## 3. Context & Prerequisites
- **Required tools / CLIs:** Docker Desktop (running and healthy), Node.js, `npm`, `npx supabase` (via project devDependency).
- **Expected workspace state:** Clean working tree or active feature branch.
- **Security Guidance:** Use default local credentials only for development (`postgres`/`postgres`). Never use local anon keys or dev secrets in production environments.

## 4. Port Mapping Reference
When running locally via Docker, Supabase maps standard ports as follows:
- **API Gateway (REST / Auth / Storage):** `http://127.0.0.1:54321`
- **PostgreSQL Database:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Supabase Studio (Dashboard):** `http://127.0.0.1:54323`
- **Inbucket (Local Email Testing):** `http://127.0.0.1:54324`

## 5. Procedure (Step-by-Step Runbook)

1. **Step 1: Start Local Supabase Stack**
   ```bash
   npx supabase start
   # or npm run db:start
   ```
   *Verification / Expected Result:* Docker containers start up and the terminal prints API URL, GraphQL URL, DB URL, Studio URL, Inbucket URL, `anon key`, and `service_role key`.

2. **Step 2: Inspect Service Status**
   ```bash
   npx supabase status
   # or npm run db:status
   ```
   *Verification / Expected Result:* Displays all service URLs and keys along with container health status.

3. **Step 3: Create a New Migration**
   ```bash
   npx supabase migration new <migration_name>
   ```
   *Verification / Expected Result:* A new timestamped `.sql` file is generated under `supabase/migrations/`.

4. **Step 4: Reset Local Database State**
   ```bash
   npx supabase db reset
   # or npm run db:reset
   ```
   *Verification / Expected Result:* Drops local database, reapplies all migrations from `supabase/migrations/`, and applies seeds from `supabase/seed.sql` if present.

5. **Step 5: Generate TypeScript Types**
   ```bash
   npx supabase gen types typescript --local > src/types/supabase.ts
   # or npm run db:types
   ```
   *Verification / Expected Result:* Updates or generates `src/types/supabase.ts` matching the current schema of the local database.

6. **Step 6: Stop Local Supabase Stack**
   ```bash
   npx supabase stop
   # or npm run db:stop
   ```
   *Verification / Expected Result:* Stops all local Supabase Docker containers, freeing system resources and ports.

## 6. Fallback & Troubleshooting
- **Docker Daemon Unavailable:** If `supabase start` fails with "Cannot connect to the Docker daemon", verify Docker Desktop is running and WSL2/hypervisor engine is initialized.
- **Port Conflict (e.g. 54321 or 54322 already in use):** Check if another Postgres instance or container is binding to 54322 or 54321 (`Get-NetTCPConnection -LocalPort 54321` or `lsof -i :54321`), or adjust ports in `supabase/config.toml`.
- **Database Drift / Corrupted Container State:** Run `npx supabase stop` followed by `npx supabase db reset` to cleanly recreate database containers and reapply migrations.
