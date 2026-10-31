import { create } from 'zustand';
import type {
  FormationMeta,
  FormationStatus,
  LogEntry,
  OperationConfig,
  OrderId,
  PendingOrder,
  ScreenId,
  FormationKind,
} from '../types/game';
import { getBattlefield } from '../data/battlefields';

const defaultOperation: OperationConfig = {
  name: 'Operation Overwatch',
  playerFaction: 'usa',
  enemyFaction: 'germany',
  mode: 'conquest',
  difficulty: 'regular',
  battlefield: 'normandy',
};

function buildFormationTree(): FormationMeta[] {
  const squads: FormationMeta[] = [
    { id: 'sq-1', name: '1st Rifle Squad', kind: 'rifle_squad', parentId: 'plt-1', soldierCount: 10 },
    { id: 'sq-2', name: '2nd Rifle Squad', kind: 'rifle_squad', parentId: 'plt-1', soldierCount: 10 },
    { id: 'sq-3', name: '3rd Rifle Squad', kind: 'rifle_squad', parentId: 'plt-1', soldierCount: 10 },
    { id: 'sq-4', name: '4th Rifle Squad', kind: 'rifle_squad', parentId: 'plt-2', soldierCount: 10 },
    { id: 'sq-5', name: '5th Rifle Squad', kind: 'rifle_squad', parentId: 'plt-2', soldierCount: 10 },
    { id: 'sq-6', name: '6th Rifle Squad', kind: 'rifle_squad', parentId: 'plt-2', soldierCount: 10 },
    { id: 'sq-recon', name: 'Recon Section', kind: 'recon_squad', parentId: 'hq', soldierCount: 6 },
    { id: 'sq-mg', name: 'Machine Gun Squad', kind: 'mg_squad', parentId: 'support', soldierCount: 8 },
  ];
  return [
    { id: 'hq', name: 'Company Headquarters', kind: 'company_hq', parentId: null, soldierCount: 4 },
    { id: 'plt-1', name: '1st Platoon', kind: 'rifle_squad', parentId: 'hq', soldierCount: 0 },
    { id: 'plt-2', name: '2nd Platoon', kind: 'rifle_squad', parentId: 'hq', soldierCount: 0 },
    { id: 'armor', name: 'Armoured Element', kind: 'tank_platoon', parentId: 'hq', soldierCount: 0 },
    { id: 'tk-1', name: '1st Tank Platoon', kind: 'tank_platoon', parentId: 'armor', soldierCount: 3 },
    { id: 'support', name: 'Support Element', kind: 'mortar_team', parentId: 'hq', soldierCount: 0 },
    ...squads,
  ];
}

function initialStatuses(formations: FormationMeta[]): Record<string, FormationStatus> {
  const out: Record<string, FormationStatus> = {};
  for (const f of formations) {
    if (f.soldierCount === 0) continue;
    out[f.id] = {
      id: f.id,
      currentOrder: 'Awaiting orders',
      healthPct: 100,
      ammoPct: 100,
      moralePct: 85,
      strength: f.soldierCount,
      available: true,
    };
  }
  return out;
}

export interface GameStore {
  screen: ScreenId;
  operation: OperationConfig;
  formations: FormationMeta[];
  formationStatus: Record<string, FormationStatus>;
  selectedFormationIds: string[];
  pendingOrder: PendingOrder | null;
  battleTimeSec: number;
  matchTimerSec: number;
  gameSpeed: number;
  paused: boolean;
  manpower: number;
  reinforcements: number;
  log: LogEntry[];
  setScreen: (screen: ScreenId) => void;
  patchOperation: (patch: Partial<OperationConfig>) => void;
  startOperation: () => void;
  selectFormations: (ids: string[], additive?: boolean) => void;
  setPendingOrder: (order: PendingOrder | null) => void;
  updateFormationStatus: (id: string, patch: Partial<FormationStatus>) => void;
  tickBattleClock: (deltaSec: number) => void;
  setGameSpeed: (speed: number) => void;
  setPaused: (paused: boolean) => void;
  pushLog: (entry: Omit<LogEntry, 'id' | 'time'>) => void;
}

let logCounter = 0;

function formatBattleTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const useGameStore = create<GameStore>((set, get) => {
  const formations = buildFormationTree();
  return {
    screen: 'menu',
    operation: defaultOperation,
    formations,
    formationStatus: initialStatuses(formations),
    selectedFormationIds: [],
    pendingOrder: null,
    battleTimeSec: 6 * 3600 + 30 * 60,
    matchTimerSec: 0,
    gameSpeed: 1,
    paused: false,
    manpower: 420,
    reinforcements: 3,
    log: [
      {
        id: 'log-0',
        time: '06:30',
        category: 'radio',
        message: 'Company net open. Awaiting commander orders.',
      },
    ],
    setScreen: (screen) => set({ screen }),
    patchOperation: (patch) =>
      set((s) => ({ operation: { ...s.operation, ...patch } })),
    startOperation: () => {
      const op = get().operation;
      const bf = getBattlefield(op.battlefield);
      set({
        screen: 'game',
        selectedFormationIds: [],
        pendingOrder: null,
        matchTimerSec: 0,
        paused: false,
        log: [
          {
            id: 'log-start',
            time: '06:31',
            category: 'command',
            message: `${op.name} commenced over ${bf.name}. All formations report ready.`,
          },
        ],
      });
    },
    selectFormations: (ids, additive = false) =>
      set((s) => ({
        selectedFormationIds: additive
          ? [...new Set([...s.selectedFormationIds, ...ids])]
          : ids,
      })),
    setPendingOrder: (pendingOrder) => set({ pendingOrder }),
    updateFormationStatus: (id, patch) =>
      set((s) => ({
        formationStatus: {
          ...s.formationStatus,
          [id]: { ...s.formationStatus[id], ...patch },
        },
      })),
    tickBattleClock: (deltaSec) => {
      const { paused, gameSpeed } = get();
      if (paused) return;
      set((s) => ({
        battleTimeSec: s.battleTimeSec + deltaSec * gameSpeed,
        matchTimerSec: s.matchTimerSec + deltaSec * gameSpeed,
      }));
    },
    setGameSpeed: (gameSpeed) => set({ gameSpeed }),
    setPaused: (paused) => set({ paused }),
    pushLog: (entry) => {
      logCounter += 1;
      const time = formatBattleTime(get().battleTimeSec);
      set((s) => ({
        log: [
          { ...entry, id: `log-${logCounter}`, time: time.slice(0, 5) },
          ...s.log,
        ].slice(0, 80),
      }));
    },
  };
});

export function getFormationById(id: string): FormationMeta | undefined {
  return useGameStore.getState().formations.find((f) => f.id === id);
}

export function getFormationKind(id: string): FormationKind | undefined {
  return getFormationById(id)?.kind;
}

export const INFANTRY_ORDERS: { id: OrderId; label: string; hint: string }[] = [
  { id: 'move', label: 'Move', hint: 'Click destination on the map.' },
  { id: 'attack', label: 'Attack', hint: 'Click enemy position or objective.' },
  { id: 'suppress', label: 'Suppress', hint: 'Sustained fire on an area.' },
  { id: 'defend', label: 'Defend', hint: 'Establish defensive positions.' },
  { id: 'hold', label: 'Hold Position', hint: 'Remain and engage in range.' },
  { id: 'retreat', label: 'Retreat', hint: 'Withdraw to a rally point.' },
  { id: 'flank', label: 'Flank', hint: 'Approach target from the flank.' },
  { id: 'cover', label: 'Take Cover', hint: 'Seek nearby cover immediately.' },
  { id: 'capture', label: 'Capture', hint: 'Advance to capture an objective.' },
  { id: 'overwatch', label: 'Overwatch', hint: 'Cover a designated area.' },
];

export const TANK_ORDERS: { id: OrderId; label: string; hint: string }[] = [
  { id: 'move', label: 'Move', hint: 'Move platoon to destination.' },
  { id: 'attack', label: 'Engage Armour', hint: 'Advance and engage enemy armour.' },
  { id: 'suppress', label: 'Suppress', hint: 'Fire on area targets.' },
  { id: 'defend', label: 'Defend', hint: 'Hold a defensive sector.' },
  { id: 'hold', label: 'Hold Position', hint: 'Remain and engage.' },
  { id: 'retreat', label: 'Retreat', hint: 'Withdraw to rally point.' },
  { id: 'overwatch', label: 'Overwatch', hint: 'Overwatch a sector.' },
];
