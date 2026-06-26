import type { Microgame } from './microgames/types';
import { dishes } from './microgames/dishes';
import { laundry } from './microgames/laundry';
import { homework } from './microgames/homework';
import { door } from './microgames/door';
import { phone } from './microgames/phone';
import { cook } from './microgames/cook';

// All six chores, each weighted equally for now. Kept as a weight table so the
// montage can be tuned without touching the picker.
export const MICROGAMES: Array<{ game: Microgame; weight: number }> = [
  { game: dishes, weight: 1 },
  { game: laundry, weight: 1 },
  { game: homework, weight: 1 },
  { game: door, weight: 1 },
  { game: phone, weight: 1 },
  { game: cook, weight: 1 },
];

/**
 * Weighted random pick that never returns the same microgame twice in a row.
 * `lastId` is excluded from the draw (rule: never two in a row).
 */
export function pickMicrogame(lastId: string | null): Microgame {
  const pool = MICROGAMES.filter((m) => m.game.id !== lastId);
  const total = pool.reduce((sum, m) => sum + m.weight, 0);
  let roll = Math.random() * total;
  for (const m of pool) {
    roll -= m.weight;
    if (roll <= 0) return m.game;
  }
  return pool[pool.length - 1].game;
}
