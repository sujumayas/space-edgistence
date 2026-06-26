import { GAME_W, GAME_H, PLAY_TOP, MC, centerText, font } from './types';
import type { Microgame, MicroInput } from './types';

// HOMEWORK! — solve a tiny sum. Up/down cycles the highlighted answer, A submits.
// Wrong answer or timeout = fail.
type HwState = {
  a: number;
  b: number;
  answer: number;
  options: number[];
  idx: number;
  t: number;
};

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const homework: Microgame<HwState> = {
  id: 'homework',
  prompt: 'HOMEWORK!',
  durationMs: 5000,

  initial(): HwState {
    const a = 1 + Math.floor(Math.random() * 8);
    const b = 1 + Math.floor(Math.random() * 8);
    const answer = a + b;
    // three distractors near the answer, deduped
    const opts = new Set<number>([answer]);
    while (opts.size < 3) {
      const d = answer + (Math.floor(Math.random() * 5) - 2);
      if (d >= 0 && d !== answer) opts.add(d);
    }
    const options = shuffle([...opts]);
    return { a, b, answer, options, idx: 0, t: 0 };
  },

  tick(s, input: MicroInput, dt) {
    s.t += dt;
    if (input.upEdge) s.idx = (s.idx - 1 + s.options.length) % s.options.length;
    if (input.downEdge) s.idx = (s.idx + 1) % s.options.length;
    if (input.aEdge) {
      return s.options[s.idx] === s.answer ? 'success' : 'fail';
    }
    return 'pending';
  },

  render(ctx, s) {
    const cx = GAME_W / 2;

    // worksheet
    ctx.fillStyle = '#f0ead6';
    ctx.fillRect(cx - 70, PLAY_TOP + 4, 140, 60);
    ctx.strokeStyle = MC.dim;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 70.5, PLAY_TOP + 3.5, 141, 61);
    // red margin line
    ctx.fillStyle = '#d05050';
    ctx.fillRect(cx - 56, PLAY_TOP + 4, 1, 60);

    centerText(ctx, `${s.a} + ${s.b} = ?`, cx, PLAY_TOP + 38, '#202040', 12);

    // answer options as a vertical list; highlight current
    const oy = GAME_H - 58;
    ctx.font = font(10);
    ctx.textAlign = 'center';
    for (let i = 0; i < s.options.length; i++) {
      const y = oy + i * 16;
      if (i === s.idx) {
        ctx.fillStyle = MC.magenta;
        ctx.fillRect(cx - 40, y - 10, 80, 14);
        ctx.fillStyle = MC.white;
      } else {
        ctx.fillStyle = MC.dim;
      }
      ctx.fillText(String(s.options[i]), cx, y);
    }
    ctx.textAlign = 'left';

    centerText(ctx, 'UP/DOWN  A=OK', cx, GAME_H - 4, MC.cyan, 6);
  },
};
