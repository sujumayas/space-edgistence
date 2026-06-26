import { useGame } from '../state/GameContext';

/**
 * The leaderboard joke: rivals own the top 10, OCHO is rendered separately at
 * rank 11 no matter how high the score climbs. Footer twists the knife.
 */
export function Leaderboard({ onClose }: { onClose: () => void }) {
  const { leaderboard, ochoBest } = useGame();
  const top10 = leaderboard.slice(0, 10);

  return (
    <div className="overlay dim fade-in">
      <div className="panel" style={{ minWidth: 280 }}>
        <h2 className="title-glow" style={{ fontSize: 14, margin: '2px 0 14px' }}>
          HIGH SCORES
        </h2>
        <div style={{ fontSize: 9, lineHeight: 1.9, textAlign: 'left' }}>
          {top10.map((e, i) => (
            <div
              key={e.name}
              style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}
            >
              <span style={{ color: 'var(--c-dim)' }}>
                {String(i + 1).padStart(2, ' ')}. {e.name}
              </span>
              <span style={{ color: 'var(--c-yellow)' }}>
                {e.score.toLocaleString()}
              </span>
            </div>
          ))}
          <div
            style={{
              borderTop: '2px dashed var(--c-dim)',
              margin: '8px 0',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              color: 'var(--c-magenta)',
            }}
          >
            <span>11. OCHO</span>
            <span>{ochoBest.toLocaleString()}</span>
          </div>
        </div>
        <p style={{ fontSize: 7, color: 'var(--c-dim)', margin: '14px 0 10px' }}>
          TOP 10 ONLY — KEEP TRYING
        </p>
        <button className="pixel-btn" onClick={onClose}>
          BACK
        </button>
      </div>
    </div>
  );
}
