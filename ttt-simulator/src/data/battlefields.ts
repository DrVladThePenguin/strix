import type { BattlefieldId } from '../types/game';

export interface BattlefieldDefinition {
  id: BattlefieldId;
  name: string;
  region: string;
  width: number;
  height: number;
  description: string;
  terrainPalette: {
    grass: number;
    dirt: number;
    forest: number;
    water: number;
    road: number;
  };
}

export const BATTLEFIELDS: Record<BattlefieldId, BattlefieldDefinition> = {
  normandy: {
    id: 'normandy',
    name: 'Normandy',
    region: 'France',
    width: 4800,
    height: 3200,
    description: 'Hedgerows, bocage lanes, farmsteads and open fields.',
    terrainPalette: {
      grass: 0x5a7a42,
      dirt: 0x8b7355,
      forest: 0x2d4a28,
      water: 0x3a5a6a,
      road: 0x6b5b4a,
    },
  },
  stalingrad: {
    id: 'stalingrad',
    name: 'Stalingrad',
    region: 'Soviet Union',
    width: 4000,
    height: 3600,
    description: 'Urban rubble, frozen ground and industrial ruins.',
    terrainPalette: {
      grass: 0x6b6b5a,
      dirt: 0x5a5048,
      forest: 0x3a3a32,
      water: 0x4a5a62,
      road: 0x4a4540,
    },
  },
  north_africa: {
    id: 'north_africa',
    name: 'North Africa',
    region: 'Libya / Egypt',
    width: 5200,
    height: 2800,
    description: 'Open desert, wadis and rocky escarpments.',
    terrainPalette: {
      grass: 0xc4a574,
      dirt: 0xb8956a,
      forest: 0x8a7a50,
      water: 0x4a7080,
      road: 0x9a8060,
    },
  },
  bulge: {
    id: 'bulge',
    name: 'Battle of the Bulge',
    region: 'Belgium / Ardennes',
    width: 4400,
    height: 3400,
    description: 'Snow-covered forests, narrow roads and frozen rivers.',
    terrainPalette: {
      grass: 0xd8dce0,
      dirt: 0xa8a090,
      forest: 0x3a4a38,
      water: 0x5a7080,
      road: 0x7a7068,
    },
  },
  eastern_front: {
    id: 'eastern_front',
    name: 'Eastern Front',
    region: 'Belarus / Poland',
    width: 5600,
    height: 3600,
    description: 'Vast steppe, birch woods and scattered villages.',
    terrainPalette: {
      grass: 0x6a8a48,
      dirt: 0x7a6848,
      forest: 0x385a30,
      water: 0x4a6270,
      road: 0x6a5a48,
    },
  },
  pacific: {
    id: 'pacific',
    name: 'Pacific Theatre',
    region: 'Pacific Islands',
    width: 3600,
    height: 2800,
    description: 'Jungle, coral beaches and volcanic ridges.',
    terrainPalette: {
      grass: 0x4a7a38,
      dirt: 0x8a6848,
      forest: 0x1a4a20,
      water: 0x2a6a80,
      road: 0x6a5840,
    },
  },
};

export const BATTLEFIELD_LIST = Object.values(BATTLEFIELDS);
