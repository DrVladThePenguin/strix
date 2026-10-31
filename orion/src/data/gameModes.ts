import type { GameModeId, DifficultyId } from '../types/game';

export interface GameModeDefinition {
  id: GameModeId;
  name: string;
  description: string;
}

export const GAME_MODES: GameModeDefinition[] = [
  {
    id: 'conquest',
    name: 'Conquest',
    description: 'Capture and hold strategic locations across the battlefield.',
  },
  {
    id: 'frontline',
    name: 'Frontline',
    description: 'Push the enemy frontline backwards sector by sector.',
  },
  {
    id: 'assault',
    name: 'Assault',
    description: 'Attack fortified enemy positions with combined arms.',
  },
  {
    id: 'defence',
    name: 'Defence',
    description: 'Hold your positions against successive enemy attacks.',
  },
  {
    id: 'breakthrough',
    name: 'Breakthrough',
    description: 'Capture successive defensive sectors in depth.',
  },
  {
    id: 'elimination',
    name: 'Elimination',
    description: 'Destroy the opposing military force.',
  },
  {
    id: 'historical',
    name: 'Historical Operations',
    description: 'Predefined WWII-inspired scenarios with fixed objectives.',
  },
];

export interface DifficultyDefinition {
  id: DifficultyId;
  name: string;
  aiMultiplier: number;
  enemyAccuracy: number;
  reactionScale: number;
}

export const DIFFICULTIES: DifficultyDefinition[] = [
  { id: 'recruit', name: 'Recruit', aiMultiplier: 0.6, enemyAccuracy: 0.5, reactionScale: 1.5 },
  { id: 'regular', name: 'Regular', aiMultiplier: 1.0, enemyAccuracy: 0.75, reactionScale: 1.0 },
  { id: 'veteran', name: 'Veteran', aiMultiplier: 1.35, enemyAccuracy: 0.9, reactionScale: 0.75 },
  { id: 'elite', name: 'Elite', aiMultiplier: 1.7, enemyAccuracy: 1.0, reactionScale: 0.55 },
];
