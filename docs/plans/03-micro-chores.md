# 03 — Micro Chores

> Before starting: read `00-foundation.md` for the shared contract, three inviolable rules, and engine helpers.

## Source parody
WarioWare (rapid-fire microgames, ~5s each).

## Concept
Montage of household chores Ocho has to do because mom is working three jobs. Each microgame is a single verb resolved in 5 seconds.

## Microgames (rotate randomly, never two in a row)
1. **DISHES!** — Mash `A` to fill a scrub counter to N
2. **LAUNDRY!** — Left/right to catch falling clothes in a basket
3. **HOMEWORK!** — Solve `2+2=?` (digits vary); up/down to cycle answers; `A` to submit
4. **DOOR!** — Landlord knocks. Press `down` to hide. Don't answer.
5. **PHONE!** — Mom calls. Press `up` to answer fast.
6. **COOK!** — Hit `A` when the pan icon turns **yellow** (not red, not black). Reaction test.

## Mechanics
- 5s timer per microgame; prompt displayed huge across the top
- 3 lives shared across the sequence; missed or failed microgame = -1 life via `onLifeLost()`
- After every 5 microgames, speed multiplier += 0.2 (durations shrink)
- 25 microgames total per level → `onComplete({ completed: true })`

## Inequity layer
Between each microgame, a 1s cutaway shows Tobias's family solving the same chore via butler / robot / AI. Player cannot interact during cutaways — input is frozen. Pure mockery.

## Payday Defense
**Trigger:** player has lost 2 of 3 lives AND the next microgame is about to start.
**Effect:** the next microgame is auto-completed. Timer ticks visibly but a mom sprite plays the success animation regardless of input. +score awarded.
**Activation:** `requestPaydayDefense()` — once per session.

## Difficulty (locked HARD)
- Speed never resets, only increases
- No tutorial / practice mode
- No retries — failed microgames cost a life

## Sprites needed
- 6 microgame backgrounds (16-bit kitchen, laundry, desk, door, phone, stove)
- Action sprites: sponge, falling clothes, math digits, peephole/door, phone, pan-3-states (red/yellow/black)
- Cutaway frames: `tobias-butler.png`, `tobias-robot.png`, `tobias-ai.png`
- Reuse `mom-payday.png` from foundation

**Shape fallback:** text labels on solid color rectangles. The verbs are the gameplay; art is decorative.

## Implementation
- `src/games/MicroChores/index.tsx`
- `src/games/MicroChores/microgames/*` — one file per microgame, each a tiny FSM:
  ```ts
  type Microgame = {
    id: string;
    prompt: string;
    durationMs: number;
    render(ctx: CanvasRenderingContext2D, state: any, t: number): void;
    tick(state: any, input: InputState, dt: number): 'pending' | 'success' | 'fail';
    initial(): any;
  };
  ```
- `src/games/MicroChores/registry.ts` — microgame list + spawn weights
- `src/games/MicroChores/cutaway.ts` — Tobias cutaway picker

## Verification
- Microgames cycle randomly without immediate repeat
- Speed visibly ramps every 5 rounds
- Cutaways play between rounds and do not accept input
- Lives drain on missed prompts via `onLifeLost`
- Payday auto-complete fires once when player is at 1 life and never again
- All 6 microgames work on mobile via TouchOverlay (mash works on touch A button)
- Round ends after 25 successful microgames
