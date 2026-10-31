import type { OperationConfig, SquadType } from '../../types/game';
import { FACTIONS } from '../../data/factions';
import { BATTLEFIELDS } from '../../data/battlefields';
import { Pathfinder } from '../systems/Pathfinder';
import {
  assignSoldierPath,
  createSoldierSprite,
  squadSlotOffset,
  tickSoldierMovement,
  type SoldierSim,
} from '../entities/Soldier';
import type Phaser from 'phaser';

export interface SquadSim {
  id: string;
  name: string;
  type: SquadType;
  platoonId: string;
  soldiers: SoldierSim[];
  currentOrderLabel: string;
  isEnemy: boolean;
  selected: boolean;
}

const SQUAD_SIZE: Record<SquadType, number> = {
  rifle: 9,
  assault: 8,
  mg: 6,
  anti_tank: 5,
  recon: 4,
  engineer: 6,
  medic: 3,
  mortar: 4,
};

export function buildInitialSquads(
  scene: Phaser.Scene,
  operation: OperationConfig,
): { squads: SquadSim[]; pathfinder: Pathfinder } {
  const bf = BATTLEFIELDS[operation.battlefield];
  const pathfinder = new Pathfinder(bf.width, bf.height, 32);

  const playerFaction = FACTIONS[operation.faction];
  const enemyFaction = FACTIONS[operation.enemyFaction];

  const squads: SquadSim[] = [];
  const playerSquads: { name: string; type: SquadType; platoonId: string; px: number; py: number }[] = [
    { name: '1st Rifle Squad', type: 'rifle', platoonId: 'p1', px: 800, py: bf.height / 2 - 120 },
    { name: '2nd Rifle Squad', type: 'rifle', platoonId: 'p1', px: 880, py: bf.height / 2 - 80 },
    { name: '3rd Rifle Squad', type: 'rifle', platoonId: 'p1', px: 960, py: bf.height / 2 - 40 },
    { name: '4th Rifle Squad', type: 'rifle', platoonId: 'p2', px: 820, py: bf.height / 2 + 40 },
    { name: '5th Rifle Squad', type: 'rifle', platoonId: 'p2', px: 900, py: bf.height / 2 + 80 },
    { name: '6th Rifle Squad', type: 'rifle', platoonId: 'p2', px: 980, py: bf.height / 2 + 120 },
    { name: 'MG Squad', type: 'mg', platoonId: 'support', px: 720, py: bf.height / 2 },
    { name: 'Recon Section', type: 'recon', platoonId: 'support', px: 1100, py: bf.height / 2 - 200 },
  ];

  for (const def of playerSquads) {
    squads.push(createSquad(scene, def.name, def.type, def.platoonId, def.px, def.py, playerFaction, false));
  }

  const enemyDefs = [
    { name: 'Enemy Rifle Squad A', type: 'rifle' as SquadType, px: bf.width - 900, py: bf.height / 2 - 100 },
    { name: 'Enemy Rifle Squad B', type: 'rifle' as SquadType, px: bf.width - 820, py: bf.height / 2 + 60 },
    { name: 'Enemy MG Team', type: 'mg' as SquadType, px: bf.width - 750, py: bf.height / 2 },
  ];

  for (const def of enemyDefs) {
    squads.push(createSquad(scene, def.name, def.type, 'enemy-p1', def.px, def.py, enemyFaction, true));
  }

  return { squads, pathfinder };
}

function createSquad(
  scene: Phaser.Scene,
  name: string,
  type: SquadType,
  platoonId: string,
  cx: number,
  cy: number,
  faction: (typeof FACTIONS)[keyof typeof FACTIONS],
  isEnemy: boolean,
): SquadSim {
  const count = SQUAD_SIZE[type];
  const soldiers: SoldierSim[] = [];
  const id = `squad-${name.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`;

  for (let i = 0; i < count; i++) {
    const off = squadSlotOffset(i, count);
    const sx = cx + off.x;
    const sy = cy + off.y;
    const soldierId = `${id}-soldier-${i}`;
    const sprite = createSoldierSprite(scene, sx, sy, faction, isEnemy);
    soldiers.push({
      id: soldierId,
      squadId: id,
      x: sx,
      y: sy,
      facing: isEnemy ? Math.PI : 0,
      health: 100,
      maxHealth: 100,
      ammo: 80,
      maxAmmo: 80,
      morale: 85,
      speed: 28,
      runSpeed: 52,
      combatState: 'idle',
      stance: 'standing',
      path: [],
      pathIndex: 0,
      sprite,
      isEnemy,
    });
  }

  return {
    id,
    name,
    type,
    platoonId,
    soldiers,
    currentOrderLabel: 'Awaiting orders',
    isEnemy,
    selected: false,
  };
}

export function orderSquadMove(
  squad: SquadSim,
  destX: number,
  destY: number,
  pathfinder: Pathfinder,
): void {
  squad.currentOrderLabel = `Moving to ${Math.round(destX)}, ${Math.round(destY)}`;
  const n = squad.soldiers.length;
  squad.soldiers.forEach((soldier, i) => {
    if (soldier.combatState === 'casualty') return;
    const path = pathfinder.findPath(soldier.x, soldier.y, destX, destY);
    assignSoldierPath(soldier, path, squadSlotOffset(i, n));
  });
}

export function updateSquads(squads: SquadSim[], dt: number): void {
  for (const squad of squads) {
    for (const soldier of squad.soldiers) {
      tickSoldierMovement(soldier, dt);
    }
  }
}

export function getSquadById(squads: SquadSim[], id: string): SquadSim | undefined {
  return squads.find((s) => s.id === id);
}

export function squadsToFormationSummaries(squads: SquadSim[], _selectedIds: string[]) {
  return squads
    .filter((s) => !s.isEnemy)
    .map((s) => {
      const alive = s.soldiers.filter((x) => x.combatState !== 'casualty').length;
      const total = s.soldiers.length;
      const ammoSum = s.soldiers.reduce((a, x) => a + x.ammo, 0);
      const ammoMax = s.soldiers.reduce((a, x) => a + x.maxAmmo, 0);
      const morale = s.soldiers.reduce((a, x) => a + x.morale, 0) / total;
      return {
        id: s.id,
        name: s.name,
        kind: 'squad' as const,
        parentId: s.platoonId,
        strength: alive,
        maxStrength: total,
        order: s.currentOrderLabel,
        healthPct: Math.round((alive / total) * 100),
        ammoPct: Math.round((ammoSum / ammoMax) * 100),
        morale: Math.round(morale),
        available: alive > 0,
      };
    });
}
