import { GAME_W, GAME_H } from '../../engine/useCanvas';
import type { Bill, Possession, Projectile, Tobias, FloatText, State } from './logic';
import { PLAYER, IMPACT_Y, WIN_SECONDS } from './logic';

const C = {
  bg0: '#1a0533',
  bg1: '#0a0118',
  magenta: '#ff2e88',
  cyan: '#2ee6f6',
  violet: '#8a4bff',
  yellow: '#ffd23f',
  orange: '#ff7b29',
  white: '#f4f0ff',
  dim: '#6a5a9a',
  green: '#7fffa0',
};

// Stable starfield
const STARS = Array.from({ length: 50 }, (_, i) => ({
  x: (i * 71) % GAME_W,
  y: (i * 37) % (GAME_H - 40),
  s: i % 3 === 0 ? 2 : 1,
}));

export function drawBackground(ctx: CanvasRenderingContext2D, elapsed: number) {
  const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
  g.addColorStop(0, C.bg0);
  g.addColorStop(1, C.bg1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // twinkle
  for (const st of STARS) {
    ctx.fillStyle = (elapsed * 2 + st.x) % 7 < 4 ? C.white : C.dim;
    ctx.fillRect(st.x, st.y, st.s, st.s);
  }

  // synthwave grid near the floor
  const horizon = IMPACT_Y - 6;
  ctx.strokeStyle = 'rgba(46,230,246,0.25)';
  ctx.lineWidth = 1;
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(GAME_W / 2 + i * 10, horizon);
    ctx.lineTo(GAME_W / 2 + i * 60, GAME_H);
    ctx.stroke();
  }
  const scroll = (elapsed * 30) % 12;
  for (let y = horizon; y < GAME_H; y += 12) {
    const yy = y + scroll;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(GAME_W, yy);
    ctx.stroke();
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, x: number, t: number) {
  const y = PLAYER.y;
  // thruster flicker
  ctx.fillStyle = (t * 20) % 2 < 1 ? C.orange : C.yellow;
  ctx.fillRect(x + 8, y + PLAYER.h, 3, 4);
  ctx.fillRect(x + 13, y + PLAYER.h, 3, 4);
  // body (purple octopus)
  ctx.fillStyle = C.violet;
  ctx.fillRect(x + 2, y + 2, PLAYER.w - 4, PLAYER.h - 2);
  ctx.fillStyle = '#5a3a9a';
  ctx.fillRect(x, y + 6, 2, 6); // left arm
  ctx.fillRect(x + PLAYER.w - 2, y + 6, 2, 6); // right arm
  // nose / cannon
  ctx.fillStyle = C.white;
  ctx.fillRect(x + PLAYER.w / 2 - 1, y - 2, 2, 4);
  // eyes
  ctx.fillStyle = C.white;
  ctx.fillRect(x + 6, y + 4, 3, 5);
  ctx.fillRect(x + 15, y + 4, 3, 5);
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 7, y + 6, 1, 2);
  ctx.fillRect(x + 16, y + 6, 1, 2);
}

export function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
  ctx.fillStyle = C.yellow;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = C.orange;
  ctx.fillRect(p.x + 1, p.y + 2, p.w - 2, p.h - 4);
}

export function drawBill(ctx: CanvasRenderingContext2D, b: Bill) {
  const isRent = b.kind === 'rent';
  // envelope body
  ctx.fillStyle = b.flash > 0 ? C.white : isRent ? '#ffb3c8' : C.white;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  // border
  ctx.strokeStyle = isRent ? C.magenta : C.cyan;
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  // envelope flap
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x + b.w / 2, b.y + b.h * 0.55);
  ctx.lineTo(b.x + b.w, b.y);
  ctx.stroke();
  // label
  ctx.fillStyle = isRent ? C.magenta : '#241046';
  ctx.font = `${isRent ? 8 : 6}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h - (isRent ? 5 : 4));
  ctx.textAlign = 'left';
  // hp pips for rent
  if (isRent && b.maxHp > 1) {
    for (let i = 0; i < b.maxHp; i++) {
      ctx.fillStyle = i < b.hp ? C.magenta : C.dim;
      ctx.fillRect(b.x + 2 + i * 5, b.y + 2, 3, 2);
    }
  }
}

const POSS_COLOR: Record<string, string> = {
  couch: '#ff7b29',
  tv: '#2ee6f6',
  fridge: '#f4f0ff',
  bed: '#ff2e88',
};

export function drawPossession(ctx: CanvasRenderingContext2D, p: Possession) {
  const h = 16;
  const y = GAME_H - h;
  if (!p.alive) {
    // rubble / empty slot
    ctx.fillStyle = 'rgba(106,90,154,0.4)';
    ctx.fillRect(p.x, y + h - 3, p.w, 3);
    return;
  }
  ctx.fillStyle = POSS_COLOR[p.kind] ?? C.violet;
  ctx.fillRect(p.x, y, p.w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(p.x, y + h - 4, p.w, 4);
  ctx.fillStyle = '#160a2e';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(p.label, p.x + p.w / 2, y + 9);
  ctx.textAlign = 'left';
}

export function drawTobias(
  ctx: CanvasRenderingContext2D,
  tob: Tobias,
  obnoxious: number,
  t: number,
) {
  const { x, y } = tob;
  const w = 40;
  // rotor
  ctx.strokeStyle = C.white;
  const rotor = (t * 40) % 2 < 1 ? 16 : 8;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - rotor, y - 4);
  ctx.lineTo(x + w / 2 + rotor, y - 4);
  ctx.stroke();
  ctx.fillStyle = C.dim;
  ctx.fillRect(x + w / 2 - 1, y - 4, 2, 4);
  // body
  ctx.fillStyle = obnoxious >= 2 ? C.magenta : '#3a6b3a';
  ctx.fillRect(x, y, w, 14);
  ctx.fillStyle = C.cyan;
  ctx.fillRect(x + 26, y + 3, 10, 7); // cockpit
  // tail
  ctx.fillStyle = obnoxious >= 2 ? C.magenta : '#3a6b3a';
  ctx.fillRect(x - 12, y + 4, 12, 4);
  // banner
  ctx.fillStyle = C.yellow;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  const label = obnoxious >= 2 ? 'TRUST FUND $$$' : 'TRUST FUND';
  ctx.fillText(label, x + w / 2, y - 8);
  if (obnoxious >= 3 && (t * 6) % 2 < 1) {
    ctx.fillStyle = C.white;
    ctx.fillText('LOL', x + w / 2, y + 24);
  }
  ctx.textAlign = 'left';
}

export function drawFloat(ctx: CanvasRenderingContext2D, f: FloatText) {
  ctx.globalAlpha = Math.max(0, f.life);
  ctx.fillStyle = f.color;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(f.text, f.x, f.y);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

/** On-canvas game HUD: coin bank (left) + survival timer (right). */
export function drawGameHud(ctx: CanvasRenderingContext2D, s: State) {
  ctx.font = '7px "Press Start 2P", monospace';
  // coins
  ctx.fillStyle = C.yellow;
  ctx.fillRect(6, GAME_H - 30, 6, 6);
  ctx.fillStyle = C.orange;
  ctx.fillRect(7, GAME_H - 29, 4, 4);
  ctx.fillStyle = s.coins > 0 ? C.yellow : C.magenta;
  ctx.fillText(`x${s.coins}`, 16, GAME_H - 24);

  // timer (count up to win)
  const remain = Math.max(0, Math.ceil(WIN_SECONDS - s.elapsed));
  ctx.fillStyle = C.cyan;
  ctx.textAlign = 'right';
  ctx.fillText(`${remain}s`, GAME_W - 6, GAME_H - 24);
  ctx.textAlign = 'left';
}
