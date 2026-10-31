# Project Orion — Development Log

## Phase 1 — Core Foundation (v0.1.0) ✓

Main menu, operation setup, Phaser battlefield, individual soldiers, selection, move orders, basic pathfinding.

## Phase 2 — Infantry Simulation (v0.3.0) ✓

### Implemented
- Weapon profiles per faction (`data/weapons.ts`) with ROF, damage, range, reload, suppression
- Line of sight (terrain blocking forests, hedgerows, buildings, water)
- Hitscan combat with cover reducing accuracy and damage
- Suppression meter — pinned soldiers crawl/prone and fire less effectively
- Casualties — individual death, morale shock to squad, log entries
- Squad orders: **attack, suppress, defend, hold, retreat, cover, capture, overwatch** (flank/patrol UI pending)
- Cover seeking via terrain cover map
- Capture objectives (3 zones) with progressive ownership
- Basic enemy commander AI (attack/suppress, armour advance)
- Live formation status sync (strength, HP, ammo, morale, orders)

### Functional
- Firefights between US and German squads with tracers and muzzle flashes
- Suppression and casualties affect behaviour
- Capture zones change colour when dominated by infantry presence

### Incomplete
- Entrench, patrol, flank pathing logic
- Medic/engineer teams
- Full morale-driven rout

## Phase 3 — Armoured Warfare (v0.3.0) ✓

### Implemented
- Faction medium tanks (Sherman, Panzer IV, T-34, Cromwell stats in `data/vehicles.ts`)
- **1st Tank Platoon** (player) and enemy panzer platoon — individual hull + turret sprites
- Hull movement with pathfinding, turret tracking, cannon reload
- Directional armour (front/side/rear) vs shell penetration
- Visible shell projectiles, impacts, knock-out explosions
- Tank command panel: move, engage armour (attack), suppress, defend, hold, retreat, overwatch
- Tanks engage infantry and enemy armour

### Incomplete
- Separate engage-infantry vs ambush/flank orders
- Track/engine damage modules
- M18/M10/Tiger/etc. full roster

## Next — Phase 4 (Support Systems)

Mortars, artillery barrages, aircraft, smoke, recon reveals.

### Bugs
- None blocking build (`npm run build` clean as of v0.3.0)
