# 06 — Bug Swatter

> Before starting: read `00-foundation.md` for the shared contract, three inviolable rules, and engine helpers. **This is the most mobile-friendly game — perfect for early mobile QA.**

## Source parody
Gnat Attack (Mario Paint minigame).

## Concept
Cockroaches crawl across the screen (the apartment is in disrepair). Player swats them with cursor / touch before they reach the food.

## Mechanics
- Pointer-only controls (mouse or touch) via `InputState.pointer`
- 3 hearts. Bug reaches the food → `onLifeLost()`
- Combo multiplier: 5 consecutive swats without a miss → 2× score until first miss
- Boss bug every 30s: a giant landlord-roach with 5 HP; must hit 5 times

## Inequity layer
Every ~20s, a popup floats by: "Tobias's exterminator just visited. His apartment is bug-free for 6 months." No gameplay effect — pure commentary.

## Payday Defense
**Trigger:** all 3 hearts at half (i.e. critical state across the board).
**Effect:** Mom sprays bug repellent. All bugs on screen are killed. 5 seconds of bug immunity (bugs still spawn but pass through harmlessly).
**Activation:** `requestPaydayDefense()` — once per session.

## Difficulty (locked HARD)
- Bug speed and spawn rate scale every 30s (faster, more frequent)
- No pause within a round (shell pause still works — this means no internal "breathing room" between waves)
- Boss bugs cannot be skipped or fled

## Sprites needed
- `roach-walk-4frame.png` (16×16, side view)
- `landlord-roach.png` (48×48, boss with HP bar over head)
- `food-target.png` (32×32, what bugs are heading toward)
- `bug-repellent-cloud.png` (mom's payday)
- `tobias-exterminator-popup.png` (text panel)
- Cursor: pixel-art crosshair / swatter (CSS cursor on desktop, drawn sprite on touch)

**Shape fallback:** circles with HP labels; food as a brown square.

## Implementation
- `src/games/BugSwatter/index.tsx`
- `src/games/BugSwatter/spawn.ts` — spawn schedule with difficulty scaling
- `src/games/BugSwatter/combo.ts` — combo multiplier state machine
- Pointer input via `InputState.pointer` (works for both mouse and touch — that's why useInput merges them)

## Verification
- Bugs spawn, walk toward food, can be tapped/clicked to kill
- Combo multiplier triggers on 5 in a row, resets on miss
- Boss bug appears every 30s and needs 5 hits to defeat
- Tobias popup appears periodically with no gameplay effect
- Payday repellent fires once when player is at critical hearts and grants 5s immunity
- Plays cleanly on a phone with finger taps (test multiple bugs simultaneously)
