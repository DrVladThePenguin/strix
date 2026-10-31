import type { BattleContext } from '../entities/BattleContext';
import { hasLineOfSight } from './LineOfSight';
import type { Soldier } from '../entities/Soldier';
import type { Squad } from '../entities/Squad';

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

export function squadLivingCount(squad: Squad): number {
  return squad.livingSoldiers().length;
}

export function averageMorale(squad: Squad): number {
  const living = squad.livingSoldiers();
  if (living.length === 0) return 0;
  return living.reduce((a, s) => a + s.morale, 0) / living.length;
}
