import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import type { GameStats, MiniGameProps } from '../types/minigame';
import { useGame } from '../state/GameContext';
import { getInput } from '../engine/useInput';
import { playSfx } from '../engine/useAudio';
import { Hud } from './Hud';
import { PauseMenu } from './PauseMenu';
import { PaydayOverlay } from './PaydayOverlay';
import { GlitchOverlay } from './GlitchOverlay';
import { TouchOverlay } from '../input/TouchOverlay';

type Props = {
  GameComponent: ComponentType<MiniGameProps>;
};

/**
 * Wraps a minigame: builds its MiniGameProps, renders the HUD + pause menu +
 * payday/glitch overlays + mobile touch controls, and owns run-level state
 * (score, pause, payday animation, end-of-run finalization).
 */
export function GameShell({ GameComponent }: Props) {
  const game = useGame();
  const [paused, setPaused] = useState(false);
  const [paydayActive, setPaydayActive] = useState(false);
  const [runScore, setRunScore] = useState(0);
  const [glitchOn, setGlitchOn] = useState(false);

  const startRef = useRef(performance.now());
  const livesAtStart = useRef(game.lives);
  const endedRef = useRef(false);

  const paydayRef = useRef(paydayActive);
  paydayRef.current = paydayActive;

  // --- end-of-run finalization (single-fire) ---
  const finalize = useCallback(
    (completed: boolean) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const stats: GameStats = {
        finalScore: runScore,
        durationMs: performance.now() - startRef.current,
        livesLost: Math.max(0, livesAtStart.current - game.lives),
        completed,
      };
      game.endGame(stats);
    },
    [game, runScore],
  );

  // Out of lives → game over.
  useEffect(() => {
    if (game.lives <= 0) finalize(false);
  }, [game.lives, finalize]);

  // --- pause toggle on Start rising-edge (keyboard) ---
  useEffect(() => {
    let raf = 0;
    let prevStart = false;
    const poll = () => {
      raf = requestAnimationFrame(poll);
      const s = getInput().start;
      if (s && !prevStart && !paydayRef.current && !endedRef.current) {
        setPaused((p) => !p);
        playSfx('select');
      }
      prevStart = s;
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- glitch overlay visibility tracks glitchUntil ---
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      setGlitchOn(Date.now() < game.glitchUntil);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [game.glitchUntil]);

  // --- MiniGameProps wired to the shell ---
  const onScoreUpdate = useCallback(
    (delta: number) => {
      setRunScore((s) => Math.max(0, s + delta));
      game.addScore(delta);
    },
    [game],
  );

  const onLifeLost = useCallback(() => {
    playSfx('lose');
    game.loseLife();
  }, [game]);

  const onComplete = useCallback(
    (stats: GameStats) => {
      // Trust the game's `completed`; stamp shell-owned fields.
      if (endedRef.current) return;
      endedRef.current = true;
      // Losing a game costs one session life (a win does not).
      if (!stats.completed && game.lives > 0) game.loseLife();
      game.endGame({
        ...stats,
        finalScore: stats.finalScore || runScore,
        durationMs: stats.durationMs || performance.now() - startRef.current,
        livesLost:
          stats.livesLost || Math.max(0, livesAtStart.current - game.lives),
      });
    },
    [game, runScore],
  );

  const requestPaydayDefense = useCallback((): boolean => {
    const granted = game.grantPayday();
    if (granted) setPaydayActive(true);
    return granted;
  }, [game]);

  const triggerGlitch = useCallback(
    (durationMs: number) => {
      playSfx('glitch');
      game.setGlitchUntil(Date.now() + durationMs);
    },
    [game],
  );

  const miniProps: MiniGameProps = {
    onScoreUpdate,
    onLifeLost,
    onComplete,
    requestPaydayDefense,
    triggerGlitch,
    inequityMode: true,
    paused: paused || paydayActive,
  };

  const quit = useCallback(() => {
    setPaused(false);
    endedRef.current = true; // prevent the lives-effect from firing game over
    game.goToMenu();
  }, [game]);

  return (
    <>
      <GameComponent {...miniProps} />

      <Hud lives={game.lives} score={runScore} onPause={() => setPaused(true)} />

      {glitchOn && <GlitchOverlay />}

      {paydayActive && (
        <PaydayOverlay onDone={() => setPaydayActive(false)} />
      )}

      {paused && (
        <PauseMenu onResume={() => setPaused(false)} onQuit={quit} />
      )}

      <TouchOverlay
        showStart
        onStart={() => {
          if (!paydayActive && !endedRef.current) {
            setPaused((p) => !p);
            playSfx('select');
          }
        }}
      />
    </>
  );
}
