import type { FactionId } from '../types/game';

export interface VehicleDef {
  id: string;
  name: string;
  hullSpeed: number;
  turnRate: number;
  turretRate: number;
  cannonDamage: number;
  cannonPenetration: number;
  reloadSec: number;
  mgDamage: number;
  range: number;
  armour: { front: number; side: number; rear: number };
  health: number;
}

export const VEHICLES: Record<string, VehicleDef> = {
  m4_sherman: {
    id: 'm4_sherman',
    name: 'M4 Sherman',
    hullSpeed: 65,
    turnRate: 2.2,
    turretRate: 2.8,
    cannonDamage: 85,
    cannonPenetration: 95,
    reloadSec: 5.5,
    mgDamage: 8,
    range: 520,
    armour: { front: 90, side: 55, rear: 40 },
    health: 100,
  },
  panzer_iv: {
    id: 'panzer_iv',
    name: 'Panzer IV',
    hullSpeed: 60,
    turnRate: 2.4,
    turretRate: 2.6,
    cannonDamage: 90,
    cannonPenetration: 100,
    reloadSec: 5,
    mgDamage: 8,
    range: 540,
    armour: { front: 85, side: 50, rear: 35 },
    health: 100,
  },
  t34: {
    id: 't34',
    name: 'T-34',
    hullSpeed: 70,
    turnRate: 2.5,
    turretRate: 2.4,
    cannonDamage: 88,
    cannonPenetration: 98,
    reloadSec: 5.2,
    mgDamage: 7,
    range: 510,
    armour: { front: 92, side: 60, rear: 45 },
    health: 100,
  },
  cromwell: {
    id: 'cromwell',
    name: 'Cromwell',
    hullSpeed: 72,
    turnRate: 2.3,
    turretRate: 2.7,
    cannonDamage: 82,
    cannonPenetration: 88,
    reloadSec: 5.4,
    mgDamage: 8,
    range: 500,
    armour: { front: 80, side: 48, rear: 38 },
    health: 100,
  },
};

export function defaultMediumTank(faction: FactionId): VehicleDef {
  switch (faction) {
    case 'usa':
      return VEHICLES.m4_sherman;
    case 'germany':
      return VEHICLES.panzer_iv;
    case 'soviet':
      return VEHICLES.t34;
    case 'britain':
      return VEHICLES.cromwell;
  }
}
