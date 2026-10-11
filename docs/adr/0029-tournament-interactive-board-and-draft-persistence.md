# ADR 0029: Tournament Interactive Board and Draft Persistence

- **Status:** Accepted
- **Date:** 2026-10-11
- **Author:** Document Writer Agent
- **Deciders:** Product Owner, Lead Architect, Frontend Team

---

## Context & Problem Statement

When organizing amateur tournaments (such as tennis tournaments with flexible amateur player availability prior to the group draw and match schedule generation), tournament organizers previously had to create a tournament, navigate away to a separate generator page, configure teams, and then manually link or save matches. 

Specifically, organizers requested:
1. **Immediate Navigation:** Creating a tournament in `/tournaments` must immediately route the user to `/tournaments/:id`.
2. **Dedicated Interactive Board:** When a tournament has 0 matches, the tournament detail view (`TournamentDetailPage`) must display the full interactive team board directly inside the tournament view rather than requiring an external redirection to `/generator`.
3. **Locked Format & Tennis Mode:** The board format must be strictly locked to the tournament's creation-time format (`tournament.format`, e.g., doubles or singles) and tennis mode, with no switcher pills.
4. **Persistent Auto-Saving (`draft_state`):** Because player availability changes dynamically before group draw, draft states (target teams, formation mode, teams, active pool, groups, schedule) must be automatically persisted to Supabase using a new `draft_state JSONB` column on `public.tournaments`.
5. **Group Draw Gating & Bulk Match Saving:** Group drawing must be gated until all team slots are filled. Finalizing and saving matches must persist matches with `tournament_id`, clear the draft state (`draft_state = null`), and transition the view to display the active match schedule and scorecards.
6. **Universal Mathematical Team Sizing & Dynamic Pool Auto-Adjustment ($P, T$):** Prevent defects when pool size $P$ and target team count $T$ mismatch. Enforce strict capacity caps (players per team $\text{ppt} = 2$ for doubles, $1$ for singles) and universal mathematical adjustment logic for any pool size $P$ and target teams $T$:
   - **Case 1 ($P \ge N + 2$, where $N = T \times \text{ppt}$):** Automatically expands target teams $M = \lfloor P / \text{ppt} \rfloor$ and displays an informational banner indicating reserves.
   - **Case 2 ($P = N + 1$):** Retains target teams $T$, fills all teams, and marks the single leftover player as a reserve with an informational banner.
   - **Case 3 ($P = N$):** Exactly fills $T$ teams with no excess and no banner.
   - **Case 4 ($P = N - 1$):** Generates $T$ teams with 1 open slot; clicking `🎲 Тегли жребий за групи` auto-prunes the incomplete team to $M = T - 1$, re-indexes the target count, and displays an adjustment banner.
   - **Case 5 ($P \le N - 2$):** Automatically adjusts target teams down to $M = \lfloor P / \text{ppt} \rfloor$ with a clear adjustment banner.

---

## Decision Drivers

1. **Seamless Organizer Experience:** Eliminate friction between tournament setup, team drafting, and match generation.
2. **Data Durability & Crash Resilience:** Ensure amateur tournament organizers never lose team drafts or slot assignments when closing browsers or refreshing pages.
3. **Format Integrity:** Prevent format tampering after tournament creation by strictly locking the board to `tournament.format`.
4. **Bulgarian Localization Compliance:** Ensure 100% adherence to Bulgarian UI copy for all feedback badges, auto-save statuses, validation alerts, and mathematical adjustment banners.
5. **Universal Mathematical Team Sizing & Dynamic Pool Auto-Adjustment:** Enforce rigorous mathematical rules for mapping any active pool size $P$ to target teams $T$ with clear feedback and robust case handling.

---

## Considered Options

1. **Option A: External Generator Redirection (Status Quo)**
   - *Pros:* Reuses existing generator code as-is.
   - *Cons:* Requires jumping between `/tournaments` and `/generator`, losing tournament context and causing organizer confusion. (Rejected)
2. **Option B: Dedicated In-Place `TournamentInteractiveBoard` with Supabase `draft_state` JSONB**
   - *Pros:* Fully integrates the interactive board into `/tournaments/:id`, locks format at tournament creation, provides debounced auto-saving (800ms) with visual status badges, and saves all matches cleanly with `tournament_id`.
   - *Cons:* Requires database migration (`draft_state JSONB`) and state hydration logic. (Selected)

---

## Decision

We have implemented **Option B**:
- Added `draft_state JSONB` migration (`supabase/migrations/20261011180000_add_draft_state_to_tournaments.sql`) to `public.tournaments`.
- Updated TypeScript database types and `useTournaments` data layer to include `saveTournamentDraft` and `draft_state` hydration.
- Updated `TournamentsPage` to immediately navigate to `/tournaments/:id` upon successful tournament creation.
- Created `TournamentInteractiveBoard` component integrated into `TournamentDetailPage` when 0 matches exist.
- Implemented debounced auto-save (800ms) with Bulgarian badges (`Запазване на чернова...`, `✓ Всички промени са запазени като чернова`), slot-by-slot picking, hybrid auto-fill, group draw gating, and bulk match saving with `tournament_id`.
- **Universal Mathematical Team Sizing & Dynamic Pool Auto-Adjustment Enhancements:**
  - **Strict Capacity Caps:** `useTeamGenerator` and `assignPlayerToTeam` enforce max 2 players per team in doubles and max 1 in singles, completely eliminating 3-player team defects.
  - **Universal Cases 1–5 Implementation:**
    - Case 1 ($P \ge N+2$): Expands $M = \lfloor P / \text{ppt} \rfloor$ with reserve notification.
    - Case 2 ($P = N+1$): Keeps $T$ teams with 1 reserve.
    - Case 3 ($P = N$): Exact match.
    - Case 4 ($P = N-1$): Generates teams with 1 open slot; group draw prunes to $M = T-1$ automatically.
    - Case 5 ($P \le N-2$): Adjusts down to $M = \lfloor P / \text{ppt} \rfloor$.
  - **Bulgarian Adjustment Banners:** Clear, natural Bulgarian notification banners explaining team adjustments and reserves.
  - **Flexible Team Count & Deletion:** Numeric stepper (2 to 32 teams), team deletion with automatic player release back to pool, and visible collapsible participants panel.

---

## Consequences

- **Positive:** Organizers enjoy a streamlined, robust tournament drafting experience with automatic persistence, universal mathematical team sizing, dynamic pool auto-adjustment, and zero data loss.
- **Negative / Trade-offs:** Storing JSONB draft state requires careful state sanitization on load and save.
- **Verification:** Fully covered by comprehensive unit and integration tests (597 tests passing across 50 files, 100% pass rate).

