import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext';
import { useCanvas, GAME_W, GAME_H } from '../engine/useCanvas';
import { playSfx } from '../engine/useAudio';

type Scene = {
  durationMs: number;
  caption: string;
  draw: (ctx: CanvasRenderingContext2D, t: number) => void; // t = 0..1
};

const STAR_SEED = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 53) % GAME_W,
  y: (i * 97) % GAME_H,
}));

function bg(ctx: CanvasRenderingContext2D, top: string, bottom: string) {
  const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

function stars(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#ffffff';
  for (const s of STAR_SEED) ctx.fillRect(s.x, s.y, 1, 1);
}

function grid(ctx: CanvasRenderingContext2D, t: number) {
  ctx.strokeStyle = '#2ee6f6';
  ctx.globalAlpha = 0.5;
  const horizon = GAME_H * 0.62;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(GAME_W / 2 + i * 8, horizon);
    ctx.lineTo(GAME_W / 2 + i * 40, GAME_H);
    ctx.stroke();
  }
  const scroll = (t * 40) % 16;
  for (let y = horizon; y < GAME_H; y += 16) {
    const yy = y + scroll;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(GAME_W, yy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function ocho(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  // tiny purple octopus: body + two white eyes + legs
  ctx.fillStyle = '#5a3a9a';
  ctx.fillRect(x, y, 14 * s, 12 * s);
  ctx.fillStyle = '#f4f0ff';
  ctx.fillRect(x + 3 * s, y + 3 * s, 3 * s, 5 * s);
  ctx.fillRect(x + 8 * s, y + 3 * s, 3 * s, 5 * s);
  ctx.fillStyle = '#5a3a9a';
  for (let i = 0; i < 4; i++) ctx.fillRect(x + i * 4 * s, y + 12 * s, 2 * s, 3 * s);
}

const SCENES: Scene[] = [
  {
    durationMs: 5000,
    caption: 'A SHIP BREAKS DOWN OVER ELMORE...',
    draw: (ctx, t) => {
      bg(ctx, '#0a0118', '#2a0a4a');
      stars(ctx);
      const x = 40 + t * 120;
      const y = 30 + t * 90;
      // ship
      ctx.fillStyle = '#dcd6f0';
      ctx.fillRect(x, y, 22, 8);
      ctx.fillStyle = '#ff7b29';
      ctx.fillRect(x - 6, y + 2, 6, 4);
      // smoke
      ctx.fillStyle = '#6a5a9a';
      for (let i = 0; i < 4; i++) ctx.fillRect(x - 10 - i * 6, y + (i % 2), 4, 4);
    },
  },
  {
    durationMs: 5000,
    caption: 'THE FAMILY LANDS. HOME IS SMALL NOW.',
    draw: (ctx, t) => {
      bg(ctx, '#160a2e', '#3a0f63');
      stars(ctx);
      // ground
      ctx.fillStyle = '#241046';
      ctx.fillRect(0, GAME_H - 40, GAME_W, 40);
      // small house rising
      const h = 28 * Math.min(1, t * 1.5);
      const hx = GAME_W / 2 - 20;
      const hy = GAME_H - 40 - h;
      ctx.fillStyle = '#7b3fb0';
      ctx.fillRect(hx, hy, 40, h);
      ctx.fillStyle = '#ff2e88';
      ctx.fillRect(hx - 4, hy, 48, 6);
      ctx.fillStyle = '#ffd23f';
      if (h > 14) ctx.fillRect(hx + 16, GAME_H - 56, 8, 16);
      ocho(ctx, GAME_W / 2 + 34, GAME_H - 55);
    },
  },
  {
    durationMs: 8000,
    caption: 'MOM WORKS. AND WORKS. AND WORKS.',
    draw: (ctx, t) => {
      bg(ctx, '#0a0118', '#160a2e');
      const phase = Math.floor(t * 3) % 3;
      ctx.fillStyle = '#241046';
      ctx.fillRect(0, GAME_H - 36, GAME_W, 36);
      // mom block
      const mx = GAME_W / 2 - 8;
      const my = GAME_H - 60;
      ctx.fillStyle = '#7b3fb0';
      ctx.fillRect(mx, my, 16, 24);
      ctx.fillStyle = '#ff2e88';
      ctx.fillRect(mx, my + 14, 16, 10);
      // prop per phase: broom / register / moon
      ctx.fillStyle = '#ffd23f';
      if (phase === 0) {
        ctx.fillRect(mx + 18, my, 2, 26); // broom handle
        ctx.fillRect(mx + 14, my + 24, 10, 4);
      } else if (phase === 1) {
        ctx.fillStyle = '#2ee6f6';
        ctx.fillRect(mx - 22, my + 8, 18, 14); // register
      } else {
        ctx.beginPath();
        ctx.arc(40, 40, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      // alarm clock flashing between
      if (t % 0.33 < 0.08) {
        ctx.fillStyle = '#ff2e88';
        ctx.fillRect(GAME_W - 50, 24, 18, 14);
      }
    },
  },
  {
    durationMs: 4000,
    caption: 'OCHO STAYS HOME. THE BILLS DO NOT.',
    draw: (ctx, t) => {
      bg(ctx, '#160a2e', '#0a0118');
      ctx.fillStyle = '#241046';
      ctx.fillRect(0, GAME_H - 30, GAME_W, 30);
      ocho(ctx, GAME_W / 2 - 7, GAME_H - 48, 1);
      // envelopes drifting in
      ctx.fillStyle = '#f4f0ff';
      for (let i = 0; i < 5; i++) {
        const ex = (20 + i * 50 + t * 30) % GAME_W;
        const ey = 20 + i * 14 + Math.sin(t * 6 + i) * 6;
        ctx.fillRect(ex, ey, 18, 12);
        ctx.strokeStyle = '#ff2e88';
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + 9, ey + 6);
        ctx.lineTo(ex + 18, ey);
        ctx.stroke();
      }
    },
  },
  {
    durationMs: 8000,
    caption: '',
    draw: (ctx, t) => {
      bg(ctx, '#1a0533', '#3a0f63');
      grid(ctx, t * 8);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2ee6f6';
      ctx.font = '20px "Press Start 2P", monospace';
      ctx.fillText('SPACE', GAME_W / 2, 70);
      ctx.fillStyle = '#ff2e88';
      ctx.fillText('EDGISTENCE', GAME_W / 2, 96);
      if (t > 0.3) {
        ctx.fillStyle = '#ffd23f';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText('DIFFICULTY: HARD', GAME_W / 2, 124);
        ctx.fillText('LOCKED AT FACTORY', GAME_W / 2, 136);
      }
      ctx.textAlign = 'left';
    },
  },
];

export function Cutscene() {
  const { finishCutscene } = useGame();
  const { canvasRef } = useCanvas();
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  indexRef.current = index;

  // advance / skip on any input
  const next = () => {
    playSfx('select');
    if (indexRef.current >= SCENES.length - 1) finishCutscene();
    else setIndex((i) => i + 1);
  };
  const skipAll = () => {
    playSfx('select');
    finishCutscene();
  };

  // animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let start = performance.now();
    let sceneIndex = index;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const scene = SCENES[sceneIndex];
      const elapsed = now - start;
      const t = Math.min(1, elapsed / scene.durationMs);
      ctx.imageSmoothingEnabled = false;
      scene.draw(ctx, t);
      if (elapsed >= scene.durationMs) {
        if (sceneIndex >= SCENES.length - 1) {
          finishCutscene();
          return;
        }
        sceneIndex++;
        setIndex(sceneIndex);
        start = now;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // re-run when index changes via manual skip
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // keyboard skip
  useEffect(() => {
    const onKey = () => next();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const caption = SCENES[index]?.caption ?? '';

  return (
    <div className="stage" onClick={next}>
      <canvas ref={canvasRef} />
      {caption && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 8,
            color: 'var(--c-white)',
            textShadow: '2px 2px 0 #000',
            zIndex: 41,
          }}
        >
          {caption}
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          skipAll();
        }}
        style={{
          position: 'fixed',
          top: 10,
          right: 12,
          zIndex: 42,
          pointerEvents: 'auto',
          fontSize: 8,
          color: 'var(--c-cyan)',
          background: 'rgba(36,16,70,0.7)',
          border: '2px solid var(--c-cyan)',
          padding: '6px 8px',
          cursor: 'pointer',
        }}
      >
        SKIP ▶▶
      </button>
    </div>
  );
}
