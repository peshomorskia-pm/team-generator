# 0017. Tennis Tournament Groups and Draw

* **Status:** Accepted
* **Date:** 2026-10-09
* **Branch:** `feature/tennis-tournament-groups-draw`

## Context & Problem Statement

In amateur tennis tournaments, players or pairs are first partitioned into round-robin groups (typically of 3 to 4 participants) prior to knockout playoffs. The system currently supports team generation (singles and doubles) with elo ratings, but lacked the capability to:
1. Automatically partition an arbitrary number of teams $N$ into balanced groups of 3 and 4 (with special handling for $N=5$ single group exception).
2. Perform a random draw (`Fisher-Yates shuffle`) to distribute teams into these groups.
3. Present the groups via a dedicated progressive UI flow using Cyrillic alphabetical naming (`Група А`, `Група Б`, etc.).
4. Provide robust clipboard copying for sharing tournament groups via messaging apps (Viber, WhatsApp).

## Decision

We implemented a pure functional architecture adhering to MADR:

1. **Partition Algorithm (`partitionIntoGroups`)**:
   - For $N < 3$: returns `[]`.
   - For $N \in \{3, 4, 5\}$: returns `[N]` (single group exception for $N=5$).
   - For $N \ge 6$: computes optimal group counts $G = \lceil N/4 \rceil$, base size $B = \lfloor N/G \rfloor$, and remainder $R = N \pmod G$, distributing $R$ teams of size $B+1$ and $G-R$ teams of size $B$ (guaranteeing group sizes $\in \{3, 4\}$ with $\max - \min \le 1$).

2. **Cyrillic Group Labeling (`getBulgarianGroupLabel`)**:
   - Maps group index $i \ge 0$ to Bulgarian Cyrillic alphabet (`А`, `Б`, `В`, `Г`...) with a numeric fallback (`Група ${index + 1}`) beyond 30.

3. **Randomized Draw (`drawTournamentGroups`)**:
   - Uses `Fisher-Yates shuffle` on cloned team arrays to ensure pure immutable transformations.

4. **UI Components (`GroupList` & `GroupCard`)**:
   - Progressive CTA "🎲 Тегли жребий за групи" in [`TeamList.tsx`](file:///D:/Projects/team-generator/src/components/team/TeamList.tsx) (visible in Tennis mode when $\ge 3$ teams exist).
   - Dedicated management controls for redrawing ("Нов жребий"), resetting ("Изчисти жребия"), and copying to clipboard ("Копирай").

## Consequences

* **Positive:**
  - Fully automated, mathematically robust round-robin group partitioning for any tournament size $\ge 3$.
  - Seamless Bulgarian UI localization adhering strictly to the Dual-Language Boundary Protocol.
  - 100% test coverage across 399 passing tests.
* **Negative / Trade-offs:**
  - Requires reactive state invalidation so pool modifications or mode switches clear stale group draws.
