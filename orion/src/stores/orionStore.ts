import { create } from 'zustand';
import type {
  BattleEvent,
  FormationSummary,
  GameUiState,
  InfantryOrderType,
  OperationConfig,
} from '../types/game';

interface OrionStore extends GameUiState {
  formations: FormationSummary[];
  setScreen: (screen: GameUiState['screen']) => void;
  setOperation: (op: OperationConfig) => void;
  setFormations: (formations: FormationSummary[]) => void;
  selectFormation: (id: string, additive?: boolean) => void;
  clearSelection: () => void;
  setPendingOrder: (order: InfantryOrderType | null) => void;
  setPaused: (paused: boolean) => void;
  setGameSpeed: (speed: number) => void;
  tickBattleTime: (dt: number) => void;
  addEvent: (event: Omit<BattleEvent, 'id'>) => void;
  phaserReady: boolean;
  setPhaserReady: (ready: boolean) => void;
  /** Bridge: Phaser reads/writes selection & orders */
  orderTarget: { x: number; y: number } | null;
  setOrderTarget: (target: { x: number; y: number } | null) => void;
}

export const useOrionStore = create<OrionStore>((set, get) => ({
  screen: 'menu',
  operation: null,
  selectedFormationIds: [],
  pendingOrder: null,
  gameSpeed: 1,
  paused: false,
  battleTime: 0,
  events: [],
  formations: [],
  phaserReady: false,
  orderTarget: null,

  setScreen: (screen) => set({ screen }),
  setOperation: (operation) => set({ operation }),
  setFormations: (formations) => set({ formations }),

  selectFormation: (id, additive = false) => {
    const current = get().selectedFormationIds;
    if (additive) {
      if (current.includes(id)) {
        set({ selectedFormationIds: current.filter((x) => x !== id) });
      } else {
        set({ selectedFormationIds: [...current, id] });
      }
    } else {
      set({ selectedFormationIds: [id] });
    }
  },

  clearSelection: () => set({ selectedFormationIds: [] }),
  setPendingOrder: (pendingOrder) => set({ pendingOrder, orderTarget: null }),
  setPaused: (paused) => set({ paused }),
  setGameSpeed: (gameSpeed) => set({ gameSpeed }),

  tickBattleTime: (dt) => {
    if (!get().paused) {
      set({ battleTime: get().battleTime + dt * get().gameSpeed });
    }
  },

  addEvent: (event) => {
    const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set({ events: [{ ...event, id }, ...get().events].slice(0, 80) });
  },

  setPhaserReady: (phaserReady) => set({ phaserReady }),
  setOrderTarget: (orderTarget) => set({ orderTarget }),
}));
