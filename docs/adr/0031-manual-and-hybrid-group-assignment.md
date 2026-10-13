# 0031. Manual and Hybrid Group Assignment in Tournaments

## Context

Tournament organizers requested advanced group configuration capabilities beyond fully automated shuffling:
1. **Manual Curation**: The ability to manually initialize blank groups and curate slots team-by-team from an unassigned team pool.
2. **Hybrid Mobility**: The ability to move or swap teams between groups after automatic draw or manual placement.
3. **Domain Constraint Enforcement**: A strict domain rule requiring that each active group must contain at least 3 teams to enable round-robin schedule generation.
4. **Draft Persistence**: Preservation of 800ms debounced persistence to Supabase `draft_state` JSONB across all group mutations.

## Decision

We extended the tournament generator hook and components with the following architecture:
1. **State & Hook API (`useTeamGenerator`)**:
   - Added `initializeBlankGroups()`, `assignTeamToGroup()`, `removeTeamFromGroup()`, `moveTeamBetweenGroups()`, `autoFillRemainingGroupTeams()`, and `hasValidGroupsForSchedule`.
   - Maintained 800ms debounced auto-save to Supabase `draft_state` for all group modifications.
2. **Component Architecture**:
   - **`GroupTeamPickerModal`**: Modal dialog providing searchable selection of unassigned teams by team/player name and star rating.
   - **`GroupCard`**: Enhanced with dashed `[ + Избери отбор ]` action slots up to calculated group capacity, remove (`X`) buttons, and inline group transfer selectors (`Премести в...`).
   - **`GroupList`**: Added manual grouping controls, validation status badges, warning banners, and schedule generation gating.
3. **Localization & UX**:
   - All end-user UI copy is strictly in natural Bulgarian while code, comments, tests, and commit messages remain in English.

## Consequences

- **Positive**: Organizers have full flexibility to manually curate groups or fine-tune automatic draws while maintaining strict round-robin integrity ($\ge 3$ teams per group) and persistence.
- **Negative**: Increased complexity in state management across group mutations and draft persistence.
