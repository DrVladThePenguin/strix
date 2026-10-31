import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

const MENU_ITEMS = [
  { label: 'New Operation', action: 'setup' as const },
  { label: 'Continue Operation', action: 'game' as const, disabled: true },
  { label: 'Historical Battles', action: 'setup' as const },
  { label: 'Army Organisation', action: 'setup' as const },
  { label: 'Field Intelligence', action: 'setup' as const },
  { label: 'Settings', action: 'setup' as const },
];

export function MainMenu() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setScreen = useGameStore((s) => s.setScreen);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const markers = Array.from({ length: 24 }, (_, i) => ({
      x: (i * 137) % 1000,
      y: (i * 89) % 600,
      vx: 0.15 + (i % 5) * 0.05,
      vy: 0.08 + (i % 3) * 0.04,
      faction: i % 2 === 0 ? '#4a6b3a' : '#5c4030',
    }));

    const draw = () => {
      frame += 1;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#2a3224';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#3d4a32';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#1e2418';
      ctx.fillRect(w * 0.55, h * 0.15, w * 0.35, h * 0.55);
      ctx.strokeStyle = '#6b5c4a';
      ctx.strokeRect(w * 0.55, h * 0.15, w * 0.35, h * 0.55);
      ctx.fillStyle = '#8b7355';
      ctx.font = '11px monospace';
      ctx.fillText('OPERATIONS MAP — SECTOR 7', w * 0.57, h * 0.2);

      for (const m of markers) {
        m.x = (m.x + m.vx) % w;
        m.y = (m.y + m.vy) % h;
        ctx.fillStyle = m.faction;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fill();
        if (frame % 60 < 30) {
          ctx.strokeStyle = '#aa8866';
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x + 20, m.y - 12);
          ctx.stroke();
        }
      }

      requestAnimationFrame(draw);
    };
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="screen menu-screen">
      <canvas ref={canvasRef} className="menu-map-bg" width={1200} height={700} />
      <div className="menu-overlay">
        <header className="menu-header">
          <p className="menu-eyebrow">PROJECT ORION — TACTICAL COMMAND</p>
          <h1>Headquarters</h1>
          <p className="menu-subtitle">Real-time WWII combined-arms simulation</p>
        </header>
        <nav className="menu-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className="menu-btn"
              disabled={item.disabled}
              onClick={() => setScreen(item.action === 'setup' ? 'setup' : 'game')}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <footer className="menu-footer">
          <span>CLASSIFICATION: RESTRICTED</span>
          <span>PHASE 1 — CORE FOUNDATION</span>
        </footer>
      </div>
    </div>
  );
}
