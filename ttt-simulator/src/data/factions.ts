import type { FactionId } from '../types/game';

export interface FactionDefinition {
  id: FactionId;
  name: string;
  shortName: string;
  uniformColor: number;
  helmetColor: number;
  accentColor: number;
  primaryRifle: string;
}

export const FACTIONS: Record<FactionId, FactionDefinition> = {
  usa: {
    id: 'usa',
    name: 'United States Army',
    shortName: 'US Army',
    uniformColor: 0x4a5d3a,
    helmetColor: 0x3d4a32,
    accentColor: 0x8b7355,
    primaryRifle: 'M1 Garand',
  },
  britain: {
    id: 'britain',
    name: 'British Army',
    shortName: 'British',
    uniformColor: 0x3d4f35,
    helmetColor: 0x2f3d28,
    accentColor: 0x6b5b4f,
    primaryRifle: 'Lee-Enfield',
  },
  soviet: {
    id: 'soviet',
    name: 'Soviet Red Army',
    shortName: 'Red Army',
    uniformColor: 0x5c4033,
    helmetColor: 0x4a3328,
    accentColor: 0x8b0000,
    primaryRifle: 'Mosin-Nagant',
  },
  germany: {
    id: 'germany',
    name: 'German Wehrmacht',
    shortName: 'Wehrmacht',
    uniformColor: 0x4a4a3a,
    helmetColor: 0x3a3a30,
    accentColor: 0x6b6b5a,
    primaryRifle: 'Kar98k',
  },
};

export const FACTION_LIST = Object.values(FACTIONS);
