# 1_intake_gate.md

## 1. Triage Verdict: 🟢 GREEN (Clear to Proceed)

### Executive Summary
The requested enhancement to eliminate legacy chess ELO displays from team cards and replace them with clean, format-aware win rate badges is **100% technically feasible, cleanly architected, and low-risk**. All prerequisite data structures, props, and calculation utilities (`getPlayerWinRate` in [src/utils/balance.ts](file:///D:/Projects/team-generator/src/utils/balance.ts#L29-L75)) already exist and are active across the application. The change requires zero schema modifications, zero API adjustments, and has a tightly bounded blast radius confined to [TeamCard.tsx](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx) and its accompanying unit tests in [TeamCard.test.tsx](file:///D:/Projects/team-generator/src/components/team/__tests__/TeamCard.test.tsx).

---

## 2. Business Feasibility & Acceptance Criteria

### Feasibility Assessment
- **Business Alignment**: Matches direct PO feedback ("Мисля, че няма нужда от средна успеваемост за отбора. Само на отделните играчи") following player observation of chess ELO ratings (`⭐ 2383`, `★ 1183`) appearing after populating teams.
- **Tennis Domain Integrity**: Replacing arbitrary legacy Elo integers with percentage win rates (`80%`, `100%`) or `"Нов"` maintains sports-first clarity and aligns team roster presentations directly with the player selection lists ([PlayerSelector.tsx](file:///D:/Projects/team-generator/src/components/generator/PlayerSelector.tsx), [ActivePool.tsx](file:///D:/Projects/team-generator/src/components/generator/ActivePool.tsx), and [TeamSlotPickerModal.tsx](file:///D:/Projects/team-generator/src/components/team/TeamSlotPickerModal.tsx)).

### Verifiable Acceptance Criteria
- [ ] **AC-1 (Clean Team Header)**: The team header in [TeamCard.tsx](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx#L40-L80) must **not** render any aggregate rating badge (`⭐`, numeric sum, or average). The header displays only: team index pill, team name, player count badge (`{count} играчи`), and configured action buttons (shuffle/delete).
- [ ] **AC-2 (Player Win Rate Badges)**: For individual players in [TeamCard.tsx](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx#L85-L122), replace legacy `★ {playerRating}` with a format-aware win rate badge computed via [`getPlayerWinRate(player, format)`](file:///D:/Projects/team-generator/src/utils/balance.ts#L29-L75):
  - Players with match history render `{winRate}%` (e.g. `100%`, `80%`) with `variant="emerald"`.
  - Unplayed / new players render `"Нов"` with `variant="slate"`.
- [ ] **AC-3 (Guest Player Handling)**: Guest players (`player.source === 'guest'`) render a clean `"Гост"` pill or neutral indicator consistent with [ActivePool.tsx](file:///D:/Projects/team-generator/src/components/generator/ActivePool.tsx#L109-L113) and [TeamSlotPickerModal.tsx](file:///D:/Projects/team-generator/src/components/team/TeamSlotPickerModal.tsx#L153-L157), avoiding erroneous win rate calculations.
- [ ] **AC-4 (Mode Isolation)**: When `mode === 'generic'`, all tennis win rate badges are suppressed, displaying player names cleanly.
- [ ] **AC-5 (Interactive Integrity)**: Empty slot placeholders (`+ Избери играч`), remove player buttons, shuffle buttons, and delete team actions remain 100% functional with touch-target compliance preserved (`min-w-[32px]`/`min-h-[32px]`).
- [ ] **AC-6 (Test Suite Green)**: All existing 69 test suites pass without regression, and [TeamCard.test.tsx](file:///D:/Projects/team-generator/src/components/team/__tests__/TeamCard.test.tsx) is updated to validate the win rate badges and the absence of the header rating badge.

---

## 3. Codebase Inspection & Technical Findings

### Inspected Components & Extension Points

1. **[TeamCard.tsx](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx)**:
   - **Header Aggregate Badge**: Currently calculates `displayTotalRating` in lines 21–35 and renders an amber `<Badge variant="amber" icon={Star}>{displayTotalRating}</Badge>` in lines 48–52. This memo and JSX will be removed. Unused `Star` icon from `lucide-react` will be pruned.
   - **Player Row Rating**: Currently resolves `playerRating` (lines 86–92) and renders `<span className="... text-amber-500 ...">★ {playerRating}</span>` (lines 103–107). This will be replaced with format-aware [`getPlayerWinRate(player, format)`](file:///D:/Projects/team-generator/src/utils/balance.ts#L29-L75) rendering a `<Badge>`.
   - **Props Contract**: [TeamCardProps](file:///D:/Projects/team-generator/src/types/index.ts#L78-L88) **already includes** `format?: 'singles' | 'doubles'` and `mode?: GeneratorMode`. No prop changes or interface modifications are required.

2. **[TournamentInteractiveBoard.tsx](file:///D:/Projects/team-generator/src/components/tournament/TournamentInteractiveBoard.tsx#L891-L908)**:
   - Renders [TeamList](file:///D:/Projects/team-generator/src/components/team/TeamList.tsx#L149-L161) passing `mode="tennis"` and `format={tournament.format}`.
   - [TeamList.tsx](file:///D:/Projects/team-generator/src/components/team/TeamList.tsx#L155-L156) already forwards `format={format}` and `mode={mode}` directly to every `<TeamCard />`.

3. **[GeneratorPage.tsx](file:///D:/Projects/team-generator/src/pages/GeneratorPage.tsx#L419-L435)**:
   - Renders [TeamList](file:///D:/Projects/team-generator/src/components/team/TeamList.tsx) passing `mode={mode}` and `format={effectiveFormat}`.
   - Automatically flows format context to `TeamCard` during general team generation.

4. **[TeamCard.test.tsx](file:///D:/Projects/team-generator/src/components/team/__tests__/TeamCard.test.tsx)**:
   - Line 25 (`renders total rating badge when present and greater than 0`): Asserts `screen.getByText('24')`. Must be updated to assert total rating badge is **not** rendered.
   - Line 35 (`renders each player with name and rating`): Asserts `★ 8`, `★ 9`, `★ 7`. Must be updated to assert win rate badges (`Нов` or `{winRate}%`).
   - Line 67 (`completely hides total rating badge and player rating stars when mode is generic`): Must be updated to verify win rate badges are hidden in generic mode.

### Blast Radius Analysis
- **Primary Source File**: `src/components/team/TeamCard.tsx` (1 file).
- **Primary Test File**: `src/components/team/__tests__/TeamCard.test.tsx` (1 file).
- **Secondary Impact**: None. `TeamList.tsx`, `TournamentInteractiveBoard.tsx`, and `GeneratorPage.tsx` already supply the needed props.

---

## 4. Constraints, Risks & Trade-Offs

### Technical Proposal Evaluation

#### Proposal 1: Strict TeamCard Scoping (Recommended)
- **Scope**: Confine modifications strictly to [TeamCard.tsx](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx) and [TeamCard.test.tsx](file:///D:/Projects/team-generator/src/components/team/__tests__/TeamCard.test.tsx).
- **Pros**:
  - Exact adherence to `0_context.md` strict scoping directive.
  - Zero risk of regression in tournament group stages or bracket partition logic.
  - Minimal diff and rapid implementation.
- **Cons**:
  - If a tournament advances to the group phase (`gen.groups.length > 0`), [GroupCard.tsx](file:///D:/Projects/team-generator/src/components/group/GroupCard.tsx#L84-L88) still currently displays `⭐ {displayTotalRating}` and `★ {playerRating}`.
- **Assessment**: Satisfies PO ticket objective completely for the team board phase observed by the user.

#### Proposal 2: Dual TeamCard + GroupCard Alignment (Alternative / Follow-up Scope)
- **Scope**: Simultaneously update [GroupCard.tsx](file:///D:/Projects/team-generator/src/components/group/GroupCard.tsx) and [GroupTeamPickerModal.tsx](file:///D:/Projects/team-generator/src/components/group/GroupTeamPickerModal.tsx) to match the win rate badge convention.
- **Pros**: Uniform UI across both initial team generation and subsequent tournament group stages.
- **Cons**: Expands blast radius beyond ticket constraints; requires modifying group test suites ([GroupCard.test.tsx](file:///D:/Projects/team-generator/src/components/group/__tests__/GroupCard.test.tsx)).
- **Assessment**: Recommended as a separate fast-follow ticket or PO opt-in, preserving strict scoping for the current branch.

---

## 5. Architectural Objectives & Roadmap

The Architect (`2_architecture.md`) and subsequent implementers should execute along these milestones:

1. **Milestone 1 — Component Refactor ([TeamCard.tsx](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx))**:
   - Prune `displayTotalRating` memo and header rating `<Badge>`.
   - Remove unused `Star` import from `lucide-react`.
   - Import `getPlayerWinRate` from `../../utils/balance`.
   - Replace player row `★ {playerRating}` with `<Badge variant={winRateInfo.isNew ? 'slate' : 'emerald'} size="sm">{winRateInfo.label}</Badge>` (or `"Гост"` pill when `player.source === 'guest'`).
2. **Milestone 2 — Unit Test Updates ([TeamCard.test.tsx](file:///D:/Projects/team-generator/src/components/team/__tests__/TeamCard.test.tsx))**:
   - Update assertions for clean header (confirm absence of total rating).
   - Update player assertions to match win rate badge format (`Нов` or `{winRate}%`).
   - Verify generic mode hides win rate badges.
3. **Milestone 3 — Verification & Gate Check**:
   - Execute full Vitest suite (`npm test -- --run`).
   - Run typecheck (`npm run typecheck` or equivalent) and linter.
