import { GAME_W, GAME_H, PLAY_TOP, MC, centerText } from './types';
import type { Microgame, MicroInput } from './types';

// PHONE! — Mom is calling. Press UP to answer fast. Declining (DOWN) or letting
// it ring out (timeout) fails. The trap: it's the mirror of DOOR!.
type PhoneState = {
  ringT: number;
  ringing: boolean;
  answered: boolean;
  t: number;
};

export const phone: Microgame<PhoneState> = {
  id: 'phone',
  prompt: 'PHONE!',
  durationMs: 3800,

  initial(): PhoneState {
    return { ringT: 0.2 + Math.random() * 0.4, ringing: false, answered: false, t: 0 };
  },

  tick(s, input: MicroInput, dt) {
    s.t += dt;
    if (s.t >= s.ringT) s.ringing = true;
    if (input.downEdge) return 'fail'; // you hung up on Mom
    if (input.upEdge) {
      s.answered = true;
      return 'success';
    }
    return 'pending';
  },

  render(ctx, s) {
    const cx = GAME_W / 2;
    const phY = PLAY_TOP + 20;

    // a shaking phone handset
    const shake = s.ringing && !s.answered ? Math.sin(s.t * 40) * 3 : 0;
    ctx.save();
    ctx.translate(cx + shake, phY);
    ctx.fillStyle = '#202028';
    ctx.fillRect(-28, 24, 56, 36); // base
    ctx.fillStyle = MC.violet;
    // handset
    ctx.fillRect(-30, 16, 14, 14);
    ctx.fillRect(16, 16, 14, 14);
    ctx.fillRect(-30, 16, 60, 8);
    ctx.fillStyle = '#3a3550';
    ctx.fillRect(-18, 34, 36, 20); // dial pad
    ctx.fillStyle = MC.dim;
    for (let r = 0; r < 3; r++)
      for (let cc = 0; cc < 3; cc++)
        ctx.fillRect(-14 + cc * 11, 37 + r * 6, 6, 4);
    ctx.restore();

    if (s.ringing && !s.answered && Math.floor(s.t * 6) % 2 === 0) {
      centerText(ctx, 'RING!', cx, PLAY_TOP + 8, MC.yellow, 9);
    }
    if (s.answered) centerText(ctx, 'HI MOM!', cx, GAME_H / 2 + 10, MC.green, 9);

    centerText(ctx, '↑ ANSWER (IT’S MOM)', cx, GAME_H - 5, MC.cyan, 6);
  },
};
