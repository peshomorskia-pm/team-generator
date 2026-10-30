# 0043. Mobile Touch Targets and Card Badge Wrapping

## Status
Accepted

## Context
Following the baseline mobile viewport stabilization in ADR-0042, outdoor court usability audits on small-to-mid mobile viewports (360px–430px) revealed touch friction and visual layout regressions:
1. **Under-sized Touch Hit Targets**: Compact action triggers across key interactive modules—score presets in `TennisScoreEditor` (~22px), player removal "X" chips in `ActivePool` (~18px), team shuffle and delete buttons in `TeamCard` (~22px), roster player removal in `TeamCard` (~18px), and team counter stepper buttons in `TournamentInteractiveBoard` (32px)—fell significantly below recommended mobile touch guidelines ($\ge 36$px to 48px). Under outdoor conditions (sun glare, quick taps, moving players), these small targets led to mis-taps or missed interactions.
2. **Badge Clipping and Orphan Date Suffix Breaking**: In `MatchCard`, the header row contained multiple pills (date, format, group, round, stage, court, status) within non-wrapping or inflexible flex containers. On narrow mobile viewports, the Bulgarian date suffix (`г.`) could wrap onto an orphan line, and badges could overflow horizontally or squeeze action buttons.
3. **Tournament Stats Grid Asymmetry**: On `TournamentsPage`, the 2-column mobile stats summary grid had fixed `gap-4` and `p-5` with `w-12 h-12` icons, leading to cramped cards, height imbalances, and potential label overflow on 360px screens.

## Decision
1. **Touch Target Scaling to Court-Ready Standards ($\ge 36$px to 40px)**:
   - **`TennisScoreEditor.tsx`**: Regular set preset buttons (`6:0`..`7:6`) updated to `min-h-[36px] py-1.5 px-2.5 flex items-center justify-center font-bold text-xs rounded-lg active:scale-95 transition-transform` for ergonomic fast score entry.
   - **`ActivePool.tsx`**: Player badge removal button updated to `p-2 -mr-2 -my-1.5 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60`, expanding hit area using negative margin compensation without altering badge dimensions.
   - **`TeamCard.tsx`**: Header action buttons (shuffle and delete) updated to `p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg`. Roster player removal button updated to `p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md`.
   - **`TournamentInteractiveBoard.tsx`**: Team count stepper buttons (`decrementTeamCountBtn` and `incrementTeamCountBtn`) updated to `w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl font-bold text-base sm:text-sm` for reliable mobile stepping while preserving compact size on desktop.

2. **Defensive Badge Wrapping & Non-Breaking Date Strings**:
   - In `MatchCard.tsx` (both regular and playoff match headers):
     - The header container uses `flex flex-wrap items-center gap-1.5 min-w-0`.
     - The date pill is wrapped in `whitespace-nowrap shrink-0 inline-flex items-center gap-1` to prevent the Bulgarian date suffix (`г.`) from breaking onto an orphan line.
     - All status, format, group, round, stage, match number, and court badges have `whitespace-nowrap shrink-0` to prevent inner text wrapping.
     - Header action buttons wrapper has `shrink-0` to avoid being compressed by wrapping pills.

3. **Responsive Stats Grid Ergonomics in TournamentsPage**:
   - `TournamentsPage.tsx` stats summary row updated to `grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6`.
   - Individual stat cards sized to `p-3.5 sm:p-5 gap-2.5 sm:gap-4 min-w-0` with icon containers sized to `w-9 h-9 sm:w-12 sm:h-12` and icons sized to `w-4 h-4 sm:w-6 sm:h-6`.
   - Label paragraphs wrapped in `min-w-0` with `truncate` to prevent card height distortions on small viewports.

## Consequences
- **Positive**:
  - High outdoor court tap reliability with standard touch hit targets ($\ge 36$px).
  - Clean badge wrapping on narrow mobile screens (360px–430px) with zero orphan date suffix breaks.
  - Balanced 2-column stats cards on mobile viewports without text clipping or irregular card heights.
  - Zero breaking changes to component props, models, or state contracts.
- **Negative**:
  - Slightly increased vertical height for score editor preset rows due to 36px touch min-height.
