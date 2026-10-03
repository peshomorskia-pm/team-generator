# Code Health Audit: 2026-09-30

## 1. UI Componentization Candidates
- **Description:** High repetition of badge / pill styling across multiple pages and components. Small status tags, ratings indicators, and metadata pills are defined with identical inline Tailwind utility strings (`rounded-full`, `text-xs`, `font-medium`/`font-semibold`, dark/light border pairs) instead of utilizing a shared atomic badge primitive.
- **Locations:**
  - [`LandingPage.tsx#L20-L23`](file:///D:/Projects/team-generator/src/pages/LandingPage.tsx#L20-L23)
  - [`LandingPage.tsx#L66-L69`](file:///D:/Projects/team-generator/src/pages/LandingPage.tsx#L66-L69)
  - [`LandingPage.tsx#L77-L79`](file:///D:/Projects/team-generator/src/pages/LandingPage.tsx#L77-L79)
  - [`LandingPage.tsx#L101-L103`](file:///D:/Projects/team-generator/src/pages/LandingPage.tsx#L101-L103)
  - [`MatchesPage.tsx#L22-L25`](file:///D:/Projects/team-generator/src/pages/MatchesPage.tsx#L22-L25)
  - [`PlayersPage.tsx#L22-L25`](file:///D:/Projects/team-generator/src/pages/PlayersPage.tsx#L22-L25)
  - [`RankingsPage.tsx#L22-L25`](file:///D:/Projects/team-generator/src/pages/RankingsPage.tsx#L22-L25)
  - [`TeamCard.tsx#L23-L30`](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx#L23-L30)
  - [`PlayerList.tsx#L21-L30`](file:///D:/Projects/team-generator/src/components/player/PlayerList.tsx#L21-L30)
- **Proposed Solution:** Create a reusable UI component [`Badge`](file:///D:/Projects/team-generator/src/components/ui/Badge.tsx) in `src/components/ui/Badge.tsx` accepting `variant` (`'indigo' | 'emerald' | 'amber' | 'slate' | 'purple'`), `size` (`'sm' | 'md'`), optional `icon`, and `children`. Replace all ad-hoc pill implementations with this component.

- **Description:** 95% identical "Under Construction" placeholder page template duplicated across three separate route components. `MatchesPage`, `PlayersPage`, and `RankingsPage` have verbatim markup structures (header title/subtitle, centered icon container, status pill, description, and primary CTA link back to `/generator`).
- **Locations:**
  - [`MatchesPage.tsx#L7-L44`](file:///D:/Projects/team-generator/src/pages/MatchesPage.tsx#L7-L44)
  - [`PlayersPage.tsx#L7-L44`](file:///D:/Projects/team-generator/src/pages/PlayersPage.tsx#L7-L44)
  - [`RankingsPage.tsx#L7-L44`](file:///D:/Projects/team-generator/src/pages/RankingsPage.tsx#L7-L44)
- **Proposed Solution:** Abstract this shared pattern into a reusable [`PlaceholderPage`](file:///D:/Projects/team-generator/src/components/layout/PlaceholderPage.tsx) component (or [`EmptyState`](file:///D:/Projects/team-generator/src/components/ui/EmptyState.tsx) wrapper) accepting `title`, `description`, `icon: LucideIcon`, `cardTitle`, `cardDescription`, and CTA properties. Each page component will then be reduced to a concise 10-line declaration.

- **Description:** Complete bypass of existing design system primitive [`Button`](file:///D:/Projects/team-generator/src/components/ui/Button.tsx). Every interactive button across the application duplicates button styling (`inline-flex items-center justify-center font-medium rounded-xl transition-...`) with manual classes instead of using `src/components/ui/Button.tsx`.
- **Locations:**
  - [`Button.tsx#L9-L37`](file:///D:/Projects/team-generator/src/components/ui/Button.tsx#L9-L37)
  - [`TeamSettings.tsx#L86-L95`](file:///D:/Projects/team-generator/src/components/team/TeamSettings.tsx#L86-L95)
  - [`TeamList.tsx#L26-L44`](file:///D:/Projects/team-generator/src/components/team/TeamList.tsx#L26-L44)
  - [`LandingPage.tsx#L38-L54`](file:///D:/Projects/team-generator/src/pages/LandingPage.tsx#L38-L54)
  - [`LandingPage.tsx#L201-L207`](file:///D:/Projects/team-generator/src/pages/LandingPage.tsx#L201-L207)
  - [`NotFoundPage.tsx#L25-L40`](file:///D:/Projects/team-generator/src/pages/NotFoundPage.tsx#L25-L40)
  - [`PlayerInput.tsx#L37-L45`](file:///D:/Projects/team-generator/src/components/player/PlayerInput.tsx#L37-L45)
  - [`PlayerInput.tsx#L68-L76`](file:///D:/Projects/team-generator/src/components/player/PlayerInput.tsx#L68-L76)
- **Proposed Solution:** Refactor components to import and consume [`Button`](file:///D:/Projects/team-generator/src/components/ui/Button.tsx). Enhance `Button` to support an `asChild` or `to` prop (via `react-router-dom` `Link`) or export a companion `ButtonLink` to eliminate button-styled `<a>`/`<Link>` duplication.

- **Description:** Complete bypass of existing design system primitive [`Input`](file:///D:/Projects/team-generator/src/components/ui/Input.tsx). Text and numeric inputs repeat standard input utility classes (`w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 ... focus:ring-indigo-500`) directly on raw HTML `<input>` elements.
- **Locations:**
  - [`Input.tsx#L8-L32`](file:///D:/Projects/team-generator/src/components/ui/Input.tsx#L8-L32)
  - [`TeamSettings.tsx#L31-L43`](file:///D:/Projects/team-generator/src/components/team/TeamSettings.tsx#L31-L43)
  - [`TeamSettings.tsx#L52-L64`](file:///D:/Projects/team-generator/src/components/team/TeamSettings.tsx#L52-L64)
  - [`PlayerInput.tsx#L52-L67`](file:///D:/Projects/team-generator/src/components/player/PlayerInput.tsx#L52-L67)
- **Proposed Solution:** Refactor inputs in `TeamSettings` and `PlayerInput` to use [`Input`](file:///D:/Projects/team-generator/src/components/ui/Input.tsx). Add a `size?: 'sm' | 'md'` prop to `Input` to accommodate compact forms like `PlayerInput`'s quick-add row.

- **Description:** Duplicated Theme Toggle control implementation between desktop navigation and mobile top header. Both render identical toggle logic, icons (`Sun`, `Moon`), aria labels, and rounded border button styles.
- **Locations:**
  - [`Navbar.tsx#L57-L76`](file:///D:/Projects/team-generator/src/components/layout/Navbar.tsx#L57-L76)
  - [`AppShell.tsx#L27-L38`](file:///D:/Projects/team-generator/src/components/layout/AppShell.tsx#L27-L38)
- **Proposed Solution:** Extract a shared [`ThemeToggle`](file:///D:/Projects/team-generator/src/components/ui/ThemeToggle.tsx) component in `src/components/ui/ThemeToggle.tsx` with a boolean prop `showLabel?: boolean` for desktop responsive text.

- **Description:** Card container style fragmentation. Card wrappers in `LandingPage`, `TeamCard`, and `GeneratorPage` duplicate `rounded-2xl`, borders, and shadows (`shadow-sm`/`shadow-md`/`shadow-xl`), but [`Card.tsx`](file:///D:/Projects/team-generator/src/components/ui/Card.tsx) has hardcoded `shadow-xl overflow-hidden` without configurable padding, border, or hover effects.
- **Locations:**
  - [`Card.tsx#L8-L16`](file:///D:/Projects/team-generator/src/components/ui/Card.tsx#L8-L16)
  - [`LandingPage.tsx#L149-L187`](file:///D:/Projects/team-generator/src/pages/LandingPage.tsx#L149-L187)
  - [`TeamCard.tsx#L12`](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx#L12)
  - [`GeneratorPage.tsx#L37`](file:///D:/Projects/team-generator/src/pages/GeneratorPage.tsx#L37)
- **Proposed Solution:** Upgrade [`Card.tsx`](file:///D:/Projects/team-generator/src/components/ui/Card.tsx) to accept `variant?: 'default' | 'flat' | 'interactive'` and `padding?: 'none' | 'sm' | 'md' | 'lg'`, consolidating border and dark mode surface classes.

- **Description:** Notification / Alert Box markup embedded directly in `GeneratorPage`. The notification rendering logic, error/success styling, and icon selection is hardcoded inline.
- **Locations:**
  - [`GeneratorPage.tsx#L42-L61`](file:///D:/Projects/team-generator/src/pages/GeneratorPage.tsx#L42-L61)
- **Proposed Solution:** Extract an [`Alert`](file:///D:/Projects/team-generator/src/components/ui/Alert.tsx) component in `src/components/ui/Alert.tsx` taking `type: 'error' | 'success'`, `message: string`, and optional `onDismiss?: () => void`.

## 2. Performance Bottlenecks
- **Description:** Unmemoized context value and unmemoized toggle handler in `ThemeProvider`. Every time `ThemeProvider` renders, a brand new object reference `{ theme, toggleTheme }` and a new `toggleTheme` function reference are instantiated. This triggers unnecessary re-renders in all consumers across the component tree (`AppShell`, `Navbar`, etc.).
- **Locations:**
  - [`ThemeContext.tsx#L42-L50`](file:///D:/Projects/team-generator/src/context/ThemeContext.tsx#L42-L50)
- **Proposed Solution:** Memoize `toggleTheme` using `useCallback`:
  ```ts
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);
  ```
  And memoize context value using `useMemo`:
  ```ts
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  ```

- **Description:** Redundant `teams` dependency in `generateTeams` callback causing cascading child re-renders. `useTeamGenerator` includes `teams` in `generateTeams` dependency list solely for `lastFingerprint = lastFingerprintRef.current || (teams.length > 0 ? generateTeamsFingerprint(teams) : '')`. Because `lastFingerprintRef` already stores the latest fingerprint, including `teams` invalidates `generateTeams` on every generation cycle, mutating prop references passed to `TeamSettings`.
- **Locations:**
  - [`useTeamGenerator.ts#L103`](file:///D:/Projects/team-generator/src/hooks/useTeamGenerator.ts#L103)
  - [`useTeamGenerator.ts#L165`](file:///D:/Projects/team-generator/src/hooks/useTeamGenerator.ts#L165)
- **Proposed Solution:** Rely strictly on `lastFingerprintRef.current` and remove `teams` from the `generateTeams` dependency array.

- **Description:** Missing `React.memo` on leaf/subcomponents in `GeneratorPage`. Whenever the user types a character in the player input textarea, `rawText` updates `GeneratorPage`. Because `TeamSettings`, `PlayerList`, `TeamList`, and `Header` are unmemoized functional components, all of them re-render and re-diff virtual DOM on every single keystroke.
- **Locations:**
  - [`GeneratorPage.tsx#L63-L96`](file:///D:/Projects/team-generator/src/pages/GeneratorPage.tsx#L63-L96)
  - [`TeamSettings.tsx#L13-L22`](file:///D:/Projects/team-generator/src/components/team/TeamSettings.tsx#L13-L22)
  - [`PlayerList.tsx#L10`](file:///D:/Projects/team-generator/src/components/player/PlayerList.tsx#L10)
  - [`TeamList.tsx#L11-L16`](file:///D:/Projects/team-generator/src/components/team/TeamList.tsx#L11-L16)
  - [`Header.tsx#L8-L11`](file:///D:/Projects/team-generator/src/components/layout/Header.tsx#L8-L11)
- **Proposed Solution:** Wrap `TeamSettings`, `PlayerList`, `TeamList`, and `Header` in `React.memo`. In `GeneratorPage`, memoize the settings change handler `(val) => setNumberOfTeams(val > 0 ? val : '')` with `useCallback` to preserve referential stability.

- **Description:** Repeated in-render array instantiation for static navigation links. In both `Navbar` and `MobileNav`, the `navItems` array containing navigation routes and icon references is re-created as a new array on every render.
- **Locations:**
  - [`Navbar.tsx#L9-L15`](file:///D:/Projects/team-generator/src/components/layout/Navbar.tsx#L9-L15)
  - [`MobileNav.tsx#L13-L19`](file:///D:/Projects/team-generator/src/components/layout/MobileNav.tsx#L13-L19)
- **Proposed Solution:** Hoist `NAV_ITEMS` array outside of both component function bodies to module-level constants.

- **Description:** Synchronous, un-debounced regex and array allocation on every keystroke. As `rawText` changes, the entire text string is split, trimmed, filtered, and parsed with regular expressions (`line.match(...)`) on the main thread inside `useMemo(() => ..., [rawText])`. For large lists (e.g. 50-100+ players), this blocks frame rendering during typing.
- **Locations:**
  - [`useTeamGenerator.ts#L18-L38`](file:///D:/Projects/team-generator/src/hooks/useTeamGenerator.ts#L18-L38)
- **Proposed Solution:** Separate rapid textarea local state from parsed player data, or debounce the parsing pipeline using a lightweight transition (`useDeferredValue` in React 19) to prioritize user typing responsiveness.

- **Description:** Repeated canonical serialization in `do...while` generation loop. The anti-repetition loop runs up to 15 times per generation. In each iteration, `generateTeamsFingerprint` deep clones arrays, runs `localeCompare` across every player in every team, sorts teams, and executes `JSON.stringify`.
- **Locations:**
  - [`useTeamGenerator.ts#L156-L160`](file:///D:/Projects/team-generator/src/hooks/useTeamGenerator.ts#L156-L160)
  - [`history.ts#L10-L24`](file:///D:/Projects/team-generator/src/utils/history.ts#L10-L24)
- **Proposed Solution:** Compute a fast 32-bit hash or numeric signature of player IDs instead of full stringified nested JSON arrays, only falling back to canonical serialization when persisting to localStorage.

## 3. Dead Code
- **Description:** Completely unused component `Container`. Defined and exported in `src/components/layout/Container.tsx`, but never imported or referenced in any application page, route, or test.
- **Locations:**
  - [`Container.tsx#L1-L17`](file:///D:/Projects/team-generator/src/components/layout/Container.tsx#L1-L17)
- **Proposed Solution:** Safely delete `src/components/layout/Container.tsx` as part of codebase cleanup.

- **Description:** Completely unused UI component `Input`. Defined in `src/components/ui/Input.tsx`, but never imported or used.
- **Locations:**
  - [`Input.tsx#L1-L33`](file:///D:/Projects/team-generator/src/components/ui/Input.tsx#L1-L33)
- **Proposed Solution:** Either integrate `Input` across `PlayerInput.tsx` and `TeamSettings.tsx` to replace raw inputs, or remove the orphaned file if raw styling is preferred. (Recommended: adopt and integrate into components).

- **Description:** Completely unused UI component `Button`. Defined in `src/components/ui/Button.tsx`, but never imported or used.
- **Locations:**
  - [`Button.tsx#L1-L38`](file:///D:/Projects/team-generator/src/components/ui/Button.tsx#L1-L38)
- **Proposed Solution:** Either integrate `Button` across all pages and components, or remove if unused. (Recommended: adopt across all button call-sites).

- **Description:** Completely unused custom hook `useLocalStorage`. Defined in `src/hooks/useLocalStorage.ts`, but never imported or referenced in application code. `ThemeContext` and `history.ts` use direct `window.localStorage` calls.
- **Locations:**
  - [`useLocalStorage.ts#L1-L29`](file:///D:/Projects/team-generator/src/hooks/useLocalStorage.ts#L1-L29)
- **Proposed Solution:** Refactor `ThemeContext` to utilize `useLocalStorage` for theme persistence, or safely remove the unused hook.

- **Description:** Orphaned utility function `isDuplicateMatchup`. Exported in `src/utils/history.ts` and tested in `history.test.ts`, but never imported or used by `useTeamGenerator` or any application logic.
- **Locations:**
  - [`history.ts#L69-L75`](file:///D:/Projects/team-generator/src/utils/history.ts#L69-L75)
- **Proposed Solution:** Either integrate `isDuplicateMatchup` into `useTeamGenerator`'s generation check, or safely remove it and its test cases if anti-repetition is maintained via local fingerprint tracking.

- **Description:** Orphaned utility function `clearMatchupHistory`. Exported in `src/utils/history.ts`, but only called within unit tests `beforeEach`, with no production feature or UI trigger to clear history.
- **Locations:**
  - [`history.ts#L80-L89`](file:///D:/Projects/team-generator/src/utils/history.ts#L80-L89)
- **Proposed Solution:** Retain as test helper or expose via a "Clear History" user action in the generator UI.

- **Description:** Deprecated and unimplemented properties in `TeamSettingsProps`. The interface in `src/types/index.ts` declares `mode?: 'teams' | 'playersPerTeam'` and `onModeChange?: (mode: 'teams' | 'playersPerTeam') => void`, which are never implemented or consumed in `TeamSettings.tsx` or `GeneratorPage.tsx`.
- **Locations:**
  - [`index.ts#L25-L26`](file:///D:/Projects/team-generator/src/types/index.ts#L25-L26)
- **Proposed Solution:** Remove `mode` and `onModeChange` from `TeamSettingsProps` in `src/types/index.ts`.

- **Description:** Misplaced and overly specialized layout component `Header`. Located in `src/components/layout/Header.tsx`, but strictly represents the purple hero card header of `GeneratorPage`, with hardcoded Bulgarian generator text.
- **Locations:**
  - [`Header.tsx#L1-L19`](file:///D:/Projects/team-generator/src/components/layout/Header.tsx#L1-L19)
  - [`GeneratorPage.tsx#L3`](file:///D:/Projects/team-generator/src/pages/GeneratorPage.tsx#L3)
- **Proposed Solution:** Move `Header.tsx` to `src/components/team/GeneratorHeader.tsx` or inline its presentation inside `GeneratorPage.tsx` to avoid confusing it with global layout headers.

## 4. Type Safety Improvements
- **Description:** Interface fragmentation and type shadowing across components. `src/types/index.ts` defines partial versions of `PlayerInputProps`, `TeamSettingsProps`, `TeamCardProps`, and `TeamListProps`. The actual components then import them as `Base...Props` and extend them with missing fields, creating dual sources of truth and drift.
- **Locations:**
  - Base interfaces: [`index.ts#L14-L36`](file:///D:/Projects/team-generator/src/types/index.ts#L14-L36)
  - Extended: [`PlayerInput.tsx#L3-L9`](file:///D:/Projects/team-generator/src/components/player/PlayerInput.tsx#L3-L9)
  - Extended: [`TeamSettings.tsx#L3-L11`](file:///D:/Projects/team-generator/src/components/team/TeamSettings.tsx#L3-L11)
  - Extended: [`TeamCard.tsx#L3-L8`](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx#L3-L8)
  - Extended: [`TeamList.tsx#L3-L9`](file:///D:/Projects/team-generator/src/components/team/TeamList.tsx#L3-L9)
- **Proposed Solution:** Consolidate complete prop interfaces in each component file directly, or synchronize `src/types/index.ts` to be the single source of truth containing all real props (`value`, `onChange`, `playerCount`, `balanceByRating`, `onBalanceToggle`, `hasRatings`, `index`, `onShuffleTeam`, `onCopy`, `isCopied`).

- **Description:** Leakage of HTML input empty string `''` sentinel into numeric TypeScript domain types (`number | ''`).
- **Locations:**
  - [`index.ts#L23-L24`](file:///D:/Projects/team-generator/src/types/index.ts#L23-L24)
  - [`TeamSettings.tsx#L6-L7`](file:///D:/Projects/team-generator/src/components/team/TeamSettings.tsx#L6-L7)
  - [`useTeamGenerator.ts#L9-L10`](file:///D:/Projects/team-generator/src/hooks/useTeamGenerator.ts#L9-L10)
- **Proposed Solution:** Type domain counts as `number | null` or `number | undefined`. Handle empty input strings at the form input boundary (`val === '' ? null : Number(val)`), keeping core state and hook contracts cleanly typed.

- **Description:** Unsafe `JSON.parse` with implicit `any` return in storage operations without runtime validation.
- **Locations:**
  - [`useLocalStorage.ts#L10`](file:///D:/Projects/team-generator/src/hooks/useLocalStorage.ts#L10)
  - [`history.ts#L34-L38`](file:///D:/Projects/team-generator/src/utils/history.ts#L34-L38)
- **Proposed Solution:** In `history.ts`, validate that parsed items are strings before feeding to `Set<string>`:
  ```ts
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === 'string')) {
    return new Set(parsed);
  }
  ```
  In `useLocalStorage`, add an optional type validator/guard `(val: unknown) => val is T`.

- **Description:** Weak icon typing in `MobileNav`. Navigation items type icons as `React.ComponentType<{ className?: string }>` rather than Lucide's official `LucideIcon` type.
- **Locations:**
  - [`MobileNav.tsx#L8`](file:///D:/Projects/team-generator/src/components/layout/MobileNav.tsx#L8)
- **Proposed Solution:** Import `LucideIcon` from `lucide-react` and type `icon: LucideIcon`.

- **Description:** Missing `forwardRef` and missing standard HTML element attribute extension on design system primitives. `Input`, `Button`, and `Card` cannot receive standard refs or native attributes (`aria-*`, `data-*`).
- **Locations:**
  - [`Input.tsx#L3-L14`](file:///D:/Projects/team-generator/src/components/ui/Input.tsx#L3-L14)
  - [`Button.tsx#L3-L15`](file:///D:/Projects/team-generator/src/components/ui/Button.tsx#L3-L15)
  - [`Card.tsx#L3-L8`](file:///D:/Projects/team-generator/src/components/ui/Card.tsx#L3-L8)
- **Proposed Solution:** Wrap `Input` and `Button` with `React.forwardRef<HTMLInputElement, InputProps>` and `React.forwardRef<HTMLButtonElement, ButtonProps>`. Have `CardProps` extend `React.HTMLAttributes<HTMLDivElement>`.

- **Description:** Potential `NaN` propagation from unsanitized input parsing. In `TeamSettings`, `parseInt(e.target.value, 10)` can return `NaN` when invalid characters are pasted or input. In `useTeamGenerator`, `parseFloat(match[2])` can yield `NaN`.
- **Locations:**
  - [`TeamSettings.tsx#L37-L39`](file:///D:/Projects/team-generator/src/components/team/TeamSettings.tsx#L37-L39)
  - [`TeamSettings.tsx#L58-L60`](file:///D:/Projects/team-generator/src/components/team/TeamSettings.tsx#L58-L60)
  - [`useTeamGenerator.ts#L30`](file:///D:/Projects/team-generator/src/hooks/useTeamGenerator.ts#L30)
- **Proposed Solution:** Sanitize parsed numbers using `Number.isFinite(parsed) ? parsed : fallback` to prevent `NaN` values from infecting state and calculations.

## 5. Test Suite Health & Coverage Gaps
- **Description:** Complete absence of UI component tests across all 13 components in `src/components/`. There is currently 0% test coverage on UI elements. Critical interactive behaviors (quick add player, remove player tag, change number of teams vs players per team, balance toggle, copy to clipboard feedback, dark mode button toggle, mobile navigation active route highlight) have no automated tests.
- **Locations:**
  - [`AppShell.tsx`](file:///D:/Projects/team-generator/src/components/layout/AppShell.tsx)
  - [`Navbar.tsx`](file:///D:/Projects/team-generator/src/components/layout/Navbar.tsx)
  - [`MobileNav.tsx`](file:///D:/Projects/team-generator/src/components/layout/MobileNav.tsx)
  - [`PlayerInput.tsx`](file:///D:/Projects/team-generator/src/components/player/PlayerInput.tsx)
  - [`PlayerList.tsx`](file:///D:/Projects/team-generator/src/components/player/PlayerList.tsx)
  - [`TeamCard.tsx`](file:///D:/Projects/team-generator/src/components/team/TeamCard.tsx)
  - [`TeamList.tsx`](file:///D:/Projects/team-generator/src/components/team/TeamList.tsx)
  - [`TeamSettings.tsx`](file:///D:/Projects/team-generator/src/components/team/TeamSettings.tsx)
  - [`Button.tsx`](file:///D:/Projects/team-generator/src/components/ui/Button.tsx)
  - [`Card.tsx`](file:///D:/Projects/team-generator/src/components/ui/Card.tsx)
  - [`Input.tsx`](file:///D:/Projects/team-generator/src/components/ui/Input.tsx)
- **Proposed Solution:** Install `@testing-library/react` and `@testing-library/user-event`. Author dedicated unit test suites for `PlayerInput.test.tsx`, `TeamSettings.test.tsx`, `TeamCard.test.tsx`, and `PlayerList.test.tsx`.

- **Description:** Complete absence of hook and context tests. The core application engine `useTeamGenerator`, theme management `ThemeContext`/`useTheme`, and `useLocalStorage` have zero test coverage.
- **Locations:**
  - [`useTeamGenerator.ts`](file:///D:/Projects/team-generator/src/hooks/useTeamGenerator.ts)
  - [`ThemeContext.tsx`](file:///D:/Projects/team-generator/src/context/ThemeContext.tsx)
  - [`useTheme.ts`](file:///D:/Projects/team-generator/src/hooks/useTheme.ts)
  - [`useLocalStorage.ts`](file:///D:/Projects/team-generator/src/hooks/useLocalStorage.ts)
- **Proposed Solution:** Author `useTeamGenerator.test.ts` testing:
  - Textarea parsing formats: "Name (5)", "Name [5]", "Name: 5", unrated names, empty lines.
  - Alert trigger scenarios: 0 players, <2 players, teams > players, neither option filled.
  - Round-robin mode vs players-per-team chunking mode.
  - Single team reshuffling (`shuffleSingleTeam`).
  - Copy results clipboard fallback behavior.
  - Author `ThemeContext.test.tsx` testing theme toggling, HTML class changes, and localStorage synchronization.

- **Description:** Zero page-level integration tests. None of the 6 pages in `src/pages/` have rendering or smoke tests.
- **Locations:**
  - [`LandingPage.tsx`](file:///D:/Projects/team-generator/src/pages/LandingPage.tsx)
  - [`GeneratorPage.tsx`](file:///D:/Projects/team-generator/src/pages/GeneratorPage.tsx)
  - [`MatchesPage.tsx`](file:///D:/Projects/team-generator/src/pages/MatchesPage.tsx)
  - [`PlayersPage.tsx`](file:///D:/Projects/team-generator/src/pages/PlayersPage.tsx)
  - [`RankingsPage.tsx`](file:///D:/Projects/team-generator/src/pages/RankingsPage.tsx)
  - [`NotFoundPage.tsx`](file:///D:/Projects/team-generator/src/pages/NotFoundPage.tsx)
- **Proposed Solution:** Create route smoke tests verifying that each page renders its expected headings, navigation links, and default states under `MemoryRouter`.

- **Description:** Untested boundary and failure edge cases in utility test suites.
- **Locations:**
  - [`balance.ts#L11-L62`](file:///D:/Projects/team-generator/src/utils/balance.ts#L11-L62)
  - [`history.ts#L29-L64`](file:///D:/Projects/team-generator/src/utils/history.ts#L29-L64)
  - [`shuffle.ts#L5-L14`](file:///D:/Projects/team-generator/src/utils/shuffle.ts#L5-L14)
- **Proposed Solution:** Add tests in:
  - `balance.test.ts`: Floating-point ratings (e.g., 4.5, 3.75), extreme rating disparities (e.g. 100 vs 1), more teams requested than available players, and large rosters (100+ players).
  - `history.test.ts`: Corrupted JSON in `localStorage`, `localStorage.setItem` throwing `QuotaExceededError`, and history capping verification (ensuring it strictly truncates to 50 items).
  - `shuffle.test.ts`: Two-element array permutation distribution testing.

- **Description:** Inadequate test runner environment and missing test coverage tooling. `vite.config.ts` specifies `environment: 'node'`, which prevents React DOM component testing (missing `window`, `document`, `HTMLElement`). Furthermore, `@vitest/coverage-v8` is not installed, causing `npm test -- --coverage` to fail.
- **Locations:**
  - [`vite.config.ts#L16-L19`](file:///D:/Projects/team-generator/vite.config.ts#L16-L19)
  - [`package.json#L23-L39`](file:///D:/Projects/team-generator/package.json#L23-L39)
- **Proposed Solution:** Propose installing `happy-dom` (or `jsdom`) as dev dependency and configuring Vitest with `environment: 'happy-dom'`. Install `@vitest/coverage-v8` to enable automated coverage thresholds in CI.
