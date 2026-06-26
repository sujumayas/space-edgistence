import { useEffect, useRef } from 'react';
import type { MiniGameProps } from '../../types/minigame';
import { useCanvas } from '../../engine/useCanvas';
import { useGameLoop } from '../../engine/useGameLoop';
import { getInput } from '../../engine/useInput';
import { playSfx } from '../../engine/useAudio';
import {
  makeState,
  makePools,
  stepGame,
  applyPayday,
  possessionsAlive,
} from './logic';
import type { State, Pools } from './logic';
import {
  drawBackground,
  drawPlayer,
  drawBill,
  drawProjectile,
  drawPossession,
  drawTobias,
  drawFloat,
  drawGameHud,
} from './sprites';

export function BillsVsCoins(props: MiniGameProps) {
  const { onScoreUpdate, onComplete, requestPaydayDefense, triggerGlitch, paused } =
    props;
  const { canvasRef } = useCanvas();

  const stateRef = useRef<State>(makeState());
  const poolsRef = useRef<Pools>(makePools());
  const endedRef = useRef(false);

  // reset on (re)mount so "continue"/replay starts fresh
  useEffect(() => {
    stateRef.current = makeState();
    poolsRef.current = makePools();
    endedRef.current = false;
  }, []);

  const finish = (won: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const s = stateRef.current;
    s.over = true;
    s.won = won;
    onComplete({
      finalScore: 0, // shell stamps the run score it tracked
      durationMs: s.elapsed * 1000,
      livesLost: 0,
      completed: won,
    });
  };

  useGameLoop(
    {
      update: (dt) => {
        const s = stateRef.current;
        const pools = poolsRef.current;
        if (s.over || endedRef.current) return;
        const input = getInput();

        const ev = stepGame(
          s,
          pools,
          { left: input.left, right: input.right, a: input.a },
          dt,
        );

        if (ev.scoreDelta) onScoreUpdate(ev.scoreDelta);
        for (const name of ev.sfx) playSfx(name);
        if (ev.glitchMs) triggerGlitch(ev.glitchMs);
        if (ev.requestPayday) {
          const granted = requestPaydayDefense();
          if (granted) applyPayday(s, pools);
        }
        if (ev.won) finish(true);
        else if (ev.gameOver) finish(false);
      },

      render: () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const s = stateRef.current;
        const pools = poolsRef.current;
        ctx.imageSmoothingEnabled = false;

        drawBackground(ctx, s.elapsed);
        for (const p of s.possessions) drawPossession(ctx, p);
        pools.bills.forEachActive((b) => drawBill(ctx, b));
        pools.projectiles.forEachActive((p) => drawProjectile(ctx, p));
        drawPlayer(ctx, s.px, s.elapsed);
        if (s.tobias.active) {
          drawTobias(ctx, s.tobias, 4 - possessionsAlive(s), s.elapsed);
        }
        pools.floats.forEachActive((f) => drawFloat(ctx, f));
        drawGameHud(ctx, s);
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
