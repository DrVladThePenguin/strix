import type { FactionId } from '../types/game';

export interface WeaponDef {
  id: string;
  name: string;
  range: number;
  damage: number;
  rpm: number;
  magazine: number;
  reloadSec: number;
  accuracy: number;
  suppressionPerShot: number;
}

export const WEAPONS: Record<string, WeaponDef> = {
  m1_garand: {
    id: 'm1_garand',
    name: 'M1 Garand',
    range: 320,
    damage: 22,
    rpm: 45,
    magazine: 8,
    reloadSec: 2.4,
    accuracy: 0.72,
    suppressionPerShot: 4,
  },
  kar98k: {
    id: 'kar98k',
    name: 'Kar98k',
    range: 340,
    damage: 28,
    rpm: 18,
    magazine: 5,
    reloadSec: 3,
    accuracy: 0.78,
    suppressionPerShot: 5,
  },
  mosin: {
    id: 'mosin',
    name: 'Mosin-Nagant',
    range: 330,
    damage: 27,
    rpm: 16,
    magazine: 5,
    reloadSec: 3.2,
    accuracy: 0.75,
    suppressionPerShot: 5,
  },
  lee_enfield: {
    id: 'lee_enfield',
    name: 'Lee-Enfield',
    range: 335,
    damage: 26,
    rpm: 20,
    magazine: 10,
    reloadSec: 2.8,
    accuracy: 0.76,
    suppressionPerShot: 4,
  },
  mg42: {
    id: 'mg42',
    name: 'MG42',
    range: 420,
    damage: 14,
    rpm: 120,
    magazine: 50,
    reloadSec: 4.5,
    accuracy: 0.55,
    suppressionPerShot: 9,
  },
  bar: {
    id: 'bar',
    name: 'M1918 BAR',
    range: 380,
    damage: 16,
    rpm: 90,
    magazine: 20,
    reloadSec: 3.5,
    accuracy: 0.58,
    suppressionPerShot: 7,
  },
};

export function defaultRifleForFaction(faction: FactionId): WeaponDef {
  switch (faction) {
    case 'usa':
      return WEAPONS.m1_garand;
    case 'germany':
      return WEAPONS.kar98k;
    case 'soviet':
      return WEAPONS.mosin;
    case 'britain':
      return WEAPONS.lee_enfield;
  }
}

export function mgForFaction(faction: FactionId): WeaponDef {
  return faction === 'usa' ? WEAPONS.bar : WEAPONS.mg42;
}
