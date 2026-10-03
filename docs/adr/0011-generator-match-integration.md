# 11. Generator-to-Match Integration Architecture

## Status
Accepted

## Context
Users frequently generate balanced teams on the Team Generator page (`/generator`) and immediately want to record the fixture into the Match History & Tracker (`/matches`). Previously, users had to manually copy player names, navigate to the Matches tab, open the Match Creation modal, and re-enter all participants from scratch. This created friction and prone-to-error manual data entry.

We needed a seamless workflow to bridge the generator output to the existing `MatchModal` without introducing parallel duplicate modals or altering core database models.

## Decision Drivers
1. **Reuse Existing Components**: Leverage the existing robust `MatchModal` component rather than inventing a separate creation flow.
2. **Support Hybrid Rosters**: Successfully map both database players (`player_id`) and transient session guests (`guest_name`) into `MatchModal` team slots.
3. **Strict Constraints**: Only render the "Запиши като мач" (Save as Match) button when exactly two teams are generated.
4. **Clean Navigation**: On successful match insertion, automatically route the user to `/matches`. On cancellation, keep the generated pool and team assignments intact without side effects.

## Considered Options
- **Approach 1 (Chosen): In-place MatchModal Prefill and Navigation**
  - Add `onSaveAsMatch?: (team1: Team, team2: Team) => void` to `TeamList`.
  - Pass team data from `GeneratorPage` into `MatchModal` by populating `initialTeam1` and `initialTeam2`.
  - Map generator players/guests into `MatchParticipantInput` objects with proper guest tags (`(гост)`).
  - Invoke `createMatch` and redirect to `/matches` upon success.
- **Approach 2: Intermediate Session Cache / Redux Store Persistence**
  - Save generated teams to global store or session storage, then read them inside `/matches`.
  - Rejected as over-engineered and introduces stale state synchronization complexity.

## Consequences
- **Positive**:
  - Users can save generated teams as an official match with a single click.
  - Full support for database players and guest participants.
  - Comprehensive automated test coverage (245 tests across 31 files, 100% pass rate).
- **Negative**:
  - Requires `GeneratorPage` to coordinate state between `useTeamGenerator` and `useMatches`.
