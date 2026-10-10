# 26. Tournament Detail View and Generator Integration

Date: 2026-10-10
Status: Accepted

## Context
Having established the schema, data hooks (PR 1), and Tournament Hub UI (PR 2), users needed a dedicated tournament dashboard (`/tournaments/:id`) and seamless generator integration that links created matches directly to the tournament. Previously, clicking on a tournament card navigated to a placeholder route. Furthermore, the team generator (`/generator`) operated strictly standalone without awareness of tournaments or ability to attach `tournament_id` to generated match fixtures.

## Decision
1. **Tournament Detail Page (`/tournaments/:id`)**:
   - Replaced the placeholder route with `TournamentDetailPage.tsx`.
   - Displays header metadata (title, Bulgarian date formatted as `DD.MM.YYYY г.`, format badge, status badge).
   - Includes a quick status switcher segmented control (`Чернова`, `В ход`, `Приключил`), edit modal trigger, delete modal trigger, and back navigation link to `/tournaments`.
   - Renders a prominent CTA banner (`🎲 Стартирай генератор за турнира`) when no matches exist or to launch the generator in context.
   - Filters and displays tournament matches with status tabs (`Всички`, `Изиграни`, `Предстоящи`), dynamic group tabs, score editing via `MatchModal`, and match deletion.
   - Handles success notifications upon returning from the generator via browser navigation state (`"Успешно записани {count} мача за турнира!"`).

2. **Generator Page Integration (`/generator?tournamentId=...`)**:
   - Updated `GeneratorPage.tsx` to read the `?tournamentId=` query parameter and fetch tournament metadata.
   - Renders a contextual top banner (`Турнир: {title} ({formatLabel})`) with a return link.
   - Automatically locks mode to Tennis and locks format to the tournament's configured format (`singles` or `doubles`), preventing unauthorized mismatch.
   - Updated `bulkCreateMatches` in `useMatches.ts` to attach `tournament_id` to all bulk-generated match rows.
   - Redirects back to `/tournaments/:id` with success state upon saving.

## Consequences
- **Positive**: Provides a complete end-to-end tournament management workflow from creation to scheduling, match score recording, and status progression. Fully localized in Bulgarian and backed by 538 passing tests across 48 test suites.
- **Negative / Trade-offs**: Requires careful management of navigation state and URL search parameters across route boundaries.
