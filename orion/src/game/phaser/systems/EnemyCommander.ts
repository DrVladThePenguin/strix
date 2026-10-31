import type { AiDifficultyProfile } from '../../../data/difficultyAi';
import { getAiProfile } from '../../../data/difficultyAi';
import type { TerrainMapData } from '../systems/TerrainMap';
import type { BattleContext } from '../entities/BattleContext';
import {
  averageMorale,
  distanceBetweenFormations,
  enemyPlatoons,
  enemySquads,
  findWeakestFriendlySquad,
  getFriendlyForceCentroid,
  pickPriorityObjective,
  squadInContactWithEnemy,
} from '../systems/CombatQueries';

export class EnemyCommander {
  private profile: AiDifficultyProfile = getAiProfile('regular');
  private thinkTimer = 0;
  private started = false;

  setDifficulty(difficulty: Parameters<typeof getAiProfile>[0]) {
    this.profile = getAiProfile(difficulty);
  }

  /** Issue first orders immediately when the battle begins. */
  bootstrap(map: TerrainMapData, ctx: BattleContext) {
    this.started = true;
    this.thinkTimer = 0;
    this.runDecisionCycle(map, ctx, true);
  }

  update(deltaSec: number, map: TerrainMapData, ctx: BattleContext) {
    if (!this.started) return;
    this.thinkTimer += deltaSec;
    if (this.thinkTimer < this.profile.thinkIntervalSec) return;
    this.thinkTimer = 0;
    this.runDecisionCycle(map, ctx, false);
  }

  private runDecisionCycle(map: TerrainMapData, ctx: BattleContext, initial: boolean) {
    const friendly = getFriendlyForceCentroid(ctx);
    if (!friendly) return;

    const objective = pickPriorityObjective(ctx, true);
    const primaryTarget = findWeakestFriendlySquad(ctx)?.getCenter() ?? friendly;
    const objectivePoint = objective ? { x: objective.x, y: objective.y } : primaryTarget;

    for (const squad of enemySquads(ctx)) {
      if (squad.livingSoldiers().length === 0) continue;
      this.directInfantrySquad(map, ctx, squad, friendly, primaryTarget, objectivePoint);
    }

    for (const platoon of enemyPlatoons(ctx)) {
      if (platoon.livingTanks().length === 0) continue;
      this.directTankPlatoon(map, ctx, platoon, friendly, primaryTarget);
    }

    if (initial && ctx.ai.id !== 'recruit') {
      ctx.logCombat(`Enemy ${this.profile.label} command net active.`);
    }
  }

  private directInfantrySquad(
    map: TerrainMapData,
    ctx: BattleContext,
    squad: ReturnType<typeof enemySquads>[0],
    friendlyCentroid: { x: number; y: number },
    primaryTarget: { x: number; y: number },
    objectivePoint: { x: number; y: number },
  ) {
    const c = squad.getCenter();
    const distToFriendly = distanceBetweenFormations(c, friendlyCentroid);
    const inContact = squadInContactWithEnemy(ctx, squad, ctx.ai.contactRange);
    const morale = averageMorale(squad);

    if (morale < this.profile.retreatMoraleThreshold && distToFriendly < 350) {
      const retreatX = c.x + (c.x - friendlyCentroid.x) * 0.35;
      const retreatY = c.y + (c.y - friendlyCentroid.y) * 0.35;
      squad.autoOrder(map, 'retreat', retreatX, retreatY);
      return;
    }

    if (inContact) {
      if (distToFriendly < this.profile.contactRange * 0.85 * this.profile.aggression) {
        squad.autoOrder(map, 'attack', primaryTarget.x, primaryTarget.y);
      } else if (this.profile.suppressWhenBlocked) {
        squad.autoOrder(map, 'suppress', friendlyCentroid.x, friendlyCentroid.y);
      } else {
        squad.autoOrder(map, 'attack', primaryTarget.x, primaryTarget.y);
      }
      return;
    }

    if (distToFriendly > this.profile.advanceRange) {
      squad.autoOrder(map, 'attack', objectivePoint.x, objectivePoint.y);
      return;
    }

    const flankRoll = Math.random() < this.profile.flankChance;
    let destX = primaryTarget.x;
    let destY = primaryTarget.y;
    if (flankRoll) {
      const nx = -(friendlyCentroid.y - c.y);
      const ny = friendlyCentroid.x - c.x;
      const len = Math.hypot(nx, ny) || 1;
      destX = primaryTarget.x + (nx / len) * 220;
      destY = primaryTarget.y + (ny / len) * 220;
      squad.autoOrder(map, 'flank', destX, destY);
      return;
    }

    if (this.profile.aggression > 0.55 || distToFriendly < this.profile.advanceRange) {
      squad.autoOrder(map, 'attack', destX, destY);
    } else {
      squad.autoOrder(map, 'defend', objectivePoint.x, objectivePoint.y);
    }
  }

  private directTankPlatoon(
    map: TerrainMapData,
    ctx: BattleContext,
    platoon: ReturnType<typeof enemyPlatoons>[0],
    friendlyCentroid: { x: number; y: number },
    primaryTarget: { x: number; y: number },
  ) {
    const c = platoon.getCenter();
    const dist = distanceBetweenFormations(c, friendlyCentroid);

    if (!this.profile.useArmourAggressively && dist > 600) {
      const obj = pickPriorityObjective(ctx, true);
      platoon.issueOrder(map, 'defend', obj?.x ?? c.x, obj?.y ?? c.y);
      return;
    }

    if (dist < 750 * this.profile.aggression) {
      platoon.issueOrder(map, 'attack', primaryTarget.x, primaryTarget.y);
    } else if (this.profile.suppressWhenBlocked && dist < 1200) {
      platoon.issueOrder(map, 'suppress', friendlyCentroid.x, friendlyCentroid.y);
    } else {
      platoon.issueOrder(map, 'attack', friendlyCentroid.x, friendlyCentroid.y);
    }
  }
}
