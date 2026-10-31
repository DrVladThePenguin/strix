import type { TerrainMapData } from '../systems/TerrainMap';
import type { EffectsSystem } from '../systems/EffectsSystem';
import type { ProjectileSystem } from '../systems/ProjectileSystem';
import type { ObjectiveSystem } from '../systems/ObjectiveSystem';
import type { AiDifficultyProfile } from '../../../data/difficultyAi';
import type { Soldier } from './Soldier';
import type { Squad } from './Squad';
import type { Tank } from './Tank';
import type { TankPlatoon } from './TankPlatoon';

export interface BattleContext {
  terrain: TerrainMapData;
  squads: Squad[];
  tankPlatoons: TankPlatoon[];
  projectiles: ProjectileSystem;
  effects: EffectsSystem;
  objectives: ObjectiveSystem;
  ai: AiDifficultyProfile;
  onCasualty: (soldier: Soldier, squad: Squad) => void;
  onTankDestroyed: (tank: Tank, platoon: TankPlatoon) => void;
  logCombat: (message: string) => void;
}

export function allLivingSoldiers(ctx: BattleContext): Soldier[] {
  const out: Soldier[] = [];
  for (const squad of ctx.squads) {
    for (const s of squad.livingSoldiers()) out.push(s);
  }
  return out;
}

export function allLivingTanks(ctx: BattleContext): Tank[] {
  const out: Tank[] = [];
  for (const platoon of ctx.tankPlatoons) {
    for (const t of platoon.livingTanks()) out.push(t);
  }
  return out;
}
