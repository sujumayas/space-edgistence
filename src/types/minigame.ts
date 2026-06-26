export type GameStats = {
  finalScore: number;
  durationMs: number;
  livesLost: number;
  completed: boolean; // true = won, false = game over
};

export interface MiniGameProps {
  onScoreUpdate: (delta: number) => void;
  onLifeLost: () => void;
  onComplete: (stats: GameStats) => void;
  requestPaydayDefense: () => boolean; // returns true if granted (only once per session)
  triggerGlitch: (durationMs: number) => void;
  inequityMode: boolean; // always true in v1
  paused: boolean; // shell-controlled
}

export type GameId =
  | 'bills'
  | 'school'
  | 'micro'
  | 'brain'
  | 'rush'
  | 'bug'
  | 'pill'
  | 'oil';

export type ScoreEntry = {
  name: string;
  score: number;
};

export type GameMeta = {
  id: GameId;
  title: string;
  subtitle: string;
  /** Source-parody tagline shown on the menu card. */
  parody: string;
};
