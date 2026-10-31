import { useGameStore } from '../../store/gameStore';

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function TopBar() {
  const operation = useGameStore((s) => s.operation);
  const battleTimeSec = useGameStore((s) => s.battleTimeSec);
  const matchTimerSec = useGameStore((s) => s.matchTimerSec);
  const paused = useGameStore((s) => s.paused);
  const gameSpeed = useGameStore((s) => s.gameSpeed);
  const manpower = useGameStore((s) => s.manpower);
  const reinforcements = useGameStore((s) => s.reinforcements);
  const setPaused = useGameStore((s) => s.setPaused);
  const setGameSpeed = useGameStore((s) => s.setGameSpeed);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <header className="top-bar">
      <div className="top-left">
        <button type="button" className="link-btn" onClick={() => setScreen('menu')}>
          HQ
        </button>
        <strong>{operation.name}</strong>
        <span className="muted">
          {operation.mode.toUpperCase()} · {operation.battlefield.replace('_', ' ')}
        </span>
      </div>
      <div className="top-center">
        <span>Time {formatTime(battleTimeSec)}</span>
        <span>Elapsed {formatTime(matchTimerSec)}</span>
        <span>MP {manpower}</span>
        <span>Reinforcements {reinforcements}</span>
      </div>
      <div className="top-right">
        <button type="button" className={paused ? 'chip active' : 'chip'} onClick={() => setPaused(!paused)}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            type="button"
            className={gameSpeed === s ? 'chip active' : 'chip'}
            onClick={() => setGameSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </header>
  );
}
