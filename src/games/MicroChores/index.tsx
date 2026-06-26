import { useEffect, useRef } from 'react';
import type { MiniGameProps } from '../../types/minigame';
import { useCanvas } from '../../engine/useCanvas';
import { useGameLoop } from '../../engine/useGameLoop';
import { getInput } from '../../engine/useInput';
import { playSfx } from '../../engine/useAudio';
import { makeState, stepGame, applyPayday } from './logic';
import type { State } from './logic';
import type { MicroInput } from './microgames/types';
import {
  drawBackground,
  drawPromptBanner,
  drawProgress,
  drawResultFlash,
  drawCutaway,
  drawMomOverlay,
  drawWin,
} from './sprites';

type Edges = { left: boolean; right: boolean; up: boolean; down: boolean; a: boolean };

export function MicroChores(props: MiniGameProps) {
  const {
    onScoreUpdate,
    onLifeLost,
    onComplete,
    requestPaydayDefense,
    triggerGlitch,
    paused,
  } = props;
  const { canvasRef } = useCanvas();

  const stateRef = useRef<State>(makeState());
  const prevRef = useRef<Edges>({
    left: false,
    right: false,
    up: false,
    down: false,
    a: false,
  });
  const endedRef = useRef(false);

  useEffect(() => {
    stateRef.current = makeState();
    prevRef.current = { left: false, right: false, up: false, down: false, a: false };
    endedRef.current = false;
  }, []);

  const finishWon = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    const s = stateRef.current;
    onComplete({
      finalScore: 0, // shell stamps the run score it tracked
      durationMs: s.elapsed * 1000,
      livesLost: s.livesLost,
      completed: true,
    });
  };

  useGameLoop(
    {
      update: (dt) => {
        const s = stateRef.current;
        if (s.over || s.won || endedRef.current) return;

        // Build a MicroInput with rising-edge flags from the shared InputState.
        const raw = getInput();
        const prev = prevRef.current;
        const input: MicroInput = {
          left: raw.left,
          right: raw.right,
          up: raw.up,
          down: raw.down,
          a: raw.a,
          leftEdge: raw.left && !prev.left,
          rightEdge: raw.right && !prev.right,
          upEdge: raw.up && !prev.up,
          downEdge: raw.down && !prev.down,
          aEdge: raw.a && !prev.a,
        };
        prev.left = raw.left;
        prev.right = raw.right;
        prev.up = raw.up;
        prev.down = raw.down;
        prev.a = raw.a;

        const ev = stepGame(s, input, dt);

        if (ev.scoreDelta) onScoreUpdate(ev.scoreDelta);
        for (const name of ev.sfx) playSfx(name);
        if (ev.lifeLost) onLifeLost();
        if (ev.glitchMs) triggerGlitch(ev.glitchMs);
        if (ev.requestPayday) {
          const granted = requestPaydayDefense();
          if (granted) applyPayday(s);
        }
        if (ev.won) finishWon();
        // Out of lives: the shell finalizes the game over once global lives hit
        // zero (driven by onLifeLost above) — nothing to do here.
      },

      render: () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const s = stateRef.current;
        ctx.imageSmoothingEnabled = false;

        if (s.phase === 'cutaway' && s.cutaway) {
          drawCutaway(ctx, s.cutaway, s.cutawayTimer);
          return;
        }

        if (s.phase === 'done' && s.won) {
          drawWin(ctx);
          return;
        }

        drawBackground(ctx);
        if (s.current) s.current.render(ctx, s.microState, s.microElapsed);
        drawPromptBanner(ctx, s);
        if (s.paydayAuto) drawMomOverlay(ctx, s);
        if (s.phase === 'result') drawResultFlash(ctx, s);
        drawProgress(ctx, s);
      },
    },
    paused,
  );

  return (
    <div className="stage">
      <canvas ref={canvasRef} />
    </div>
  );
}
