## Phase 1 — Core Foundation (2026-10-31)

### Implemented
- **Stack:** TypeScript, React, Vite, Phaser 3, Zustand under `/workspace/orion`
- **Main menu:** WWII HQ-themed screen with navigation (New Operation active)
- **Operation setup:** Faction, game mode, difficulty, battlefield picker, operation name
- **Game screen:** Top bar, left unit organisation tree, right contextual command panel, bottom event log
- **Battlefield:** Large scrollable 2D map with procedural terrain (forests, buildings, hedgerows, roads, grid)
- **Camera:** Mouse wheel zoom, right-drag pan, WASD pan, box selection
- **Soldiers:** Each squad member is an independent entity with position, facing, health, ammo, morale, pathing
- **Selection:** Click squad on map or org panel; multi-select via shift or drag box
- **Orders:** MOVE order — click destination; squads pathfind and advance in formation slots
- **Data:** Four factions, six battlefields, seven game modes, four difficulties (UI wired; rules Phase 5)

### Functional
- Playable loop: Menu → Setup → Battlefield with ~70+ individually rendered soldiers (friendly + enemy)
- MOVE orders update radio log and squad status; soldiers animate movement with run/walk stance
- Pause and game speed (0.5×–4×) affect simulation time

### Incomplete (Phase 1 scope gaps / later phases)
- Continue save, Historical Battles menu routes, Army Organisation, Field Intelligence, Settings
- All infantry orders except MOVE (UI placeholders through Phase 2)
- Tanks, aircraft, artillery, mortars, fog of war, enemy commander AI, game mode victory rules
- Minimap viewport indicator polish; control groups; tactical overlays
- Pixel-art asset pipeline (currently procedural rectangle sprites)

### Bugs discovered
- Buildings block pathfinding; squads may route around structures (expected)
- Left-click drag starts selection even on short clicks (minor)

### Next — Phase 2
- Weapon firing, combat, suppression, cover, casualties, morale
- Remaining infantry orders with real AI
- Squad cohesion improvements and enemy engagement
