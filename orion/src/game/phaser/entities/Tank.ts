import Phaser from 'phaser';
import type { FactionId } from '../../../types/game';
import type { VehicleDef } from '../../../data/vehicles';
import { defaultMediumTank } from '../../../data/vehicles';
import { gridToWorld, worldToGrid, type TerrainMapData } from '../systems/TerrainMap';
import { findPath } from '../systems/Pathfinding';
import { tankHullTextureKey, tankTurretTextureKey } from '../render/SpriteFactory';
import type { BattleContext } from './BattleContext';
import type { TankPlatoon } from './TankPlatoon';
import { hasLineOfSight } from '../systems/LineOfSight';
import { allLivingTanks } from './BattleContext';

export class Tank {
  readonly id: string;
  readonly platoonId: string;
  readonly factionId: FactionId;
  readonly friendly: boolean;
  readonly def: VehicleDef;
  hull: Phaser.GameObjects.Container;
  turret: Phaser.GameObjects.Image;
  health: number;
  hullAngle = 0;
  turretAngle = 0;
  path: { x: number; y: number }[] = [];
  pathIndex = 0;
  moving = false;
  reloadTimer = 0;
  targetPoint: { x: number; y: number } | null = null;
  destroyed = false;

  constructor(
    scene: Phaser.Scene,
    id: string,
    platoonId: string,
    factionId: FactionId,
    friendly: boolean,
    x: number,
    y: number,
    vehicle?: VehicleDef,
  ) {
    this.id = id;
    this.platoonId = platoonId;
    this.factionId = factionId;
    this.friendly = friendly;
    this.def = vehicle ?? defaultMediumTank(factionId);
    this.health = this.def.health;

    this.hull = scene.add.container(x, y).setDepth(12);
    const hullSprite = scene.add.image(0, 0, tankHullTextureKey(factionId, friendly));
    this.turret = scene.add.image(0, -2, tankTurretTextureKey(factionId, friendly));
    this.hull.add([hullSprite, this.turret]);
  }

  living(): boolean {
    return !this.destroyed && this.health > 0;
  }

  setSelected(selected: boolean) {
    if (!this.living()) return;
    this.hull.list.forEach((c) => {
      if (c instanceof Phaser.GameObjects.Image) {
        if (selected) c.setTint(0xffe066);
        else c.clearTint();
      }
    });
  }

  assignPath(_map: TerrainMapData, gridPath: { x: number; y: number }[]) {
    this.path = gridPath;
    this.pathIndex = 0;
    this.moving = gridPath.length > 0;
  }

  moveTo(map: TerrainMapData, wx: number, wy: number) {
    const start = worldToGrid(this.hull.x, this.hull.y);
    const end = worldToGrid(wx, wy);
    this.assignPath(map, findPath(map, start.gx, start.gy, end.gx, end.gy));
  }

  armourFacing(angleFromShot: number): number {
    let diff = Math.abs(angleFromShot - this.hullAngle);
    while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
    if (diff < 0.6) return this.def.armour.front;
    if (diff < 2.2) return this.def.armour.side;
    return this.def.armour.rear;
  }

  takeHit(damage: number, penetration: number, shotAngle: number, ctx: BattleContext, platoon: TankPlatoon) {
    if (!this.living()) return;
    const armour = this.armourFacing(shotAngle);
    const effectivePen = penetration - armour * 0.85;
    const dealt = effectivePen > 0 ? damage * (effectivePen / 100) : damage * 0.08;
    this.health -= dealt;
    if (this.health <= 0) {
      this.destroyed = true;
      ctx.effects.explosion(this.hull.x, this.hull.y);
      this.hull.setVisible(false);
      ctx.onTankDestroyed(this, platoon);
      ctx.logCombat(`${this.def.name} knocked out`);
    }
  }

  tryFire(ctx: BattleContext, targetX: number, targetY: number) {
    if (!this.living() || this.reloadTimer > 0) return;
    const dist = Math.hypot(targetX - this.hull.x, targetY - this.hull.y);
    if (dist > this.def.range) return;
    if (!hasLineOfSight(ctx.terrain, this.hull.x, this.hull.y, targetX, targetY)) return;

    this.reloadTimer = this.def.reloadSec;
    ctx.effects.muzzleFlash(this.hull.x + Math.cos(this.turretAngle) * 14, this.hull.y + Math.sin(this.turretAngle) * 14);
    ctx.projectiles.spawnShell(
      this.hull.x,
      this.hull.y,
      targetX,
      targetY,
      420,
      this.def.cannonDamage,
      this.def.cannonPenetration,
      this.friendly,
      this.id,
    );
  }

  findTarget(ctx: BattleContext, preferArmour: boolean): { x: number; y: number } | null {
    let best: { x: number; y: number; d: number } | null = null;
    if (preferArmour) {
      for (const t of allLivingTanks(ctx)) {
        if (t.friendly === this.friendly) continue;
        const d = Math.hypot(t.hull.x - this.hull.x, t.hull.y - this.hull.y);
        if (d > this.def.range) continue;
        if (!hasLineOfSight(ctx.terrain, this.hull.x, this.hull.y, t.hull.x, t.hull.y)) continue;
        if (!best || d < best.d) best = { x: t.hull.x, y: t.hull.y, d };
      }
    }
    if (best) return best;
    for (const squad of ctx.squads) {
      if (squad.friendly === this.friendly) continue;
      for (const s of squad.livingSoldiers()) {
        const d = Math.hypot(s.sprite.x - this.hull.x, s.sprite.y - this.hull.y);
        if (d > this.def.range) continue;
        if (!best || d < best.d) best = { x: s.sprite.x, y: s.sprite.y, d };
      }
    }
    return best ? { x: best.x, y: best.y } : this.targetPoint;
  }

  update(deltaSec: number, _map: TerrainMapData, ctx: BattleContext, platoon: TankPlatoon, engage: boolean) {
    if (!this.living()) return;
    if (this.reloadTimer > 0) this.reloadTimer -= deltaSec;

    if (this.moving && this.path.length > 0) {
      while (this.pathIndex < this.path.length) {
        const cell = this.path[this.pathIndex];
        const target = gridToWorld(cell.x, cell.y);
        const dx = target.x - this.hull.x;
        const dy = target.y - this.hull.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          this.pathIndex += 1;
          continue;
        }
        const step = this.def.hullSpeed * deltaSec;
        const move = Math.min(step, dist);
        this.hull.x += (dx / dist) * move;
        this.hull.y += (dy / dist) * move;
        this.hullAngle = Math.atan2(dy, dx);
        this.hull.rotation = this.hullAngle + Math.PI / 2;
        break;
      }
      if (this.pathIndex >= this.path.length) {
        this.moving = false;
        this.path = [];
      }
    }

    const aim = engage ? this.findTarget(ctx, platoon.preferArmour) : this.targetPoint;
    if (aim) {
      this.turretAngle = Math.atan2(aim.y - this.hull.y, aim.x - this.hull.x);
      this.turret.rotation = this.turretAngle - this.hullAngle;
      if (engage) this.tryFire(ctx, aim.x, aim.y);
    }
  }

  destroy() {
    this.hull.destroy();
  }
}
