import { useGameStore } from './store/gameStore';
import { MainMenu } from './ui/screens/MainMenu';
import { OperationSetup } from './ui/screens/OperationSetup';
import { GameScreen } from './ui/screens/GameScreen';
import './styles/global.css';

function App() {
  const screen = useGameStore((s) => s.screen);

  if (screen === 'setup') return <OperationSetup />;
  if (screen === 'game') return <GameScreen />;
  return <MainMenu />;
}

export default App;
