# ADR 0013: Dual ELO Rating System & Rankings Leaderboard Architecture

## Status
Accepted

## Context
Team Generator reached Stage 5, requiring a robust, transparent, and fair competitive ranking mechanism for both singles (1v1) and doubles (2v2) tennis matches. Key requirements included:
1. **Dual Ratings:** Independent ELO ratings for Singles (`singles_rating`) and Doubles (`doubles_rating`), initialized at 1200.
2. **Standard ELO Math:** Implementation of the standard logistic expectation formula with $K = 32$.
3. **Partner Averaging in Doubles:** For doubles matches, each team's expected rating is computed as the arithmetic mean of its two active participants' current ratings.
4. **Transient Guest Handling:** Unregistered or guest players default to a provisional rating of 1200 without creating permanent database pollution.
5. **Draw Handling:** Full support for match draws ($S = 0.5$).
6. **Persistence & Auditing:** Atomic storage of pre-match and post-match ratings (`rating_before`, `rating_after`) per participant in `match_players`.

## Decision
1. **Algorithmic Core (`src/utils/elo.ts`):**
   - Expected score calculation: $E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}$.
   - Rating update: $R'_A = R_A + K \cdot (S_A - E_A)$ where $K = 32$.
   - Doubles team rating: $R_{\text{team}} = \frac{R_{p1} + R_{p2}}{2}$.
2. **Database Schema ([20261003120000_add_rankings_elo.sql](file:///D:/Projects/team-generator/supabase/migrations/20261003120000_add_rankings_elo.sql)):**
   - Added `singles_rating` and `doubles_rating` columns to `players`.
   - Added `rating_before` and `rating_after` numeric columns to `match_players`.
   - Added `format` ENUM/check constraint (`singles`, `doubles`) to `matches`.
3. **State Management & Hooks:**
   - [useMatches.ts](file:///D:/Projects/team-generator/src/hooks/useMatches.ts) automatically triggers ELO delta calculation upon match completion and persists audit snapshots.
   - [useRankings.ts](file:///D:/Projects/team-generator/src/hooks/useRankings.ts) computes live leaderboards with filtering while preserving global absolute ranks.
4. **UI Architecture:**
   - Responsive leaderboard featuring a top-3 podium ([Podium.tsx](file:///D:/Projects/team-generator/src/components/rankings/Podium.tsx)), desktop table ([RankingsTable.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsTable.tsx)), and mobile card layout ([RankingsMobile.tsx](file:///D:/Projects/team-generator/src/components/rankings/RankingsMobile.tsx)).
   - Match creation modal ([MatchModal.tsx](file:///D:/Projects/team-generator/src/components/match/MatchModal.tsx)) with auto-format detection and strict participant count validation.

## Consequences
- **Positive:** Fair, self-correcting skill rankings across both singles and doubles formats. Full historical auditability of rating changes per match. Fully tested with 283 unit and integration tests passing successfully.
- **Negative / Trade-offs:** Requires strict roster size validation before match submission.
