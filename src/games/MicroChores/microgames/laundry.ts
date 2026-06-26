import { GAME_W, GAME_H, PLAY_TOP, MC, centerText } from './types';
import type { Microgame, MicroInput } from './types';

// LAUNDRY! — slide the basket left/right to catch falling clothes. Catch the
// quota before the timer expires. Missed items drop past the floor (no instant
// fail — but they don't count).
type Cloth = { x: number; y: number; vy: number; color: string; live: boolean };
type LaundryState = {
  basketX: number;
  caught: number;
  need: number;
  clothes: Cloth[];
  t: number;
};

const FLOOR = GAME_H - 18;
const BASKET_W = 36;
const BASKET_Y = FLOOR - 14;
const COLORS = [MC.magenta, MC.cyan, MC.yellow, MC.green, MC.orange];

export const laundry: Microgame<LaundryState> = {
  id: 'laundry',
  prompt: 'LAUNDRY!',
  durationMs: 5000,

  initial(): LaundryState {
    const clothes: Cloth[] = [];
    // five items on a tight stagger so all reach the basket inside the 5s
    // budget (you only need to bag three — two can slip past).
    for (let i = 0; i < 5; i++) {
      clothes.push({
        x: 30 + Math.random() * (GAME_W - 60),
        y: PLAY_TOP - 12 - i * 24 - Math.random() * 8,
        vy: 60 + Math.random() * 14,
        color: COLORS[i % COLORS.length],
        live: true,
      });
    }
    return { basketX: GAME_W / 2, caught: 0, need: 3, clothes, t: 0 };
  },

  tick(s, input: MicroInput, dt) {
    s.t += dt;
    const speed = 150;
    if (input.left) s.basketX -= speed * dt;
    if (input.right) s.basketX += speed * dt;
    s.basketX = Math.max(BASKET_W / 2, Math.min(GAME_W - BASKET_W / 2, s.basketX));

    for (const c of s.clothes) {
      if (!c.live) continue;
      c.y += c.vy * dt;
      // caught if it reaches basket lip while overlapping horizontally
      if (
        c.y >= BASKET_Y - 2 &&
        c.y <= BASKET_Y + 8 &&
        Math.abs(c.x - s.basketX) < BASKET_W / 2
      ) {
        c.live = false;
        s.caught += 1;
      } else if (c.y > FLOOR) {
        c.live = false; // hit the floor, missed
      }
    }
    return s.caught >= s.need ? 'success' : 'pending';
  },

  render(ctx, s) {
    // floor line
    ctx.fillStyle = '#2a1c14';
    ctx.fillRect(0, FLOOR, GAME_W, GAME_H - FLOOR);

    // falling clothes (little shirts)
    for (const c of s.clothes) {
      if (!c.live) continue;
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x - 6, c.y, 12, 8);
      ctx.fillRect(c.x - 9, c.y + 1, 3, 4); // sleeves
      ctx.fillRect(c.x + 6, c.y + 1, 3, 4);
    }

    // basket
    const bx = s.basketX;
    ctx.fillStyle = MC.wood;
    ctx.fillRect(bx - BASKET_W / 2, BASKET_Y, BASKET_W, 14);
    ctx.fillStyle = '#8a5420';
    for (let i = -BASKET_W / 2 + 3; i < BASKET_W / 2; i += 6) {
      ctx.fillRect(bx + i, BASKET_Y, 2, 14);
    }
    ctx.fillStyle = '#d89a4a';
    ctx.fillRect(bx - BASKET_W / 2, BASKET_Y, BASKET_W, 3);

    centerText(
      ctx,
      `CAUGHT ${s.caught}/${s.need}`,
      GAME_W / 2,
      PLAY_TOP + 12,
      MC.cyan,
      7,
    );
  },
};
