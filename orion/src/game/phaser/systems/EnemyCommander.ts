import type { TerrainMapData } from '../systems/TerrainMap';
import type { BattleContext } from '../entities/BattleContext';

export class EnemyCommander {
  private timer = 0;

  update(deltaSec: number, map: TerrainMapData, ctx: BattleContext) {
    this.timer += deltaSec;
    if (this.timer < 5) return;
    this.timer = 0;

    let friendlyCx = 0;
    let friendlyN = 0;
    for (const squad of ctx.squads) {
      if (!squad.friendly) continue;
      const c = squad.getCenter();
      friendlyCx += c.x;
      friendlyN += 1;
    }
    for (const tp of ctx.tankPlatoons) {
      if (!tp.friendly) continue;
      const c = tp.getCenter();
      friendlyCx += c.x;
      friendlyN += 1;
    }
    if (friendlyN === 0) return;
    friendlyCx /= friendlyN;

    const objective = ctx.objectives.zones.find((z) => z.owner !== 'enemy') ?? ctx.objectives.zones[0];
    const targetX = objective ? objective.x : friendlyCx;
    const targetY = objective ? objective.y : 2200;

    for (const squad of ctx.squads) {
      if (squad.friendly || squad.livingSoldiers().length === 0) continue;
      const c = squad.getCenter();
      const dist = Math.hypot(c.x - friendlyCx, c.y - 2200);
      if (dist < 900) {
        squad.autoOrder(map, dist < 420 ? 'attack' : 'suppress', targetX, targetY);
      }
    }

    for (const platoon of ctx.tankPlatoons) {
      if (platoon.friendly || platoon.livingTanks().length === 0) continue;
      platoon.issueOrder(map, 'attack', friendlyCx, targetY);
    }
  }
}
