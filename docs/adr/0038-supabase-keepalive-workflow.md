# Architectural Decision Record: Supabase Inactivity Keep-Alive Scheduled Workflow

## Status
Accepted

## Context
Under the Supabase Free Tier policy, projects that experience no database queries, API requests, or dashboard activity for 7 consecutive days (168 hours) are automatically paused to conserve compute resources.

When a Supabase project is paused:
1. All client API queries fail immediately with connection or gateway errors.
2. Unpausing requires manual login to the Supabase dashboard and initiating a project restore, which typically takes several minutes.
3. Live tournament events and casual match sessions in the Team Generator application face unexpected downtime and degraded user experience if an unpausing event occurs during play.

To guarantee high availability and prevent dormant pauses during tournament off-seasons, an automated, low-overhead keep-alive mechanism is required.

## Decision
We implement an automated scheduled healthcheck workflow in [`.github/workflows/supabase-keepalive.yml`](../../.github/workflows/supabase-keepalive.yml) using GitHub Actions.

Key architectural decisions:
1. **Cadence (`0 7 */3 * *`)**: Run every 3 days at 07:00 UTC, providing a safe >96-hour buffer before the 7-day inactivity pause threshold is reached.
2. **On-Demand Trigger (`workflow_dispatch`)**: Enable manual workflow execution directly from the GitHub Actions UI or CLI for instant health verification.
3. **Target Query (`/rest/v1/players?select=id&limit=1`)**: Execute a lightweight, read-only PostgREST SELECT query against the public `players` table. This invokes the PostgreSQL query planner and execution engine, resetting the internal Supabase activity tracking timestamp.
4. **Secret Fallback Resolution**: Support both standard backend secret naming conventions (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) and Vite frontend conventions (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) via `${{ secrets.SUPABASE_URL || secrets.VITE_SUPABASE_URL }}` and `${{ secrets.SUPABASE_ANON_KEY || secrets.VITE_SUPABASE_ANON_KEY }}`.
5. **Least Privilege & Secure Injection**: Scoped runner permissions strictly to `contents: read`. Secrets are injected solely through environment variables (`env:`) and never echoed to standard output or run logs.

## Rationale for Technical Choices
* **3-Day Interval**: Provides >96 hours of buffer against transient network failures, GitHub Actions runner delays, or scheduled maintenance windows.
* **PostgREST Query vs `pg_isready` / Supabase CLI**: Directly executes an actual SQL query on the Postgres engine, ensuring compute activity is registered by Supabase metrics, without requiring heavy database client tools, pooler passwords, or connection pool exhaustion.
* **Curl on Ubuntu Runner**: Native, zero-dependency utility pre-installed on `ubuntu-latest`. Avoids external npm packages or third-party GitHub Actions that introduce supply-chain risks.
* **Validation & Diagnostic Guardrails**: Immediately validates that secrets are present before issuing network requests, outputting actionable setup instructions if configuration is incomplete.

## Step-by-Step Repository Secret Setup
To ensure the scheduled workflow can authenticate with the Supabase project:

1. Navigate to your GitHub repository:
   - Go to **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret**.
3. Add the following secrets:
   - **`SUPABASE_URL`** (or **`VITE_SUPABASE_URL`**):
     - Value: `https://ctmusfnyftdrjopumwcw.supabase.co` (or your project URL).
   - **`SUPABASE_ANON_KEY`** (or **`VITE_SUPABASE_ANON_KEY`**):
     - Value: Your Supabase anonymous (`anon`) public API key obtained from Supabase Project Settings -> API.
4. Click **Add secret** to save each credential.

## Consequences & Operational Considerations

### Positive
* **Zero Manual Maintenance**: Supabase database remains continuously active without requiring developer dashboard logins.
* **Automated Failure Alerting**: If the database is unreachable or returns an HTTP status other than 200/206, the workflow fails and sends GitHub Actions failure notifications.
* **Minimal Resource Footprint**: Each run executes in under 10 seconds and consumes less than 1 minute of GitHub Actions runner quota per month.

### Operational Caveats & GitHub 60-Day Policy
* **GitHub Inactivity Policy**: GitHub automatically disables scheduled cron workflows in repositories that have had no commit activity for 60 consecutive days. If the repository is inactive for nearly two months, maintainers must trigger a manual run (`workflow_dispatch`) or push a commit to keep scheduled workflows active.
