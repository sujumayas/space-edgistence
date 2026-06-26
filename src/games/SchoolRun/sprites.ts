import { GAME_W, GAME_H } from '../../engine/useCanvas';
import type { Entity, FloatText, Rival, State } from './logic';
import {
  GROUND_Y,
  PX,
  CHECKPOINT_DISTANCE,
  C_THRESHOLD,
  METER_MAX,
  gradeLetter,
  playerRect,
} from './logic';

const C = {
  bg0: '#241a4a',
  bg1: '#120a2e',
  sky: '#3a2a6a',
  magenta: '#ff2e88',
  cyan: '#2ee6f6',
  violet: '#8a4bff',
  yellow: '#ffd23f',
  orange: '#ff7b29',
  white: '#f4f0ff',
  dim: '#6a5a9a',
  green: '#7fffa0',
  brown: '#b5722e',
  ground: '#2a1c14',
};

// ---- parallax background: far school silhouettes + near fence ----
export function drawBackground(ctx: CanvasRenderingContext2D, distance: number) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, C.bg0);
  g.addColorStop(1, C.sky);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_W, GROUND_Y);

  // far layer — school buildings, slow scroll
  const farOff = (distance * 0.3) % 96;
  ctx.fillStyle = '#1d143a';
  for (let i = -1; i < GAME_W / 96 + 1; i++) {
    const bx = i * 96 - farOff;
    ctx.fillRect(bx + 6, GROUND_Y - 70, 60, 70);
    // roof / clocktower
    ctx.fillRect(bx + 26, GROUND_Y - 86, 20, 16);
    // lit windows
    ctx.fillStyle = '#3a2c66';
    for (let wx = 0; wx < 3; wx++)
      for (let wy = 0; wy < 3; wy++)
        ctx.fillRect(bx + 12 + wx * 18, GROUND_Y - 60 + wy * 18, 8, 10);
    ctx.fillStyle = '#1d143a';
  }

  // near layer — chain-link fence posts, faster scroll
  const nearOff = (distance * 0.6) % 24;
  ctx.strokeStyle = 'rgba(106,90,154,0.5)';
  ctx.lineWidth = 1;
  for (let i = -1; i < GAME_W / 24 + 1; i++) {
    const fx = i * 24 - nearOff;
    ctx.beginPath();
    ctx.moveTo(fx, GROUND_Y - 28);
    ctx.lineTo(fx, GROUND_Y);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y - 28);
  ctx.lineTo(GAME_W, GROUND_Y - 28);
  ctx.stroke();
}

export function drawGround(ctx: CanvasRenderingContext2D, distance: number) {
  ctx.fillStyle = C.ground;
  ctx.fillRect(0, GROUND_Y, GAME_W, GAME_H - GROUND_Y);
  // sidewalk seams scrolling at full speed sell the motion
  ctx.strokeStyle = 'rgba(180,114,46,0.45)';
  ctx.lineWidth = 1;
  const seam = distance % 32;
  for (let x = -seam; x < GAME_W; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 2);
    ctx.lineTo(x, GAME_H);
    ctx.stroke();
  }
  ctx.strokeStyle = C.dim;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 0.5);
  ctx.lineTo(GAME_W, GROUND_Y + 0.5);
  ctx.stroke();
}

// ---- player (Ocho) ----
export function drawPlayer(ctx: CanvasRenderingContext2D, s: State) {
  // invuln blink
  if (s.invuln > 0 && Math.floor(s.invuln * 20) % 2 === 0) return;

  const r = playerRect(s);
  const airborne = s.feetY < GROUND_Y - 0.5;
  const bodyColor = s.flash > 0 ? C.white : C.violet;

  // body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(r.x, r.y, r.w, r.h - (airborne ? 0 : 0));

  // backpack
  ctx.fillStyle = C.orange;
  ctx.fillRect(r.x - 3, r.y + 4, 4, Math.max(6, r.h - 10));

  // eyes
  ctx.fillStyle = C.white;
  const eyeY = r.y + (s.kindergarten ? 3 : 5);
  ctx.fillRect(r.x + r.w - 7, eyeY, 3, 4);
  ctx.fillRect(r.x + r.w - 3, eyeY, 3, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(r.x + r.w - 2, eyeY + 1, 1, 2);

  // legs / tentacles (tucked when airborne, splayed when running)
  ctx.fillStyle = '#5a3a9a';
  if (!s.ducking) {
    const legY = r.y + r.h;
    const wig = Math.floor(s.elapsed * 16) % 2;
    if (airborne) {
      ctx.fillRect(r.x + 2, legY - 2, 3, 3);
      ctx.fillRect(r.x + r.w - 5, legY - 2, 3, 3);
    } else {
      ctx.fillRect(r.x + 1 + wig, legY - 2, 3, 2);
      ctx.fillRect(r.x + r.w - 4 - wig, legY - 2, 3, 2);
    }
  }

  // kindergarten beanie / propeller hat — visible badge of demotion
  if (s.kindergarten) {
    ctx.fillStyle = C.magenta;
    ctx.fillRect(r.x + 2, r.y - 3, r.w - 4, 3);
    ctx.fillStyle = C.yellow;
    ctx.fillRect(r.x + r.w / 2 - 1, r.y - 6, 2, 3);
  }
}

// ---- entities ----
export function drawEntity(ctx: CanvasRenderingContext2D, e: Entity) {
  switch (e.kind) {
    case 'A':
    case 'B':
    case 'F':
      drawGradeTile(ctx, e);
      break;
    case 'bully':
      drawBully(ctx, e);
      break;
    case 'book':
      drawBook(ctx, e);
      break;
  }
}

function drawGradeTile(ctx: CanvasRenderingContext2D, e: Entity) {
  const isF = e.kind === 'F';
  const fill = isF ? C.magenta : e.kind === 'A' ? C.green : C.cyan;
  ctx.fillStyle = e.magnet ? C.yellow : '#160a2e';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = fill;
  ctx.lineWidth = 1;
  ctx.strokeRect(e.x + 0.5, e.y + 0.5, e.w - 1, e.h - 1);
  ctx.fillStyle = fill;
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(e.kind, e.x + e.w / 2, e.y + e.h / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawBully(ctx: CanvasRenderingContext2D, e: Entity) {
  // big blocky kid blocking the sidewalk
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(e.x, e.y + 6, e.w, e.h - 6);
  ctx.fillStyle = '#e8c39e'; // head
  ctx.fillRect(e.x + 3, e.y, e.w - 6, 8);
  ctx.fillStyle = '#000';
  ctx.fillRect(e.x + 5, e.y + 3, 2, 2);
  ctx.fillRect(e.x + e.w - 7, e.y + 3, 2, 2);
  // mean eyebrow
  ctx.fillStyle = '#3a1010';
  ctx.fillRect(e.x + 4, e.y + 2, e.w - 8, 1);
  // arms crossed
  ctx.fillStyle = '#8e2820';
  ctx.fillRect(e.x - 1, e.y + 11, e.w + 2, 4);
}

function drawBook(ctx: CanvasRenderingContext2D, e: Entity) {
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.rotate(Math.sin(e.spin) * 0.5);
  ctx.fillStyle = C.brown;
  ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
  ctx.fillStyle = C.white; // pages
  ctx.fillRect(-e.w / 2 + 2, -e.h / 2 + 2, e.w - 4, e.h - 4);
  ctx.fillStyle = C.brown; // spine
  ctx.fillRect(-1, -e.h / 2, 2, e.h);
  ctx.restore();
}

// ---- rivals ----
export function drawRival(ctx: CanvasRenderingContext2D, r: Rival, t: number) {
  if (r.kind === 'tobias') {
    const { x, y } = r;
    // hover glow
    ctx.fillStyle = 'rgba(46,230,246,0.3)';
    ctx.fillRect(x - 2, y + 14, 26, 3);
    // hoverboard
    ctx.fillStyle = C.cyan;
    ctx.fillRect(x - 2, y + 12, 26, 3);
    // body
    ctx.fillStyle = C.yellow;
    ctx.fillRect(x + 4, y, 14, 12);
    // head
    ctx.fillStyle = '#e8c39e';
    ctx.fillRect(x + 6, y - 6, 10, 7);
    // smug shades
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 7, y - 3, 8, 2);
    // floating cash
    if (Math.floor(t * 6) % 2 === 0) {
      ctx.fillStyle = C.green;
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('$', x + 22, y - 2);
      ctx.textAlign = 'left';
    }
  } else {
    const { x, y } = r;
    // cloud Masami floats on
    ctx.fillStyle = C.white;
    ctx.fillRect(x - 2, y + 10, 28, 6);
    ctx.fillRect(x + 2, y + 6, 20, 6);
    // body
    ctx.fillStyle = C.magenta;
    ctx.fillRect(x + 6, y, 12, 11);
    // head + halo
    ctx.fillStyle = '#e8c39e';
    ctx.fillRect(x + 8, y - 6, 8, 7);
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + 12, y - 8, 6, 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
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

// ---- checkpoint (REPORT CARD finish line) ----
export function drawCheckpoint(ctx: CanvasRenderingContext2D, s: State) {
  if (!s.checkpointVisible) return;
  const x = PX + (CHECKPOINT_DISTANCE - s.distance);
  if (x > GAME_W + 30 || x < -40) return;

  // checkered finish post
  for (let yy = GROUND_Y - 64; yy < GROUND_Y; yy += 8) {
    const even = (Math.floor((yy - GROUND_Y) / 8) % 2 === 0);
    ctx.fillStyle = even ? C.white : '#000';
    ctx.fillRect(x, yy, 6, 8);
    ctx.fillStyle = even ? '#000' : C.white;
    ctx.fillRect(x + 6, yy, 6, 8);
  }
  // report-card banner
  ctx.fillStyle = C.white;
  ctx.fillRect(x - 8, GROUND_Y - 78, 40, 16);
  ctx.fillStyle = C.magenta;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('REPORT', x + 12, GROUND_Y - 71);
  ctx.fillText('CARD', x + 12, GROUND_Y - 64);
  ctx.textAlign = 'left';
}

// ---- HUD: grade meter + distance ----
const SEG: Array<{ label: string; min: number }> = [
  { label: 'F', min: 0 },
  { label: 'D', min: 20 },
  { label: 'C', min: 40 },
  { label: 'B', min: 60 },
  { label: 'A', min: 80 },
];

export function drawGameHud(ctx: CanvasRenderingContext2D, s: State) {
  // top grade bar
  const bx = 6;
  const by = 6;
  const bw = GAME_W - 60;
  const bh = 8;

  ctx.fillStyle = '#0a0118';
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);

  // segment fill up to current meter
  const fillW = (Math.max(0, s.meter) / METER_MAX) * bw;
  const letter = gradeLetter(s.meter);
  const meterColor =
    letter === 'A' || letter === 'B'
      ? C.green
      : letter === 'C'
        ? C.yellow
        : C.magenta;
  ctx.fillStyle = meterColor;
  ctx.fillRect(bx, by, fillW, bh);

  // segment dividers + C pass-line marker
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  for (const seg of SEG) {
    const sx = bx + (seg.min / METER_MAX) * bw;
    ctx.strokeStyle = seg.min === C_THRESHOLD ? C.white : 'rgba(106,90,154,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, by);
    ctx.lineTo(sx, by + bh);
    ctx.stroke();
    ctx.fillStyle = C.dim;
    ctx.fillText(seg.label, sx + 4, by + bh + 7);
  }
  ctx.textAlign = 'left';
  ctx.strokeStyle = meterColor;
  ctx.strokeRect(bx - 0.5, by - 0.5, bw + 1, bh + 1);

  // current letter, big, right side
  ctx.fillStyle = meterColor;
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(letter, GAME_W - 6, by + 14);
  ctx.textAlign = 'left';

  // distance-to-checkpoint progress (thin, under grade bar)
  const dy = by + bh + 10;
  const prog = Math.min(1, s.distance / CHECKPOINT_DISTANCE);
  ctx.fillStyle = '#0a0118';
  ctx.fillRect(bx - 1, dy - 1, bw + 2, 4);
  ctx.fillStyle = C.cyan;
  ctx.fillRect(bx, dy, prog * bw, 2);
  // checkpoint flag at the end of the progress bar
  ctx.fillStyle = C.white;
  ctx.fillRect(bx + bw, dy - 2, 3, 5);
}

export function drawHeldBack(ctx: CanvasRenderingContext2D, s: State) {
  if (s.heldBack <= 0) return;
  const blink = Math.floor(s.heldBack * 8) % 2 === 0;
  ctx.fillStyle = blink ? 'rgba(255,46,136,0.35)' : 'rgba(20,4,30,0.6)';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  ctx.fillStyle = C.magenta;
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HELD BACK', GAME_W / 2, GAME_H / 2 - 6);
  ctx.fillStyle = C.white;
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.fillText('→ BACK TO KINDERGARTEN', GAME_W / 2, GAME_H / 2 + 12);
  ctx.textAlign = 'left';
}
