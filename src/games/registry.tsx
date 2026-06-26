import type { ComponentType } from 'react';
import type { GameId, GameMeta, MiniGameProps } from '../types/minigame';
import { BillsVsCoins } from './BillsVsCoins/index';

export const GAME_META: Record<GameId, GameMeta> = {
  bills: {
    id: 'bills',
    title: 'BILLS VS COINS',
    subtitle: 'Pay or perish',
    parody: "Don't Bomb Her, Man! / Space Invaders",
  },
  school: { id: 'school', title: 'SCHOOL RUN', subtitle: 'Late again', parody: 'Paperboy' },
  micro: { id: 'micro', title: 'MICRO CHORES', subtitle: 'Faster!', parody: 'WarioWare' },
  brain: { id: 'brain', title: 'BRAIN DRAIN', subtitle: 'Do the math', parody: 'Brain Age' },
  rush: { id: 'rush', title: 'RUSH HOUR', subtitle: 'Floor it', parody: 'Mario Kart' },
  bug: { id: 'bug', title: 'BUG SWATTER', subtitle: 'Squash it', parody: 'Whack-a-Mole' },
  pill: { id: 'pill', title: 'PILL MATCHER', subtitle: 'Match meds', parody: 'Dr. Mario' },
  oil: { id: 'oil', title: 'OIL PANIC', subtitle: 'Catch the drip', parody: 'Game & Watch' },
};

export const GAME_ORDER: GameId[] = [
  'bills',
  'school',
  'micro',
  'brain',
  'rush',
  'bug',
  'pill',
  'oil',
];

/** Components for games that are actually implemented this session. */
export const GAME_COMPONENTS: Partial<Record<GameId, ComponentType<MiniGameProps>>> = {
  bills: BillsVsCoins,
};
