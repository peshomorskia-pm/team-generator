# 22. Dynamic Multi-Group Round-Robin Bye Teams

Date: 2026-10-09

## Status

Accepted

## Context

When round-robin tournaments feature multiple odd-sized groups (e.g. 2 or 3 groups of 3 teams), multiple teams rest (bye) simultaneously in each round. 
Previously, `MatchScheduleList` used `.find()` on the schedule array, which truncated the resting team display to a single resting team without group affiliation. This resulted in missing bye indicators for second and third groups in multi-group tournaments (e.g., 6 teams drawn into 2 groups of 3 teams).

## Decision

We implement dynamic multi-group resting team aggregation and adaptive badge rendering in `MatchScheduleList.tsx` and plain-text clipboard export in `clipboard.ts`:
1. **Dynamic Aggregation:** In `MatchScheduleList.tsx`, for each round, collect and deduplicate all resting teams across odd groups into a `Map<string, { team: Team; groupName: string }>` keyed by `groupId`.
2. **Adaptive Badge Formatting:** 
   - When multiple groups exist in the schedule (`hasMultipleGroups = new Set(schedule.map(m => m.groupId)).size > 1`), render badges formatted as `Почива: {team.name} ({groupName})`.
   - When a single group exists, render `Почива: {team.name}` without redundant group parenthesis.
3. **Responsive UI Presentation:** Wrap bye badges in a flex container (`flex flex-wrap items-center gap-2`) with custom amber pill styling.
4. **Clipboard Parity:** Update `formatScheduleForClipboard` to partition sections by group and explicitly include resting teams (`Почива: {team.name} ({players})`).

## Consequences

### Positive
- Full visibility of all resting teams across all odd groups in multi-group tournaments.
- Clean backward compatibility for single-group round-robin schedules.
- 100% Bulgarian localization compliance for all UI elements and clipboard exports.
- Robust test coverage (467 tests passing across 42 files).

### Negative
- Slightly more complex data transformation in `MatchScheduleList` to aggregate and group-map round matches.
