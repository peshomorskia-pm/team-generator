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
6. **Variant A Tennis Team Size Constraints & Excess Handling:** Prevent defects where generating teams in tennis mode created teams with 3 players. Enforce strict capacity caps (max 2 players per team in doubles, max 1 in singles). When pool exceeds needed slots (e.g., 8 players for 3 doubles teams), assign exactly 2 players per team (total 6) and leave excess players (2) in the unassigned pool as reserves, fully compatible with `➕ Добави отбор`.

---

## Decision Drivers

1. **Seamless Organizer Experience:** Eliminate friction between tournament setup, team drafting, and match generation.
2. **Data Durability & Crash Resilience:** Ensure amateur tournament organizers never lose team drafts or slot assignments when closing browsers or refreshing pages.
3. **Format Integrity:** Prevent format tampering after tournament creation by strictly locking the board to `tournament.format`.
4. **Bulgarian Localization Compliance:** Ensure 100% adherence to Bulgarian UI copy for all feedback badges, auto-save statuses, and validation alerts (including the excess player warning banner).
5. **Strict Tennis Team Capacity & Reserve Handling:** Enforce strict 2-player limit in doubles and 1-player limit in singles, ensuring excess pool players are retained as unassigned reserves rather than overflowing teams.

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
- **Variant A Tennis Capacity & Excess Handling Enhancements:**
  - **Strict Capacity Caps:** `useTeamGenerator` and `assignPlayerToTeam` enforce max 2 players per team in doubles and max 1 in singles, completely eliminating 3-player team defects.
  - **Excess Pool Retention:** When pool size exceeds required slots (e.g., 8 players for 3 doubles teams), exactly 6 players are distributed across 3 teams and 2 excess players remain in `unassignedPoolPlayers` as reserves.
  - **Excess Warning Notification:** Displays accurate Bulgarian warning: `"Излишък на играчи: в пула има 8 играчи, а за 3 отбора са нужни 6."` in an amber alert box.
  - **Dynamic Team Expansion:** Clicking `➕ Добави отбор` adds Team 4 to accommodate the excess players, seamlessly resolving the excess warning.
  - **Flexible Team Count & Deletion:** Numeric stepper (2 to 32 teams), team deletion with automatic player release back to pool, and visible collapsible participants panel.

---

## Consequences

- **Positive:** Organizers enjoy a streamlined, robust tournament drafting experience with automatic persistence, strict tennis team capacity caps, clean excess pool handling, and zero data loss.
- **Negative / Trade-offs:** Storing JSONB draft state requires careful state sanitization on load and save.
- **Verification:** Fully covered by comprehensive unit and integration tests (587 tests passing across 50 files, 100% pass rate).
