import type { GameModeId } from '../types/game';

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
    description: 'Push the enemy frontline back sector by sector.',
  },
  {
    id: 'assault',
    name: 'Assault',
    description: 'Break through fortified enemy positions.',
  },
  {
    id: 'defence',
    name: 'Defence',
    description: 'Hold key positions against waves of enemy attacks.',
  },
  {
    id: 'breakthrough',
    name: 'Breakthrough',
    description: 'Seize successive defensive sectors in depth.',
  },
  {
    id: 'elimination',
    name: 'Elimination',
    description: 'Destroy the opposing military force completely.',
  },
  {
    id: 'historical',
    name: 'Historical Operations',
    description: 'Predefined WWII-inspired scenarios with unique objectives.',
  },
];
