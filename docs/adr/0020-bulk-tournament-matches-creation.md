# 0020. Bulk Tournament Match Creation Persistence & Routing

Date: 2026-10-09
Status: Accepted

## Context
Team Generator supports generating round-robin tournament fixture schedules in Tennis mode with registered players and guest participants. Previously, users could only record individual matches one by one or copy schedules to the clipboard. To streamline tournament management, users need a one-click capability to persist an entire generated tournament schedule directly into Supabase as upcoming fixtures without requiring full tournament schema migrations.

Key challenges addressed:
1. **Schema & Migration Constraints:** Supabase tables (`matches` and `match_players`) must store upcoming fixtures without breaking existing ELO rating calculation logic for played matches.
2. **Participant Polymorphism:** Support mixed rosters of registered database players (`player_id`) and guest participants (`guest_name`), adhering strictly to Supabase check constraints (`check_participant`).
3. **Resilience & Rollback:** Network failures during dual-batch insertion must not leave orphan match records in Supabase.
4. **Navigation & State Handoff:** Seamless redirection to `/matches` with the active status tab automatically set to "Предстоящи" and a dismissible Bulgarian success notification.

## Decision
1. **Two-Query Batch Insertion:**
   - Generate deterministic client-side UUIDs for all matches using `crypto.randomUUID()`.
   - Insert all match rows into the `matches` table with `team_1_score: null`, `team_2_score: null`, `match_format`, and ISO `played_at` timestamps.
   - Insert associated participant rows into `match_players` referencing the generated match UUIDs and correctly mapping team indices (0 or 1).
2. **Participant Polymorphism & DB Constraints:**
   - Implement guest detection (`is_guest`, `source === 'guest'`, or missing `id`).
   - If guest: set `player_id: null` and `guest_name: player.name`.
   - If registered player: set `player_id: player.id` and `guest_name: null`.
3. **Compensation Rollback:**
   - If `match_players` insertion fails after `matches` records are committed, execute a compensation cleanup query (`matches.delete().in('id', matchIds)`) to prevent orphan records.
4. **Navigation & UI Handoff:**
   - Expose `bulkCreateMatches` in `useMatches`.
   - On successful persistence, navigate to `/matches` passing state `{ fromBulkCreate: true, matchCount, statusFilter: 'upcoming' }`.
   - `MatchesPage` captures router state, activates the "Предстоящи" tab, and displays a green Bulgarian success banner (`"Успешно създадени {count} предстоящи мача от турнира!"`), clearing location state via `replace: true` to prevent recurring alerts.

## Consequences
- **Positive:** Users can persist full tournament schedules instantly with a single click, maintaining full support for guest participants and seamless navigation to upcoming matches.
- **Negative / Trade-offs:** Client-side batch insertions require explicit compensation rollback logic to handle partial network failures cleanly.
