export type FactionId = 'usa' | 'britain' | 'soviet' | 'germany';

export type GameModeId =
  | 'conquest'
  | 'frontline'
  | 'assault'
  | 'defence'
  | 'breakthrough'
  | 'elimination'
  | 'historical';

export type DifficultyId = 'recruit' | 'regular' | 'veteran' | 'elite';

export type BattlefieldId =
  | 'normandy'
  | 'stalingrad'
  | 'north_africa'
  | 'bulge'
  | 'eastern_front'
  | 'pacific';

export type InfantryOrderType =
  | 'move'
  | 'attack'
  | 'suppress'
  | 'defend'
  | 'hold'
  | 'retreat'
  | 'flank'
  | 'cover'
  | 'entrench'
  | 'patrol'
  | 'capture'
  | 'follow'
  | 'overwatch';

export type SquadType =
  | 'rifle'
  | 'assault'
  | 'mg'
  | 'anti_tank'
  | 'recon'
  | 'engineer'
  | 'medic'
  | 'mortar';

export interface OperationConfig {
  faction: FactionId;
  enemyFaction: FactionId;
  mode: GameModeId;
  difficulty: DifficultyId;
  battlefield: BattlefieldId;
  operationName: string;
}

export interface SoldierState {
  id: string;
  x: number;
  y: number;
  facing: number;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  morale: number;
  stance: 'standing' | 'crouching' | 'prone' | 'running';
  combatState: 'idle' | 'moving' | 'shooting' | 'reloading' | 'casualty';
  weaponId: string;
}

export interface SquadState {
  id: string;
  name: string;
  type: SquadType;
  platoonId: string;
  soldierIds: string[];
  currentOrder: string;
  selected: boolean;
}

export interface FormationSummary {
  id: string;
  name: string;
  kind: 'squad' | 'platoon' | 'tank_platoon' | 'artillery' | 'air';
  parentId?: string;
  children?: string[];
  strength: number;
  maxStrength: number;
  order: string;
  healthPct: number;
  ammoPct: number;
  morale: number;
  available: boolean;
}

export interface BattleEvent {
  id: string;
  time: number;
  message: string;
  category: 'radio' | 'combat' | 'intel' | 'casualty' | 'objective';
}

export interface GameUiState {
  screen: 'menu' | 'setup' | 'game';
  operation: OperationConfig | null;
  selectedFormationIds: string[];
  pendingOrder: InfantryOrderType | null;
  gameSpeed: number;
  paused: boolean;
  battleTime: number;
  events: BattleEvent[];
}
