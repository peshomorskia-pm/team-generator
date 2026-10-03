# ADR 0012: Production Deployment on Vercel and Supabase Cloud

* **Status:** Accepted
* **Date:** 2026-10-03
* **Deciders:** Orchestrator, Planner, Architect, Senior Dev, Code Reviewer, Document Writer
* **Consulted:** Project Guidelines (`GEMINI.md`), Architecture Specifications (`2_architecture.md`), Role Definitions (`.agents/roles/`)

---

## 1. Context and Problem Statement

Initially, the Team Generator prototype was hosted as a static distribution on GitHub Pages. As the application evolved into a full Single Page Application (SPA) utilizing React Router v7 and requiring real-time persistent relational storage for player rosters and match records, GitHub Pages introduced severe architectural limitations:

1. **Client-Side SPA Routing Failures:** Directly navigating or refreshing deep routes (such as `/generator`, `/players`, `/matches`, and `/rankings`) on GitHub Pages triggers HTTP 404 responses because the static web server seeks physical files matching the URI path. Mitigations (e.g. `404.html` redirection hacks or hash history routing) introduce flash-of-unloaded-content, fragile URL state, and poor developer and user experience.
2. **Persistence and Backend Integration:** The application requires a scalable, cloud-hosted relational database (PostgreSQL via Supabase) for live environments, distinct from local Docker development containers.
3. **Continuous Deployment & Secret Management:** The project required an automated CI/CD pipeline integrated directly with GitHub that securely injects environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) during production builds without exposing secrets in public repositories.

---

## 2. Decision Drivers

* **Seamless SPA Routing:** Support native HTML5 browser history routing across all deep paths without 404 hacks or client-side redirect workarounds.
* **Zero-Configuration GitHub CI/CD:** Automatic deployment preview and production promotion on Git push/merge events.
* **Production-Grade PostgreSQL Backend:** A high-availability managed database for `players`, `matches`, and `match_players` tables with automated backups and security rules.
* **Isolated Environment Configurations:** Clear demarcation between local development (Docker Supabase) and production (Supabase Cloud).
* **High Performance & Global Edge CDN:** Fast static asset distribution with modern edge caching.

---

## 3. Considered Options

1. **Option 1 (Chosen): Vercel Edge Network (SPA) + Supabase Cloud (PostgreSQL)**
   * Host the frontend SPA on Vercel's global edge platform.
   * Provide a root `vercel.json` file configuring single-page application URL rewrites (`{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}`).
   * Connect production builds to Supabase Cloud via managed Vercel Environment Variables.
2. **Option 2: GitHub Pages with 404.html Redirect Hack + Supabase Cloud**
   * Keep hosting on GitHub Pages, utilizing a custom `404.html` that encodes the path into query parameters and redirects to `index.html`.
   * *Rejected:* Fragile URL manipulation, visible flash/reloads on deep linking, inconsistent SEO/OpenGraph indexing, and awkward routing edge cases with React Router v7.
3. **Option 3: Custom VPS (Virtual Private Server) via Docker Compose**
   * Host both frontend Nginx and backend Supabase stack on a self-managed VPS.
   * *Rejected:* Substantial operational maintenance burden, manual SSL certificate renewal, lack of out-of-the-box global edge CDN, and unnecessary complexity for a serverless frontend + managed BaaS architecture.

---

## 4. Decision Outcome

We decided to deploy the production application to **Vercel** with backend services managed on **Supabase Cloud**.

### Implementation Details

1. **Frontend Hosting on Vercel:**
   * Live production URL: [https://team-generator-psi.vercel.app](https://team-generator-psi.vercel.app).
   * Rewrites configured via `vercel.json`:
     ```json
     {
       "rewrites": [
         { "source": "/(.*)", "destination": "/index.html" }
       ]
     }
     ```
     This ensures all deep routes (`/`, `/generator`, `/players`, `/matches`, `/rankings`) are cleanly resolved to `index.html`, allowing React Router v7 to handle client-side routing natively without 404 errors.
2. **Managed Cloud Database via Supabase Cloud:**
   * Production tables `players`, `matches`, and `match_players` deployed to a Supabase Cloud PostgreSQL instance.
   * Migrations (`supabase/migrations/`) are synchronized to production, maintaining identical schemas between local Docker containers and cloud environments.
3. **Dual Environment Configuration:**
   * **Local Development:** Configured via `.env.local` targeting local Docker Supabase (`http://127.0.0.1:54321`).
   * **Production:** Configured via Vercel dashboard environment variables targeting Supabase Cloud (`https://<project-ref>.supabase.co`).
4. **Deprecation of GitHub Pages:**
   * The legacy GitHub Pages deployment has been retired and unpublished.
   * All documentation, badges, and links are updated to point to the official Vercel production deployment.

---

## 5. Consequences

### Positive
* **Zero 404 Errors on Deep Navigation:** Full SPA routing fidelity on page refresh and direct link sharing.
* **Instant Continuous Delivery:** Production branch (`main`) automatically builds and deploys on merge.
* **Secure Secret Management:** Sensitive credentials and production keys are isolated in Vercel environment variables, keeping repository secrets safe.
* **Operational Simplicity:** Zero infrastructure server management; high reliability and automatic backups provided by Supabase Cloud.

### Negative
* **Vendor Dependency:** Dependency on Vercel and Supabase cloud platforms (mitigated by standard Vite build artifacts in `dist/` and standard PostgreSQL migrations).
* **Build Dependency:** External build triggers rely on Vercel service availability.

### Operational Runbook
* To update production, merge approved changes into `main` after standard PR review targeting `dev`.
* Production database migrations are executed against Supabase Cloud using Supabase CLI (`supabase db push`).
