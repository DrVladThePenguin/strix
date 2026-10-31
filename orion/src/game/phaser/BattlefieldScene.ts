import Phaser from 'phaser';
import type { OperationConfig, OrderId } from '../../types/game';
import { getBattlefield } from '../../data/battlefields';
import { GameBridge } from '../GameBridge';
import { useGameStore } from '../../store/gameStore';
import { registerBattlefieldTextures } from './render/SpriteFactory';
import {
  generateTerrain,
  TILE_SIZE,
  type TerrainMapData,
  type TerrainCell,
} from './systems/TerrainMap';
import { Squad, getSquadAt, getSquadSoldierAt } from './entities/Squad';

interface SceneData {
  operation: OperationConfig;
}

export class BattlefieldScene extends Phaser.Scene {
  private operation!: OperationConfig;
  private terrain!: TerrainMapData;
  private squads: Squad[] = [];
  private selectedSquadIds = new Set<string>();
  private pendingOrder: OrderId | null = null;
  private pendingFormationIds: string[] = [];
  private orderMarker: Phaser.GameObjects.Graphics | null = null;
  private selectRect: Phaser.GameObjects.Graphics | null = null;
  private dragStart: { x: number; y: number } | null = null;
  private isDraggingCamera = false;
  private cameraDragStart = { x: 0, y: 0, scrollX: 0, scrollY: 0 };
  private gridLabel!: Phaser.GameObjects.Text;
  private clockSync = 0;

  constructor() {
    super({ key: 'BattlefieldScene' });
  }

  init(data: SceneData) {
    this.operation = data.operation;
  }

  create() {
    registerBattlefieldTextures(this);
    const bf = getBattlefield(this.operation.battlefield);
    this.terrain = generateTerrain(bf.seed);

    this.renderTerrain();
    this.spawnForces();

    const worldW = this.terrain.cols * TILE_SIZE;
    const worldH = this.terrain.rows * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(0.85);
    this.cameras.main.centerOn(worldW * 0.28, worldH * 0.55);

    this.gridLabel = this.add
      .text(12, 12, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#d4c4a8',
        backgroundColor: '#1a1f14aa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.orderMarker = this.add.graphics().setDepth(50);
    this.selectRect = this.add.graphics().setDepth(200);

    this.setupInput();
    this.events.on('shutdown', () => this.cleanup());
  }

  private renderTerrain() {
    for (let y = 0; y < this.terrain.rows; y++) {
      for (let x = 0; x < this.terrain.cols; x++) {
        const cell = this.terrain.cells[y][x] as TerrainCell;
        this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, `terrain-${cell}`);
      }
    }
  }

  private spawnForces() {
    const player = this.operation.playerFaction;
    const enemy = this.operation.enemyFaction;
    const friendlySquads = [
      { id: 'sq-1', name: '1st Rifle Squad', x: 800, y: 2200, count: 10 },
      { id: 'sq-2', name: '2nd Rifle Squad', x: 880, y: 2240, count: 10 },
      { id: 'sq-3', name: '3rd Rifle Squad', x: 960, y: 2280, count: 10 },
      { id: 'sq-recon', name: 'Recon Section', x: 720, y: 2100, count: 6 },
    ];
    for (const s of friendlySquads) {
      this.squads.push(new Squad(this, s.id, s.name, player, true, s.x, s.y, s.count));
    }

    const enemySquads = [
      { id: 'en-1', name: 'Enemy Rifle Squad', x: 2800, y: 1800, count: 10 },
      { id: 'en-2', name: 'Enemy MG Team', x: 3000, y: 1900, count: 8 },
    ];
    for (const s of enemySquads) {
      this.squads.push(new Squad(this, s.id, s.name, enemy, false, s.x, s.y, s.count));
    }
  }

  private setupInput() {
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gos: unknown, _dx: number, dy: number) => {
      const cam = this.cameras.main;
      const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.0015, 0.35, 2.5);
      cam.setZoom(newZoom);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown() || (pointer.rightButtonDown() && !this.pendingOrder)) {
        this.isDraggingCamera = true;
        this.cameraDragStart = {
          x: pointer.x,
          y: pointer.y,
          scrollX: this.cameras.main.scrollX,
          scrollY: this.cameras.main.scrollY,
        };
        return;
      }

      if (pointer.rightButtonDown() && this.pendingOrder) {
        this.clearOrderMode();
        return;
      }

      if (this.pendingOrder && pointer.leftButtonDown()) {
        this.executePendingOrder(pointer.worldX, pointer.worldY);
        return;
      }

      if (pointer.leftButtonDown()) {
        this.dragStart = { x: pointer.worldX, y: pointer.worldY };
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingCamera) {
        const cam = this.cameras.main;
        const dx = (pointer.x - this.cameraDragStart.x) / cam.zoom;
        const dy = (pointer.y - this.cameraDragStart.y) / cam.zoom;
        cam.scrollX = this.cameraDragStart.scrollX - dx;
        cam.scrollY = this.cameraDragStart.scrollY - dy;
        return;
      }

      this.gridLabel.setText(
        `GRID ${Math.floor(pointer.worldX / TILE_SIZE)}:${Math.floor(pointer.worldY / TILE_SIZE)}  ZOOM ${this.cameras.main.zoom.toFixed(2)}`,
      );

      if (this.dragStart && pointer.leftButtonDown()) {
        this.drawSelectionRect(this.dragStart.x, this.dragStart.y, pointer.worldX, pointer.worldY);
      }

      if (this.pendingOrder === 'move') {
        this.drawOrderMarker(pointer.worldX, pointer.worldY);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingCamera) {
        this.isDraggingCamera = false;
        return;
      }

      if (this.dragStart && pointer.leftButtonReleased()) {
        const dx = Math.abs(pointer.worldX - this.dragStart.x);
        const dy = Math.abs(pointer.worldY - this.dragStart.y);
        if (dx < 8 && dy < 8) {
          this.handleClickSelect(pointer.worldX, pointer.worldY, pointer.event.shiftKey);
        } else {
          this.handleBoxSelect(this.dragStart, { x: pointer.worldX, y: pointer.worldY }, pointer.event.shiftKey);
        }
        this.dragStart = null;
        this.selectRect?.clear();
      }
    });
  }

  private drawSelectionRect(x1: number, y1: number, x2: number, y2: number) {
    const g = this.selectRect;
    if (!g) return;
    g.clear();
    g.lineStyle(1, 0xffe066, 1);
    g.fillStyle(0xffe066, 0.12);
    g.fillRect(x1, y1, x2 - x1, y2 - y1);
    g.strokeRect(x1, y1, x2 - x1, y2 - y1);
  }

  private drawOrderMarker(x: number, y: number) {
    const g = this.orderMarker;
    if (!g) return;
    g.clear();
    g.lineStyle(2, 0x88ccff, 0.9);
    g.strokeCircle(x, y, 24);
    g.lineStyle(2, 0x88ccff, 0.5);
    g.strokeCircle(x, y, 48);
  }

  private handleClickSelect(worldX: number, worldY: number, additive: boolean) {
    const soldier = getSquadSoldierAt(
      this.squads.filter((s) => s.friendly),
      worldX,
      worldY,
    );
    if (soldier) {
      this.setSelection([soldier.squadId], additive);
      return;
    }
    const squad = getSquadAt(this.squads, worldX, worldY);
    if (squad) {
      this.setSelection([squad.id], additive);
    } else if (!additive) {
      this.setSelection([], false);
    }
  }

  private handleBoxSelect(
    a: { x: number; y: number },
    b: { x: number; y: number },
    additive: boolean,
  ) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    const ids: string[] = [];
    for (const squad of this.squads) {
      if (!squad.friendly) continue;
      for (const soldier of squad.soldiers) {
        const pos = soldier.getPosition();
        if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
          ids.push(squad.id);
          break;
        }
      }
    }
    this.setSelection([...new Set(ids)], additive);
  }

  setSelection(ids: string[], additive: boolean) {
    if (!additive) this.selectedSquadIds.clear();
    for (const id of ids) this.selectedSquadIds.add(id);
    for (const squad of this.squads) {
      squad.setSelected(this.selectedSquadIds.has(squad.id));
    }
    const formationIds = [...this.selectedSquadIds];
    GameBridge.emitSelection(formationIds);
    useGameStore.getState().selectFormations(formationIds);
  }

  focusFormation(formationId: string) {
    const squad = this.squads.find((s) => s.id === formationId);
    if (!squad) return;
    const c = squad.getCenter();
    this.cameras.main.pan(c.x, c.y, 400, 'Sine.easeInOut');
    this.setSelection([formationId], false);
  }

  setOrderMode(orderId: OrderId | null, formationIds: string[]) {
    this.pendingOrder = orderId;
    this.pendingFormationIds = formationIds;
    if (!orderId) this.orderMarker?.clear();
  }

  clearOrderMode() {
    this.pendingOrder = null;
    this.pendingFormationIds = [];
    this.orderMarker?.clear();
    useGameStore.getState().setPendingOrder(null);
  }

  executePendingOrder(worldX: number, worldY: number) {
    if (!this.pendingOrder) return;
    const order = this.pendingOrder;
    const ids =
      this.pendingFormationIds.length > 0
        ? this.pendingFormationIds
        : [...this.selectedSquadIds];
    for (const id of ids) {
      const squad = this.squads.find((s) => s.id === id);
      if (!squad || !squad.friendly) continue;
      squad.issueOrder(this.terrain, order, worldX, worldY);
      useGameStore.getState().updateFormationStatus(id, {
        currentOrder: squad.orderLabel,
      });
      useGameStore.getState().pushLog({
        category: 'command',
        message: `${squad.name}: ${squad.orderLabel}`,
      });
    }
    this.clearOrderMode();
  }

  issueOrder(ids: string[], order: OrderId, x: number, y: number) {
    for (const id of ids) {
      const squad = this.squads.find((s) => s.id === id);
      squad?.issueOrder(this.terrain, order, x, y);
    }
  }

  getSquads(): Squad[] {
    return this.squads;
  }

  update(_time: number, delta: number) {
    const deltaSec = delta / 1000;
    const store = useGameStore.getState();
    if (!store.paused) {
      for (const squad of this.squads) {
        squad.update(deltaSec * store.gameSpeed, this.terrain);
      }
      this.clockSync += deltaSec;
      if (this.clockSync > 0.25) {
        store.tickBattleClock(this.clockSync);
        this.clockSync = 0;
      }
    }
  }

  private cleanup() {
    for (const squad of this.squads) squad.destroy();
    this.squads = [];
  }
}
