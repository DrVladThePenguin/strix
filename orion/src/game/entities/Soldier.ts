import Phaser from 'phaser';
import type { FactionDefinition } from '../../data/factions';

export interface SoldierSim {
  id: string;
  squadId: string;
  x: number;
  y: number;
  facing: number;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  morale: number;
  speed: number;
  runSpeed: number;
  combatState: 'idle' | 'moving' | 'shooting' | 'reloading' | 'casualty';
  stance: 'standing' | 'crouching' | 'prone' | 'running';
  path: { x: number; y: number }[];
  pathIndex: number;
  sprite: Phaser.GameObjects.Container;
  isEnemy: boolean;
}

const SOLDIER_W = 6;
const SOLDIER_H = 10;

export function createSoldierSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  faction: FactionDefinition,
  isEnemy: boolean,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const body = scene.add.rectangle(0, 0, SOLDIER_W, SOLDIER_H, faction.uniformColor);
  body.setStrokeStyle(1, isEnemy ? 0x8b2020 : 0x2a3a20);
  const helmet = scene.add.rectangle(0, -4, SOLDIER_W + 1, 3, faction.helmetColor);
  const weapon = scene.add.rectangle(3, 1, 5, 1, 0x2a2a2a);
  weapon.setAngle(0);
  container.add([body, helmet, weapon]);
  container.setDepth(y);
  return container;
}

export function updateSoldierVisual(sim: SoldierSim): void {
  sim.sprite.setPosition(sim.x, sim.y);
  sim.sprite.setDepth(sim.y);
  const weapon = sim.sprite.list[2] as Phaser.GameObjects.Rectangle;
  weapon.setAngle(Phaser.Math.RadToDeg(sim.facing));
  const body = sim.sprite.list[0] as Phaser.GameObjects.Rectangle;
  if (sim.combatState === 'casualty') {
    body.setFillStyle(0x3a2020);
    sim.sprite.setAngle(90);
  } else if (sim.stance === 'crouching') {
    sim.sprite.setScale(1, 0.75);
  } else if (sim.stance === 'running') {
    sim.sprite.setScale(1.05, 1);
  } else {
    sim.sprite.setScale(1, 1);
    sim.sprite.setAngle(0);
  }
}

export function tickSoldierMovement(sim: SoldierSim, dt: number): boolean {
  if (sim.combatState === 'casualty') return false;
  if (sim.path.length === 0 || sim.pathIndex >= sim.path.length) {
    sim.combatState = 'idle';
    sim.stance = 'standing';
    return false;
  }

  const target = sim.path[sim.pathIndex];
  const dx = target.x - sim.x;
  const dy = target.y - sim.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 4) {
    sim.pathIndex++;
    if (sim.pathIndex >= sim.path.length) {
      sim.combatState = 'idle';
      sim.stance = 'standing';
      return false;
    }
    return true;
  }

  sim.combatState = 'moving';
  sim.stance = dist > 80 ? 'running' : 'standing';
  const spd = sim.stance === 'running' ? sim.runSpeed : sim.speed;
  sim.facing = Math.atan2(dy, dx);
  const step = spd * dt;
  sim.x += (dx / dist) * step;
  sim.y += (dy / dist) * step;
  updateSoldierVisual(sim);
  return true;
}

export function assignSoldierPath(
  sim: SoldierSim,
  path: { x: number; y: number }[],
  slotOffset: { x: number; y: number },
): void {
  if (path.length === 0) return;
  const dest = path[path.length - 1];
  const offsetPath = path.map((p, i) => {
    if (i < path.length - 1) return { x: p.x, y: p.y };
    return { x: dest.x + slotOffset.x, y: dest.y + slotOffset.y };
  });
  sim.path = offsetPath;
  sim.pathIndex = 0;
  sim.combatState = 'moving';
}

/** Formation offsets for squad cohesion at destination */
export function squadSlotOffset(index: number, total: number): { x: number; y: number } {
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    x: (col - (cols - 1) / 2) * 14,
    y: (row - Math.floor(total / cols) / 2) * 16,
  };
}
