# 02 — School Run

> Before starting: read `00-foundation.md` for the shared contract, three inviolable rules, and engine helpers.

## Source parody
Paperboy (side-scroller, dodge obstacles, collect targets).

## Concept
Auto-scrolling sidescroller through "school". Pick up good grades (A, B), avoid bad grades (F) and obstacles (bullies, falling textbooks). End-of-level "REPORT CARD" checkpoint requires grade ≥ C to pass.

## Mechanics
- Auto-scroll right at constant speed
- `InputState.a` = jump, `InputState.down` = duck
- Grade meter (visible HUD bar) starts at C
- A: +20, B: +10, F: -25, obstacle hit: -15
- Drop below F → screen flash "HELD BACK" → respawn at level start as tiny kindergartener sprite (smaller hitbox, slower movement)
- Reach checkpoint with C or higher → `onComplete({ completed: true })`

## Inequity layer
- Tobias passes player on a hoverboard; auto-dodges; magnetically attracts A's; reaches the checkpoint first with `PRIVILEGE BONUS +500` popup
- Masami floats above the ground entirely, ignoring all obstacles
- Both visibly cross the checkpoint before the player **every single time** — this is not a bug

## Payday Defense
**Trigger:** demoted to kindergarten twice in one level.
**Effect:** Mom sprite picks up Ocho, runs through to the finish line carrying him on her back, dropping him at the checkpoint exhausted. Sets grade meter to C.
**Activation:** `requestPaydayDefense()` — returns true once per session.

## Difficulty (locked HARD)
- No mid-level checkpoints
- Obstacle density scales with distance traveled
- One bully hit drops grade meter sharply (-15)
- Kindergartener form is permanent for the rest of the level

## Sprites needed
- `ocho-run-4frame.png` (32×32, running animation)
- `ocho-kindergarten.png` (16×16, tiny version)
- `grade-a.png`, `grade-b.png`, `grade-f.png` (16×16 letter tiles)
- `bully.png` (32×32, obstacle)
- `textbook-fall.png` (16×16)
- `tobias-hoverboard.png` (40×24)
- `masami-cloud.png` (40×24)
- `report-card-checkpoint.png` (48×64, finish line)

**Shape fallback:** rectangles with letter labels.

## Implementation
- `src/games/SchoolRun/index.tsx`
- `src/games/SchoolRun/logic.ts` — scrolling, spawn tables, grade meter, demotion handling
- `src/games/SchoolRun/sprites.ts`
- Parallax background using two layered canvas draws (far-back slow, near-back fast)

## Verification
- Auto-scroll runs smoothly; jump and duck respond correctly
- Grade meter visible and updates on pickup/hit
- F demotion triggers HELD BACK overlay and respawn with tiny sprite
- Tobias and Masami consistently pass the player with their popups
- Payday Defense triggers on second demotion exactly once
- Touch: jump and duck work via on-screen buttons (`A` and down on D-pad)
- 60fps on a mid-tier phone
