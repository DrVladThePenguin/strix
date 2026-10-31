import type { BattleContext } from '../entities/BattleContext';
import { hasLineOfSight } from './LineOfSight';
import type { Soldier } from '../entities/Soldier';
import type { Squad } from '../entities/Squad';
import type { TankPlatoon } from '../entities/TankPlatoon';

export function findNearestEnemySoldier(
  ctx: BattleContext,
  from: Soldier,
  maxRange: number,
): Soldier | null {
  let best: Soldier | null = null;
  let bestD = maxRange;
  for (const squad of ctx.squads) {
    if (squad.friendly === from.friendly) continue;
    for (const enemy of squad.livingSoldiers()) {
      const d = Math.hypot(enemy.sprite.x - from.sprite.x, enemy.sprite.y - from.sprite.y);
      if (d >= bestD) continue;
      if (!hasLineOfSight(ctx.terrain, from.sprite.x, from.sprite.y, enemy.sprite.x, enemy.sprite.y))
        continue;
      best = enemy;
      bestD = d;
    }
  }
  return best;
}

export function getFriendlyForceCentroid(ctx: BattleContext): { x: number; y: number } | null {
  let x = 0;
  let y = 0;
  let n = 0;
  for (const squad of ctx.squads) {
    if (!squad.friendly || squad.livingSoldiers().length === 0) continue;
    const c = squad.getCenter();
    x += c.x;
    y += c.y;
    n += 1;
  }
  for (const tp of ctx.tankPlatoons) {
    if (!tp.friendly || tp.livingTanks().length === 0) continue;
    const c = tp.getCenter();
    x += c.x;
    y += c.y;
    n += 1;
  }
  if (n === 0) return null;
  return { x: x / n, y: y / n };
}

export function squadInContactWithEnemy(ctx: BattleContext, squad: Squad, range: number): boolean {
  for (const s of squad.livingSoldiers()) {
    if (findNearestEnemySoldier(ctx, s, range)) return true;
  }
  return false;
}

export function findWeakestFriendlySquad(ctx: BattleContext): Squad | null {
  let best: Squad | null = null;
  let bestScore = Infinity;
  for (const squad of ctx.squads) {
    if (!squad.friendly) continue;
    const n = squad.livingSoldiers().length;
    if (n === 0) continue;
    const score = n * 10 + averageMorale(squad);
    if (score < bestScore) {
      bestScore = score;
      best = squad;
    }
  }
  return best;
}

export function averageMorale(squad: Squad): number {
  const living = squad.livingSoldiers();
  if (living.length === 0) return 0;
  return living.reduce((a, s) => a + s.morale, 0) / living.length;
}

export function distanceBetweenFormations(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pickPriorityObjective(ctx: BattleContext, forEnemy: boolean) {
  const zones = ctx.objectives.zones;
  const preferred = zones.find((z) => (forEnemy ? z.owner !== 'enemy' : z.owner !== 'friendly'));
  return preferred ?? zones[0];
}

export function enemyPlatoons(ctx: BattleContext): TankPlatoon[] {
  return ctx.tankPlatoons.filter((p) => !p.friendly);
}

export function enemySquads(ctx: BattleContext): Squad[] {
  return ctx.squads.filter((s) => !s.friendly);
}
