import { useCallback, useEffect, useRef } from 'react';

export const GAME_W = 256; // NES-native internal resolution
export const GAME_H = 224;

export type CanvasHandle = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Current integer scale factor (CSS px per game px). */
  scaleRef: React.RefObject<number>;
  /** Map a client (mouse/touch) coord to internal game coords. */
  toGameCoords: (clientX: number, clientY: number) => { x: number; y: number };
};

/**
 * Sets up a fixed 256×224 backing-store canvas and scales it to the viewport
 * with integer scaling and crisp pixels. The canvas is centered in its parent.
 */
export function useCanvas(): CanvasHandle {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scaleRef = useRef<number>(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = GAME_W;
    canvas.height = GAME_H;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.imageSmoothingEnabled = false;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const aw = parent.clientWidth;
      const ah = parent.clientHeight;
      const scale = Math.max(1, Math.floor(Math.min(aw / GAME_W, ah / GAME_H)));
      scaleRef.current = scale;
      canvas.style.width = `${GAME_W * scale}px`;
      canvas.style.height = `${GAME_H * scale}px`;
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  const toGameCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = scaleRef.current || 1;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  }, []);

  return { canvasRef, scaleRef, toGameCoords };
}
