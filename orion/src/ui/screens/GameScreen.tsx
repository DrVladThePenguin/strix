import { PhaserCanvas } from '../components/PhaserCanvas';
import { UnitOrganisationPanel } from '../components/UnitOrganisationPanel';
import { CommandPanel } from '../components/CommandPanel';
import { TopBar } from '../components/TopBar';
import { BottomLog } from '../components/BottomLog';
import { useGameStore } from '../../store/gameStore';

export function GameScreen() {
  const operation = useGameStore((s) => s.operation);

  return (
    <div className="screen game-screen">
      <TopBar />
      <div className="game-layout">
        <UnitOrganisationPanel />
        <div className="battlefield-wrap">
          <PhaserCanvas operation={operation} active />
          <div className="map-hint">
            Wheel: zoom · Right-drag: pan · Box-select · Move order: select squad → Move → click
          </div>
        </div>
        <CommandPanel />
      </div>
      <BottomLog />
    </div>
  );
}
