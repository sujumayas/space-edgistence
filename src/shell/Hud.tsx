type Props = {
  lives: number;
  score: number;
  onPause: () => void;
};

/** Top HUD: lives as hearts (left), score (right), pause control. */
export function Hud({ lives, score, onPause }: Props) {
  const hearts = Math.max(0, lives);
  return (
    <div className="hud">
      <div style={{ position: 'absolute', top: 6, left: 8, fontSize: 10 }}>
        <span style={{ color: 'var(--c-magenta)' }}>
          {'♥ '.repeat(hearts).trim() || '×'}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10,
          color: 'var(--c-cyan)',
          textShadow: '2px 2px 0 #000',
        }}
      >
        {String(score).padStart(6, '0')}
      </div>
      <button
        onClick={onPause}
        style={{
          position: 'absolute',
          top: 4,
          right: 8,
          pointerEvents: 'auto',
          fontSize: 8,
          color: 'var(--c-white)',
          background: 'rgba(36,16,70,0.7)',
          border: '2px solid var(--c-violet)',
          padding: '4px 6px',
          cursor: 'pointer',
        }}
        aria-label="Pause"
      >
        ❚❚
      </button>
    </div>
  );
}
