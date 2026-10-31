import type { BattlefieldId } from '../types/game';

export interface BattlefieldDefinition {
  id: BattlefieldId;
  name: string;
  region: string;
  description: string;
  width: number;
  height: number;
  seed: number;
}

export const BATTLEFIELDS: BattlefieldDefinition[] = [
  {
    id: 'normandy',
    name: 'Normandy',
    region: 'France',
    description: 'Hedgerows, bocage lanes, farmsteads and sunken roads.',
    width: 4800,
    height: 3600,
    seed: 19440606,
  },
  {
    id: 'stalingrad',
    name: 'Stalingrad',
    region: 'Soviet Union',
    description: 'Urban rubble, factory ruins and frozen river crossings.',
    width: 4200,
    height: 3200,
    seed: 19420823,
  },
  {
    id: 'north_africa',
    name: 'North Africa',
    region: 'Libya / Tunisia',
    description: 'Open desert, rocky escarpments and oasis villages.',
    width: 5200,
    height: 3800,
    seed: 19421108,
  },
  {
    id: 'bulge',
    name: 'Battle of the Bulge',
    region: 'Ardennes',
    description: 'Dense forest, snow-covered trails and narrow passes.',
    width: 4600,
    height: 3400,
    seed: 19441216,
  },
  {
    id: 'eastern_front',
    name: 'Eastern Front',
    region: 'Belarus / Ukraine',
    description: 'Steppe farmland, birch woods and scattered villages.',
    width: 5000,
    height: 3600,
    seed: 19430705,
  },
  {
    id: 'pacific',
    name: 'Pacific Theatre',
    region: 'Pacific Islands',
    description: 'Jungle clearings, coral beaches and volcanic ridges.',
    width: 4400,
    height: 3200,
    seed: 19440219,
  },
];

export function getBattlefield(id: BattlefieldId): BattlefieldDefinition {
  const found = BATTLEFIELDS.find((b) => b.id === id);
  if (!found) return BATTLEFIELDS[0];
  return found;
}
