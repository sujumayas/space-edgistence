# 01 — Bills vs Coins

> Before starting: read `00-foundation.md` for the shared contract, three inviolable rules, and engine helpers.

## Source parody
Bomberman ("Don't bomb her, man!") + Space Invaders vertical shooter.

## Concept
Bills (rent, utilities, internet) descend from the top. The player ship (Ocho) sits at the bottom and fires coins upward to "pay" them before they reach 4 possessions at the bottom of the screen.

## Mechanics
- Player ship at bottom: move with `InputState.left/right`, fire with `InputState.a`
- Coin counter starts at 20, regenerates +1 every 2s (income trickle)
- Each shot costs 1 coin; can't shoot at 0
- Bill HP: utility = 1 coin, rent = 5 coins (visibly bigger sprite)
- Four possessions across the bottom (couch, TV, fridge, bed). Each takes 1 hit then disappears.
- Game over when all 4 possessions are gone
- Win: survive 90 seconds → `onComplete({ completed: true, ... })`

## Inequity layer
Every ~15s, Tobias floats across the screen in a chopper labeled "TRUST FUND". Invincible. Drops 3 gold coins (visible mocking) into the player's coin counter. Renders even more obnoxiously when the player is doing badly (lower possession count).

## Payday Defense
**Trigger:** 3 of 4 possessions gone AND a bill is < 1s from impact.
**Effect:** Mom sprite walks in from the left, throws a giant paycheck. All bills on screen explode into +10 coins each. Speech bubble: "Mamá tiene que volver al trabajo, mijo". She exits right.
**Activation:** call `requestPaydayDefense()` — returns true the first time, false thereafter.

## Difficulty (locked HARD)
- Bill spawn interval starts at 1.5s, decreases by 0.05s every 10s (floor 0.4s)
- No power-ups, no upgrade tree, no second chances beyond Payday

## Sprites needed
- `ocho-ship.png` (32×32)
- `bill-utility.png` (24×24, envelope)
- `bill-rent.png` (32×32, big red envelope, "RENT" text)
- `coin-shot.png` (8×8, projectile)
- `possession-couch.png`, `possession-tv.png`, `possession-fridge.png`, `possession-bed.png` (32×32 each)
- `tobias-chopper.png` (48×32, helicopter)
- Reuse `mom-payday.png` from foundation

**Shape fallback:** rectangles labeled with letters/text. Game is fully playable without art.

## Implementation
- `src/games/BillsVsCoins/index.tsx` — React wrapper implementing `MiniGameProps`
- `src/games/BillsVsCoins/logic.ts` — pure step/spawn/collide functions
- `src/games/BillsVsCoins/sprites.ts` — sprite-sheet coordinate map
- Object pool from `engine/pool.ts` for bills and projectiles (avoid GC churn)
- AABB collision from `engine/collision.ts`
- Audio: shot SFX, hit SFX, payday fanfare

## Verification
- Bills descend at the documented spawn rate; can be shot down; lose 1 coin per shot
- Possessions disappear on bill impact; game ends at 0 possessions
- Tobias chopper appears ~every 15s, drops coins, is invincible
- Pause from shell freezes the game loop completely (test mid-projectile)
- Payday Defense fires automatically exactly once at the documented trigger, then never again — verify with `requestPaydayDefense()` returning false
- `onScoreUpdate` flows to the shell; HUD reflects updates
- 60fps on a mid-tier phone; bill/coin pool prevents GC stutters
- Touch: left/right via D-pad, fire via A button
