import Phaser from 'phaser';
import type { FactionId, OrderId } from '../../../types/game';
import type { TerrainMapData } from '../systems/TerrainMap';
import { worldToGrid } from '../systems/TerrainMap';
import { findPath } from '../systems/Pathfinding';
import { findCoverPosition } from '../systems/CoverSystem';
import { Soldier } from './Soldier';
import type { BattleContext } from './BattleContext';
import { mgForFaction } from '../../../data/weapons';
import { averageMorale } from '../systems/CombatQueries';

export class Squad {
  readonly id: string;
  readonly name: string;
  readonly factionId: FactionId;
  readonly friendly: boolean;
  soldiers: Soldier[] = [];
  marker: Phaser.GameObjects.Ellipse;
  currentOrder: OrderId | 'idle' = 'idle';
  orderLabel = 'Awaiting orders';
  orderPoint: { x: number; y: number } | null = null;
  engageHold = false;
  suppressiveFire = false;

  constructor(
    scene: Phaser.Scene,
    id: string,
    name: string,
    factionId: FactionId,
    friendly: boolean,
    centerX: number,
    centerY: number,
    count: number,
    useMg = false,
  ) {
    this.id = id;
    this.name = name;
    this.factionId = factionId;
    this.friendly = friendly;

    const weapon = useMg ? mgForFaction(factionId) : undefined;
    const formation = buildFormationOffsets(count);
    for (let i = 0; i < count; i++) {
      const off = formation[i] ?? { x: (i % 5) * 14, y: Math.floor(i / 5) * 14 };
      this.soldiers.push(
        new Soldier(scene, `${id}-s${i}`, id, factionId, friendly, centerX + off.x, centerY + off.y, weapon),
      );
    }

    this.marker = scene.add.ellipse(centerX, centerY - 20, 40, 16, friendly ? 0x3d4f2f : 0x5c3030, 0);
    this.marker.setStrokeStyle(1, friendly ? 0x8fbc8f : 0xaa6666, 0.6);
    this.marker.setDepth(5);
  }

  livingSoldiers(): Soldier[] {
    return this.soldiers.filter((s) => s.living());
  }

  setSelected(selected: boolean) {
    for (const s of this.soldiers) s.setSelected(selected);
    this.marker.setFillStyle(selected ? (this.friendly ? 0x3d4f2f : 0x5c3030) : 0x000000, selected ? 0.35 : 0);
    this.marker.setStrokeStyle(selected ? 2 : 1, selected ? 0xffe066 : this.friendly ? 0x8fbc8f : 0xaa6666, 0.9);
  }

  getCenter(): { x: number; y: number } {
    const living = this.livingSoldiers();
    if (living.length === 0) return { x: this.marker.x, y: this.marker.y };
    let x = 0;
    let y = 0;
    for (const s of living) {
      x += s.sprite.x;
      y += s.sprite.y;
    }
    return { x: x / living.length, y: y / living.length };
  }

  statusSnapshot() {
    const living = this.livingSoldiers();
    const n = Math.max(1, living.length);
    return {
      strength: living.length,
      healthPct: living.reduce((a, s) => a + s.health, 0) / n,
      ammoPct: living.reduce((a, s) => a + s.ammoPercent(), 0) / n,
      moralePct: averageMorale(this),
    };
  }

  issueMoveOrder(map: TerrainMapData, worldX: number, worldY: number) {
    this.currentOrder = 'move';
    this.orderPoint = { x: worldX, y: worldY };
    this.engageHold = false;
    this.suppressiveFire = false;
    this.orderLabel = `Moving to grid ${Math.floor(worldX / 32)},${Math.floor(worldY / 32)}`;
    this.assignFormationMove(map, worldX, worldY);
  }

  private assignFormationMove(map: TerrainMapData, worldX: number, worldY: number) {
    const formation = buildFormationOffsets(this.soldiers.length);
    const endGrid = worldToGrid(worldX, worldY);
    this.soldiers.forEach((soldier, i) => {
      if (!soldier.living()) return;
      const off = formation[i] ?? { x: 0, y: 0 };
      const targetGx = endGrid.gx + Math.round(off.x / 32);
      const targetGy = endGrid.gy + Math.round(off.y / 32);
      const start = worldToGrid(soldier.sprite.x, soldier.sprite.y);
      const path = findPath(map, start.gx, start.gy, targetGx, targetGy);
      if (path.length === 0) soldier.moveTo(map, worldX + off.x, worldY + off.y);
      else soldier.assignPath(map, path);
    });
  }

  issueOrder(map: TerrainMapData, order: OrderId, worldX: number, worldY: number) {
    this.orderPoint = { x: worldX, y: worldY };
    this.currentOrder = order;
    this.suppressiveFire = order === 'suppress';
    this.engageHold = order === 'hold' || order === 'defend';

    switch (order) {
      case 'move':
        this.issueMoveOrder(map, worldX, worldY);
        return;
      case 'attack':
      case 'capture':
      case 'flank':
        this.orderLabel = `${order} — advancing on objective`;
        this.assignFormationMove(map, worldX, worldY);
        return;
      case 'suppress':
        this.orderLabel = 'Suppressive fire';
        return;
      case 'defend':
        this.orderLabel = 'Defending position';
        this.assignFormationMove(map, worldX, worldY);
        for (const s of this.livingSoldiers()) s.stance = 'crouching';
        return;
      case 'hold':
        this.orderLabel = 'Hold position';
        return;
      case 'retreat':
        this.orderLabel = 'Retreating';
        this.assignFormationMove(map, worldX, worldY);
        return;
      case 'cover':
        this.orderLabel = 'Taking cover';
        for (const s of this.livingSoldiers()) {
          const cover = findCoverPosition(map, s.sprite.x, s.sprite.y, 10);
          if (cover) {
            s.combatState = 'seeking_cover';
            s.moveTo(map, cover.x, cover.y);
            s.stance = 'crouching';
          }
        }
        return;
      case 'overwatch':
        this.orderLabel = 'Overwatch';
        this.engageHold = true;
        return;
      default:
        this.orderLabel = order;
    }
  }

  autoOrder(map: TerrainMapData, order: OrderId, x: number, y: number) {
    if (!this.friendly) this.issueOrder(map, order, x, y);
  }

  update(deltaSec: number, map: TerrainMapData, ctx: BattleContext) {
    const allowEngage =
      this.currentOrder !== 'move' ||
      this.livingSoldiers().some((s) => s.combatState !== 'moving' || s.path.length === 0);

    for (const s of this.soldiers) {
      if (!s.living()) continue;
      s.tickCombat(deltaSec, ctx, this, allowEngage || this.engageHold, this.orderPoint, this.suppressiveFire);

      if (this.currentOrder === 'attack' || this.currentOrder === 'capture') {
        const c = this.getCenter();
        if (this.orderPoint && Math.hypot(c.x - this.orderPoint.x, c.y - this.orderPoint.y) > 60) {
          if (!this.anyMoving()) this.assignFormationMove(map, this.orderPoint.x, this.orderPoint.y);
        }
      }
    }

    const c = this.getCenter();
    this.marker.setPosition(c.x, c.y - 18);
  }

  anyMoving(): boolean {
    return this.livingSoldiers().some((s) => s.isMoving());
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
    for (const soldier of squad.livingSoldiers()) {
      const pos = soldier.getPosition();
      if (Math.hypot(pos.x - x, pos.y - y) <= radius) return soldier;
    }
  }
  return null;
}

export function getSquadAt(squads: Squad[], x: number, y: number, radius = 28, friendlyOnly = true): Squad | null {
  for (const squad of squads) {
    if (friendlyOnly && !squad.friendly) continue;
    const c = squad.getCenter();
    if (Math.hypot(c.x - x, c.y - y) <= radius) return squad;
  }
  return null;
}
