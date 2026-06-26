import { useGame } from '../state/GameContext';
import { playSfx } from '../engine/useAudio';

type Props = {
  onResume: () => void;
  onQuit: () => void;
};

/**
 * The locked-difficulty joke lives here (Rule 1). The "Difficulty: HARD" row is
 * a disabled button: greyed out, "no" cursor, and clicking it plays the denied
 * buzzer. Its label NEVER changes.
 */
export function PauseMenu({ onResume, onQuit }: Props) {
  const { settings, toggleSound, toggleCrt } = useGame();

  return (
    <div className="overlay dim fade-in">
      <div className="panel" style={{ minWidth: 260 }}>
        <h2 className="title-glow" style={{ fontSize: 16, margin: '4px 0 18px' }}>
          PAUSED
        </h2>

        <button className="pixel-btn" onClick={() => { playSfx('select'); onResume(); }}>
          RESUME
        </button>

        <button
          className="pixel-btn"
          onClick={() => { playSfx('select'); toggleSound(); }}
        >
          SOUND: {settings.sound ? 'ON' : 'OFF'}
        </button>

        <button
          className="pixel-btn"
          onClick={() => { playSfx('select'); toggleCrt(); }}
        >
          CRT EFFECT: {settings.crt ? 'ON' : 'OFF'}
        </button>

        <button
          className="pixel-btn locked"
          aria-disabled="true"
          onClick={() => playSfx('denied')}
          title="Locked at factory"
        >
          DIFFICULTY: HARD
        </button>

        <button
          className="pixel-btn danger"
          onClick={() => { playSfx('select'); onQuit(); }}
        >
          QUIT TO MENU
        </button>

        <p style={{ fontSize: 7, color: 'var(--c-dim)', marginTop: 14, lineHeight: 1.6 }}>
          DIFFICULTY LOCKED — HARD
        </p>
      </div>
    </div>
  );
}
