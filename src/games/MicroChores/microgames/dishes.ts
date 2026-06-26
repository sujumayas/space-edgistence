import { GAME_W, GAME_H, PLAY_TOP, MC, centerText } from './types';
import type { Microgame, MicroInput } from './types';

// DISHES! — mash A to fill the scrub meter to the target before time runs out.
type DishState = {
  scrub: number;
  target: number;
  spongeX: number; // render-only wobble
  t: number;
};

export const dishes: Microgame<DishState> = {
  id: 'dishes',
  prompt: 'DISHES!',
  durationMs: 4200,

  initial(): DishState {
    return { scrub: 0, target: 14, spongeX: 0, t: 0 };
  },

  tick(s, input: MicroInput, dt) {
    s.t += dt;
    if (input.aEdge) {
      s.scrub += 1;
      s.spongeX = s.spongeX === 0 ? 1 : 0;
    }
    return s.scrub >= s.target ? 'success' : 'pending';
  },

  render(ctx, s) {
    const cx = GAME_W / 2;
    const sinkY = PLAY_TOP + 26;

    // sink basin
    ctx.fillStyle = '#3a3550';
    ctx.fillRect(cx - 60, sinkY, 120, 70);
    ctx.fillStyle = '#2a2740';
    ctx.fillRect(cx - 54, sinkY + 8, 108, 56);

    // sudsy water
    ctx.fillStyle = 'rgba(46,230,246,0.25)';
    ctx.fillRect(cx - 54, sinkY + 40, 108, 24);

    // a stack of dirty plates, drawn cleaner as scrub rises
    const prog = Math.min(1, s.scrub / s.target);
    for (let i = 0; i < 3; i++) {
      const py = sinkY + 50 - i * 8;
      ctx.fillStyle = prog > i / 3 ? MC.white : '#7a6a4a';
      ctx.beginPath();
      ctx.ellipse(cx, py, 26 - i * 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // sponge bobbing on top of the plates
    const sx = cx + (s.spongeX === 0 ? -10 : 10);
    ctx.fillStyle = MC.yellow;
    ctx.fillRect(sx - 7, sinkY + 18, 14, 9);
    ctx.fillStyle = MC.green;
    ctx.fillRect(sx - 7, sinkY + 18, 14, 3);

    // scrub meter
    const bw = 120;
    const bx = cx - bw / 2;
    const by = GAME_H - 24;
    ctx.fillStyle = '#0a0118';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 10);
    ctx.fillStyle = MC.green;
    ctx.fillRect(bx, by, prog * bw, 8);
    ctx.strokeStyle = MC.white;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 0.5, by - 0.5, bw + 1, 9);

    centerText(ctx, 'MASH A!', cx, by - 6, MC.cyan, 7);
  },
};
