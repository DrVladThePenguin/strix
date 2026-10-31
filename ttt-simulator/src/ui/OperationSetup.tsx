import { useState } from 'react';
import type { BattlefieldId, DifficultyId, FactionId, GameModeId } from '../types/game';
import { FACTION_LIST } from '../data/factions';
import { BATTLEFIELD_LIST } from '../data/battlefields';
import { GAME_MODES, DIFFICULTIES } from '../data/gameModes';
import { useOrionStore } from '../stores/orionStore';
import './OperationSetup.css';

const ENEMY_BY_FACTION: Record<FactionId, FactionId> = {
  usa: 'germany',
  britain: 'germany',
  soviet: 'germany',
  germany: 'usa',
};

export function OperationSetup() {
  const setScreen = useOrionStore((s) => s.setScreen);
  const setOperation = useOrionStore((s) => s.setOperation);

  const [faction, setFaction] = useState<FactionId>('usa');
  const [mode, setMode] = useState<GameModeId>('conquest');
  const [difficulty, setDifficulty] = useState<DifficultyId>('regular');
  const [battlefield, setBattlefield] = useState<BattlefieldId>('normandy');
  const [operationName, setOperationName] = useState('Operation Overwatch');

  const bf = BATTLEFIELD_LIST.find((b) => b.id === battlefield)!;

  const launch = () => {
    setOperation({
      faction,
      enemyFaction: ENEMY_BY_FACTION[faction],
      mode,
      difficulty,
      battlefield,
      operationName,
    });
    setScreen('game');
  };

  return (
    <div className="op-setup">
      <header className="op-setup__header">
        <button type="button" className="mil-btn mil-btn--small" onClick={() => setScreen('menu')}>
          ← HQ
        </button>
        <h1>Operation Planning</h1>
      </header>
      <div className="op-setup__grid">
        <section className="op-panel">
          <h2>Faction</h2>
          <div className="op-options">
            {FACTION_LIST.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`op-chip ${faction === f.id ? 'op-chip--active' : ''}`}
                onClick={() => setFaction(f.id)}
              >
                {f.shortName}
              </button>
            ))}
          </div>
          <p className="op-hint">Opposing force: {FACTION_LIST.find((x) => x.id === ENEMY_BY_FACTION[faction])?.name}</p>
        </section>

        <section className="op-panel">
          <h2>Game Mode</h2>
          <select value={mode} onChange={(e) => setMode(e.target.value as GameModeId)} className="op-select">
            {GAME_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="op-desc">{GAME_MODES.find((m) => m.id === mode)?.description}</p>
        </section>

        <section className="op-panel">
          <h2>Difficulty</h2>
          <div className="op-options">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`op-chip ${difficulty === d.id ? 'op-chip--active' : ''}`}
                onClick={() => setDifficulty(d.id)}
              >
                {d.name}
              </button>
            ))}
          </div>
        </section>

        <section className="op-panel op-panel--wide">
          <h2>Battlefield</h2>
          <div className="battlefield-picker">
            {BATTLEFIELD_LIST.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`bf-card ${battlefield === b.id ? 'bf-card--active' : ''}`}
                onClick={() => setBattlefield(b.id)}
              >
                <span className="bf-card__name">{b.name}</span>
                <span className="bf-card__region">{b.region}</span>
              </button>
            ))}
          </div>
          <p className="op-desc">{bf.description}</p>
        </section>

        <section className="op-panel">
          <h2>Operation Name</h2>
          <input
            className="op-input"
            value={operationName}
            onChange={(e) => setOperationName(e.target.value)}
            maxLength={48}
          />
        </section>
      </div>
      <footer className="op-setup__footer">
        <button type="button" className="mil-btn mil-btn--primary" onClick={launch}>
          Commence Operation
        </button>
      </footer>
    </div>
  );
}
