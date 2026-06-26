import { GAME_W, GAME_H } from '../../engine/useCanvas';
import { Pool } from '../../engine/pool';
import { aabb, clamp } from '../../engine/collision';
import type { Rect } from '../../engine/collision';
import type { SfxName } from '../../engine/useAudio';

// ---- geometry / tuning ----
export const GROUND_Y = GAME_H - 22; // top of the floor; the player's feet rest here
export const PX = 40; // player is fixed on screen; the world scrolls past

export const STAND_W = 16;
export const STAND_H = 26;
export const DUCK_H = 14;
export const KID_W = 12;
export const KID_H = 16;
export const KID_DUCK_H = 10;

export const SCROLL_BASE = 72; // constant auto-scroll speed (px/s) — rule: never changes
export const GRAVITY = 560;
export const JUMP_V = 205;
export const KID_JUMP_V = 178; // demoted = weaker hops

export const CHECKPOINT_DISTANCE = 3000; // ~42s of running to the REPORT CARD

// Grade meter: 0..100. Letters partition the range; below 0 = HELD BACK.
export const METER_MAX = 100;
export const METER_START = 50; // mid-C
export const C_THRESHOLD = 40; // checkpoint requires >= C to pass

export const HELD_BACK_SEC = 1.4; // overlay duration before respawn

// Spawn lanes (entity top y). Standing player ≈ [GROUND_Y-26 .. GROUND_Y].
export const GROUND_BAND = GROUND_Y - 22; // jump to clear
export const DUCK_BAND = GROUND_Y - 30; // duck (or jump) to clear
export const AIR_BAND = GROUND_Y - 52; // only reachable mid-jump

// ---- entities ----
export type EKind = 'A' | 'B' | 'F' | 'bully' | 'book';

export type Entity = {
  active: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: EKind;
  spin: number; // render-only tumble phase
  stealable: boolean; // A's that Tobias will magnet away
  magnet: boolean; // currently being pulled toward Tobias
  hitFlash: number;
};

export type FloatText = {
  active: boolean;
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
};

export type Rival = {
  x: number; // fixed screen x (always ahead of the player)
  y: number;
  lead: number; // world-distance head start; larger = crosses sooner
  kind: 'tobias' | 'masami';
  crossed: boolean;
};

export type State = {
  elapsed: number;
  distance: number; // world px travelled toward the checkpoint

  // player
  feetY: number;
  vy: number;
  ducking: boolean;
  prevJump: boolean;
  kindergarten: boolean; // permanent once demoted
  invuln: number;
  flash: number;

  // grade
  meter: number;

  // spawning
  spawnTimer: number;

  // rivals
  tobias: Rival;
  masami: Rival;

  // demotion / payday
  demotions: number;
  heldBack: number; // > 0 = HELD BACK overlay active, gameplay frozen
  paydayRequested: boolean;
  momCarried: boolean;

  checkpointVisible: boolean;
  over: boolean;
  won: boolean;
};

export type Pools = {
  entities: Pool<Entity>;
  floats: Pool<FloatText>;
};

export function makePools(): Pools {
  return {
    entities: new Pool<Entity>(() => ({
      active: false,
      x: 0,
      y: 0,
      w: 14,
      h: 14,
      kind: 'A',
      spin: 0,
      stealable: false,
      magnet: false,
      hitFlash: 0,
    })),
    floats: new Pool<FloatText>(() => ({
      active: false,
      x: 0,
      y: 0,
      text: '',
      life: 0,
      color: '#fff',
    })),
  };
}

export function makeState(): State {
  return {
    elapsed: 0,
    distance: 0,
    feetY: GROUND_Y,
    vy: 0,
    ducking: false,
    prevJump: false,
    kindergarten: false,
    invuln: 0,
    flash: 0,
    meter: METER_START,
    spawnTimer: 0.8,
    tobias: { x: PX + 55, y: GROUND_Y - 50, lead: 55, kind: 'tobias', crossed: false },
    masami: { x: PX + 84, y: GROUND_Y - 80, lead: 84, kind: 'masami', crossed: false },
    demotions: 0,
    heldBack: 0,
    paydayRequested: false,
    momCarried: false,
    checkpointVisible: false,
    over: false,
    won: false,
  };
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// F < D < C < B < A
export function gradeLetter(meter: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (meter >= 80) return 'A';
  if (meter >= 60) return 'B';
  if (meter >= C_THRESHOLD) return 'C';
  if (meter >= 20) return 'D';
  return 'F';
}

/** Difficulty curve: obstacle cadence tightens with distance (floor 0.55s). */
export function currentSpawnInterval(distance: number): number {
  const prog = clamp(distance / CHECKPOINT_DISTANCE, 0, 1);
  return clamp(1.0 - prog * 0.5, 0.55, 1.0) * rand(0.85, 1.15);
}

export function playerRect(s: State): Rect {
  const w = s.kindergarten ? KID_W : STAND_W;
  const baseH = s.kindergarten ? KID_H : STAND_H;
  const h = s.ducking ? (s.kindergarten ? KID_DUCK_H : DUCK_H) : baseH;
  return { x: PX, y: s.feetY - h, w, h };
}

export function spawnFloat(
  pool: Pool<FloatText>,
  x: number,
  y: number,
  text: string,
  color: string,
): void {
  const f = pool.acquire();
  f.x = x;
  f.y = y;
  f.text = text;
  f.life = 0.9;
  f.color = color;
}

function spawnEntity(s: State, pools: Pools): void {
  const prog = clamp(s.distance / CHECKPOINT_DISTANCE, 0, 1);
  const weights: Array<[EKind, number]> = [
    ['A', 2],
    ['B', 3],
    ['F', 1.5 + prog * 2],
    ['bully', 1.5 + prog * 2.5],
    ['book', 1 + prog * 2],
  ];
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  let kind: EKind = 'B';
  for (const [k, w] of weights) {
    roll -= w;
    if (roll <= 0) {
      kind = k;
      break;
    }
  }

  const e = pools.entities.acquire();
  e.kind = kind;
  e.spin = 0;
  e.magnet = false;
  e.stealable = false;
  e.hitFlash = 0;
  e.x = GAME_W + rand(0, 28);

  switch (kind) {
    case 'A':
      e.w = 14;
      e.h = 14;
      e.y = AIR_BAND; // jump to grab it
      e.stealable = Math.random() < 0.7; // Tobias steals most of them
      break;
    case 'B':
      e.w = 14;
      e.h = 14;
      e.y = GROUND_BAND; // free grab at running height
      break;
    case 'F':
      e.w = 14;
      e.h = 14;
      e.y = Math.random() < 0.5 ? GROUND_BAND : DUCK_BAND; // jump or duck to dodge
      break;
    case 'bully':
      e.w = 18;
      e.h = 26;
      e.y = GROUND_Y - 26; // jump over
      break;
    case 'book':
      e.w = 16;
      e.h = 14;
      e.y = DUCK_BAND; // duck under
      break;
  }
}

export function toRect(o: { x: number; y: number; w: number; h: number }): Rect {
  return { x: o.x, y: o.y, w: o.w, h: o.h };
}

export { aabb, clamp, GAME_W, GAME_H };

// ---- per-frame step ----
export type InputSnapshot = { a: boolean; down: boolean };

export type StepEvents = {
  scoreDelta: number;
  sfx: SfxName[];
  requestPayday: boolean;
  glitchMs: number;
  gameOver: boolean;
  won: boolean;
};

function emptyEvents(): StepEvents {
  return {
    scoreDelta: 0,
    sfx: [],
    requestPayday: false,
    glitchMs: 0,
    gameOver: false,
    won: false,
  };
}

function respawnAtStart(s: State, pools: Pools): void {
  s.distance = 0;
  s.meter = METER_START;
  s.feetY = GROUND_Y;
  s.vy = 0;
  s.ducking = false;
  s.invuln = 1.0;
  s.spawnTimer = 0.8;
  s.checkpointVisible = false;
  pools.entities.releaseAll();
  s.tobias.crossed = false;
  s.masami.crossed = false;
  // kindergarten form is permanent for the rest of the level
}

function triggerDemotion(s: State, ev: StepEvents): void {
  s.kindergarten = true;
  s.demotions += 1;
  s.heldBack = HELD_BACK_SEC;
  s.invuln = 0;
  ev.glitchMs = Math.max(ev.glitchMs, 350);
  ev.sfx.push('lose');
  // Payday Defense: demoted to kindergarten twice in one level.
  if (s.demotions >= 2 && !s.paydayRequested) {
    s.paydayRequested = true;
    ev.requestPayday = true;
  }
}

function handleHit(s: State, pools: Pools, e: Entity, ev: StepEvents): void {
  if (e.kind === 'A' || e.kind === 'B') {
    const add = e.kind === 'A' ? 20 : 10;
    const score = e.kind === 'A' ? 200 : 100;
    s.meter = Math.min(METER_MAX, s.meter + add);
    ev.scoreDelta += score;
    ev.sfx.push('coin');
    spawnFloat(pools.floats, e.x + e.w / 2, e.y, `+${add}`, '#7fffa0');
    pools.entities.release(e);
    return;
  }
  // hazard
  if (s.invuln > 0) return;
  const dmg = e.kind === 'F' ? 25 : 15;
  s.meter -= dmg;
  s.invuln = 0.7;
  s.flash = 0.3;
  ev.sfx.push(e.kind === 'F' ? 'lose' : 'hit');
  spawnFloat(
    pools.floats,
    e.x + e.w / 2,
    e.y - 2,
    e.kind === 'F' ? 'F! -25' : `-${dmg}`,
    '#ff2e88',
  );
  if (e.kind === 'F') pools.entities.release(e); // an F is collected; bullies/books run on by
  if (s.meter < 0) triggerDemotion(s, ev);
}

/**
 * Advances the simulation one fixed step. Mutates state/pools and returns an
 * events bag; the React component performs the actual I/O (score, sfx, payday,
 * glitch, completion). Keeps the game headless-testable.
 */
export function stepGame(
  s: State,
  pools: Pools,
  input: InputSnapshot,
  dt: number,
): StepEvents {
  const ev = emptyEvents();
  if (s.over) return ev;

  // HELD BACK freeze: count down the overlay, then respawn at the start.
  if (s.heldBack > 0) {
    s.heldBack -= dt;
    if (s.heldBack <= 0) {
      s.heldBack = 0;
      respawnAtStart(s, pools);
    }
    return ev;
  }

  s.elapsed += dt;
  s.distance += SCROLL_BASE * dt;

  // Reached the REPORT CARD checkpoint.
  if (s.distance >= CHECKPOINT_DISTANCE) {
    s.over = true;
    if (s.meter >= C_THRESHOLD) {
      s.won = true;
      ev.won = true;
      ev.scoreDelta += 500;
      ev.sfx.push('payday');
    } else {
      ev.gameOver = true;
      ev.sfx.push('lose');
    }
    return ev;
  }

  s.checkpointVisible = s.distance >= CHECKPOINT_DISTANCE - GAME_W;

  // ---- player ----
  const grounded = s.feetY >= GROUND_Y - 0.001;
  s.ducking = input.down && grounded;
  if (input.a && !s.prevJump && grounded && !s.ducking) {
    s.vy = -(s.kindergarten ? KID_JUMP_V : JUMP_V);
    ev.sfx.push('select');
  }
  s.prevJump = input.a;

  s.vy += GRAVITY * dt;
  s.feetY += s.vy * dt;
  if (s.feetY >= GROUND_Y) {
    s.feetY = GROUND_Y;
    s.vy = 0;
  }

  if (s.invuln > 0) s.invuln -= dt;
  if (s.flash > 0) s.flash -= dt;

  // ---- rivals always cross the checkpoint before you (this is not a bug) ----
  for (const r of [s.masami, s.tobias]) {
    if (!r.crossed && s.distance >= CHECKPOINT_DISTANCE - r.lead) {
      r.crossed = true;
      if (r.kind === 'tobias') {
        spawnFloat(pools.floats, r.x + 4, r.y - 12, 'PRIVILEGE BONUS +500', '#ffd23f');
      } else {
        spawnFloat(pools.floats, r.x + 4, r.y - 12, 'ALREADY GRADUATED', '#2ee6f6');
      }
      ev.sfx.push('coin');
    }
  }

  // ---- spawning (clear the runway before the finish line) ----
  if (s.distance < CHECKPOINT_DISTANCE - 200) {
    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      spawnEntity(s, pools);
      s.spawnTimer = currentSpawnInterval(s.distance);
    }
  }

  // ---- entities ----
  const tobiasActive = !s.tobias.crossed && s.distance < CHECKPOINT_DISTANCE - 200;
  pools.entities.forEachActive((e) => {
    e.spin += dt * 6;
    if (e.hitFlash > 0) e.hitFlash -= dt;

    if (e.magnet) {
      // Tobias pulls it away from you.
      const t = Math.min(1, 8 * dt);
      e.x += (s.tobias.x - e.x) * t;
      e.y += (s.tobias.y - e.y) * t;
      if (Math.abs(e.x - s.tobias.x) < 6) {
        spawnFloat(pools.floats, s.tobias.x + 6, s.tobias.y - 6, 'MINE!', '#ff2e88');
        ev.sfx.push('coin');
        pools.entities.release(e);
      }
      return;
    }

    e.x -= SCROLL_BASE * dt;
    if (e.x + e.w < -4) {
      pools.entities.release(e);
      return;
    }

    // Tobias magnetically attracts A's as they pass his column.
    if (
      tobiasActive &&
      e.kind === 'A' &&
      e.stealable &&
      Math.abs(e.x + e.w / 2 - s.tobias.x) < 24 &&
      Math.abs(e.y - s.tobias.y) < 28
    ) {
      e.magnet = true;
      return;
    }

    if (aabb(playerRect(s), toRect(e))) handleHit(s, pools, e, ev);
  });

  // ---- floats ----
  pools.floats.forEachActive((f) => {
    f.life -= dt;
    f.y -= 14 * dt;
    if (f.life <= 0) pools.floats.release(f);
  });

  return ev;
}

/**
 * Granted Payday Defense: Mom carries Ocho through to the finish line, drops him
 * at the checkpoint exhausted, and sets the grade meter to C. Implemented by
 * cancelling the HELD BACK respawn and snapping him to the checkpoint with a
 * passing grade — the next step registers the win.
 */
export function applyPayday(s: State, pools: Pools): void {
  s.heldBack = 0;
  s.meter = METER_START; // a clean C
  s.momCarried = true;
  s.distance = CHECKPOINT_DISTANCE; // dropped at the checkpoint
  pools.entities.releaseAll();
}
