# 19. Tennis Round-Robin Match Schedule & Single-Group Optimization

Date: 2026-10-09
Status: Accepted

## Context

The Team Generator application supports both generic team balancing and tennis tournament group management. Previously, tournament group partitioning supported multi-group draws for 6 or more teams ($N \ge 6$) but lacked:
1. **Single-group optimization** for small tournaments with 3 to 5 participants ($N \in \{3, 4, 5\}$), where partitioning into multiple groups is unnecessary and counter-intuitive.
2. **Automated match schedule generation** using a standard round-robin algorithm (Berger circle method) to pair teams within each group across successive rounds with proper bye management for odd participant counts.
3. **Clipboard integration** for exporting generated match schedules alongside team rosters to messaging apps (Viber, WhatsApp) in clean Bulgarian plaintext.

## Decision

We have implemented the following architectural components:
1. **Berger Circle Round-Robin Algorithm (`src/utils/roundRobin.ts`)**:
   - Generates round-robin schedules for any group of $N \ge 3$ teams.
   - Handles odd participant counts by introducing a `null` bye sentinel, resulting in exactly $\frac{N(N-1)}{2}$ unique matches across $N$ rounds (for odd $N$) or $N-1$ rounds (for even $N$).
2. **Data Models (`src/types/tournament.ts`)**:
   - Typed `TournamentMatch` (round, team1, team2, restingTeam, etc.) and `TournamentRound` data structures.
3. **Single-Group Auto-Assignment**:
   - For $N \in \{3, 4, 5\}$ in tennis mode, teams are automatically assigned to `"Група А"` upon team generation, suppressing the redundant inter-group lottery button and exposing the match schedule generation CTA directly.
4. **UI Presentation (`MatchScheduleList.tsx`)**:
   - Displays match schedules partitioned by round with VS cards, star ratings, player rosters, and resting team badges.
5. **Clipboard & Localization**:
   - Extended clipboard formatting (`src/utils/clipboard.ts`) to format rounds and matchups in Bulgarian. All UI labels and actions are strictly localized.

## Consequences

- **Positive**: Enables complete end-to-end tournament round-robin scheduling for tennis groups, eliminating manual pairing overhead and streamlining small tournament workflows.
- **Negative**: Adds state management overhead for tournament schedules within `useTeamGenerator`, mitigated by clean reactive invalidation on pool changes and redraws.
