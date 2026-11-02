# 2_architecture.md: Technical Architecture Specification for Team & Group Roster Win Rate Badges

## 1. Overview & Architectural Goals
Following user observation ("след като вкарам играчите в отборите има елота") and direct PO decision ("Мисля, че няма нужда от средна успеваемост за отбора. Само на отделните играчи"), this specification defines the technical contracts and implementation blueprints to:
1. **Completely eliminate aggregate team rating badges** (`⭐ 2383`, `⭐ 2400`) and their `Star` icons from formed team headers ([TeamCard.tsx](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx)) and tournament group cards ([GroupCard.tsx](file:///D:/Projects/team-generator/src/components/group/GroupCard.tsx)).
2. **Replace legacy chess rating stars** (`★ 1183`, `★ 1200`) on roster player rows with format-aware sports win rate badges computed via [`getPlayerWinRate`](file:///D:/Projects/team-generator/src/utils/balance.ts):
   - **Active Players**: `{winRateInfo.winRate}%` (e.g. `80%`, `100%`) styled with emerald pill.
   - **New / Unplayed Players**: `"Нов"` styled with neutral gray pill.
   - **Guest Players**: `"Гост"` styled with amber pill.
3. **Preserve Generic Mode Isolation**: In `mode === 'generic'`, all win rate, `"Нов"`, and `"Гост"` badges are suppressed to keep non-sports rosters clean.
4. **Update ADR-0049**: Expand the architectural decision record from player selection pools to include formed teams and tournament group stages.
5. **Update Unit Test Suites**: Transition tests in [TeamCard.test.tsx](file:///D:/Projects/team-generator/src/components/team/__tests__/TeamCard.test.tsx) and [GroupCard.test.tsx](file:///D:/Projects/team-generator/src/components/group/__tests__/GroupCard.test.tsx) to assert clean headers and win rate badge states.

---

## 2. Directory Hierarchy & File Tree

```
D:/Projects/team-generator/
├── docs/
│   └── adr/
│       └── 0049-player-selection-winrate-badges.md    # [MODIFIED] Expand scope to TeamCard & GroupCard
├── src/
│   ├── types/
│   │   └── index.ts                                   # [MODIFIED] Add optional isGuest & source to Player
│   ├── components/
│   │   ├── team/
│   │   │   ├── TeamCard.tsx                           # [MODIFIED] Prune header rating, add player win rate pill
│   │   │   └── __tests__/
│   │   │       └── TeamCard.test.tsx                  # [MODIFIED] Assert clean header, test win rate badge states
│   │   └── group/
│   │       ├── GroupCard.tsx                          # [MODIFIED] Prune team rating, add player win rate pill
│   │       ├── GroupTeamPickerModal.tsx               # [OPTIONAL/ALIGNMENT] Clean ratings in group slot modal
│   │       └── __tests__/
│   │           └── GroupCard.test.tsx                 # [MODIFIED] Assert clean group card, test win rate badges
```

---

## 3. Data Models, Schemas & Interface Contracts

### 3.1 Type Contract Extension ([src/types/index.ts](file:///D:/Projects/team-generator/src/types/index.ts))
Ensure [`Player`](file:///D:/Projects/team-generator/src/types/index.ts#L3-L16) includes `isGuest` and `source` to maintain full TypeScript alignment with [`GeneratorPlayer`](file:///D:/Projects/team-generator/src/types/generator.ts#L4-L18):
```typescript
export interface Player {
  id: string;
  name: string;
  rating?: number;
  singles_rating?: number;
  doubles_rating?: number;
  singles_matches_played?: number;
  singles_wins?: number;
  singles_losses?: number;
  doubles_matches_played?: number;
  doubles_wins?: number;
  doubles_losses?: number;
  winRate?: number;
  isGuest?: boolean;
  source?: 'registered' | 'guest';
}
```

### 3.2 Win Rate Resolution Contract ([src/utils/balance.ts](file:///D:/Projects/team-generator/src/utils/balance.ts#L29-L77))
Components consume:
```typescript
import { getPlayerWinRate, PlayerWinRateInfo } from '../../utils/balance';

// Signature:
function getPlayerWinRate(
  player?: PlayerLike | null,
  format?: 'singles' | 'doubles'
): PlayerWinRateInfo;
```

### 3.3 Visual Badge Contract Matrix
| Player Classification | Condition | Badge Text | Tailwind Pill Classes |
| :--- | :--- | :--- | :--- |
| **Guest Player** | `player.isGuest \|\| player.source === 'guest'` | `"Гост"` | `bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400` |
| **New / Unplayed** | `!isGuest && winRateInfo.isNew` | `"Нов"` | `bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400` |
| **Active Player** | `!isGuest && !winRateInfo.isNew` | `{Math.round(winRateInfo.winRate)}%` | `bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400` |
| **Generic Mode** | `mode === 'generic'` | *None (Hidden)* | *N/A* |

All pills share the base sizing: `px-2 py-0.5 text-xs font-semibold rounded-full inline-flex items-center shrink-0`.

---

## 4. Component / Module Specifications

### Module 1: `TeamCard.tsx` ([src/components/team/TeamCard.tsx](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx))
1. **Prune Legacy State & Icons**:
   - Remove `Star` from `lucide-react` import.
   - Import `getPlayerWinRate` from `../../utils/balance`.
   - Remove `displayTotalRating` `useMemo` block completely.
2. **Team Header Sanitization** (`lines 40–80`):
   - Remove `<Badge variant="amber" size="sm" icon={Star}>{displayTotalRating}</Badge>`.
   - Header JSX structure remains strictly:
     - Left: Team index pill (`span`, `{index + 1}`), Team name (`h3`, `{team.name}`).
     - Right: Player count badge (`<Badge variant="slate" size="sm">{team.players.length} играчи</Badge>`), shuffle button (`onShuffleTeam`), delete button (`onDeleteTeam`).
3. **Roster Player Sanitization** (`lines 85–122`):
   - Remove `playerRating` resolution (`format === 'singles' ? ...`).
   - Remove `★ {playerRating}` amber span.
   - Compute player badge state:
     ```tsx
     const isGuest = Boolean(player.isGuest || player.source === 'guest');
     const winRateInfo = getPlayerWinRate(player, format);
     ```
   - Render badge container before `onRemovePlayer` button:
     ```tsx
     {mode !== 'generic' && (
       isGuest ? (
         <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 shrink-0">
           Гост
         </span>
       ) : winRateInfo.isNew ? (
         <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 shrink-0">
           Нов
         </span>
       ) : (
         <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0">
           {Math.round(winRateInfo.winRate)}%
         </span>
       )
     )}
     ```

### Module 2: `GroupCard.tsx` ([src/components/group/GroupCard.tsx](file:///D:/Projects/team-generator/src/components/group/GroupCard.tsx))
1. **Prune Legacy State & Icons**:
   - Remove `Star` from `lucide-react` import.
   - Import `getPlayerWinRate` from `../../utils/balance`.
   - Inside `group.teams.map((team, idx) => { ... })`, delete the `displayTotalRating` IIFE calculation (`lines 52–67`).
2. **Team Item Header Sanitization** (`lines 73–104`):
   - In `<div className="flex items-center space-x-1.5 shrink-0">`:
     - Delete `<Badge variant="amber" size="sm" icon={Star}>{displayTotalRating}</Badge>`.
     - Retain only `onRemoveTeam` action button.
3. **Team Players Roster Sanitization** (`lines 107–137`):
   - Remove `playerRating` calculation (`lines 108–114`).
   - Remove `★ {playerRating}` amber span (`lines 124–128`).
   - Compute win rate and guest state for each player:
     ```tsx
     const isGuest = Boolean(player.isGuest || player.source === 'guest');
     const winRateInfo = getPlayerWinRate(player, format);
     ```
   - Render the format-aware win rate pill matching the Module 1 styling.

### Module 3: ADR-0049 Update ([docs/adr/0049-player-selection-winrate-badges.md](file:///D:/Projects/team-generator/docs/adr/0049-player-selection-winrate-badges.md))
- Update Title / Scope: "Player Selection & Roster Win Rate Badges".
- Update Context: Document user observation of chess ELO ratings (`⭐ 2383`, `★ 1183`) in formed teams and group cards, and PO decision to drop team aggregate rating.
- Update Decision Section: Document sanitization of `TeamCard.tsx` and `GroupCard.tsx`, completely removing aggregate team rating badges and rendering format-aware win rate badges (`{winRate}%`, `"Нов"`, `"Гост"`).
- Record Consequences: Complete visual consistency across player pool, team board, and tournament group stages.

---

## 5. Automated Test Blueprints & Scenarios

### 5.1 Test Suite: `TeamCard.test.tsx` ([src/components/team/__tests__/TeamCard.test.tsx](file:///D:/Projects/team-generator/src/components/team/__tests__/TeamCard.test.tsx))

```typescript
describe('TeamCard - Clean Header & Win Rate Badges', () => {
  // T-TC-1: Total Rating Removal from Header
  it('does not render total rating badge in header even if totalRating is provided', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      totalRating: 24,
      players: [{ id: 'p-1', name: 'Иван', rating: 8 }],
    };
    render(<TeamCard team={team} index={0} />);
    expect(screen.queryByText('24')).not.toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Отбор 1')).toBeInTheDocument();
  });

  // T-TC-2: Unplayed / New Players render "Нов"
  it('renders "Нов" pill for unplayed players without match history', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      players: [
        { id: 'p-1', name: 'Иван' },
        { id: 'p-2', name: 'Петър' },
      ],
    };
    render(<TeamCard team={team} index={0} />);
    const newBadges = screen.getAllByText('Нов');
    expect(newBadges).toHaveLength(2);
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  // T-TC-3: Active Players render percentage win rate
  it('renders percentage win rate pill for players with match history', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      players: [
        {
          id: 'p-1',
          name: 'Иван',
          singles_matches_played: 10,
          singles_wins: 8,
        },
      ],
    };
    render(<TeamCard team={team} index={0} format="singles" />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.queryByText('Нов')).not.toBeInTheDocument();
  });

  // T-TC-4: Guest Players render "Гост" pill
  it('renders "Гост" pill for guest players', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      players: [
        { id: 'g-1', name: 'Стефан', isGuest: true },
        { id: 'g-2', name: 'Николай', source: 'guest' },
      ],
    };
    render(<TeamCard team={team} index={0} />);
    const guestBadges = screen.getAllByText('Гост');
    expect(guestBadges).toHaveLength(2);
  });

  // T-TC-5: Generic Mode Hides All Badges
  it('completely hides win rate, "Нов", and "Гост" badges when mode is generic', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      totalRating: 24,
      players: [
        { id: 'p-1', name: 'Иван', singles_matches_played: 10, singles_wins: 8 },
        { id: 'p-2', name: 'Петър' },
        { id: 'g-1', name: 'Стефан', isGuest: true },
      ],
    };
    render(<TeamCard team={team} index={0} mode="generic" />);
    expect(screen.queryByText('24')).not.toBeInTheDocument();
    expect(screen.queryByText('80%')).not.toBeInTheDocument();
    expect(screen.queryByText('Нов')).not.toBeInTheDocument();
    expect(screen.queryByText('Гост')).not.toBeInTheDocument();
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  // T-TC-6: Format sensitivity
  it('uses format-specific statistics (doubles vs singles)', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Отбор 1',
      players: [
        {
          id: 'p-1',
          name: 'Иван',
          singles_matches_played: 10,
          singles_wins: 10, // 100% singles
          doubles_matches_played: 4,
          doubles_wins: 1,  // 25% doubles
        },
      ],
    };
    render(<TeamCard team={team} index={0} format="doubles" />);
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
  });
});
```

### 5.2 Test Suite: `GroupCard.test.tsx` ([src/components/group/__tests__/GroupCard.test.tsx](file:///D:/Projects/team-generator/src/components/group/__tests__/GroupCard.test.tsx))

```typescript
describe('GroupCard - Clean Group & Team Win Rates', () => {
  // T-GC-1: Absence of Team Total Rating in Group
  it('does not render total rating badges on teams in group', () => {
    render(<GroupCard group={dummyGroup} mode="tennis" format="doubles" />);
    expect(screen.queryByText('3100')).not.toBeInTheDocument();
    expect(screen.queryByText('2800')).not.toBeInTheDocument();
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  // T-GC-2: Win Rate Badges rendered for group roster players
  it('renders format-aware win rate badges for players in tournament groups', () => {
    const groupWithStats: TournamentGroup = {
      id: 'grp-1',
      name: 'Група А',
      teams: [
        {
          id: 't-1',
          name: 'Отбор 1',
          players: [
            {
              id: 'p-1',
              name: 'Иван Иванов',
              doubles_matches_played: 5,
              doubles_wins: 4, // 80%
            },
            {
              id: 'p-2',
              name: 'Георги Димитров', // 0 matches -> Нов
            },
            {
              id: 'p-3',
              name: 'Гост Играч',
              isGuest: true,
            },
          ],
        },
      ],
    };
    render(<GroupCard group={groupWithStats} mode="tennis" format="doubles" />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Нов')).toBeInTheDocument();
    expect(screen.getByText('Гост')).toBeInTheDocument();
  });

  // T-GC-3: Generic Mode Isolation in GroupCard
  it('hides all win rate and guest badges when mode is generic', () => {
    const groupWithStats: TournamentGroup = {
      id: 'grp-1',
      name: 'Група А',
      teams: [
        {
          id: 't-1',
          name: 'Отбор 1',
          players: [
            { id: 'p-1', name: 'Иван Иванов', doubles_matches_played: 5, doubles_wins: 4 },
            { id: 'p-2', name: 'Георги Димитров' },
            { id: 'p-3', name: 'Гост Играч', isGuest: true },
          ],
        },
      ],
    };
    render(<GroupCard group={groupWithStats} mode="generic" />);
    expect(screen.queryByText('80%')).not.toBeInTheDocument();
    expect(screen.queryByText('Нов')).not.toBeInTheDocument();
    expect(screen.queryByText('Гост')).not.toBeInTheDocument();
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });
});
```

---

## 6. Implementation Guidelines for Senior Dev

1. **Interface Update**: Add `isGuest?: boolean;` and `source?: 'registered' | 'guest';` to `Player` in `src/types/index.ts`.
2. **TeamCard Refactoring** (`src/components/team/TeamCard.tsx`):
   - Remove unused `Star` import.
   - Remove `displayTotalRating` `useMemo`.
   - Remove amber badge from header.
   - Replace player row `★ {playerRating}` with win rate / guest / new pill.
3. **GroupCard Refactoring** (`src/components/group/GroupCard.tsx`):
   - Remove unused `Star` import.
   - Remove `displayTotalRating` IIFE calculation and amber badge from team sub-headers.
   - Replace player row `★ {playerRating}` with win rate / guest / new pill.
4. **ADR-0049 Update** (`docs/adr/0049-player-selection-winrate-badges.md`):
   - Expand context, decision, and consequences to encompass `TeamCard.tsx` and `GroupCard.tsx`.
5. **Unit Tests**:
   - Update `src/components/team/__tests__/TeamCard.test.tsx` using blueprints in Section 5.1.
   - Update `src/components/group/__tests__/GroupCard.test.tsx` using blueprints in Section 5.2.
6. **Verification Guardrail**:
   - Run Vitest synchronously with `WaitMsBeforeAsync: 10000`:
     `npx vitest run src/components/team/__tests__/TeamCard.test.tsx src/components/group/__tests__/GroupCard.test.tsx`
   - Run full test suite: `npx vitest run`
   - Run TypeScript check: `npx tsc --noEmit`
   - Run linter: `npm run lint`

---

## 7. Next Step Handoff (Summon Senior Dev)
The technical architecture, schema updates, component specifications, and test blueprints are complete. Hand off execution to **Senior Dev** to apply the changes and verify against acceptance criteria.
