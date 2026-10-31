import type { FactionId } from '../types/game';

export interface FactionDefinition {
  id: FactionId;
  name: string;
  shortName: string;
  primaryColor: number;
  secondaryColor: number;
  helmetColor: number;
  description: string;
}

export const FACTIONS: Record<FactionId, FactionDefinition> = {
  usa: {
    id: 'usa',
    name: 'United States Army',
    shortName: 'US Army',
    primaryColor: 0x3d4f2f,
    secondaryColor: 0x8b7355,
    helmetColor: 0x5a6b4a,
    description: 'Flexible combined-arms with strong artillery and air support.',
  },
  britain: {
    id: 'britain',
    name: 'British Army',
    shortName: 'British',
    primaryColor: 0x4a5238,
    secondaryColor: 0x6b5c4a,
    helmetColor: 0x3d4530,
    description: 'Methodical infantry tactics and resilient armour.',
  },
  soviet: {
    id: 'soviet',
    name: 'Soviet Red Army',
    shortName: 'Red Army',
    primaryColor: 0x4a3028,
    secondaryColor: 0x6b4030,
    helmetColor: 0x5c3a30,
    description: 'Massed infantry assaults and heavy tanks.',
  },
  germany: {
    id: 'germany',
    name: 'German Wehrmacht',
    shortName: 'Wehrmacht',
    primaryColor: 0x3a3a32,
    secondaryColor: 0x5c5c4a,
    helmetColor: 0x4a4a40,
    description: 'Aggressive manoeuvre warfare and superior coordination.',
  },
};

export const FACTION_LIST = Object.values(FACTIONS);
