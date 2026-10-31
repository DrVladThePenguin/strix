import { useOrionStore } from '../stores/orionStore';
import './MainMenu.css';

export function MainMenu() {
  const setScreen = useOrionStore((s) => s.setScreen);

  return (
    <div className="main-menu">
      <div className="main-menu__map-bg" aria-hidden />
      <div className="main-menu__overlay" />
      <header className="main-menu__header">
        <p className="main-menu__theatre">PROJECT ORION — TACTICAL COMMAND</p>
        <h1 className="main-menu__title">HEADQUARTERS</h1>
        <p className="main-menu__subtitle">WWII Real-Time Tactical Command Simulator</p>
      </header>
      <nav className="main-menu__nav">
        <button type="button" className="mil-btn mil-btn--primary" onClick={() => setScreen('setup')}>
          New Operation
        </button>
        <button type="button" className="mil-btn" disabled title="Available when a save exists">
          Continue Operation
        </button>
        <button type="button" className="mil-btn" disabled title="Phase 6">
          Historical Battles
        </button>
        <button type="button" className="mil-btn" disabled title="Phase 5">
          Army Organisation
        </button>
        <button type="button" className="mil-btn" disabled title="Phase 5">
          Field Intelligence
        </button>
        <button type="button" className="mil-btn" disabled title="Phase 6">
          Settings
        </button>
      </nav>
      <footer className="main-menu__footer">
        <span className="stamp">RESTRICTED — EYES ONLY</span>
        <span>Phase 1 — Core Foundation</span>
      </footer>
    </div>
  );
}
