# Project Orion — Development Log

## Phase 1 — Core Foundation (v0.1.0)

### Implemented
- **Architecture:** `orion/` app with React 19 (menus, panels) + Phaser 3 (battlefield), Zustand game state, `GameBridge` for UI ↔ simulation events.
- **Main menu:** WWII headquarters theme, animated operations map background, navigation entries.
- **Operation setup:** Faction pairing, seven game modes, four difficulties, six battlefields, operation naming and briefing.
- **Game screen:** Top bar (time, resources, pause, speed), left organisation tree, right contextual orders, bottom radio/log panel.
- **Battlefield:** Procedural pixel terrain (4800×3600 world), friendly and enemy squads with **individual soldier sprites** (10 soldiers per rifle squad, etc.).
- **Camera:** Mouse-wheel zoom, right/middle-button drag pan, grid coordinate HUD.
- **Selection:** Click soldier/squad, drag box multi-select, panel selection with camera focus.
- **Commands:** Contextual infantry order grid; **Move** and **Take Cover** wired to squad AI; other orders shown as “Soon”.
- **Infantry AI (basic):** A* pathfinding on terrain cost grid, per-soldier path following, formation offsets on move orders, squad cohesion markers.
- **Modules stubbed for later phases:** `Pathfinding`, `TerrainMap`, `Soldier`, `Squad`, `BattlefieldScene`, data layers for factions/modes/maps.

### Functional (tested)
- `npm run build` succeeds.
- Dev server runs (`npm run dev` in `orion/`).
- Move order flow: select squad → Move → click map → soldiers pathfind and animate movement.

### Incomplete (by design — later phases)
- Combat, suppression, casualties, morale effects
- Tanks, aircraft, artillery, mortars
- Fog of war, enemy commander AI, resources/reinforcements logic
- Game mode victory conditions (UI/config only in Phase 1)
- Entrench, attack, patrol, and remaining order implementations
- Audio, advanced pixel art, historical scenarios

### Bugs discovered
- None blocking in local build; browser QA pending full manual pass.
- Performance: full terrain tile sprites (150×112) — acceptable for Phase 1; optimise in Phase 6.

### Next (Phase 2 — Infantry Simulation)
- Weapon firing, line of sight, damage, suppression
- Cover-seeking behaviour, casualties, morale
- Attack/defend/hold order AI
- Objective markers and capture logic foundations
