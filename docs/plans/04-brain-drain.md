# 04 — Brain Drain

> Before starting: read `00-foundation.md` for the shared contract, three inviolable rules, and engine helpers.

## Source parody
Brain Age (rapid mental math under time pressure).

## Concept
Rapid-fire questions, but the kind Ocho actually faces — household-budget math under stress. Wrong answers raise a STRESS meter; full stress triggers a Giygas-style screen glitch that blinds the player.

## Mechanics
- 60-second round
- Each question shows 3 multiple-choice answers; player selects via `InputState.up/down` and confirms with `a`
- Correct: +10 score; Wrong: -5 score AND stress += 20
- When stress reaches 100: call shell's `triggerGlitch(3000)`. Screen distorts for 3 seconds; player cannot read questions during glitch
- Stress decays by 5 every 5s of clean play (no wrong answers)
- Round end at 60s → `onComplete({ completed: true })`

## Question pool (the commentary IS the content)
- "Rent is $800. Mom earns $5/hr × 3 jobs × 8 hrs/day. Days to pay rent?" (answer: ~7)
- "Bus: $2.50. You have $3. Can you afford lunch ($4)?" (answer: No)
- "Hot water bill or internet for homework — pick ONE this month." (answer: trick — both are penalties, but "internet" is "correct" for school)
- "You have $7. School supplies cost $9. How many subjects can you afford?" (answer: 0 — supplies are per subject)
- 20+ total, weighted toward harder questions as the round progresses

Store as typed pool:
```ts
type Question = { id: string; prompt: string; choices: string[]; correctIndex: number; difficulty: 1|2|3 };
```

## Inequity layer
Every 10s, a side-popup shows Tobias's question: "What's 1+1?" with one button: "2". He always answers correctly. Faint laugh SFX plays.

## Payday Defense
**Trigger:** stress hits 100 for the second time in a round.
**Effect:** Mom slides a cup of coffee onto the HUD. Stress resets to 0.
**Activation:** `requestPaydayDefense()` — once per session.

## Difficulty (locked HARD)
- Question complexity ramps every 15 seconds (difficulty 1 → 2 → 3 → mixed-3)
- Timer never extends
- No skip button

## Sprites needed
- `coffee-cup.png` (mom's payday gift)
- `tobias-question-popup.png` (template panel)
- Stress meter graphic (segmented bar)
- Glitch overlay is shell-owned — just call `triggerGlitch()`

**Shape fallback:** text + colored-bar primitives. This game is mostly text anyway.

## Implementation
- `src/games/BrainDrain/index.tsx`
- `src/games/BrainDrain/questions.ts` — typed question pool
- `src/games/BrainDrain/stress.ts` — meter logic and decay
- UI is mostly DOM-over-canvas — text-heavy; use absolute-positioned divs with Press Start 2P

## Verification
- Questions appear, can be answered, score updates correctly per `onScoreUpdate`
- Stress meter fills on wrong answers, decays on clean play
- Glitch overlay activates at stress=100 and player loses readability
- Tobias popup appears periodically with the trivial question
- Payday coffee fires once at the SECOND 100-stress event (not the first)
- Round ends at 60s with summary screen
- Touch: up/down via D-pad, confirm via A button
