import { useEffect, useState } from 'react';
import { setTouchButton } from '../engine/useInput';
import type { ButtonName } from '../engine/useInput';
import './touch.css';

type Props = {
  /** Show a pause/start button (hidden on menus). */
  showStart?: boolean;
  onStart?: () => void;
};

function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(pointer: coarse)').matches
      : false,
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const handler = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return coarse;
}

function HoldButton({
  btn,
  label,
  className,
}: {
  btn: ButtonName;
  label: string;
  className: string;
}) {
  const press = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setTouchButton(btn, true);
  };
  const release = (e: React.PointerEvent) => {
    e.preventDefault();
    setTouchButton(btn, false);
  };
  return (
    <button
      className={className}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      aria-label={label}
    >
      {label}
    </button>
  );
}

/**
 * Virtual D-pad (left) + A/B buttons (right), unified with keyboard through the
 * shared InputState. Only mounts on coarse-pointer devices.
 */
export function TouchOverlay({ showStart, onStart }: Props) {
  const coarse = useCoarsePointer();
  if (!coarse) return null;

  return (
    <div className="touch-overlay">
      <div className="touch-dpad">
        <HoldButton btn="up" label="▲" className="dpad-btn dpad-up" />
        <HoldButton btn="left" label="◀" className="dpad-btn dpad-left" />
        <HoldButton btn="right" label="▶" className="dpad-btn dpad-right" />
        <HoldButton btn="down" label="▼" className="dpad-btn dpad-down" />
      </div>

      <div className="touch-actions">
        <HoldButton btn="b" label="B" className="action-btn b-btn" />
        <HoldButton btn="a" label="A" className="action-btn a-btn" />
      </div>

      {showStart && (
        <button
          className="touch-start"
          onPointerDown={(e) => {
            e.preventDefault();
            onStart?.();
          }}
          aria-label="Start / Pause"
        >
          ❚❚
        </button>
      )}
    </div>
  );
}
