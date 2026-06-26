import { useEffect, useState } from 'react';
import { useGame } from '../state/GameContext';
import { loadProgress } from '../state/storage';
import { playSfx } from '../engine/useAudio';
import './boot.css';

/** CRT power-on animation + logo. Advances to menu (or cutscene on first run). */
export function BootScreen() {
  const { startCutscene, goToMenu } = useGame();
  const [phase, setPhase] = useState<'power' | 'logo'>('power');

  const advance = () => {
    playSfx('select');
    if (!loadProgress().cutsceneSeen) startCutscene();
    else goToMenu();
  };

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), 900);
    const t2 = setTimeout(advance, 3200);
    const onKey = () => advance();
    window.addEventListener('keydown', onKey, { once: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overlay boot" onClick={advance}>
      <div className={`boot-tube ${phase}`}>
        <div className="boot-line" />
        <div className="boot-content">
          <div className="boot-logo title-glow">SPACE</div>
          <div className="boot-logo title-glow alt">EDGISTENCE</div>
          <div className="boot-sub">GUMBALL GAMES</div>
          <div className="boot-sub small blink">CLICK / PRESS ANY KEY</div>
        </div>
      </div>
    </div>
  );
}
