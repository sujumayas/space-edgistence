import { GAME_W, GAME_H } from '../../../engine/useCanvas';

// The play region sits below the prompt banner the orchestrator paints at the
// top. Microgames should keep their action inside [PLAY_TOP .. GAME_H].
export const PLAY_TOP = 32;

export type MicroResult = 'pending' | 'success' | 'fail';

/**
 * Per-frame input handed to a microgame. Both the held state and the rising
 * edge (pressed *this* frame) are provided — mashing/submitting/cycling all key
 * off edges, while held flags drive continuous movement (the laundry basket).
 */
export type MicroInput = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  a: boolean;
  leftEdge: boolean;
  rightEdge: boolean;
  upEdge: boolean;
  downEdge: boolean;
  aEdge: boolean;
};

/**
 * A single WarioWare-style microgame: a tiny FSM resolved in a few seconds.
 * `tick` is pure-ish (mutates only its own `state`) and returns the verdict;
 * `render` paints the scene below the prompt banner. The orchestrator owns the
 * timer, the speed multiplier, lives, and the cutaways.
 */
export type Microgame<S = unknown> = {
  id: string;
  /** Huge verb shown across the top while the microgame plays. */
  prompt: string;
  /** Base time budget at speed 1.0; the orchestrator shrinks it as speed ramps. */
  durationMs: number;
  initial(): S;
  tick(state: S, input: MicroInput, dt: number): MicroResult;
  render(ctx: CanvasRenderingContext2D, state: S, t: number): void;
};

export { GAME_W, GAME_H };

// Shared palette (mirrors the other games' look).
export const MC = {
  bg0: '#241a4a',
  bg1: '#120a2e',
  magenta: '#ff2e88',
  cyan: '#2ee6f6',
  violet: '#8a4bff',
  yellow: '#ffd23f',
  orange: '#ff7b29',
  white: '#f4f0ff',
  dim: '#6a5a9a',
  green: '#7fffa0',
  red: '#c0392b',
  black: '#1a0f0f',
  skin: '#e8c39e',
  wood: '#b5722e',
};

export function font(px: number): string {
  return `${px}px "Press Start 2P", monospace`;
}

/** Center-aligned text helper that restores alignment afterwards. */
export function centerText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  px: number,
): void {
  ctx.fillStyle = color;
  ctx.font = font(px);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}
