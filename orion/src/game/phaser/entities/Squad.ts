import Phaser from 'phaser';
import type { FactionId, OrderId } from '../../../types/game';
import type { TerrainMapData } from '../systems/TerrainMap';
import { worldToGrid } from '../systems/TerrainMap';
import { findPath } from '../systems/Pathfinding';
import { Soldier } from './Soldier';

export class Squad {
  readonly id: string;
  readonly name: string;
  readonly factionId: FactionId;
  readonly friendly: boolean;
  soldiers: Soldier[] = [];
  marker: Phaser.GameObjects.Ellipse;
  currentOrder: OrderId | 'idle' = 'idle';
  orderLabel = 'Awaiting orders';

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

    const formation = buildFormationOffsets(count);
    for (let i = 0; i < count; i++) {
      const off = formation[i] ?? { x: (i % 5) * 14, y: Math.floor(i / 5) * 14 };
      const soldier = new Soldier(
        scene,
        `${id}-s${i}`,
        id,
        factionId,
        friendly,
        centerX + off.x,
        centerY + off.y,
      );
      this.soldiers.push(soldier);
    }

    this.marker = scene.add.ellipse(centerX, centerY - 20, 40, 16, friendly ? 0x3d4f2f : 0x5c3030, 0);
    this.marker.setStrokeStyle(1, friendly ? 0x8fbc8f : 0xaa6666, 0.6);
    this.marker.setDepth(5);
  }

  setSelected(selected: boolean) {
    for (const s of this.soldiers) s.setSelected(selected);
    this.marker.setFillStyle(selected ? (this.friendly ? 0x3d4f2f : 0x5c3030) : 0x000000, selected ? 0.35 : 0);
    this.marker.setStrokeStyle(selected ? 2 : 1, selected ? 0xffe066 : this.friendly ? 0x8fbc8f : 0xaa6666, 0.9);
  }

  getCenter(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    for (const s of this.soldiers) {
      x += s.sprite.x;
      y += s.sprite.y;
    }
    const n = Math.max(1, this.soldiers.length);
    return { x: x / n, y: y / n };
  }

  issueMoveOrder(map: TerrainMapData, worldX: number, worldY: number) {
    this.currentOrder = 'move';
    this.orderLabel = `Moving to grid ${Math.floor(worldX / 32)},${Math.floor(worldY / 32)}`;
    const formation = buildFormationOffsets(this.soldiers.length);
    const endGrid = worldToGrid(worldX, worldY);

    this.soldiers.forEach((soldier, i) => {
      const off = formation[i] ?? { x: 0, y: 0 };
      const targetGx = endGrid.gx + Math.round(off.x / 32);
      const targetGy = endGrid.gy + Math.round(off.y / 32);
      const start = worldToGrid(soldier.sprite.x, soldier.sprite.y);
      const path = findPath(map, start.gx, start.gy, targetGx, targetGy);
      if (path.length === 0) {
        soldier.moveTo(map, worldX + off.x, worldY + off.y);
      } else {
        soldier.assignPath(map, path);
      }
    });
  }

  issueOrder(map: TerrainMapData, order: OrderId, worldX: number, worldY: number) {
    if (order === 'move') {
      this.issueMoveOrder(map, worldX, worldY);
      return;
    }
    if (order === 'cover') {
      this.orderLabel = 'Taking cover';
      this.currentOrder = order;
      for (const s of this.soldiers) {
        s.stance = 'crouching';
        s.combatState = 'seeking_cover';
      }
      return;
    }
    this.orderLabel = `${order} (pending AI)`;
    this.currentOrder = order;
  }

  update(deltaSec: number, map: TerrainMapData) {
    for (const s of this.soldiers) s.update(deltaSec, map);
    const c = this.getCenter();
    this.marker.setPosition(c.x, c.y - 18);
  }

  anyMoving(): boolean {
    return this.soldiers.some((s) => s.isMoving());
  }

  destroy() {
    for (const s of this.soldiers) s.destroy();
    this.marker.destroy();
  }
}

function buildFormationOffsets(count: number): { x: number; y: number }[] {
  const offsets: { x: number; y: number }[] = [];
  const cols = Math.ceil(Math.sqrt(count));
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    offsets.push({ x: (col - cols / 2) * 16, y: row * 14 });
  }
  return offsets;
}

export function getSquadSoldierAt(squads: Squad[], x: number, y: number, radius = 12): Soldier | null {
  for (const squad of squads) {
    for (const soldier of squad.soldiers) {
      const pos = soldier.getPosition();
      if (Math.hypot(pos.x - x, pos.y - y) <= radius) return soldier;
    }
  }
  return null;
}

export function getSquadAt(squads: Squad[], x: number, y: number, radius = 28): Squad | null {
  for (const squad of squads) {
    if (!squad.friendly) continue;
    const c = squad.getCenter();
    if (Math.hypot(c.x - x, c.y - y) <= radius) return squad;
  }
  return null;
}
