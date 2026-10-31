import type { DifficultyId } from '../types/game';

export interface AiDifficultyProfile {
  id: DifficultyId;
  label: string;
  thinkIntervalSec: number;
  contactRange: number;
  advanceRange: number;
  enemyAccuracyMod: number;
  enemyDamageMod: number;
  enemyFireRateMod: number;
  aggression: number;
  flankChance: number;
  useArmourAggressively: boolean;
  suppressWhenBlocked: boolean;
  retreatMoraleThreshold: number;
}

const PROFILES: Record<DifficultyId, AiDifficultyProfile> = {
  recruit: {
    id: 'recruit',
    label: 'Recruit',
    thinkIntervalSec: 8,
    contactRange: 380,
    advanceRange: 1100,
    enemyAccuracyMod: 0.55,
    enemyDamageMod: 0.75,
    enemyFireRateMod: 0.7,
    aggression: 0.45,
    flankChance: 0,
    useArmourAggressively: false,
    suppressWhenBlocked: false,
    retreatMoraleThreshold: 25,
  },
  regular: {
    id: 'regular',
    label: 'Regular',
    thinkIntervalSec: 5,
    contactRange: 480,
    advanceRange: 1600,
    enemyAccuracyMod: 0.82,
    enemyDamageMod: 0.95,
    enemyFireRateMod: 0.9,
    aggression: 0.68,
    flankChance: 0.12,
    useArmourAggressively: true,
    suppressWhenBlocked: true,
    retreatMoraleThreshold: 18,
  },
  veteran: {
    id: 'veteran',
    label: 'Veteran',
    thinkIntervalSec: 3.5,
    contactRange: 560,
    advanceRange: 2200,
    enemyAccuracyMod: 1.05,
    enemyDamageMod: 1.08,
    enemyFireRateMod: 1.05,
    aggression: 0.85,
    flankChance: 0.28,
    useArmourAggressively: true,
    suppressWhenBlocked: true,
    retreatMoraleThreshold: 12,
  },
  elite: {
    id: 'elite',
    label: 'Elite',
    thinkIntervalSec: 2.2,
    contactRange: 640,
    advanceRange: 2800,
    enemyAccuracyMod: 1.2,
    enemyDamageMod: 1.15,
    enemyFireRateMod: 1.15,
    aggression: 1,
    flankChance: 0.42,
    useArmourAggressively: true,
    suppressWhenBlocked: true,
    retreatMoraleThreshold: 8,
  },
};

export function getAiProfile(difficulty: DifficultyId): AiDifficultyProfile {
  return PROFILES[difficulty] ?? PROFILES.regular;
}
