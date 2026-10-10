# ADR 0025: Tournament Hub UI & Navigation

## Context
Following the creation of the database schema and data hook (`useTournaments`) in PR 1, users required a dedicated tournament dashboard to browse, search, create, edit, and delete tournaments. Furthermore, navigation integration via the sidebar and routing setup were required.

## Decision
1. **Navigation Route & Icon**: Added the `/tournaments` route to `src/constants/navigation.ts` utilizing the `Trophy` icon with full Bulgarian localization ("Турнири").
2. **Tournaments Dashboard (`TournamentsPage`)**: Built a comprehensive tournament management page displaying statistics (total, active, completed, upcoming), interactive status tabs filter (All, Upcoming, Active, Completed), and search functionality.
3. **Tournament Cards & Modals**: Implemented `TournamentCard`, `TournamentModal` (create/edit with date/status/format validation), and `DeleteTournamentModal` with full Bulgarian localization and accessible modals.
4. **Bridge Placeholder**: Registered a placeholder route for `/tournaments/:id` in `src/App.tsx` ahead of PR 3.

## Consequences
- Provides users with a seamless, fully localized hub for managing tournaments.
- Fully tested with 524 passing tests across 47 test files (100% pass rate).
