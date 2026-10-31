import Phaser from 'phaser';
import type { FactionId } from '../../../types/game';
import type { WeaponDef } from '../../../data/weapons';
import { defaultRifleForFaction } from '../../../data/weapons';
import { gridToWorld, worldToGrid, type TerrainMapData } from '../systems/TerrainMap';
import { findPath } from '../systems/Pathfinding';
import { soldierTextureKey } from '../render/SpriteFactory';
import type { BattleContext } from './BattleContext';
import type { Squad } from './Squad';
import { findNearestEnemySoldier } from '../systems/CombatQueries';

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
  readonly weapon: WeaponDef;
  sprite: Phaser.GameObjects.Sprite;
  health = 100;
  morale = 85;
  facing = 0;
  stance: SoldierStance = 'standing';
  combatState: SoldierCombatState = 'idle';
  path: { x: number; y: number }[] = [];
  pathIndex = 0;
  runSpeed = 90;
  suppression = 0;
  roundsInMagazine: number;
  fireCooldown = 0;
  reloadTimer = 0;
  pinned = false;

  constructor(
    scene: Phaser.Scene,
    id: string,
    squadId: string,
    factionId: FactionId,
    friendly: boolean,
    x: number,
    y: number,
    weapon?: WeaponDef,
  ) {
    this.id = id;
    this.squadId = squadId;
    this.factionId = factionId;
    this.friendly = friendly;
    this.weapon = weapon ?? defaultRifleForFaction(factionId);
    this.roundsInMagazine = this.weapon.magazine;
    this.sprite = scene.add.sprite(x, y, soldierTextureKey(factionId, friendly));
    this.sprite.setDepth(10);
  }

  setSelected(selected: boolean) {
    if (this.combatState === 'casualty') return;
    if (selected) this.sprite.setTint(0xffe066);
    else this.sprite.clearTint();
  }

  living(): boolean {
    return this.combatState !== 'casualty';
  }

  assignPath(_map: TerrainMapData, gridPath: { x: number; y: number }[]) {
    this.path = gridPath;
    this.pathIndex = 0;
    if (gridPath.length === 0) {
      this.combatState = 'idle';
      this.stance = 'standing';
      return;
    }
    this.combatState = 'moving';
    this.stance = 'running';
  }

  moveTo(map: TerrainMapData, worldX: number, worldY: number) {
    const start = worldToGrid(this.sprite.x, this.sprite.y);
    const end = worldToGrid(worldX, worldY);
    this.assignPath(map, findPath(map, start.gx, start.gy, end.gx, end.gy));
  }

  takeDamage(amount: number, ctx: BattleContext, squad: Squad) {
    if (!this.living()) return;
    this.health -= amount;
    this.morale -= amount * 0.15;
    this.addSuppression(amount * 0.25);
    if (this.health <= 0) {
      this.becomeCasualty(ctx, squad);
    }
  }

  addSuppression(amount: number) {
    this.suppression = Math.min(100, this.suppression + amount);
    this.pinned = this.suppression > 72;
    if (this.pinned) this.stance = 'prone';
  }

  becomeCasualty(ctx: BattleContext, squad: Squad) {
    this.combatState = 'casualty';
    this.health = 0;
    this.sprite.setTint(0x662222);
    this.sprite.setAlpha(0.55);
    this.sprite.rotation = Math.PI / 2;
    ctx.onCasualty(this, squad);
    for (const mate of squad.livingSoldiers()) {
      mate.morale -= 6;
      mate.addSuppression(8);
    }
  }

  private moveStep(deltaSec: number) {
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
      const speed = (this.pinned ? this.runSpeed * 0.35 : this.runSpeed) * deltaSec;
      const step = Math.min(speed, dist);
      this.sprite.x += (dx / dist) * step;
      this.sprite.y += (dy / dist) * step;
      this.facing = Math.atan2(dy, dx);
      this.sprite.rotation = this.facing + Math.PI / 2;
      return;
    }
    this.path = [];
    if (this.combatState === 'moving') {
      this.combatState = 'idle';
      this.stance = this.pinned ? 'prone' : 'standing';
      this.sprite.rotation = 0;
    }
  }

  tryFireAt(ctx: BattleContext, targetX: number, targetY: number, suppressive = false) {
    if (!this.living() || this.pinned && !suppressive) return;
    if (this.reloadTimer > 0 || this.fireCooldown > 0) return;
    if (this.roundsInMagazine <= 0) {
      this.combatState = 'reloading';
      this.reloadTimer = this.weapon.reloadSec;
      return;
    }

    this.combatState = 'shooting';
    this.fireCooldown = 60 / this.weapon.rpm;
    this.roundsInMagazine -= 1;
    const tx = targetX + (suppressive ? (Math.random() - 0.5) * 40 : 0);
    const ty = targetY + (suppressive ? (Math.random() - 0.5) * 40 : 0);
    ctx.projectiles.fireHitscan(ctx, this, this.weapon, tx, ty);
    if (suppressive) {
      ctx.projectiles.applySuppressionAt(ctx, tx, ty, this.weapon.suppressionPerShot, 55);
    }
  }

  tickCombat(
    deltaSec: number,
    ctx: BattleContext,
    _squad: Squad,
    allowEngage: boolean,
    focusPoint: { x: number; y: number } | null,
    suppressive: boolean,
  ) {
    if (!this.living()) return;

    this.suppression = Math.max(0, this.suppression - 12 * deltaSec);
    if (this.suppression < 55) this.pinned = false;

    if (this.reloadTimer > 0) {
      this.reloadTimer -= deltaSec;
      if (this.reloadTimer <= 0) {
        this.roundsInMagazine = this.weapon.magazine;
        this.combatState = 'idle';
      }
      return;
    }
    if (this.fireCooldown > 0) this.fireCooldown -= deltaSec;

    if (this.combatState === 'seeking_cover' && this.path.length === 0) {
      this.stance = 'crouching';
      this.combatState = 'idle';
    }

    if (this.combatState === 'moving') {
      this.moveStep(deltaSec);
    }

    if (!allowEngage) return;

    const enemy = findNearestEnemySoldier(ctx, this, this.weapon.range);
    if (enemy) {
      this.facing = Math.atan2(enemy.sprite.y - this.sprite.y, enemy.sprite.x - this.sprite.x);
      this.sprite.rotation = this.facing + Math.PI / 2;
      this.tryFireAt(ctx, enemy.sprite.x, enemy.sprite.y, suppressive);
      return;
    }

    if (focusPoint) {
      this.tryFireAt(ctx, focusPoint.x, focusPoint.y, suppressive);
    }
  }

  updateMovementOnly(deltaSec: number) {
    if (this.combatState === 'moving') this.moveStep(deltaSec);
  }

  isMoving(): boolean {
    return this.combatState === 'moving';
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  ammoPercent(): number {
    return (this.roundsInMagazine / this.weapon.magazine) * 100;
  }

  destroy() {
    this.sprite.destroy();
  }
}
