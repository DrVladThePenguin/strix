import Phaser from 'phaser';
import type { BattleContext } from '../entities/BattleContext';
import { coverAt } from './CoverSystem';
import { hasLineOfSight } from './LineOfSight';
import type { WeaponDef } from '../../../data/weapons';
import type { Soldier } from '../entities/Soldier';
import type { Tank } from '../entities/Tank';

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  penetration: number;
  friendly: boolean;
  kind: 'bullet' | 'shell';
  life: number;
  shooterId: string;
  sprite?: Phaser.GameObjects.Arc;
}

export class ProjectileSystem {
  private scene: Phaser.Scene;
  active: Projectile[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  spawnShell(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    speed: number,
    damage: number,
    penetration: number,
    friendly: boolean,
    shooterId: string,
  ) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy) || 1;
    const flight = dist / speed;
    this.active.push({
      x,
      y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      damage,
      penetration,
      friendly,
      kind: 'shell',
      life: flight + 0.5,
      shooterId,
    });
  }

  fireHitscan(
    ctx: BattleContext,
    shooter: Soldier,
    weapon: WeaponDef,
    targetX: number,
    targetY: number,
  ): boolean {
    const sx = shooter.sprite.x;
    const sy = shooter.sprite.y;
    if (!hasLineOfSight(ctx.terrain, sx, sy, targetX, targetY)) return false;

    const dist = Math.hypot(targetX - sx, targetY - sy);
    if (dist > weapon.range) return false;

    ctx.effects.muzzleFlash(sx, sy);
    ctx.effects.tracer(sx, sy, targetX, targetY);

    const accuracy =
      weapon.accuracy *
      (1 - coverAt(ctx.terrain, targetX, targetY) * 0.45) *
      (dist / weapon.range > 0.7 ? 0.75 : 1);

    const hit = Math.random() < accuracy;
    if (hit) {
      this.applyDamageAt(ctx, targetX, targetY, weapon.damage, 0, !shooter.friendly, 28);
    } else {
      this.applySuppressionAt(ctx, targetX, targetY, weapon.suppressionPerShot * 0.5, 40);
    }
    return hit;
  }

  applyDamageAt(
    ctx: BattleContext,
    x: number,
    y: number,
    damage: number,
    penetration: number,
    hitFriendly: boolean,
    radius: number,
  ) {
    for (const squad of ctx.squads) {
      for (const soldier of squad.livingSoldiers()) {
        if (soldier.friendly !== hitFriendly) continue;
        const d = Math.hypot(soldier.sprite.x - x, soldier.sprite.y - y);
        if (d > radius) continue;
        const cover = coverAt(ctx.terrain, soldier.sprite.x, soldier.sprite.y);
        soldier.takeDamage(damage * (1 - cover * 0.6), ctx, squad);
      }
    }
    for (const platoon of ctx.tankPlatoons) {
      for (const tank of platoon.livingTanks()) {
        if (tank.friendly !== hitFriendly) continue;
        const d = Math.hypot(tank.hull.x - x, tank.hull.y - y);
        if (d > radius + 10) continue;
        tank.takeHit(damage, penetration, tank.hull.rotation, ctx, platoon);
      }
    }
  }

  applySuppressionAt(ctx: BattleContext, x: number, y: number, amount: number, radius: number) {
    for (const squad of ctx.squads) {
      for (const soldier of squad.livingSoldiers()) {
        const d = Math.hypot(soldier.sprite.x - x, soldier.sprite.y - y);
        if (d <= radius) soldier.addSuppression(amount * (1 - d / radius));
      }
    }
  }

  update(deltaSec: number, ctx: BattleContext) {
    const remaining: Projectile[] = [];
    for (const p of this.active) {
      p.life -= deltaSec;
      p.x += p.vx * deltaSec;
      p.y += p.vy * deltaSec;

      if (p.kind === 'shell') {
        if (!p.sprite) {
          p.sprite = this.scene.add.circle(p.x, p.y, 3, 0x222222, 1).setDepth(22);
        } else {
          p.sprite.setPosition(p.x, p.y);
        }

        const hitTank = this.findTankAt(ctx, p.x, p.y, 14, p.friendly);
        if (hitTank) {
          hitTank.tank.takeHit(p.damage, p.penetration, hitTank.tank.hull.rotation, ctx, hitTank.platoon);
          ctx.effects.explosion(p.x, p.y);
          p.sprite?.destroy();
          continue;
        }
        if (p.life < 0.12) {
          ctx.effects.shellImpact(p.x, p.y, true);
          this.applyDamageAt(ctx, p.x, p.y, p.damage * 0.35, p.penetration, !p.friendly, 36);
          p.sprite?.destroy();
          continue;
        }
      }

      if (p.life > 0) remaining.push(p);
      else p.sprite?.destroy();
    }
    this.active = remaining;
  }

  private findTankAt(
    ctx: BattleContext,
    x: number,
    y: number,
    radius: number,
    shooterFriendly: boolean,
  ): { tank: Tank; platoon: import('../entities/TankPlatoon').TankPlatoon } | null {
    for (const platoon of ctx.tankPlatoons) {
      for (const tank of platoon.livingTanks()) {
        if (tank.friendly === shooterFriendly) continue;
        if (Math.hypot(tank.hull.x - x, tank.hull.y - y) <= radius) return { tank, platoon };
      }
    }
    return null;
  }

  clear() {
    for (const p of this.active) p.sprite?.destroy();
    this.active = [];
  }
}
