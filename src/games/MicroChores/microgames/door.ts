import { GAME_W, GAME_H, PLAY_TOP, MC, centerText } from './types';
import type { Microgame, MicroInput } from './types';

// DOOR! — the landlord knocks. Press DOWN to hide. Do NOT answer (UP opens it).
// Opening the door, or freezing until the timer expires, fails.
type DoorState = {
  knockT: number; // time until first knock
  knocked: boolean;
  hidden: boolean;
  t: number;
};

export const door: Microgame<DoorState> = {
  id: 'door',
  prompt: 'DOOR!',
  durationMs: 3800,

  initial(): DoorState {
    return { knockT: 0.3 + Math.random() * 0.5, knocked: false, hidden: false, t: 0 };
  },

  tick(s, input: MicroInput, dt) {
    s.t += dt;
    if (s.t >= s.knockT) s.knocked = true;
    if (input.upEdge || input.aEdge) return 'fail'; // you answered — rent is due
    if (input.downEdge) {
      s.hidden = true;
      return 'success';
    }
    return 'pending';
  },

  render(ctx, s) {
    const cx = GAME_W / 2;
    // wall + door
    ctx.fillStyle = '#2a2440';
    ctx.fillRect(0, PLAY_TOP, GAME_W, GAME_H - PLAY_TOP);
    ctx.fillStyle = MC.wood;
    ctx.fillRect(cx - 26, PLAY_TOP + 8, 52, GAME_H - PLAY_TOP - 20);
    ctx.fillStyle = '#8a5420';
    ctx.fillRect(cx - 22, PLAY_TOP + 14, 44, 40);
    ctx.fillRect(cx - 22, PLAY_TOP + 60, 44, 40);
    // knob
    ctx.fillStyle = MC.yellow;
    ctx.fillRect(cx + 14, PLAY_TOP + 70, 4, 4);

    // KNOCK! bubble pulsing when the landlord is at the door
    if (s.knocked && Math.floor(s.t * 6) % 2 === 0) {
      centerText(ctx, 'KNOCK!', cx, PLAY_TOP + 6, MC.magenta, 9);
    }

    // hiding curtain when ducked
    if (s.hidden) {
      ctx.fillStyle = 'rgba(10,1,24,0.7)';
      ctx.fillRect(0, PLAY_TOP, GAME_W, GAME_H - PLAY_TOP);
      centerText(ctx, 'HIDDEN', cx, GAME_H / 2, MC.green, 9);
    }

    centerText(ctx, '↓ HIDE  (DON’T ANSWER)', cx, GAME_H - 5, MC.cyan, 6);
  },
};
