import { useState } from 'react';
import { useGame } from '../state/GameContext';
import { playSfx } from '../engine/useAudio';
import { GAME_META, GAME_ORDER, GAME_COMPONENTS } from '../games/registry';
import { Leaderboard } from './Leaderboard';
import './menu.css';

export function MainMenu() {
  const { unlocked, startGame, startCutscene, lives, totalScore } = useGame();
  const [showBoard, setShowBoard] = useState(false);

  const isUnlocked = (id: (typeof GAME_ORDER)[number]) =>
    unlocked.includes(id) && !!GAME_COMPONENTS[id];

  return (
    <div className="overlay menu-screen">
      <div className="menu-inner">
        <header className="menu-header">
          <h1 className="title-glow menu-title">SPACE</h1>
          <h1 className="menu-title alt">EDGISTENCE</h1>
          <p className="menu-tag">DIFFICULTY: HARD — LOCKED AT FACTORY</p>
        </header>

        <div className="menu-grid">
          {GAME_ORDER.map((id) => {
            const meta = GAME_META[id];
            const open = isUnlocked(id);
            return (
              <button
                key={id}
                className={`game-card ${open ? '' : 'locked'}`}
                onClick={() => {
                  if (open) {
                    playSfx('select');
                    startGame(id);
                  } else {
                    playSfx('denied');
                  }
                }}
              >
                <span className="card-title">{meta.title}</span>
                <span className="card-sub">{open ? meta.subtitle : 'LOCKED'}</span>
                <span className="card-parody">{meta.parody}</span>
              </button>
            );
          })}
        </div>

        <footer className="menu-footer">
          <div className="menu-stats">
            <span>LIVES {'♥'.repeat(Math.max(0, lives)) || '×'}</span>
            <span>SCORE {String(totalScore).padStart(6, '0')}</span>
          </div>
          <div className="menu-actions">
            <button className="pixel-btn" onClick={() => { playSfx('select'); setShowBoard(true); }}>
              HIGH SCORES
            </button>
            <button className="pixel-btn" onClick={() => { playSfx('select'); startCutscene(); }}>
              REPLAY INTRO
            </button>
          </div>
        </footer>
      </div>

      {showBoard && <Leaderboard onClose={() => setShowBoard(false)} />}
    </div>
  );
}
