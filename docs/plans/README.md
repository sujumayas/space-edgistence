# Plans index

Ten self-contained plans. Each Claude Code session reads `00-foundation.md` first (the shared chassis), then its specific plan.

| File | Purpose | Depends on |
|---|---|---|
| [`00-foundation.md`](./00-foundation.md) | Shell, engine, pause, menu, leaderboard, cutscene, mobile, placeholder game | — |
| [`01-bills-vs-coins.md`](./01-bills-vs-coins.md) | Game 1 — Bomberman / Space Invaders parody | Foundation |
| [`02-school-run.md`](./02-school-run.md) | Game 2 — Paperboy parody | Foundation |
| [`03-micro-chores.md`](./03-micro-chores.md) | Game 3 — WarioWare parody | Foundation |
| [`04-brain-drain.md`](./04-brain-drain.md) | Game 4 — Brain Age parody | Foundation |
| [`05-rush-hour.md`](./05-rush-hour.md) | Game 5 — Mario Kart parody (most complex) | Foundation |
| [`06-bug-swatter.md`](./06-bug-swatter.md) | Game 6 — Gnat Attack parody (most mobile-friendly) | Foundation |
| [`07-pill-matcher.md`](./07-pill-matcher.md) | Game 7 — Dr. Mario parody | Foundation |
| [`08-oil-panic.md`](./08-oil-panic.md) | Game 8 — Oil Panic (Game & Watch) parody | Foundation |
| [`09-polish-and-deploy.md`](./09-polish-and-deploy.md) | Audio, ending, mobile QA, performance, deploy | All games |

## Recommended order

1. Foundation (session 1)
2. Bills vs Coins (session 2)
3. School Run (session 3) — **shippable v1 reached here**
4. Anything next (recommend Bug Swatter or Pill Matcher for simpler scope)
5. Polish & Deploy (session 10)

## How each plan is structured

Every per-game plan uses the same template:

- **Source parody** — the classic game it riffs on
- **Concept** — one-paragraph pitch
- **Mechanics** — bullet list of controls and rules
- **Inequity layer** — how systemic privilege manifests visually in this game
- **Payday Defense** — trigger, effect, one-time activation
- **Difficulty (locked HARD)** — what stays cruel
- **Sprites needed** — asset list with shape-primitive fallback
- **Implementation** — files to create, helpers to reuse
- **Verification** — how to confirm it's done

The shared `MiniGameProps` contract, global state shape, and engine helpers live in `00-foundation.md`. Per-game plans never redefine them.
