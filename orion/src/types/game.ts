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

export type FormationKind =
  | 'rifle_squad'
  | 'assault_squad'
  | 'mg_squad'
  | 'at_squad'
  | 'recon_squad'
  | 'engineer_squad'
  | 'medic_team'
  | 'mortar_team'
  | 'tank_platoon'
  | 'artillery_battery'
  | 'fighter_squadron'
  | 'company_hq';

export type OrderId =
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

export type ScreenId = 'menu' | 'setup' | 'game';

export interface OperationConfig {
  name: string;
  playerFaction: FactionId;
  enemyFaction: FactionId;
  mode: GameModeId;
  difficulty: DifficultyId;
  battlefield: BattlefieldId;
}

export interface FormationMeta {
  id: string;
  name: string;
  kind: FormationKind;
  parentId: string | null;
  soldierCount: number;
}

export interface FormationStatus {
  id: string;
  currentOrder: string;
  healthPct: number;
  ammoPct: number;
  moralePct: number;
  strength: number;
  available: boolean;
}

export interface LogEntry {
  id: string;
  time: string;
  category: 'radio' | 'combat' | 'intel' | 'command' | 'casualty';
  message: string;
}

export interface PendingOrder {
  orderId: OrderId;
  formationIds: string[];
}
