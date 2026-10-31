# Project Orion

WWII real-time tactical command simulator — React UI + Phaser 3 battlefield.

## Run locally

```bash
cd orion
npm install
npm run dev
```

Open the URL shown by Vite (default `http://localhost:5173`).

## Phase 1 (v0.1.0)

- Headquarters main menu and operation setup (factions, modes, difficulty, battlefields)
- Scrollable 2D pixel battlefield with procedural terrain
- Individual soldier sprites per squad (not single-squad icons)
- Camera zoom (wheel), pan (right-drag / middle-drag)
- Unit selection (click + box select) and organisation panel
- Contextual command panel with working **Move** orders and pathfinding
- Battle log, pause, and game speed controls

See [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md) for progress.
