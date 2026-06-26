import { useEffect, useRef } from 'react';
import type { MiniGameProps } from '../../types/minigame';
import { useCanvas, GAME_W, GAME_H } from '../../engine/useCanvas';
import { useGameLoop } from '../../engine/useGameLoop';
import { playSfx } from '../../engine/useAudio';

/**
 * Foundation contract demo. A black square earns 10 points per click and loses
 * a life every 5s. Proves score/life/complete wiring end-to-end. Not in the
 * menu — kept as a reference implementation of MiniGameProps.
 */
export function Placeholder(props: MiniGameProps) {
  const { onScoreUpdate, onLifeLost, paused } = props;
  const { canvasRef, toGameCoords } = useCanvas();
  const box = useRef({ x: GAME_W / 2 - 16, y: GAME_H / 2 - 16, w: 32, h: 32, flash: 0 });
  const lifeTimer = useRef(0);

  useGameLoop(
    {
      update: (dt) => {
        lifeTimer.current += dt;
        if (lifeTimer.current >= 5) {
          lifeTimer.current = 0;
          onLifeLost();
        }
        if (box.current.flash > 0) box.current.flash -= dt;
      },
      render: () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#0a0118';
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        const b = box.current;
        ctx.fillStyle = b.flash > 0 ? '#ff2e88' : '#000';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#2ee6f6';
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#6a5a9a';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('CLICK THE BOX', 70, 30);
      },
    },
    paused,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onClick = (e: PointerEvent) => {
      if (paused) return;
      const { x, y } = toGameCoords(e.clientX, e.clientY);
      const b = box.current;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        onScoreUpdate(10);
        b.flash = 0.1;
        playSfx('coin');
      }
    };
    canvas.addEventListener('pointerdown', onClick);
    return () => canvas.removeEventListener('pointerdown', onClick);
  }, [canvasRef, toGameCoords, onScoreUpdate, paused]);

  return (
    <div className="stage">
      <canvas ref={canvasRef} />
    </div>
  );
}
