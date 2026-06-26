# 00 — Foundation: Shell, Cutscene, Engine, Mobile

> This is the chassis every other game plugs into. Read this file first in **every** future session, then your game-specific plan.

## Context
Build the chassis that all 8 minigames will plug into. Nothing about a specific game lives here — this is the engine, the global state, the CRT shell, the pause menu, the boot screen, the leaderboard, the cutscene, the mobile touch overlay, and the shared payday/glitch overlays.

If this phase is wrong, all 8 games suffer. If this phase is right, each subsequent game is just a 200–400 LOC component slotted into the shared contract.

## The Three Inviolable Rules
1. **Difficulty is locked.** Pause menu shows it grayed out at HARD; clicking plays a "denied" sound.
2. **Inequity is visible.** Rivals appear in every game with visibly better stats. No exceptions.
3. **Payday Defense is once-per-session.** Triggers automatically at the brink; player cannot summon it.

When in doubt: pick the option that makes the unfairness *louder*, not the option that makes the game fairer.

## Locked stack decisions
- React + Vite + **TypeScript** + HTML5 Canvas (already scaffolded)
- Press Start 2P (Google Fonts) for all UI text
- Touch controls from day one, unified with keyboard via a single `InputState`
- `localStorage` for persistence (not Claude's `window.storage`)
- Internal resolution 256×224 (NES native), scaled to viewport with `image-rendering: pixelated`

## Scope

### Engine (`src/engine/`)
- `useCanvas.ts` — canvas ref with DPR-aware sizing, integer scaling to viewport
- `useGameLoop.ts` — fixed timestep loop with accumulator (target 60Hz logic, render uncapped)
- `useInput.ts` — merges keyboard + touch into a single `InputState` (see below)
- `useAudio.ts` — Web Audio API wrapper; load + play short SFX, support looping music
- `useSprite.ts` — load + cache sprite-sheet PNGs, draw frames by coordinates
- `collision.ts` — AABB overlap, point-in-rect, distance
- `pool.ts` — generic object pool to avoid GC churn (bullets, bills, drips, etc.)

### State (`src/state/`)
- `GameContext.tsx` — global state per `GlobalState` shape below
- `storage.ts` — typed localStorage wrapper, keys: `leaderboard:global`, `progress:ocho`, `settings:crt`

### Types (`src/types/`)
- `minigame.ts` — the `MiniGameProps` interface every game implements

### Shell (`src/shell/`)
- `GameShell.tsx` — wraps a minigame; renders HUD (lives, score), pause menu, payday overlay, glitch overlay
- `BootScreen.tsx` — CRT power-on animation, logo
- `MainMenu.tsx` — game selection grid; greys out games not yet unlocked
- `Cutscene.tsx` — skippable intro animator (see below)
- `PauseMenu.tsx` — **the locked-difficulty joke lives here**
- `PaydayOverlay.tsx` — mom-rescue animation, shared visual across games
- `GlitchOverlay.tsx` — Giygas/MissingNo style distortion, time-bounded
- `Leaderboard.tsx` — pre-seeded top 10 with rivals; OCHO always rank 11
- `GameOverScreen.tsx` — end-of-run summary with score and "continue" only if lives remain

### Input (`src/input/`)
- `TouchOverlay.tsx` — virtual D-pad on left, A/B buttons on right; visible only when pointer is coarse

### Styles (`src/styles/`)
- `crt.css` — scanlines, glow, pixel-perfect scaling, optional curvature
- `fonts.css` — Press Start 2P import

### App
- `App.tsx` — top-level router: boot → menu → cutscene (first run) → game → results

### Placeholder minigame
- `src/games/Placeholder/index.tsx` — implements `MiniGameProps`. A single black square that earns 10 points per click and loses a life every 5 seconds. Demonstrates the contract end-to-end so the foundation session can verify everything wires up before any real game is built.

## Shared interfaces

### `src/types/minigame.ts`
```ts
export type GameStats = {
  finalScore: number;
  durationMs: number;
  livesLost: number;
  completed: boolean; // true = won, false = game over
};

export interface MiniGameProps {
  onScoreUpdate: (delta: number) => void;
  onLifeLost: () => void;
  onComplete: (stats: GameStats) => void;
  requestPaydayDefense: () => boolean; // returns true if granted (only once per session)
  triggerGlitch: (durationMs: number) => void;
  inequityMode: boolean; // always true in v1
  paused: boolean; // shell-controlled
}
```

### `InputState` (in `useInput.ts`)
```ts
export type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  a: boolean;     // primary action (space / on-screen A)
  b: boolean;     // secondary action (shift / on-screen B)
  start: boolean; // pause (esc / on-screen start)
  pointer: { x: number; y: number; down: boolean } | null; // mouse/touch
};
```

Every minigame reads InputState — **never raw `keydown`**. This is what makes mobile painless.

### Global state (`GameContext.tsx`)
```ts
type GameId = 'bills' | 'school' | 'micro' | 'brain' | 'rush' | 'bug' | 'pill' | 'oil';

type GlobalState = {
  lives: number;          // starts at 3, persists within a session
  totalScore: number;
  currentGame: GameId | 'menu' | 'cutscene' | 'boot' | 'gameover';
  paydayUsed: boolean;
  glitchUntil: number;    // ms timestamp; overlay active when Date.now() < this
  unlocked: GameId[];
  highScores: Record<GameId, ScoreEntry[]>;
};
```

## The Pause Menu joke (critical)
```
+---------------------+
|       PAUSED        |
|                     |
|   Resume            |
|   Sound: ON         |
|   CRT effect: ON    |
|   Difficulty: HARD  |  <-- grayed out, non-interactive, plays "denied" SFX on click
|   Quit              |
+---------------------+
```
Implementation: the Difficulty row is a `<button disabled>` styled with reduced opacity and a "no" cursor. Clicking it plays a buzzer SFX. The label NEVER changes.

## The Leaderboard joke
Pre-seed `leaderboard:global` on first run:
```
1.  TOBIAS    9,999,999
2.  MASAMI    9,000,000
3.  PENNY     1,200,000
4.  GUMBALL     900,000
5.  DARWIN      850,000
6.  ALAN        700,000
7.  CARRIE      650,000
8.  BANANA      600,000
9.  ANTON       550,000
10. CARMEN      500,000
---
11. OCHO    <your best>
```
OCHO row is rendered separately below the top 10 list, always at rank 11. Footer reads: `TOP 10 ONLY — KEEP TRYING`.

## Cutscene (~30s, skippable)
A simple frame-array animator: each scene is `{ frames: ImageBitmap[]; durationMs: number; caption?: string }`. Plays in sequence. Any input skips to next scene; second input skips entirely.

Scene plan:
- **Scene 1 (5s):** Ship breaking down over Elmore (Arwing-style sprite, falling)
- **Scene 2 (5s):** Family lands; small house appears
- **Scene 3 (8s):** Mom-sprite montage: cleaning house → cashier → night shift, alarm clocks between
- **Scene 4 (4s):** Ocho alone in apartment, bills floating in
- **Scene 5 (8s):** Title card "SPACE EDGISTENCE" with subtitle "Difficulty: HARD — locked at factory"

## Sprites needed (foundation)
- `ocho-idle.png`, `ocho-walk-2frame.png`
- `mom-payday.png` (the rescue overlay)
- `heart-full.png`, `heart-empty.png`
- `coin-spin-4frame.png`
- `boot-logo.png`
- Rival portraits: `tobias.png`, `masami.png`, `penny.png`, `darwin.png`

**Shape fallback:** every sprite has a colored-rectangle equivalent. Render rectangles labeled with text if PNGs aren't ready. Game is fully playable without art.

## Files to create (rough count: 22)
```
src/main.tsx                            (Vite default, minor edits)
src/App.tsx
src/styles/crt.css
src/styles/fonts.css
src/types/minigame.ts
src/state/GameContext.tsx
src/state/storage.ts
src/engine/useCanvas.ts
src/engine/useGameLoop.ts
src/engine/useInput.ts
src/engine/useAudio.ts
src/engine/useSprite.ts
src/engine/collision.ts
src/engine/pool.ts
src/shell/GameShell.tsx
src/shell/BootScreen.tsx
src/shell/MainMenu.tsx
src/shell/Cutscene.tsx
src/shell/PauseMenu.tsx
src/shell/PaydayOverlay.tsx
src/shell/GlitchOverlay.tsx
src/shell/Leaderboard.tsx
src/shell/GameOverScreen.tsx
src/input/TouchOverlay.tsx
src/games/Placeholder/index.tsx
```

## Verification
- `npm install` then `npm run dev` boots, CRT shell renders, Press Start 2P loaded
- Flow: Boot screen → menu → cutscene (skippable) → menu → placeholder game → pause works → resume works → "Difficulty: HARD" row is non-interactive in pause menu → game over screen → back to menu
- Lives persist across game switches in one session, reset only on page reload
- Leaderboard pre-seeded on first run; OCHO always rank 11 regardless of score
- TouchOverlay appears in Chrome devtools mobile emulation, controls a moving sprite in the placeholder game
- `npx tsc --noEmit` passes with no errors (strict mode)
- `npm run build` succeeds; `npm run preview` serves it

## Out of scope
- Any minigame logic beyond the placeholder
- Final sprite art (rectangles are fine; sprites land per game)
- Deploy (lands in `09-polish-and-deploy.md`)
- Music (SFX-only here; chiptune music in polish phase)
