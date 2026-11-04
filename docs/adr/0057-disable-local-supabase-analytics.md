# Architectural Decision Record (ADR-0057): Disable Local Supabase Analytics and Vector Service

## Metadata
- **Status:** Accepted
- **Ticket:** Disable Local Supabase Analytics (`chore/disable-local-supabase-analytics`)
- **Date:** 2026-11-04
- **Branch:** `chore/disable-local-supabase-analytics`
- **Target Branch:** `dev`

---

## Context & Problem Statement
During local development using the Supabase CLI (`supabase start`), the Docker container `supabase_vector_team-generator` enters an unrecoverable crash-loop (`Restarting (0)`). Vector fails to establish a TCP/socket connection to query the Docker host daemon for container logs (`ConnectError("tcp connect error", Os { code: 111, kind: ConnectionRefused })`). This results in unnecessary CPU usage, disk I/O, and noise in Docker Desktop.

Furthermore, `team-generator` is a client-side SPA backed by Supabase Postgres and Auth. The application codebase (`src/**`) has zero dependencies on Supabase Analytics or Logflare endpoints. Local developer debugging relies exclusively on browser DevTools console output and container logs (`docker logs`).

---

## Decision
Disable local analytics in `supabase/config.toml`:
1. Set `[analytics] enabled = false`.
2. Keep dormant port (`55327`) and backend (`postgres`) configuration options intact for TOML schema validity.
3. Restart local Supabase stack using `npx supabase stop` and `npx supabase start`.

---

## Consequences
- **Positive:**
  - Prevents provisioning or starting `supabase_vector_team-generator` and `supabase_analytics_team-generator`.
  - Resolves container crash-loops, eliminating background CPU churn and Docker error spam.
  - Zero impact on PostgreSQL (`supabase_db`), PostgREST Data API (`supabase_rest`), GoTrue Auth (`supabase_auth`), Kong Gateway (`supabase_kong`), Storage, Realtime, Inbucket, or Studio (`supabase_studio`).
  - Zero modifications to application source code (`src/**`).
  - 100% test pass rate across all 70 test files (992 tests).
- **Negative / Trade-offs:**
  - The "Logs" explorer panel in Supabase Studio (`http://127.0.0.1:55323`) will not show collected Logflare log events. Local debugging continues unhindered via `npm run dev` and `docker logs`.
