import type { SfxName } from '../../engine/useAudio';
import type { Microgame, MicroInput } from './microgames/types';
import { pickMicrogame } from './registry';
import { pickCutaway, CUTAWAY_MS } from './cutaway';
import type { Cutaway } from './cutaway';

// ---- tuning (locked HARD) ----
export const TARGET_CLEARS = 25; // 25 microgames survived → level complete
export const START_LIVES = 3; // shared across the whole montage
export const RESULT_SEC = 0.7; // NICE!/MISS! flash between play and cutaway
export const SPEED_STEP = 0.2; // +0.2 multiplier every 5 cleared
export const SPEED_EVERY = 5;

export type Phase = 'play' | 'result' | 'cutaway' | 'done';

export type State = {
  phase: Phase;
  current: Microgame | null;
  microState: unknown;
  lastId: string | null;

  // current-microgame timing (scaled by speedMult)
  timeLeft: number; // ms left in the budget
  budget: number; // the full budget, for the timer bar ratio
  microElapsed: number; // seconds, for render animation

  // result flash
  resultTimer: number;
  resultWin: boolean;

  // cutaway
  cutawayTimer: number;
  cutaway: Cutaway | null;
  lastCaption: string | null;

  cleared: number;
  speedMult: number;
  lives: number;
  livesLost: number;

  paydayAuto: boolean; // current microgame auto-completes (Mom)
  paydayRequested: boolean;

  elapsed: number;
  over: boolean; // out of lives — shell finalizes via onLifeLost
  won: boolean;
};

export type StepEvents = {
  scoreDelta: number;
  sfx: SfxName[];
  lifeLost: boolean;
  requestPayday: boolean;
  glitchMs: number;
  won: boolean;
};

function emptyEvents(): StepEvents {
  return {
    scoreDelta: 0,
    sfx: [],
    lifeLost: false,
    requestPayday: false,
    glitchMs: 0,
    won: false,
  };
}

export function speedFor(cleared: number): number {
  return 1 + SPEED_STEP * Math.floor(cleared / SPEED_EVERY);
}

function startMicrogame(s: State): void {
  const game = pickMicrogame(s.lastId);
  s.current = game;
  s.microState = game.initial();
  s.lastId = game.id;
  s.budget = game.durationMs;
  s.timeLeft = game.durationMs;
  s.microElapsed = 0;
  s.paydayAuto = false;
  s.phase = 'play';
}

export function makeState(): State {
  const s: State = {
    phase: 'play',
    current: null,
    microState: null,
    lastId: null,
    timeLeft: 0,
    budget: 1,
    microElapsed: 0,
    resultTimer: 0,
    resultWin: false,
    cutawayTimer: 0,
    cutaway: null,
    lastCaption: null,
    cleared: 0,
    speedMult: 1,
    lives: START_LIVES,
    livesLost: 0,
    paydayAuto: false,
    paydayRequested: false,
    elapsed: 0,
    over: false,
    won: false,
  };
  startMicrogame(s);
  return s;
}

// A neutral input used while Payday Defense plays the microgame for you.
const NO_INPUT: MicroInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  a: false,
  leftEdge: false,
  rightEdge: false,
  upEdge: false,
  downEdge: false,
  aEdge: false,
};

function onSuccess(s: State, ev: StepEvents): void {
  s.cleared += 1;
  s.speedMult = speedFor(s.cleared);
  ev.scoreDelta += Math.round(100 * s.speedMult);
  ev.sfx.push('coin');
  s.paydayAuto = false;

  if (s.cleared >= TARGET_CLEARS) {
    s.won = true;
    s.phase = 'done';
    ev.won = true;
    ev.scoreDelta += 500;
    ev.sfx.push('payday');
    return;
  }
  s.phase = 'result';
  s.resultWin = true;
  s.resultTimer = RESULT_SEC;
}

function onFail(s: State, ev: StepEvents): void {
  ev.lifeLost = true;
  ev.sfx.push('lose');
  ev.glitchMs = Math.max(ev.glitchMs, 260);
  s.lives -= 1;
  s.livesLost += 1;
  s.paydayAuto = false;

  if (s.lives <= 0) {
    // Out of lives. The shell sees global lives hit 0 (via onLifeLost) and
    // finalizes the run as a game over — we just freeze the sim here.
    s.over = true;
    s.phase = 'done';
    return;
  }
  s.phase = 'result';
  s.resultWin = false;
  s.resultTimer = RESULT_SEC;
}

/**
 * Advances the montage one fixed step. Mutates state and returns an events bag;
 * the React component performs I/O (score, sfx, life loss, payday, glitch,
 * completion). Pure of React/DOM so it stays headless-testable.
 */
export function stepGame(s: State, input: MicroInput, dt: number): StepEvents {
  const ev = emptyEvents();
  if (s.over || s.won || s.phase === 'done') return ev;
  s.elapsed += dt;

  if (s.phase === 'play') {
    const game = s.current;
    if (!game) return ev;
    const sdt = dt * s.speedMult;
    s.microElapsed += sdt;
    s.timeLeft -= sdt * 1000;

    if (s.paydayAuto) {
      // Mom plays it for you: advance visuals with no input, win on timeout.
      game.tick(s.microState, NO_INPUT, sdt);
      if (s.timeLeft <= 0) onSuccess(s, ev);
      return ev;
    }

    const res = game.tick(s.microState, input, sdt);
    if (res === 'success') onSuccess(s, ev);
    else if (res === 'fail') onFail(s, ev);
    else if (s.timeLeft <= 0) onFail(s, ev); // timeout = miss
    return ev;
  }

  if (s.phase === 'result') {
    s.resultTimer -= dt;
    if (s.resultTimer <= 0) {
      s.cutaway = pickCutaway(s.lastCaption);
      s.lastCaption = s.cutaway.caption;
      s.cutawayTimer = CUTAWAY_MS / 1000;
      s.phase = 'cutaway';
    }
    return ev;
  }

  if (s.phase === 'cutaway') {
    // Input is frozen during the mockery beat — we simply ignore `input`.
    s.cutawayTimer -= dt;
    if (s.cutawayTimer <= 0) {
      // Payday Defense: lost 2 of 3 lives and the next chore is about to start.
      if (!s.paydayRequested && s.livesLost >= 2) {
        s.paydayRequested = true;
        ev.requestPayday = true;
      }
      startMicrogame(s);
    }
    return ev;
  }

  return ev;
}

/**
 * Granted Payday Defense: Mom takes over the *upcoming* microgame. The next
 * play phase runs with no player input and auto-succeeds on timeout while her
 * sprite plays the success animation. Once per session.
 */
export function applyPayday(s: State): void {
  s.paydayAuto = true;
}
