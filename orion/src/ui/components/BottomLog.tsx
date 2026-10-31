import { useGameStore } from '../../store/gameStore';

export function BottomLog() {
  const log = useGameStore((s) => s.log);

  return (
    <footer className="bottom-panel">
      <h3>Battlefield Log</h3>
      <ul className="log-list">
        {log.slice(0, 12).map((entry) => (
          <li key={entry.id}>
            <span className="log-time">{entry.time}</span>
            <span className={`log-cat ${entry.category}`}>{entry.category}</span>
            <span>{entry.message}</span>
          </li>
        ))}
      </ul>
    </footer>
  );
}
