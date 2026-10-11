# 0028. Tournament Past Date Validation

Date: 2026-10-11
Status: Accepted

## Context
Organizers could previously pick or enter past dates when creating a new tournament, which could lead to scheduling inconsistencies and unrealistic historical entries created as future events. The application requires strict validation preventing tournament creation in the past, while preserving full edit flexibility for historical tournaments.

## Decision
1. **Native Datepicker Constraint (`min`)**: In create mode, the tournament date input restricts past dates by applying `min={getTodayFormatted()}`.
2. **Synchronous Submission Guard**: Implemented a validation guard in `handleSubmit` within `TournamentModal` that intercepts submission attempts with past dates, displaying the Bulgarian error message `"Датата на провеждане не може да бъде в миналото."` and preventing persistence.
3. **Historical Edit Mode Exemption**: In edit mode (`isEditMode = Boolean(initialData)`), date constraints are relaxed (`min` is unset, and the past-date submit guard is bypassed) to ensure existing historical tournaments can still be updated.

## Consequences
- **Positive**: Eliminates accidental or intentional scheduling of new tournaments in the past. Improves data integrity across tournament management.
- **Negative**: None. Historical records remain fully editable.
- **Compliance**: Adheres to the Dual-Language Boundary Protocol (pure Bulgarian UI copy, English code & tests).
