import Phaser from 'phaser';
import type { FactionId } from '../../../types/game';
import { gridToWorld, worldToGrid, type TerrainMapData } from '../systems/TerrainMap';
import { findPath } from '../systems/Pathfinding';
import { soldierTextureKey } from '../render/SpriteFactory';

export type SoldierStance = 'standing' | 'crouching' | 'prone' | 'running';

export type SoldierCombatState =
  | 'idle'
  | 'moving'
  | 'shooting'
  | 'reloading'
  | 'seeking_cover'
  | 'casualty';

export class Soldier {
  readonly id: string;
  readonly squadId: string;
  readonly factionId: FactionId;
  readonly friendly: boolean;
  sprite: Phaser.GameObjects.Sprite;
  health = 100;
  morale = 85;
  ammo = 120;
  facing = 0;
  stance: SoldierStance = 'standing';
  combatState: SoldierCombatState = 'idle';
  path: { x: number; y: number }[] = [];
  pathIndex = 0;
  targetWorld: { x: number; y: number } | null = null;
  moveSpeed = 55;
  runSpeed = 90;

  constructor(
    scene: Phaser.Scene,
    id: string,
    squadId: string,
    factionId: FactionId,
    friendly: boolean,
    x: number,
    y: number,
  ) {
    this.id = id;
    this.squadId = squadId;
    this.factionId = factionId;
    this.friendly = friendly;
    this.sprite = scene.add.sprite(x, y, soldierTextureKey(factionId, friendly));
    this.sprite.setDepth(10);
    this.sprite.setData('soldierId', id);
    this.sprite.setData('squadId', squadId);
    this.sprite.setData('friendly', friendly);
  }

  setSelected(selected: boolean) {
    if (selected) {
      this.sprite.setTint(0xffe066);
    } else {
      this.sprite.clearTint();
    }
  }

  assignPath(map: TerrainMapData, gridPath: { x: number; y: number }[]) {
    void map;
    this.path = gridPath;
    this.pathIndex = 0;
    this.combatState = 'moving';
    this.stance = 'running';
    if (this.path.length === 0) {
      this.combatState = 'idle';
      this.stance = 'standing';
    }
  }

  moveTo(map: TerrainMapData, worldX: number, worldY: number) {
    this.targetWorld = { x: worldX, y: worldY };
    const start = worldToGrid(this.sprite.x, this.sprite.y);
    const end = worldToGrid(worldX, worldY);
    const gridPath = findPath(map, start.gx, start.gy, end.gx, end.gy);
    this.assignPath(map, gridPath);
  }

  update(deltaSec: number, _map: TerrainMapData) {
    if (this.combatState === 'casualty') return;
    if (this.combatState !== 'moving' || this.path.length === 0) return;

    while (this.pathIndex < this.path.length) {
      const cell = this.path[this.pathIndex];
      const target = gridToWorld(cell.x, cell.y);
      const dx = target.x - this.sprite.x;
      const dy = target.y - this.sprite.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        this.pathIndex += 1;
        continue;
      }
      const speed = this.runSpeed * deltaSec;
      const step = Math.min(speed, dist);
      this.sprite.x += (dx / dist) * step;
      this.sprite.y += (dy / dist) * step;
      this.facing = Math.atan2(dy, dx);
      this.sprite.rotation = this.facing + Math.PI / 2;
      return;
    }

    this.combatState = 'idle';
    this.stance = 'standing';
    this.path = [];
    this.sprite.rotation = 0;
  }

  isMoving(): boolean {
    return this.combatState === 'moving';
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  destroy() {
    this.sprite.destroy();
  }
}
