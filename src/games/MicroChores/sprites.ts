import {
  GAME_W,
  GAME_H,
  PLAY_TOP,
  MC,
  font,
  centerText,
} from './microgames/types';
import { TARGET_CLEARS } from './logic';
import type { State } from './logic';
import type { Cutaway } from './cutaway';

// ---- base background (microgames paint their own scene on top) ----
export function drawBackground(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
  g.addColorStop(0, MC.bg0);
  g.addColorStop(1, MC.bg1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

// ---- the huge verb across the top + timer ----
export function drawPromptBanner(ctx: CanvasRenderingContext2D, s: State) {
  if (!s.current) return;

  // banner strip behind the prompt (sits just below the DOM lives/score HUD)
  ctx.fillStyle = 'rgba(10,1,24,0.72)';
  ctx.fillRect(0, PLAY_TOP - 24, GAME_W, 24);

  // shake the verb a touch when time is nearly out
  const ratio = Math.max(0, s.timeLeft / s.budget);
  const shake = !s.paydayAuto && ratio < 0.3 ? Math.sin(s.elapsed * 50) * 1.5 : 0;
  const color = s.paydayAuto ? MC.green : ratio < 0.3 ? MC.magenta : MC.yellow;
  centerText(ctx, s.current.prompt, GAME_W / 2 + shake, PLAY_TOP - 7, color, 13);

  // timer bar along the banner's bottom edge
  const by = PLAY_TOP - 3;
  ctx.fillStyle = '#0a0118';
  ctx.fillRect(0, by, GAME_W, 3);
  ctx.fillStyle = s.paydayAuto ? MC.green : ratio < 0.3 ? MC.magenta : MC.cyan;
  ctx.fillRect(0, by, ratio * GAME_W, 3);
}

// ---- progress + speed, tucked into the bottom corners ----
export function drawProgress(ctx: CanvasRenderingContext2D, s: State) {
  ctx.fillStyle = MC.dim;
  ctx.font = font(6);
  ctx.textAlign = 'left';
  ctx.fillText(
    `${String(s.cleared).padStart(2, '0')}/${TARGET_CLEARS}`,
    4,
    GAME_H - 4,
  );
  ctx.textAlign = 'right';
  ctx.fillStyle = s.speedMult > 1 ? MC.orange : MC.dim;
  ctx.fillText(`x${s.speedMult.toFixed(1)}`, GAME_W - 4, GAME_H - 4);
  ctx.textAlign = 'left';
}

// ---- NICE!/MISS! flash between play and the cutaway ----
export function drawResultFlash(ctx: CanvasRenderingContext2D, s: State) {
  const win = s.resultWin;
  ctx.fillStyle = win ? 'rgba(127,255,160,0.18)' : 'rgba(255,46,136,0.22)';
  ctx.fillRect(0, PLAY_TOP, GAME_W, GAME_H - PLAY_TOP);
  const txt = win ? 'NICE!' : 'MISS!';
  const blink = Math.floor(s.resultTimer * 10) % 2 === 0;
  if (blink || win) {
    centerText(ctx, txt, GAME_W / 2, GAME_H / 2, win ? MC.green : MC.magenta, 18);
  }
}

// ---- 1s Tobias-family mockery cutaway ----
export function drawCutaway(ctx: CanvasRenderingContext2D, c: Cutaway, timer: number) {
  // full-bleed posh backdrop
  const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
  g.addColorStop(0, '#143a2e');
  g.addColorStop(1, '#0a1f18');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  const cx = GAME_W / 2;
  const cy = GAME_H / 2 - 8;

  if (c.kind === 'butler') drawButler(ctx, cx, cy);
  else if (c.kind === 'robot') drawRobot(ctx, cx, cy, timer);
  else drawAi(ctx, cx, cy, timer);

  // caption plate
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, GAME_H - 26, GAME_W, 26);
  centerText(ctx, c.caption, cx, GAME_H - 10, MC.yellow, 6);
}

function drawButler(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // tailcoat butler holding a silver tray
  ctx.fillStyle = '#101018';
  ctx.fillRect(cx - 10, cy - 4, 20, 30); // coat
  ctx.fillStyle = MC.white; // shirt
  ctx.fillRect(cx - 4, cy - 2, 8, 16);
  ctx.fillStyle = MC.skin; // head
  ctx.fillRect(cx - 7, cy - 18, 14, 14);
  ctx.fillStyle = '#000';
  ctx.fillRect(cx - 4, cy - 13, 2, 2);
  ctx.fillRect(cx + 2, cy - 13, 2, 2);
  ctx.fillStyle = '#3a2a1a'; // tidy hair
  ctx.fillRect(cx - 7, cy - 19, 14, 4);
  // silver tray held aloft
  ctx.fillStyle = '#c9d2dd';
  ctx.fillRect(cx + 8, cy - 6, 26, 4);
  ctx.fillStyle = MC.white;
  ctx.fillRect(cx + 16, cy - 12, 8, 6);
}

function drawRobot(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  ctx.fillStyle = '#9aa4b2';
  ctx.fillRect(cx - 14, cy - 6, 28, 26); // body
  ctx.fillStyle = '#c9d2dd';
  ctx.fillRect(cx - 10, cy - 18, 20, 14); // head
  // scanning eye sweeping
  const ex = cx - 6 + ((Math.sin(t * 18) + 1) / 2) * 12;
  ctx.fillStyle = MC.cyan;
  ctx.fillRect(ex, cy - 13, 4, 4);
  // busy arms
  const arm = Math.floor(t * 16) % 2 === 0 ? 2 : -2;
  ctx.fillStyle = '#6a7484';
  ctx.fillRect(cx - 20, cy - 2 + arm, 8, 4);
  ctx.fillRect(cx + 12, cy - 2 - arm, 8, 4);
  // efficiency sparkles
  ctx.fillStyle = MC.yellow;
  if (Math.floor(t * 10) % 2 === 0) ctx.fillRect(cx + 18, cy - 16, 2, 2);
}

function drawAi(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  // glowing AI orb over a phone
  ctx.fillStyle = '#202028';
  ctx.fillRect(cx - 10, cy + 6, 20, 30);
  ctx.fillStyle = MC.violet;
  ctx.fillRect(cx - 7, cy + 10, 14, 20);
  const pulse = 8 + Math.sin(t * 12) * 3;
  ctx.fillStyle = 'rgba(46,230,246,0.3)';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, pulse + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = MC.cyan;
  ctx.beginPath();
  ctx.arc(cx, cy - 6, pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = MC.white;
  centerText(ctx, 'AI', cx, cy - 3, MC.bg1, 7);
}

// ---- Payday Defense: Mom takes over the chore ----
export function drawMomOverlay(ctx: CanvasRenderingContext2D, s: State) {
  const cx = GAME_W / 2;
  // mom sweeps in from the side and does the work
  const t = s.elapsed;
  const mx = cx + Math.sin(t * 3) * 40;
  const my = GAME_H / 2 + 6;

  ctx.fillStyle = MC.magenta; // dress
  ctx.fillRect(mx - 8, my - 4, 16, 26);
  ctx.fillStyle = MC.skin; // head
  ctx.fillRect(mx - 6, my - 18, 12, 14);
  ctx.fillStyle = '#3a1a2a'; // hair bun
  ctx.fillRect(mx - 7, my - 20, 14, 5);
  ctx.fillRect(mx - 2, my - 24, 4, 4);
  // sweeping arm
  const arm = Math.sin(t * 14) * 6;
  ctx.fillStyle = MC.skin;
  ctx.fillRect(mx + 6, my - 2, 10, 3);
  ctx.fillStyle = MC.wood; // broom
  ctx.fillRect(mx + 14, my - 4 + arm, 2, 16);
  ctx.fillStyle = MC.yellow;
  ctx.fillRect(mx + 11, my + 10 + arm, 8, 4);

  // sparkles + label
  ctx.fillStyle = MC.yellow;
  for (let i = 0; i < 4; i++) {
    if (Math.floor(t * 8 + i) % 2 === 0) {
      ctx.fillRect(mx - 16 + i * 11, my - 22 + (i % 2) * 6, 2, 2);
    }
  }
  ctx.fillStyle = 'rgba(10,1,24,0.55)';
  ctx.fillRect(0, GAME_H - 24, GAME_W, 14);
  centerText(ctx, 'MOM’S GOT IT', cx, GAME_H - 14, MC.green, 7);
}

// ---- brief victory card before the shell takes over ----
export function drawWin(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(10,1,24,0.8)';
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  centerText(ctx, 'ALL CHORES', GAME_W / 2, GAME_H / 2 - 8, MC.green, 14);
  centerText(ctx, 'DONE!', GAME_W / 2, GAME_H / 2 + 12, MC.green, 14);
}
