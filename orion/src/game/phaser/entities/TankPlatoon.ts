import Phaser from 'phaser';
import type { FactionId, OrderId } from '../../../types/game';
import type { TerrainMapData } from '../systems/TerrainMap';
import { worldToGrid } from '../systems/TerrainMap';
import { findPath } from '../systems/Pathfinding';
import { Tank } from './Tank';
import type { BattleContext } from './BattleContext';

export type TankOrderId =
  | 'move'
  | 'attack'
  | 'suppress'
  | 'defend'
  | 'hold'
  | 'retreat'
  | 'overwatch';

export class TankPlatoon {
  readonly id: string;
  readonly name: string;
  readonly factionId: FactionId;
  readonly friendly: boolean;
  tanks: Tank[] = [];
  marker: Phaser.GameObjects.Ellipse;
  currentOrder: TankOrderId | 'idle' = 'idle';
  orderLabel = 'Awaiting orders';
  orderPoint: { x: number; y: number } | null = null;
  preferArmour = true;
  engage = false;

  constructor(
    scene: Phaser.Scene,
    id: string,
    name: string,
    factionId: FactionId,
    friendly: boolean,
    centerX: number,
    centerY: number,
    count: number,
  ) {
    this.id = id;
    this.name = name;
    this.factionId = factionId;
    this.friendly = friendly;
    for (let i = 0; i < count; i++) {
      this.tanks.push(
        new Tank(scene, `${id}-t${i}`, id, factionId, friendly, centerX + i * 36, centerY + (i % 2) * 20),
      );
    }
    this.marker = scene.add.ellipse(centerX, centerY - 28, 56, 20, friendly ? 0x3d4f2f : 0x5c3030, 0);
    this.marker.setStrokeStyle(1, friendly ? 0x8fbc8f : 0xaa6666, 0.6);
    this.marker.setDepth(5);
  }

  livingTanks(): Tank[] {
    return this.tanks.filter((t) => t.living());
  }

  setSelected(selected: boolean) {
    for (const t of this.tanks) t.setSelected(selected);
    this.marker.setFillStyle(selected ? (this.friendly ? 0x3d4f2f : 0x5c3030) : 0x000000, selected ? 0.35 : 0);
  }

  getCenter() {
    const living = this.livingTanks();
    if (!living.length) return { x: this.marker.x, y: this.marker.y };
    let x = 0;
    let y = 0;
    for (const t of living) {
      x += t.hull.x;
      y += t.hull.y;
    }
    return { x: x / living.length, y: y / living.length };
  }

  statusSnapshot() {
    const living = this.livingTanks();
    const n = Math.max(1, living.length);
    return {
      strength: living.length,
      healthPct: living.reduce((a, t) => a + t.health, 0) / n,
      ammoPct: living.some((t) => t.reloadTimer > 0) ? 40 : 100,
      moralePct: 80,
    };
  }

  issueOrder(map: TerrainMapData, order: OrderId, worldX: number, worldY: number) {
    this.orderPoint = { x: worldX, y: worldY };
    this.preferArmour = order === 'attack';
    this.engage = order === 'attack' || order === 'suppress' || order === 'hold' || order === 'defend' || order === 'overwatch';

    if (order === 'move' || order === 'retreat' || order === 'defend') {
      this.currentOrder = order as TankOrderId;
      this.orderLabel = `${order} — armour column`;
      this.movePlatoon(map, worldX, worldY);
      return;
    }
    if (order === 'attack') {
      this.currentOrder = 'attack';
      this.orderLabel = 'Engaging armour';
      this.preferArmour = true;
      this.engage = true;
      this.movePlatoon(map, worldX, worldY);
      return;
    }
    if (order === 'suppress') {
      this.currentOrder = 'suppress';
      this.orderLabel = 'Suppressive fire';
      this.engage = true;
      return;
    }
    if (order === 'hold' || order === 'overwatch') {
      this.currentOrder = order as TankOrderId;
      this.orderLabel = order === 'hold' ? 'Hold position' : 'Overwatch';
      this.engage = true;
      return;
    }
    this.orderLabel = order;
  }

  private movePlatoon(map: TerrainMapData, wx: number, wy: number) {
    this.livingTanks().forEach((tank, i) => {
      const ox = (i - 1) * 40;
      const oy = (i % 2) * 24;
      const end = worldToGrid(wx + ox, wy + oy);
      const start = worldToGrid(tank.hull.x, tank.hull.y);
      tank.assignPath(map, findPath(map, start.gx, start.gy, end.gx, end.gy));
      tank.targetPoint = { x: wx + ox, y: wy + oy };
    });
  }

  update(deltaSec: number, map: TerrainMapData, ctx: BattleContext) {
    for (const t of this.tanks) {
      t.targetPoint = this.orderPoint;
      t.update(deltaSec, map, ctx, this, this.engage);
    }
    const c = this.getCenter();
    this.marker.setPosition(c.x, c.y - 26);
  }

  destroy() {
    for (const t of this.tanks) t.destroy();
    this.marker.destroy();
  }
}

export function getTankPlatoonAt(platoons: TankPlatoon[], x: number, y: number, radius = 40, friendlyOnly = true) {
  for (const p of platoons) {
    if (friendlyOnly && !p.friendly) continue;
    const c = p.getCenter();
    if (Math.hypot(c.x - x, c.y - y) <= radius) return p;
  }
  return null;
}

export function getTankAt(platoons: TankPlatoon[], x: number, y: number, radius = 22): TankPlatoon | null {
  for (const p of platoons) {
    for (const t of p.livingTanks()) {
      if (Math.hypot(t.hull.x - x, t.hull.y - y) <= radius) return p;
    }
  }
  return null;
}
