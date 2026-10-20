# 0031. Manual and Hybrid Group Assignment in Tournaments

## Context

Tournament organizers requested advanced group configuration capabilities beyond fully automated shuffling:
1. **Manual Curation**: The ability to manually initialize blank groups and curate slots team-by-team from an unassigned team pool.
2. **Hybrid Mobility**: The ability to move or swap teams between groups after automatic draw or manual placement.
3. **Domain Constraint Enforcement**: A strict domain rule requiring that each active group must contain at least 3 teams to enable round-robin schedule generation.
4. **Draft Persistence**: Preservation of 800ms debounced persistence to Supabase `draft_state` JSONB across all group mutations.
5. **Schedule CTA Unification**: Elimination of redundant informational banner boxes and duplicate save buttons in favor of a single unified action bar in the schedule section header (`💾 Запиши мачове за турнира`).

## Decision

We extended the tournament generator hook and components with the following architecture:
1. **State & Hook API (`useTeamGenerator`)**:
   - Added `initializeBlankGroups()`, `assignTeamToGroup()`, `removeTeamFromGroup()`, `moveTeamBetweenGroups()`, `autoFillRemainingGroupTeams()`, and `hasValidGroupsForSchedule`.
   - **Group Sizing Alignment**: For $N \ge 6$ (including 9, 10, 11, 12, 13, 14, 15, 16, etc.), `initializeBlankGroups` uses the exact same `calculateGroupSizes(N)` formula as automatic draw, setting `targetSize` so that $\sum \text{slots} = N$ and every group has $\ge 3$ slots (e.g. 16 teams creates 4 groups of 4 slots = 16 empty dashed slots). For 3, 4, 5 teams, creates 1 single group (`Група А`) with $N$ slots.
   - Maintained 800ms debounced auto-save to Supabase `draft_state` for all group modifications.
2. **Component Architecture**:
   - **`GroupTeamPickerModal`**: Modal dialog providing searchable selection of unassigned teams by team/player name and star rating.
   - **`GroupCard`**: Enhanced with dashed `[ + Избери отбор ]` action slots up to `targetSize`, remove (`X`) buttons, and inline group transfer selectors (`Премести в...`).
   - **`GroupList`**: Added manual grouping controls, validation status badges, warning banners, and schedule generation gating.
   - **`MatchScheduleList` & Schedule CTA Unification**: Removed the redundant informational banner box and duplicate save button. Unified the save action into the schedule header via `saveLabel="💾 Запиши мачове за турнира"` while preserving backward compatibility (`⚡ Запиши всички мачове` for generic generator mode).
3. **Localization & UX**:
   - All end-user UI copy is strictly in natural Bulgarian while code, comments, tests, and commit messages remain in English.

## Consequences

- **Positive**: Organizers have full flexibility to manually curate groups or fine-tune automatic draws while maintaining strict round-robin integrity ($\ge 3$ teams per group) and persistence. Furthermore, UI clutter has been eliminated via a single unified schedule save action in the header.
- **Negative**: Increased complexity in state management across group mutations and draft persistence.

