import { GAME_W, GAME_H } from '../../engine/useCanvas';
import { Pool } from '../../engine/pool';
import { aabb, clamp } from '../../engine/collision';
import type { Rect } from '../../engine/collision';
import type { SfxName } from '../../engine/useAudio';

// ---- tuning constants ----
export const PLAYER = { w: 24, h: 14, speed: 96, y: GAME_H - 42 };
export const COIN_START = 20;
export const COIN_REGEN_SEC = 2; // +1 coin every 2s
export const COIN_MAX = 99;
export const FIRE_CD = 0.16;
export const PROJ_SPEED = 200;

export const WIN_SECONDS = 90;

// Difficulty (locked HARD): spawn interval 1.5s, -0.05s every 10s, floor 0.4s.
export const SPAWN_START = 1.5;
export const SPAWN_STEP = 0.05;
export const SPAWN_STEP_EVERY = 10;
export const SPAWN_FLOOR = 0.4;

export const TOBIAS_EVERY = 15; // seconds
export const TOBIAS_DROP = 3; // coins dropped
export const TOBIAS_SPEED = 64;

export const IMPACT_Y = GAME_H - 20; // possessions line

export type BillKind = 'utility' | 'rent';

export type Bill = {
  active: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  hp: number;
  maxHp: number;
  kind: BillKind;
  label: string;
  flash: number;
};

export type Projectile = {
  active: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
};

export type FloatText = {
  active: boolean;
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
};

export type PossKind = 'couch' | 'tv' | 'fridge' | 'bed';
export type Possession = {
  kind: PossKind;
  x: number;
  w: number;
  alive: boolean;
  label: string;
};

export type Tobias = {
  active: boolean;
  x: number;
  y: number;
  dir: number;
  dropTimer: number;
  dropsLeft: number;
};

export type State = {
  px: number; // player x (left)
  coins: number;
  regenTimer: number;
  fireCd: number;
  elapsed: number;
  spawnTimer: number;
  spawnInterval: number;
  tobiasTimer: number;
  tobias: Tobias;
  possessions: Possession[];
  paydayFired: boolean;
  over: boolean;
  won: boolean;
};

export type Pools = {
  bills: Pool<Bill>;
  projectiles: Pool<Projectile>;
  floats: Pool<FloatText>;
};

const BILL_LABELS: Record<BillKind, string[]> = {
  utility: ['GAS', 'H2O', 'NET', 'PWR', 'PH'],
  rent: ['RENT'],
};

export function makePools(): Pools {
  return {
    bills: new Pool<Bill>(() => ({
      active: false,
      x: 0,
      y: 0,
      w: 20,
      h: 16,
      vy: 0,
      hp: 1,
      maxHp: 1,
      kind: 'utility',
      label: '',
      flash: 0,
    })),
    projectiles: new Pool<Projectile>(() => ({
      active: false,
      x: 0,
      y: 0,
      w: 4,
      h: 7,
      vy: 0,
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
  const slots: PossKind[] = ['couch', 'tv', 'fridge', 'bed'];
  const labels: Record<PossKind, string> = {
    couch: 'SOFA',
    tv: 'TV',
    fridge: 'FRDG',
    bed: 'BED',
  };
  const margin = 12;
  const w = 36;
  const gap = (GAME_W - margin * 2 - w * 4) / 3;
  const possessions: Possession[] = slots.map((kind, i) => ({
    kind,
    x: margin + i * (w + gap),
    w,
    alive: true,
    label: labels[kind],
  }));

  return {
    px: GAME_W / 2 - PLAYER.w / 2,
    coins: COIN_START,
    regenTimer: 0,
    fireCd: 0,
    elapsed: 0,
    spawnTimer: 0,
    spawnInterval: SPAWN_START,
    tobiasTimer: 0,
    tobias: { active: false, x: 0, y: 26, dir: 1, dropTimer: 0, dropsLeft: 0 },
    possessions,
    paydayFired: false,
    over: false,
    won: false,
  };
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function spawnBill(pool: Pool<Bill>): void {
  const isRent = Math.random() < 0.22;
  const b = pool.acquire();
  if (isRent) {
    b.kind = 'rent';
    b.w = 30;
    b.h = 24;
    b.hp = 5;
    b.maxHp = 5;
    b.vy = rand(16, 22);
    b.label = 'RENT';
  } else {
    b.kind = 'utility';
    b.w = 20;
    b.h = 16;
    b.hp = 1;
    b.maxHp = 1;
    b.vy = rand(20, 30);
    const opts = BILL_LABELS.utility;
    b.label = opts[Math.floor(Math.random() * opts.length)];
  }
  b.x = rand(6, GAME_W - b.w - 6);
  b.y = -b.h;
  b.flash = 0;
}

export function fireCoin(pool: Pool<Projectile>, px: number): void {
  const p = pool.acquire();
  p.x = px + PLAYER.w / 2 - 2;
  p.y = PLAYER.y - 6;
  p.w = 4;
  p.h = 7;
  p.vy = -PROJ_SPEED;
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

export function billValue(kind: BillKind): number {
  return kind === 'rent' ? 250 : 50;
}

export function possessionsAlive(s: State): number {
  return s.possessions.filter((p) => p.alive).length;
}

/** Difficulty curve: faster spawns the longer you survive (floor 0.4s). */
export function currentSpawnInterval(elapsed: number): number {
  const steps = Math.floor(elapsed / SPAWN_STEP_EVERY);
  return Math.max(SPAWN_FLOOR, SPAWN_START - steps * SPAWN_STEP);
}

export function toRect(o: { x: number; y: number; w: number; h: number }): Rect {
  return { x: o.x, y: o.y, w: o.w, h: o.h };
}

export { aabb, clamp, GAME_W, GAME_H };

// ---- the pure per-frame step ----

export type InputSnapshot = { left: boolean; right: boolean; a: boolean };

export type StepEvents = {
  scoreDelta: number;
  sfx: SfxName[];
  requestPayday: boolean; // brink reached → shell decides if granted
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

/**
 * Advances the whole simulation one fixed step. Pure w.r.t. side effects: it
 * mutates the passed state/pools and returns an events bag; the caller performs
 * actual I/O (score, sfx, payday grant, glitch, completion). This keeps the
 * React component thin and makes the game headless-testable.
 */
export function stepGame(
  s: State,
  pools: Pools,
  input: InputSnapshot,
  dt: number,
): StepEvents {
  const ev = emptyEvents();
  if (s.over) return ev;

  s.elapsed += dt;

  // win: survive the full shift
  if (s.elapsed >= WIN_SECONDS) {
    s.over = true;
    s.won = true;
    ev.won = true;
    return ev;
  }

  // coin income trickle
  s.regenTimer += dt;
  while (s.regenTimer >= COIN_REGEN_SEC) {
    s.regenTimer -= COIN_REGEN_SEC;
    if (s.coins < COIN_MAX) s.coins++;
  }

  // movement
  if (input.left) s.px -= PLAYER.speed * dt;
  if (input.right) s.px += PLAYER.speed * dt;
  s.px = clamp(s.px, 0, GAME_W - PLAYER.w);

  // firing (held action auto-fires at cadence)
  s.fireCd -= dt;
  if (input.a && s.fireCd <= 0 && s.coins > 0) {
    fireCoin(pools.projectiles, s.px);
    s.coins--;
    s.fireCd = FIRE_CD;
    ev.sfx.push('shoot');
  }

  // spawn bills along the difficulty curve
  s.spawnInterval = currentSpawnInterval(s.elapsed);
  s.spawnTimer += dt;
  if (s.spawnTimer >= s.spawnInterval) {
    s.spawnTimer = 0;
    spawnBill(pools.bills);
  }

  // projectiles ascend
  pools.projectiles.forEachActive((p) => {
    p.y += p.vy * dt;
    if (p.y + p.h < 0) pools.projectiles.release(p);
  });

  // bills descend
  pools.bills.forEachActive((b) => {
    b.y += b.vy * dt;
    if (b.flash > 0) b.flash -= dt;
  });

  // projectile <-> bill collisions
  pools.projectiles.forEachActive((p) => {
    if (!p.active) return;
    pools.bills.forEachActive((b) => {
      if (!p.active || !b.active) return;
      if (aabb(toRect(p), toRect(b))) {
        pools.projectiles.release(p);
        b.hp--;
        b.flash = 0.12;
        if (b.hp <= 0) {
          const val = billValue(b.kind);
          ev.scoreDelta += val;
          spawnFloat(pools.floats, b.x + b.w / 2, b.y, `+${val}`, '#ffd23f');
          pools.bills.release(b);
          ev.sfx.push('hit');
        }
      }
    });
  });

  // bills reaching the possessions line
  pools.bills.forEachActive((b) => {
    if (b.y + b.h >= IMPACT_Y) {
      const bcx = b.x + b.w / 2;
      let target: Possession | null = null;
      let best = Infinity;
      for (const poss of s.possessions) {
        if (!poss.alive) continue;
        const d = Math.abs(poss.x + poss.w / 2 - bcx);
        if (d < best) {
          best = d;
          target = poss;
        }
      }
      pools.bills.release(b);
      if (target) {
        target.alive = false;
        ev.sfx.push('lose');
        spawnFloat(pools.floats, target.x + target.w / 2, IMPACT_Y - 6, 'LOST', '#ff2e88');
        const left = possessionsAlive(s);
        if (left === 1) ev.glitchMs = Math.max(ev.glitchMs, 450);
        if (left <= 0) {
          s.over = true;
          ev.gameOver = true;
        }
      }
    }
  });

  // Mom's Payday Defense — brink detection (3 of 4 gone, impact < 1s away)
  if (!s.paydayFired && possessionsAlive(s) === 1) {
    let imminent = false;
    pools.bills.forEachActive((b) => {
      const tti = (IMPACT_Y - (b.y + b.h)) / b.vy;
      if (tti >= 0 && tti < 1) imminent = true;
    });
    if (imminent) {
      s.paydayFired = true;
      ev.requestPayday = true;
    }
  }

  // Tobias chopper (inequity layer)
  const tob = s.tobias;
  s.tobiasTimer += dt;
  if (!tob.active && s.tobiasTimer >= TOBIAS_EVERY) {
    s.tobiasTimer = 0;
    tob.active = true;
    tob.dir = 1;
    tob.x = -50;
    const ob = 4 - possessionsAlive(s); // lower → more obnoxious
    tob.y = 22 + ob * 6;
    tob.dropsLeft = TOBIAS_DROP;
    tob.dropTimer = 0;
  }
  if (tob.active) {
    tob.x += TOBIAS_SPEED * tob.dir * dt;
    tob.dropTimer += dt;
    if (tob.dropsLeft > 0 && tob.x > GAME_W * 0.3 && tob.dropTimer >= 0.45) {
      tob.dropTimer = 0;
      tob.dropsLeft--;
      s.coins = Math.min(COIN_MAX, s.coins + 1);
      spawnFloat(pools.floats, tob.x + 20, tob.y + 18, '+1', '#ffd23f');
      ev.sfx.push('coin');
    }
    if (tob.x > GAME_W + 60) tob.active = false;
  }

  // floating score popups
  pools.floats.forEachActive((f) => {
    f.life -= dt;
    f.y -= 14 * dt;
    if (f.life <= 0) pools.floats.release(f);
  });

  return ev;
}

/** Applies the granted Payday rescue: every bill explodes into +10 coins. */
export function applyPayday(s: State, pools: Pools): number {
  let n = 0;
  pools.bills.forEachActive((b) => {
    s.coins = Math.min(COIN_MAX, s.coins + 10);
    spawnFloat(pools.floats, b.x + b.w / 2, b.y, '+10', '#7fffa0');
    pools.bills.release(b);
    n++;
  });
  if (n === 0) s.coins = Math.min(COIN_MAX, s.coins + 10);
  return n;
}
