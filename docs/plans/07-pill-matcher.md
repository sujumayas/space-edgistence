# 07 — Pill Matcher

> Before starting: read `00-foundation.md` for the shared contract, three inviolable rules, and engine helpers. **This is the most algorithmically dense game — grid logic needs to be solid before you build the visuals.**

## Source parody
Dr. Mario (match-3 with falling capsules).

## Concept
Reframed as "managing meds you can't afford to refill." Each capsule comes from a finite prescription bottle — once it's empty, no more capsules drop and the remaining viruses win.

## Mechanics
- Field: 8 columns × 16 rows
- Capsule controls: rotate (`InputState.a`), move left/right, fast-drop (`down`)
- Match 4+ same color (horizontal or vertical) → clear
- Gravity applies after clears; chains earn bonus score
- Colors map to symptoms: red = anger, blue = stress, yellow = exhaustion
- Round starts with N viruses; clear all to win → `onComplete({ completed: true })`
- **Prescription bottle: 10 capsules per round.** When empty, no new capsules drop. Field freezes. Remaining viruses → game over.

## Inequity layer
Side panel labeled "TOBIAS PHARMACY" shows a counter that auto-refills at 1 capsule/sec, visibly always full. Player cannot interact. It exists to be looked at.

## Payday Defense
**Trigger:** field is 80% full of capsules/viruses (computed each tick).
**Effect:** Mom delivers one free capsule. The game picks the color most useful (one that would create the largest immediate match).
**Activation:** `requestPaydayDefense()` — once per session.

## Difficulty (locked HARD)
- Capsule drop speed is high from level 1 (no easy intro)
- Prescription cap of 10 is brutal — must play efficient matches
- No previewing the next 3 capsules (only the current one is visible)

## Sprites needed
- Capsule halves: 3 colors × 2 orientations = 6 sprites at 16×16
- Virus sprites: 3 colors at 16×16 with slight idle animation
- Prescription bottle counter (10/9/8/.../0 states)
- Tobias pharmacy side panel
- Reuse `mom-payday.png` from foundation

**Shape fallback:** colored squares. The game is grid-based and reads fine without art.

## Implementation
- `src/games/PillMatcher/index.tsx`
- `src/games/PillMatcher/grid.ts` — board state, match detection (BFS or scanline), gravity step
- `src/games/PillMatcher/spawner.ts` — capsule queue + prescription counter
- Build and unit-test `grid.ts` in isolation FIRST (no rendering) — match detection bugs are nasty

## Verification
- Capsules fall, rotate, can be placed via player input
- 4-in-a-row clears in both orientations
- Gravity applies after clears; chain reactions work and award bonus score
- Prescription counter decrements per capsule placed; supply runs out at 10 caps
- When prescription is 0 and viruses remain, round ends as game over
- Tobias side panel always full, visibly mocking, no interaction
- Payday capsule appears when field hits ~80% packed; placed at a sensible location
- Touch: rotate via A button, move via D-pad left/right, fast-drop via down
