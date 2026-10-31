# Project Orion

WWII real-time tactical command simulator — React + Vite + Phaser 3.

## Run

```bash
cd orion
npm install
npm run dev
```

Open the local URL shown in the terminal (default port 5173).

## Architecture

- `src/ui/` — React menus and command panels
- `src/game/` — Phaser battlefield, entities, pathfinding, terrain
- `src/stores/` — Zustand bridge between UI and simulation
- `src/data/` — Factions, battlefields, game modes

See `DEVELOPMENT_LOG.md` for phase progress.
