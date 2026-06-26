# 08 — Oil Panic

> Before starting: read `00-foundation.md` for the shared contract, three inviolable rules, and engine helpers.

## Source parody
Oil Panic (Game & Watch dual-screen).

## Concept
Split-screen survival. Upper half: leaky ceiling drips water into Ocho's apartment, caught in a bucket. Lower half: Ocho carries the bucket to a window to dump it — but dumping on a neighbor below loses a life.

## Mechanics
- Two stacked play areas, both visible at once (top half ≈ half canvas height, bottom half the same)
- The player controls one Ocho sprite at a time — switch contexts with `InputState.b`
- **Top scene:**
  - Move left/right under leak positions (3–5 leak spots)
  - Bucket fills 1 unit per drop caught; capacity = 3
  - If bucket overflows (drop falls when full) → flood, `onLifeLost()`
- **Bottom scene:**
  - 3 windows. Walk left/right to align with one.
  - Press `InputState.a` to dump.
  - If a neighbor is below the active window → angry neighbor, `onLifeLost()`. Empties bucket either way.
  - Neighbor walking schedule is partially randomized.
- Score: +10 per successful dump (no neighbor below)
- Survive 90 seconds → `onComplete({ completed: true })`

## Inequity layer
- A "CALL LANDLORD" button is always visible at the top of the screen. Pressing it does nothing for 10 seconds, then displays `LANDLORD UNAVAILABLE` for 3s, then resets. Pure UX troll.
- Brief cutaway popups show Tobias's apartment with the leak instantly patched by a contractor

## Payday Defense
**Trigger:** 2 of 3 lives are gone.
**Effect:** Mom appears holding a giant tarp at the ceiling for 10s. All drips caught harmlessly during this window. Bottom screen behavior unchanged.
**Activation:** `requestPaydayDefense()` — once per session.

## Difficulty (locked HARD)
- Drip frequency increases every 15s (more leak spots active, faster falls)
- Neighbor schedule randomized — no memorizable pattern
- No grace period after a life loss

## Sprites needed
- `ocho-bucket-4dir.png` (32×32 × directions, side-view)
- `drip-3frame.png` (8×8, animated water drop)
- `bucket-fill-states.png` (4 sprites: empty / 1 / 2 / 3)
- `window-frame.png` (24×24)
- `neighbor-walk-2frame.png` (24×24, sidewalk pedestrian)
- `tarp-payday.png` (mom holding tarp at ceiling)
- `tobias-apartment-cutaway.png` (popup panel)

**Shape fallback:** rectangles + text labels. The split-screen layout reads fine without art.

## Implementation
- `src/games/OilPanic/index.tsx`
- `src/games/OilPanic/topScene.ts` — drip catching state + logic
- `src/games/OilPanic/bottomScene.ts` — window dumping state + logic
- Single canvas with a horizontal divider; both halves tick the same loop, render side by side
- Context-switch indicator (highlight border on active scene)

## Verification
- Drips spawn on top half at increasing frequency
- Bucket fills correctly; overflows on capacity+1 and costs a life
- Player switches between top and bottom freely via B button
- Dumping at a window costs a life when a neighbor is below; scores otherwise
- "CALL LANDLORD" button does nothing for 10s, then shows UNAVAILABLE briefly
- Payday tarp catches all drips for exactly 10s, once per session
- Touch: D-pad + 2 buttons cover all controls (A = dump, B = switch context)
