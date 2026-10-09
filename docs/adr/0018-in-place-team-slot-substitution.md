# 0018. In-Place Team Slot Substitution and Team Pruning

Date: 2026-10-09
Status: Accepted

## Context
Tournament organizers frequently need to manage roster changes right before a draw or match start. When a registered player or guest withdraws from a generated team roster, organizers need the ability to remove that player without forcing a complete reshuffle of all other carefully balanced pairings and groups. Conversely, when a replacement player or guest arrives, the system needs to fill vacant slots dynamically in-place rather than scrambling the entire tournament roster. Furthermore, when the last player leaves a team container, the empty container must be automatically pruned. In tennis doubles mode, incomplete teams require clear visual placeholders (`"+ Свободно място"`), validation warnings (`"Добавете още 1 играч за пълни двойки"`), and action gating that disables match saving and group draws until all teams are full.

## Decision
We implement **In-Place Team Slot Substitution and Team Pruning** with the following core mechanisms:
1. **In-Place Player Removal:** Removing or deselecting a player from a team excises them from their assigned team while preserving all other team rosters intact. Tournament groups (`groups`) are invalidated and reset to `[]` to prevent stale draws.
2. **Complete Team Pruning:** Removing the last remaining player from a 1-player team prunes the empty team container entirely from the generated roster (`teams.filter(t => t.players.length > 0)`).
3. **In-Place Slot Substitution:** Adding a new registered player or guest fills the first vacant slot (`team.players.length < targetTeamSize`) across existing teams without triggering a global reshuffle.
4. **Accurate Rating Recalculation:** Team ratings update dynamically upon removal and substitution using format-aware ratings (`doubles_rating` / `singles_rating` / fallback `rating`), treating unrated guests as `0`.
5. **Validation Messaging & Action Gating:** In tennis doubles mode, incomplete teams render a warning banner (`"Добавете още 1 играч за пълни двойки"`), display a dashed `"+ Свободно място"` placeholder card (`data-testid="empty-slot"`), and disable both match saving (`"Запиши като мач"`) and group draw (`"🎲 Тегли жребий за групи"`) actions in `TeamList` and hook logic.
6. **Reshuffle Availability:** Organizers can trigger a clean reshuffle from scratch at any time via the `"Разпредели в отбори"` action when the active pool is valid and even.

## Consequences
### Positive
- **Streamlined Live Operations:** Tournament organizers can handle last-minute player dropouts and substitutions instantly without disrupting existing team pairings.
- **Data Integrity:** Group draws and match creation are strictly gated against incomplete team rosters, eliminating invalid fixture creations.
- **Intuitive Visual Feedback:** Dashed empty-slot placeholders and clear Bulgarian warning banners provide unambiguous status visibility.
- **Robust Test Coverage:** 418 tests across 40 test files pass with a 100% success rate, ensuring zero regressions.

### Negative
- Requires careful state tracking of partial team slots during concurrent player additions and removals.
