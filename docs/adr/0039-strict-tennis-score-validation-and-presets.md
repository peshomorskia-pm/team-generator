# 39. Strict Tennis Score Validation and Mobile Presets

Date: 2026-10-20
Status: Accepted
Branch: `feature/tennis-score-validation-and-presets`

## Context

Casual score inputs in tournaments previously allowed corrupt or nonsensical scores such as `7:56` or incomplete/invalid sets like `6:5`. Players entering scores on mobile during tournaments require fast, tap-friendly score entry and strict enforcement of official tennis scoring rules (regular sets to 6 or 7 games, and deciding super tiebreak to 10+ points with 2-point margins).

## Decision

1. **Pure Validation Engine (`src/utils/tennisScoreValidation.ts`)**:
   - **Regular Sets (Sets 1 & 2)**: $\ge 6$ games with $\ge 2$ margin (`6:0`..`6:4`), `7:5`, `7:6`. Rejects incomplete (`6:5`), invalid early sets, or corrupt inputs (`7:56`).
   - **Deciding Match Tiebreak (Set 3 when 1-1)**: Super tiebreak to $\ge 10$ points with $\ge 2$ point margin (`10:7`, `11:9`, `12:10`), rejecting $< 10$ or margin $< 2$.
   - **Casual Matches (`MatchModal.tsx`)**: Protected by sanity guard ($0 \le score \le 50$, non-tie).

2. **Mobile-First UX Enhancement (`TournamentScoreModal.tsx`)**:
   - 1-tap mobile preset chips for Team 1 and Team 2 wins across sets.
   - Discrete touch-friendly steppers (`-`/`+`) for Set 3.
   - Live inline per-set Bulgarian error feedback.
   - Dynamic Deciding Set button (`+ Добави решителен тайбрек (Сет 3)`) appearing only when Sets 1 and 2 are tied 1-1.

## Consequences

- **Positive**: Eliminates score entry corruption in tournaments; dramatically speeds up mobile entry with preset chips; ensures 100% compliance with official tennis rules.
- **Negative**: Slightly stricter validation requires players to enter valid set margins, preventing casual arbitrary strings in tournament mode.
