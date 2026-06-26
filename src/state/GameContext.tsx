import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { GameId, GameStats, ScoreEntry } from '../types/minigame';
import {
  loadLeaderboard,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
} from './storage';
import { setMuted } from '../engine/useAudio';
import { GAME_COMPONENTS } from '../games/registry';

export type Screen = 'boot' | 'menu' | 'cutscene' | 'playing' | 'gameover';

const START_LIVES = 3;

export type GameContextValue = {
  // session state (resets only on page reload)
  lives: number;
  totalScore: number;
  paydayUsed: boolean;
  glitchUntil: number;

  // navigation
  screen: Screen;
  activeGame: GameId | null;
  lastStats: GameStats | null;

  // persisted
  unlocked: GameId[];
  leaderboard: ScoreEntry[];
  ochoBest: number;
  settings: { crt: boolean; sound: boolean };

  // actions
  goToMenu: () => void;
  startGame: (id: GameId) => void;
  startCutscene: () => void;
  finishCutscene: () => void;
  addScore: (delta: number) => void;
  loseLife: () => void;
  grantPayday: () => boolean;
  setGlitchUntil: (ts: number) => void;
  endGame: (stats: GameStats) => void;
  resetSession: () => void;
  toggleCrt: () => void;
  toggleSound: () => void;
};

const Ctx = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const progress0 = useRef(loadProgress()).current;
  const settings0 = useRef(loadSettings()).current;
  // Sync the audio mute flag to the persisted setting on first render.
  useRef(setMuted(!settings0.sound));

  const [lives, setLives] = useState(START_LIVES);
  const [totalScore, setTotalScore] = useState(0);
  const [paydayUsed, setPaydayUsed] = useState(false);
  const [glitchUntil, setGlitchUntil] = useState(0);

  const [screen, setScreen] = useState<Screen>('boot');
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [lastStats, setLastStats] = useState<GameStats | null>(null);

  // Any game with a registered component is playable — union it with the
  // persisted list so implementing a game auto-unlocks it (and persists it),
  // without per-game seed edits or migrations for existing saves.
  const [unlocked] = useState<GameId[]>(() => {
    const implemented = Object.keys(GAME_COMPONENTS) as GameId[];
    const merged = Array.from(new Set([...progress0.unlocked, ...implemented]));
    if (merged.length !== progress0.unlocked.length) {
      saveProgress({ ...loadProgress(), unlocked: merged });
    }
    return merged;
  });
  const [leaderboard] = useState<ScoreEntry[]>(() => loadLeaderboard());
  const [ochoBest, setOchoBest] = useState(progress0.bestTotal);
  const [settings, setSettings] = useState(settings0);

  const goToMenu = useCallback(() => setScreen('menu'), []);
  const startCutscene = useCallback(() => setScreen('cutscene'), []);

  const finishCutscene = useCallback(() => {
    const p = loadProgress();
    if (!p.cutsceneSeen) saveProgress({ ...p, cutsceneSeen: true });
    setScreen('menu');
  }, []);

  const startGame = useCallback((id: GameId) => {
    setActiveGame(id);
    setLastStats(null);
    setScreen('playing');
  }, []);

  const addScore = useCallback((delta: number) => {
    setTotalScore((s) => {
      const next = Math.max(0, s + delta);
      setOchoBest((best) => {
        if (next > best) {
          const p = loadProgress();
          saveProgress({ ...p, bestTotal: next });
          return next;
        }
        return best;
      });
      return next;
    });
  }, []);

  const loseLife = useCallback(() => {
    setLives((l) => Math.max(0, l - 1));
  }, []);

  const grantPayday = useCallback((): boolean => {
    let granted = false;
    setPaydayUsed((used) => {
      if (!used) {
        granted = true;
        return true;
      }
      return used;
    });
    return granted;
  }, []);

  const endGame = useCallback((stats: GameStats) => {
    setLastStats(stats);
    setScreen('gameover');
  }, []);

  const resetSession = useCallback(() => {
    setLives(START_LIVES);
    setTotalScore(0);
    setPaydayUsed(false);
    setGlitchUntil(0);
    setActiveGame(null);
    setLastStats(null);
    setScreen('menu');
  }, []);

  const toggleCrt = useCallback(() => {
    setSettings((s) => {
      const next = { ...s, crt: !s.crt };
      saveSettings(next);
      return next;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSettings((s) => {
      const next = { ...s, sound: !s.sound };
      saveSettings(next);
      setMuted(!next.sound);
      return next;
    });
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      lives,
      totalScore,
      paydayUsed,
      glitchUntil,
      screen,
      activeGame,
      lastStats,
      unlocked,
      leaderboard,
      ochoBest,
      settings,
      goToMenu,
      startGame,
      startCutscene,
      finishCutscene,
      addScore,
      loseLife,
      grantPayday,
      setGlitchUntil,
      endGame,
      resetSession,
      toggleCrt,
      toggleSound,
    }),
    [
      lives,
      totalScore,
      paydayUsed,
      glitchUntil,
      screen,
      activeGame,
      lastStats,
      unlocked,
      leaderboard,
      ochoBest,
      settings,
      goToMenu,
      startGame,
      startCutscene,
      finishCutscene,
      addScore,
      loseLife,
      grantPayday,
      endGame,
      resetSession,
      toggleCrt,
      toggleSound,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame must be used within GameProvider');
  return v;
}
