import { useEffect } from 'react';
import { playSfx } from '../engine/useAudio';
import './payday.css';

type Props = {
  onDone: () => void;
};

/**
 * Mom's Payday Defense — the deus ex machina (Rule 3). Shared visual across
 * every game: Mom walks in from the left, hurls a giant paycheck, and exits
 * right. Plays once when granted; the game applies its own rescue effect.
 */
export function PaydayOverlay({ onDone }: Props) {
  useEffect(() => {
    playSfx('payday');
    const t = setTimeout(onDone, 2900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="overlay payday-overlay">
      <div className="payday-flash" />
      <div className="payday-bubble">
        ¡MAMÁ TIENE QUE
        <br />
        VOLVER AL TRABAJO,
        <br />
        MIJO!
      </div>
      <div className="payday-mom" aria-label="Mom">
        <div className="mom-head" />
        <div className="mom-body" />
      </div>
      <div className="payday-check">PAYDAY $$$</div>
      <div className="payday-banner">MOM ASSIST</div>
    </div>
  );
}
