import { useMemo, useState } from 'react';
import { BATTLEFIELDS } from '../../data/battlefields';
import { FACTION_LIST } from '../../data/factions';
import { GAME_MODES } from '../../data/gameModes';
import { useGameStore } from '../../store/gameStore';
import type { BattlefieldId, DifficultyId, FactionId, GameModeId } from '../../types/game';

const STEPS = ['Faction', 'Mode & Difficulty', 'Battlefield', 'Briefing'];

const DIFFICULTIES: { id: DifficultyId; label: string }[] = [
  { id: 'recruit', label: 'Recruit' },
  { id: 'regular', label: 'Regular' },
  { id: 'veteran', label: 'Veteran' },
  { id: 'elite', label: 'Elite' },
];

export function OperationSetup() {
  const operation = useGameStore((s) => s.operation);
  const patchOperation = useGameStore((s) => s.patchOperation);
  const startOperation = useGameStore((s) => s.startOperation);
  const setScreen = useGameStore((s) => s.setScreen);
  const [step, setStep] = useState(0);

  const battlefield = useMemo(
    () => BATTLEFIELDS.find((b) => b.id === operation.battlefield) ?? BATTLEFIELDS[0],
    [operation.battlefield],
  );

  return (
    <div className="screen setup-screen">
      <div className="setup-panel">
        <button type="button" className="link-btn" onClick={() => setScreen('menu')}>
          ← Return to Headquarters
        </button>
        <h1>Operation Setup</h1>
        <div className="step-tabs">
          {STEPS.map((label, i) => (
            <span key={label} className={i === step ? 'step active' : 'step'}>
              {i + 1}. {label}
            </span>
          ))}
        </div>

        {step === 0 && (
          <section className="setup-section">
            <h2>Faction Selection</h2>
            <div className="card-grid">
              {FACTION_LIST.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={operation.playerFaction === f.id ? 'card selected' : 'card'}
                  onClick={() => patchOperation({ playerFaction: f.id as FactionId })}
                >
                  <strong>{f.name}</strong>
                  <p>{f.description}</p>
                </button>
              ))}
            </div>
            <h3>Opposing Force</h3>
            <div className="chip-row">
              {FACTION_LIST.filter((f) => f.id !== operation.playerFaction).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={operation.enemyFaction === f.id ? 'chip active' : 'chip'}
                  onClick={() => patchOperation({ enemyFaction: f.id as FactionId })}
                >
                  {f.shortName}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="setup-section">
            <h2>Game Mode</h2>
            <div className="card-grid modes">
              {GAME_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={operation.mode === m.id ? 'card selected' : 'card'}
                  onClick={() => patchOperation({ mode: m.id as GameModeId })}
                >
                  <strong>{m.name}</strong>
                  <p>{m.description}</p>
                </button>
              ))}
            </div>
            <h3>Difficulty</h3>
            <div className="chip-row">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={operation.difficulty === d.id ? 'chip active' : 'chip'}
                  onClick={() => patchOperation({ difficulty: d.id })}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="setup-section">
            <h2>Battlefield Selection</h2>
            <div className="card-grid battlefields">
              {BATTLEFIELDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={operation.battlefield === b.id ? 'card selected' : 'card'}
                  onClick={() => patchOperation({ battlefield: b.id as BattlefieldId })}
                >
                  <strong>
                    {b.name}, {b.region}
                  </strong>
                  <p>{b.description}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="setup-section">
            <h2>Operation Briefing</h2>
            <label className="field">
              Operation name
              <input
                value={operation.name}
                onChange={(e) => patchOperation({ name: e.target.value })}
              />
            </label>
            <div className="briefing-sheet">
              <p>
                <strong>Allied faction:</strong> {operation.playerFaction.toUpperCase()}
              </p>
              <p>
                <strong>Enemy:</strong> {operation.enemyFaction.toUpperCase()}
              </p>
              <p>
                <strong>Mode:</strong> {operation.mode}
              </p>
              <p>
                <strong>Difficulty:</strong> {operation.difficulty}
              </p>
              <p>
                <strong>Theatre:</strong> {battlefield.name} — {battlefield.description}
              </p>
            </div>
          </section>
        )}

        <div className="setup-actions">
          <button type="button" className="secondary-btn" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Previous
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="primary-btn" onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button type="button" className="primary-btn" onClick={() => startOperation()}>
              Commence Operation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
