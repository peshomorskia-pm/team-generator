# 0027. Interactive Team Board (Manual and Hybrid Slot Builder)

Date: 2026-10-10
Status: Accepted

## Context
Doubles tournaments frequently involve pre-determined pairs or specific manual seating requirements where organizers cannot rely solely on random or algorithmic split distribution. Previously, teams could only be formed via automatic split generation (`useTeamGenerator`). Organizers needed an interactive board to manually assign specific players to team slots, configure team counts, initialize blank team containers, hybrid auto-fill remaining unassigned slots before drawing tournament groups, and maintain zero regression for generic or singles generation modes.

## Decision
We extended the team generation workflow with the following architectural and component decisions:
1. **Extended `useTeamGenerator` Hook**:
   - Added `formationMode` (`'auto' | 'manual'`).
   - Added `initializeBlankTeams(numTeams: number, playersPerTeam: number)` to spawn empty team containers with pre-allocated blank player slots.
   - Added `assignPlayerToTeam(teamId: string, player: Player)` and `removePlayerFromTeam(teamId: string, playerId: string)` to support precise manual slot picking and in-place player unassignment.
   - Added `autoFillRemainingSlots(balance: boolean)` to perform hybrid auto-filling of remaining empty slots from the unassigned active player pool.
2. **Interactive UI & Components**:
   - **`TeamSettings`**: Added mode switcher (`🤖 Автоматично` vs `📋 Интерактивна дъска (Ръчно)`) and team count / size selectors.
   - **`TeamCard`**: Rendered accessible dashed slots (`+ Избери играч`) for empty positions and action buttons for player removal. Preserved empty team containers in manual mode (overriding ADR 0018 auto-mode pruning).
   - **`TeamSlotPickerModal`**: Built an accessible slot picking modal with unassigned player search filtering, rating badges, and a quick-add guest feature.
   - **`TeamList`**: Added a hybrid auto-fill trigger banner (`✨ Попълни останалите автоматично`) and enforced strict action gating (`🎲 Тегли жребий за групи` and `Запиши като мач` remain disabled until all slots are filled).

## Consequences
- **Positive**: Organizers can now curate pre-determined doubles pairs or manually construct tournament rosters while retaining hybrid auto-fill capabilities.
- **Positive**: 100% Bulgarian localization compliance across all new UI components and modals.
- **Positive**: Robust test coverage with 553 tests passing across 49 files with 100% green pass rate.
- **Negative / Trade-offs**: Added state complexity around manual vs automatic formation modes, requiring careful handling of unassigned pools and capacity constraints.
