import { useEffect } from 'react';
import { GameProvider, useGame } from './state/GameContext';
import { useInput } from './engine/useInput';
import { useAudio } from './engine/useAudio';
import { BootScreen } from './shell/BootScreen';
import { MainMenu } from './shell/MainMenu';
import { Cutscene } from './shell/Cutscene';
import { GameShell } from './shell/GameShell';
import { GameOverScreen } from './shell/GameOverScreen';
import { GAME_COMPONENTS } from './games/registry';
import './styles/fonts.css';
import './styles/crt.css';

function Router() {
  const { screen, activeGame, settings, goToMenu } = useGame();
  useInput(); // install global keyboard listeners once
  useAudio(); // unlock audio on first gesture

  const GameComponent = activeGame ? GAME_COMPONENTS[activeGame] : undefined;

  // If a game screen is requested but no component exists, bounce to menu.
  useEffect(() => {
    if (screen === 'playing' && !GameComponent) goToMenu();
  }, [screen, GameComponent, goToMenu]);

  return (
    <>
      {screen === 'boot' && <BootScreen />}
      {screen === 'menu' && <MainMenu />}
      {screen === 'cutscene' && <Cutscene />}
      {screen === 'playing' && GameComponent && (
        <GameShell key={activeGame} GameComponent={GameComponent} />
      )}
      {screen === 'gameover' && <GameOverScreen />}

      <div className={`crt-overlay ${settings.crt ? '' : 'off'}`} />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Router />
    </GameProvider>
  );
}
