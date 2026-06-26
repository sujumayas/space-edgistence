import { useEffect, useRef } from 'react';

const STEP_MS = 1000 / 60; // 60Hz fixed logic step
const MAX_FRAME_MS = 250; // clamp huge gaps (tab was backgrounded)

export type LoopCallbacks = {
  /** Fixed-timestep logic update. dt is always STEP_MS / 1000 seconds. */
  update: (dtSec: number) => void;
  /** Render, called once per animation frame. alpha = interpolation 0..1. */
  render: (alpha: number) => void;
};

/**
 * Fixed-timestep loop with an accumulator: logic runs at a stable 60Hz while
 * rendering is uncapped. When `paused` is true the loop keeps requesting frames
 * but skips update() entirely, so a single resume continues seamlessly.
 *
 * Callbacks are read through a ref so the loop is never torn down on re-render.
 */
export function useGameLoop(callbacks: LoopCallbacks, paused: boolean): void {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      let delta = now - last;
      last = now;
      if (delta > MAX_FRAME_MS) delta = MAX_FRAME_MS;

      if (!pausedRef.current) {
        acc += delta;
        let steps = 0;
        while (acc >= STEP_MS && steps < 5) {
          cbRef.current.update(STEP_MS / 1000);
          acc -= STEP_MS;
          steps++;
        }
        if (steps === 5) acc = 0; // spiral-of-death guard
      } else {
        // Keep `last` fresh so resuming doesn't dump a giant delta.
        acc = 0;
      }

      cbRef.current.render(acc / STEP_MS);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
}
