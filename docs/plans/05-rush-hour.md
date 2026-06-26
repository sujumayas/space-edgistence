# 05 — Rush Hour

> Before starting: read `00-foundation.md` for the shared contract, three inviolable rules, and engine helpers. **This is the most complex game in the anthology — budget extra time.**

## Source parody
Super Mario Kart (top-down racer).

## Concept
A "kart race" but Ocho rides a skateboard while the rivals drive cars / fly. The track is the daily commute (home → school → store → home). Three laps.

## Mechanics
- Top-down view, 256×224 internal resolution
- Steering: `InputState.left/right`
- Accelerate: `InputState.a`
- Brake: `InputState.b`
- Power-ups on track: Bus Transfer (+speed 3s), Found Quarter (+small boost 1s), Pothole (slowdown 1s, hostile pickup)
- 4 rivals: Tobias (Ferrari), Masami (cloud limo), Penny (regular car), Darwin (bike)
- 3 laps; finish position determines score (1st=500, 2nd=300, 3rd=200, 4th=100, 5th=0)

## Inequity layer
- Tobias's car has 2× max speed AND uses shortcuts gated by toll booths only he can pass
- Masami flies over the track entirely (cuts corners through the air)
- Penny and Darwin are realistic competitors (player can theoretically beat them)
- Ocho's skateboard randomly trips on cracks in the sidewalk (visible "OOF" bubble), losing speed for 0.5s. Random, not triggered by input.

## Payday Defense
**Trigger:** Ocho is in last place entering lap 3.
**Effect:** Mom drives in from off-track in a beat-up car, picks him up, auto-completes the race in 4th position. Score = 100 instead of 0.
**Activation:** `requestPaydayDefense()` — once per session.

## Difficulty (locked HARD)
- **Reverse rubber-banding:** leaders speed up, last place slows down (opposite of MarioKart)
- No item-balancing — pickups are flat, randomness is brutal
- Cracks (tripping) are not visible until the player is on top of them

## Sprites needed
- `ocho-skateboard-4dir.png` (32×32, 4 cardinal directions)
- `tobias-ferrari.png` (48×24)
- `masami-limo.png` (48×24)
- `penny-car.png` (32×24)
- `darwin-bike.png` (32×24)
- Track tiles: road, grass, toll booth, crack, shortcut entrance/exit
- Items: bus pass, quarter, pothole-trap

**Shape fallback:** colored ovals with single-letter labels (T, M, P, D, O). Track as flat colors.

## Implementation
- `src/games/RushHour/index.tsx`
- `src/games/RushHour/track.ts` — track data (tile grid, checkpoint waypoints, shortcut spline for Tobias)
- `src/games/RushHour/ai.ts` — rival behavior with reverse rubber-banding logic
- `src/games/RushHour/physics.ts` — top-down arcade movement (max speed, friction, turn rate)
- Camera follows player; track rotates around player or scrolls — pick whichever is simpler given the chosen track layout

## Verification
- Track renders top-down; camera scrolls/rotates correctly relative to player
- 4 rivals complete the race with characteristic behaviors (Tobias takes shortcuts; Masami flies; Penny and Darwin drive normally)
- Ocho trips randomly on cracks throughout the race
- Tobias is faster and unreachable through the gated shortcuts
- Masami visibly leaves the track surface
- Reverse rubber-banding actually punishes last place (measurable speed difference)
- Payday rescue fires when Ocho is last at lap-3 boundary
- Touch: steering pad + accelerate + brake buttons feel okay on a phone (test on a real device)
