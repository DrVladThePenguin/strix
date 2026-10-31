# TTT Simulator

**WWII real-time tactical command simulator** — React + Vite + Phaser 3.

(Originally developed as *Project Orion*; this repository is the standalone home for the game.)

## Run

```bash
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

## Publish to GitHub

If this folder is not yet its own repository on your account, from this directory:

```bash
gh repo create DrVladThePenguin/ttt-simulator --public --description "WWII tactical command simulator" --source=. --remote=origin --push
```

Or create an empty repo named `ttt-simulator` on GitHub, then:

```bash
git remote add origin https://github.com/DrVladThePenguin/ttt-simulator.git
git push -u origin main
```
