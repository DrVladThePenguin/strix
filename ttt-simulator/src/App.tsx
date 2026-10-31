import { useOrionStore } from './stores/orionStore';
import { MainMenu } from './ui/MainMenu';
import { OperationSetup } from './ui/OperationSetup';
import { GameScreen } from './ui/GameScreen';
import './App.css';

function App() {
  const screen = useOrionStore((s) => s.screen);

  return (
    <>
      {screen === 'menu' && <MainMenu />}
      {screen === 'setup' && <OperationSetup />}
      {screen === 'game' && <GameScreen />}
    </>
  );
}

export default App;
