# 09 — Polish & Deploy

> Before starting: read `00-foundation.md`. This phase assumes all 8 games and the foundation are done.

## Context
All 8 games and the foundation exist and play correctly in isolation. This phase wraps the project into something portfolio-shareable: tightens the audio, the meta-layer jokes, the ending, the mobile experience, the bundle size, and the deploy story.

## Scope

1. **Audio pass.**
   - Every game has shot/hit/score/payday SFX (review and unify in `src/engine/audio.ts`)
   - Generated chiptune music for each game (loopable 30s clip) — can use [jsfxr](https://github.com/chr15m/jsfxr) or pre-rendered audio files
   - One menu theme that loops on the main menu and boot screen

2. **Glitch effects polish.**
   - The Giygas/MissingNo overlay used by BrainDrain ramps up — bring it to other games conditionally:
     - BillsVsCoins: glitch flickers when 1 possession is left
     - PillMatcher: glitch when field is >90% full
     - OilPanic: glitch when at 1 life

3. **Leaderboard pay-off.**
   - Hidden Konami code (↑↑↓↓←→←→BA) on the leaderboard screen adds a new entry above rank 1: `GOD MODE: $$$,$$$,$$$` — cheating doesn't help you, it just exposes another tier above you. The joke punches up the central thesis.

4. **Game-over / ending screen.**
   - Final screen ties back to the episode's theme. Short text, paced like a credits roll, ending with: `Difficulty: HARD — locked at factory.`
   - Plays after the player completes all 8 games (rare) or "gives up" (clicks a hidden option in the pause menu after losing N times)

5. **Mobile QA.**
   - Test all 8 games on at least 2 real phones (iOS Safari + Android Chrome) or 2 Chrome devtools mobile profiles
   - Fix any touch issues: button sizing, dead zones, accidental gestures, viewport units, safe-area insets

6. **Performance pass.**
   - Lighthouse ≥ 90 on all categories
   - Each game route lazy-loaded via `React.lazy(() => import('./games/...'))`
   - Verify each game chunk is < 500KB gzipped (use `npm run build` + bundle analyzer)
   - Audio assets loaded on demand per game

7. **README.**
   - Explains the design philosophy FIRST (the inequity thesis, what the episode is about)
   - Tech stack second
   - Embeds screenshots / GIFs of each game
   - Links the YouTube reference and the live deploy
   - Credits the original episode as inspiration; clearly labels as fan parody, no Cartoon Network IP used

8. **Deploy.**
   - Push to Vercel or Netlify
   - Configure custom domain (e.g. `space-edgistence.<yourdomain>`)
   - Set CSP headers if needed
   - Verify the deployed build matches local

9. **Analytics (optional).**
   - Default: none.
   - If portfolio metrics matter: Plausible or Umami with explicit cookie banner (the project is about ethics; analytics should match the vibe)

## Stretch (skip if v1 is tight)
- **Tobias Mode:** play any game as Tobias. Every game is trivially easy, framed as the ironic alt-version. Cosmetic only — not a real game mode, more of an "extra menu option" that reveals the unfairness from the other side.
- **Spanish localization:** the author is in Lima. Toggle in settings, all strings in `i18n.json`.
- **Achievements:** "Worked 5 jobs in one day", "Held back 3 times", "Watched Tobias win 100 times". Stored in localStorage.

## Verification
- Lighthouse Performance ≥ 90 on the deployed URL
- All 8 games playable on phone and desktop without UI bugs
- Bundle analysis: each game route lazy-loaded, no game chunk above 500KB gzipped
- `npx tsc --noEmit` zero errors in strict mode
- A non-Gumball viewer can play it and understand the commentary by the end
- A Gumball fan laughs at least three times
- The Konami code on the leaderboard works and produces the "GOD MODE" tier
- The pause menu Difficulty row is still locked (regression check — easy to accidentally make it editable during a refactor)
