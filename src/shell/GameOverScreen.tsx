import { useGame } from '../state/GameContext';
import { playSfx } from '../engine/useAudio';

/** End-of-run summary. "Continue" only offered if lives remain. */
export function GameOverScreen() {
  const { lastStats, lives, activeGame, startGame, goToMenu, resetSession } =
    useGame();
  const won = lastStats?.completed ?? false;
  const canContinue = lives > 0 && activeGame != null;

  return (
    <div className="overlay dim fade-in">
      <div className="panel" style={{ minWidth: 280 }}>
        <h2
          className="title-glow"
          style={{
            fontSize: 18,
            margin: '4px 0 16px',
            color: won ? 'var(--c-yellow)' : 'var(--c-magenta)',
            textShadow: won
              ? '0 0 8px var(--c-yellow), 3px 3px 0 #000'
              : '0 0 8px var(--c-magenta), 3px 3px 0 #000',
          }}
        >
          {won ? 'DAY CLEARED' : 'FAILURE'}
        </h2>

        <div style={{ fontSize: 9, lineHeight: 2.1, textAlign: 'left', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--c-dim)' }}>SCORE</span>
            <span style={{ color: 'var(--c-cyan)' }}>
              {(lastStats?.finalScore ?? 0).toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--c-dim)' }}>TIME</span>
            <span style={{ color: 'var(--c-cyan)' }}>
              {Math.round((lastStats?.durationMs ?? 0) / 1000)}s
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--c-dim)' }}>LIVES LEFT</span>
            <span style={{ color: 'var(--c-magenta)' }}>
              {'♥'.repeat(Math.max(0, lives)) || '×'}
            </span>
          </div>
        </div>

        {canContinue && activeGame && (
          <button
            className="pixel-btn"
            onClick={() => {
              playSfx('select');
              startGame(activeGame);
            }}
          >
            CONTINUE
          </button>
        )}

        {lives <= 0 && (
          <button
            className="pixel-btn danger"
            onClick={() => {
              playSfx('select');
              resetSession();
            }}
          >
            NEW SESSION (RESET LIVES)
          </button>
        )}

        <button
          className="pixel-btn"
          onClick={() => {
            playSfx('select');
            goToMenu();
          }}
        >
          BACK TO MENU
        </button>

        {lives <= 0 && (
          <p style={{ fontSize: 7, color: 'var(--c-dim)', marginTop: 12, lineHeight: 1.7 }}>
            OUT OF LIVES — RIVALS UNAFFECTED
          </p>
        )}
      </div>
    </div>
  );
}
