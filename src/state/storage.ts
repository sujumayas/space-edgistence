import type { GameId, ScoreEntry } from '../types/minigame';

// Typed localStorage wrapper. All persistence flows through here so keys and
// shapes stay consistent. (Lives/score are session-only and live in context,
// not here — only durable things are persisted.)

const KEYS = {
  leaderboard: 'leaderboard:global',
  progress: 'progress:ocho',
  settings: 'settings:crt',
} as const;

export type Progress = {
  unlocked: GameId[];
  highScores: Partial<Record<GameId, ScoreEntry[]>>;
  bestTotal: number;
  cutsceneSeen: boolean;
};

export type Settings = {
  crt: boolean;
  sound: boolean;
};

// The leaderboard joke: rivals dominate the top 10; OCHO is forever rank 11.
export const SEEDED_LEADERBOARD: ScoreEntry[] = [
  { name: 'TOBIAS', score: 9_999_999 },
  { name: 'MASAMI', score: 9_000_000 },
  { name: 'PENNY', score: 1_200_000 },
  { name: 'GUMBALL', score: 900_000 },
  { name: 'DARWIN', score: 850_000 },
  { name: 'ALAN', score: 700_000 },
  { name: 'CARRIE', score: 650_000 },
  { name: 'BANANA', score: 600_000 },
  { name: 'ANTON', score: 550_000 },
  { name: 'CARMEN', score: 500_000 },
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function loadLeaderboard(): ScoreEntry[] {
  const existing = read<ScoreEntry[] | null>(KEYS.leaderboard, null);
  if (existing && Array.isArray(existing) && existing.length) return existing;
  write(KEYS.leaderboard, SEEDED_LEADERBOARD);
  return SEEDED_LEADERBOARD;
}

export function loadProgress(): Progress {
  return read<Progress>(KEYS.progress, {
    unlocked: ['bills'],
    highScores: {},
    bestTotal: 0,
    cutsceneSeen: false,
  });
}

export function saveProgress(p: Progress): void {
  write(KEYS.progress, p);
}

export function loadSettings(): Settings {
  return read<Settings>(KEYS.settings, { crt: true, sound: true });
}

export function saveSettings(s: Settings): void {
  write(KEYS.settings, s);
}

/** OCHO's best total across the session, for the rank-11 leaderboard row. */
export function ochoBest(): number {
  return loadProgress().bestTotal;
}
