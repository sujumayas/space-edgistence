# Space Edgistence

A portfolio-grade web minigame anthology inspired by *The Wonderfully Weird World of Gumball* S2E7 "The Score", where Ocho's life is depicted as an 8-bit video game permanently set to hard mode.

The project is built as 10 self-contained Claude Code sessions. Each session works from a single plan file in `docs/plans/`.

## Status

**Playable.** The foundation chassis and the first game are built and verified.

- ✅ **Foundation** — engine (fixed-60Hz loop, 256×224 integer-scaled canvas, unified keyboard+touch input, procedural Web Audio SFX, object pool, AABB), CRT/synthwave shell (boot → cutscene → menu → game → game over), pause menu, payday & glitch overlays, leaderboard, mobile touch controls.
- ✅ **Game 1 — Bills vs Coins** — vertical shooter: pay descending bills with coins before they wreck your 4 possessions. Tobias's "TRUST FUND" chopper, Mom's Payday Defense, locked-HARD difficulty.
- ⬜ Games 2–8 + final polish/deploy — pending (see the session table below).

```bash
npm install && npm run dev   # then open the printed localhost URL
```

**Controls:** ← / → move · **Space** fire · **Esc** pause · on-screen D-pad + A on touch devices.

### A note on art

All in-game art is **rendered procedurally on the HTML5 canvas** in the references' synthwave palette — there are no PNG sprite assets. The plans list sprite filenames, but they also specify a shape/procedural fallback ("Game is fully playable without art"), which is the path this build takes. A `useSprite` loader exists for optional future PNG drop-in.

## Stack

- React + Vite + **TypeScript** + HTML5 Canvas
- Press Start 2P (Google Fonts)
- `localStorage` for persistence
- Mobile touch controls unified with keyboard input from day one

## The Three Inviolable Rules

Every minigame and every UI surface must respect these. They are the soul of the project:

1. **Difficulty is locked.** The pause menu shows a Difficulty row permanently grayed out at `HARD`. Clicking plays a "denied" sound.
2. **Inequity is visible.** Every game features rival NPCs (Tobias, Masami, Penny, Darwin) with visibly better stats. They are not opponents to beat — they exist on a better difficulty than the player.
3. **Mom's Payday Defense is deus ex machina.** Triggers automatically at the brink of failure. Once per session. Player cannot summon it.

When in doubt: pick the option that makes the unfairness *louder*, not the option that makes the game fairer.

## How to work on this project (Claude Code sessions)

Each session starts cold. Hand the next session **two** files:

1. `docs/plans/00-foundation.md` — shared chassis, contract, engine, and rules
2. The specific plan for what you're building this session (e.g. `docs/plans/01-bills-vs-coins.md`)

That is the entire onboarding. Each plan file is self-contained.

### Session sequence

| # | Session | Plan file | Output | Status |
|---|---|---|---|---|
| 1 | Foundation | `00-foundation.md` | Shell, engine, pause, menu, leaderboard, cutscene, mobile, placeholder game | ✅ done |
| 2 | Bills vs Coins | `01-bills-vs-coins.md` | Game 1 polished | ✅ done |
| 3 | School Run | `02-school-run.md` | Game 2 polished — **shippable v1 reached** | ⬜ |
| 4 | Bug Swatter | `06-bug-swatter.md` | Simplest game, ideal mobile QA | ⬜ |
| 5 | Pill Matcher | `07-pill-matcher.md` | Match-3 grid logic | ⬜ |
| 6 | Brain Drain | `04-brain-drain.md` | Text-heavy mental math | ⬜ |
| 7 | Micro Chores | `03-micro-chores.md` | WarioWare-style microgames | ⬜ |
| 8 | Rush Hour | `05-rush-hour.md` | Top-down racer (most complex) | ⬜ |
| 9 | Oil Panic | `08-oil-panic.md` | Split-screen survival | ⬜ |
| 10 | Polish & Deploy | `09-polish-and-deploy.md` | Audio, ending, mobile QA, deploy | ⬜ |

Order after session 3 is flexible — pick whichever game you're in the mood for.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed `localhost` URL. `npm run build` produces a production bundle in `dist/`.

### Project layout (`src/`)

```
engine/   game loop, canvas, input, audio, sprite loader, pool, collision
state/    global GameContext + typed localStorage
shell/    boot, menu, cutscene, pause, payday/glitch overlays, leaderboard, game-over, HUD
input/    mobile touch overlay (D-pad + A/B)
games/    registry + per-game folders (BillsVsCoins: index.tsx / logic.ts / sprites.ts)
```

Each game follows the same contract: a thin React `index.tsx` drives a **pure** `stepGame(state, pools, input, dt)` in `logic.ts` (which makes the logic headless-testable) and draws via procedural functions in `sprites.ts`.

## References

- `docs/references/` — drop screenshots from the YouTube clip and full episode here, organized per game folder
- Episode reference video ID: `68v4M_Oef3I` (YouTube)

## Credits

Inspired by *The Wonderfully Weird World of Gumball* S2E7 "The Score". This project is a fan parody / commentary work. No Cartoon Network IP is used directly — all assets are original.
