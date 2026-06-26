import { GAME_W, GAME_H, PLAY_TOP, MC, centerText } from './types';
import type { Microgame, MicroInput } from './types';

// COOK! — reaction test. The pan heats red → yellow → black (burnt). Hit A only
// while it is YELLOW. Too early (red), too late (black), or no press = fail.
type CookState = {
  redDur: number; // seconds before it turns yellow
  yellowDur: number; // the success window
  t: number;
  phase: 'red' | 'yellow' | 'black';
};

export const cook: Microgame<CookState> = {
  id: 'cook',
  prompt: 'COOK!',
  durationMs: 4600,

  initial(): CookState {
    return {
      redDur: 0.9 + Math.random() * 1.6,
      yellowDur: 0.75,
      t: 0,
      phase: 'red',
    };
  },

  tick(s, input: MicroInput, dt) {
    s.t += dt;
    if (s.t < s.redDur) s.phase = 'red';
    else if (s.t < s.redDur + s.yellowDur) s.phase = 'yellow';
    else s.phase = 'black';

    if (input.aEdge) {
      return s.phase === 'yellow' ? 'success' : 'fail';
    }
    return 'pending';
  },

  render(ctx, s) {
    const cx = GAME_W / 2;
    const cy = PLAY_TOP + 50;

    // stove top
    ctx.fillStyle = '#2a2740';
    ctx.fillRect(cx - 60, cy + 10, 120, 50);

    // burner glow
    const glow =
      s.phase === 'red'
        ? 'rgba(192,57,43,0.5)'
        : s.phase === 'yellow'
          ? 'rgba(255,210,63,0.6)'
          : 'rgba(40,40,40,0.6)';
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 26, 44, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // pan
    ctx.fillStyle = '#3a3a44';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // contents — the colour you're reacting to
    const inner =
      s.phase === 'red' ? MC.red : s.phase === 'yellow' ? MC.yellow : MC.black;
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // handle
    ctx.fillStyle = '#202028';
    ctx.fillRect(cx + 34, cy - 3, 30, 6);

    // sizzle / smoke cue
    if (s.phase === 'yellow' && Math.floor(s.t * 12) % 2 === 0) {
      centerText(ctx, 'NOW!', cx, cy - 24, MC.green, 9);
    } else if (s.phase === 'black') {
      centerText(ctx, 'BURNT!', cx, cy - 24, MC.magenta, 8);
    }

    centerText(ctx, 'A WHEN YELLOW', cx, GAME_H - 5, MC.cyan, 6);
  },
};
