import { useOrionStore } from '../stores/orionStore';
import { PhaserBattlefield } from '../game/PhaserBattlefield';
import type { InfantryOrderType } from '../types/game';
import { FACTIONS } from '../data/factions';
import { GAME_MODES } from '../data/gameModes';
import './GameScreen.css';

const INFANTRY_ORDERS: { id: InfantryOrderType; label: string; phase: number }[] = [
  { id: 'move', label: 'Move', phase: 1 },
  { id: 'attack', label: 'Attack', phase: 2 },
  { id: 'suppress', label: 'Suppress', phase: 2 },
  { id: 'defend', label: 'Defend', phase: 2 },
  { id: 'hold', label: 'Hold Position', phase: 2 },
  { id: 'retreat', label: 'Retreat', phase: 2 },
  { id: 'flank', label: 'Flank', phase: 2 },
  { id: 'cover', label: 'Take Cover', phase: 2 },
  { id: 'entrench', label: 'Entrench', phase: 2 },
  { id: 'patrol', label: 'Patrol', phase: 2 },
  { id: 'capture', label: 'Capture', phase: 2 },
  { id: 'follow', label: 'Follow', phase: 2 },
  { id: 'overwatch', label: 'Overwatch', phase: 2 },
];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GameScreen() {
  const operation = useOrionStore((s) => s.operation);
  const formations = useOrionStore((s) => s.formations);
  const selectedIds = useOrionStore((s) => s.selectedFormationIds);
  const pendingOrder = useOrionStore((s) => s.pendingOrder);
  const paused = useOrionStore((s) => s.paused);
  const gameSpeed = useOrionStore((s) => s.gameSpeed);
  const battleTime = useOrionStore((s) => s.battleTime);
  const events = useOrionStore((s) => s.events);
  const setScreen = useOrionStore((s) => s.setScreen);
  const selectFormation = useOrionStore((s) => s.selectFormation);
  const setPendingOrder = useOrionStore((s) => s.setPendingOrder);
  const setPaused = useOrionStore((s) => s.setPaused);
  const setGameSpeed = useOrionStore((s) => s.setGameSpeed);

  if (!operation) return null;

  const platoonGroups = groupByPlatoon(formations);
  const modeName = GAME_MODES.find((m) => m.id === operation.mode)?.name ?? operation.mode;

  return (
    <div className="game-screen">
      <header className="game-topbar">
        <div className="game-topbar__left">
          <button type="button" className="mil-btn mil-btn--small" onClick={() => setScreen('menu')}>
            HQ
          </button>
          <span className="game-topbar__op">{operation.operationName}</span>
          <span className="game-topbar__meta">{FACTIONS[operation.faction].shortName} · {modeName}</span>
        </div>
        <div className="game-topbar__center">
          <span>BATTLE TIME {formatTime(battleTime)}</span>
        </div>
        <div className="game-topbar__right">
          <span className="resource">MP: 100%</span>
          <span className="resource">Ammo: 85%</span>
          <span className="resource">Reinf: 3</span>
          <button type="button" className="mil-btn mil-btn--small" onClick={() => setPaused(!paused)}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <select
            className="speed-select"
            value={gameSpeed}
            onChange={(e) => setGameSpeed(Number(e.target.value))}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </div>
      </header>

      <div className="game-body">
        <aside className="panel panel--left">
          <h2 className="panel__title">Unit Organisation</h2>
          <div className="org-tree">
            <div className="org-node org-node--hq">COMPANY HEADQUARTERS</div>
            {Object.entries(platoonGroups).map(([platoonId, squads]) => (
              <div key={platoonId} className="org-platoon">
                <div className="org-node org-node--platoon">{platoonLabel(platoonId)}</div>
                {squads.map((sq) => (
                  <button
                    key={sq.id}
                    type="button"
                    className={`org-squad ${selectedIds.includes(sq.id) ? 'org-squad--selected' : ''}`}
                    onClick={() => selectFormation(sq.id)}
                  >
                    <span className="org-squad__name">{sq.name}</span>
                    <span className="org-squad__stats">
                      {sq.strength}/{sq.maxStrength} · {sq.order.slice(0, 28)}
                    </span>
                    <span className="org-squad__bars">
                      HP {sq.healthPct}% · Ammo {sq.ammoPct}% · Morale {sq.morale}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <main className="battlefield-wrap">
          <div id="orion-phaser-root" className="battlefield-canvas" />
          <PhaserBattlefield parentId="orion-phaser-root" />
          {pendingOrder === 'move' && (
            <div className="order-hint">MOVE: Click destination on the battlefield</div>
          )}
          <div className="coord-overlay">Grid ref · Scroll zoom · Right-drag pan · Box select</div>
        </main>

        <aside className="panel panel--right">
          <h2 className="panel__title">Command Interface</h2>
          {selectedIds.length === 0 ? (
            <p className="panel__empty">Select a formation to issue orders.</p>
          ) : (
            <>
              <p className="panel__selection">
                {selectedIds.length} formation(s) selected
              </p>
              <div className="order-grid">
                {INFANTRY_ORDERS.map((o) => {
                  const enabled = o.phase <= 1;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={!enabled}
                      className={`order-btn ${pendingOrder === o.id ? 'order-btn--active' : ''}`}
                      title={enabled ? undefined : `Available in Phase ${o.phase}`}
                      onClick={() => enabled && setPendingOrder(o.id === pendingOrder ? null : o.id)}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </aside>
      </div>

      <footer className="game-log">
        <h2 className="panel__title">Battlefield Log</h2>
        <ul className="log-list">
          {events.slice(0, 12).map((e) => (
            <li key={e.id} className={`log-entry log-entry--${e.category}`}>
              <span className="log-time">[{formatTime(e.time)}]</span> {e.message}
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}

function groupByPlatoon(formations: ReturnType<typeof useOrionStore.getState>['formations']) {
  const map: Record<string, typeof formations> = {};
  for (const f of formations) {
    const pid = f.parentId ?? 'other';
    if (!map[pid]) map[pid] = [];
    map[pid].push(f);
  }
  return map;
}

function platoonLabel(id: string): string {
  const labels: Record<string, string> = {
    p1: '1ST PLATOON',
    p2: '2ND PLATOON',
    support: 'SUPPORT ELEMENT',
  };
  return labels[id] ?? id.toUpperCase();
}
