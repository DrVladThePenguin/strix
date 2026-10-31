import Phaser from 'phaser';
import { BATTLEFIELDS } from '../../data/battlefields';
import { useOrionStore } from '../../stores/orionStore';
import {
  buildInitialSquads,
  getSquadById,
  orderSquadMove,
  squadsToFormationSummaries,
  updateSquads,
  type SquadSim,
} from '../entities/SquadManager';
import type { Pathfinder } from '../systems/Pathfinder';
import { generateTerrain, worldToGridLabel } from '../systems/TerrainGenerator';

export class BattlefieldScene extends Phaser.Scene {
  squads: SquadSim[] = [];
  pathfinder!: Pathfinder;
  private dragStart: { x: number; y: number } | null = null;
  private isDragging = false;
  private selectionRect?: Phaser.GameObjects.Rectangle;
  private moveMarker?: Phaser.GameObjects.Graphics;
  private minimapCam?: Phaser.Cameras.Scene2D.Camera;
  private unsubscribers: (() => void)[] = [];

  constructor() {
    super({ key: 'BattlefieldScene' });
  }

  create(): void {
    const operation = useOrionStore.getState().operation;
    if (!operation) {
      return;
    }

    const bf = BATTLEFIELDS[operation.battlefield];
    this.cameras.main.setBounds(0, 0, bf.width, bf.height);
    this.cameras.main.setZoom(0.85);
    this.cameras.main.centerOn(900, bf.height / 2);

    const { squads, pathfinder } = buildInitialSquads(this, operation);
    this.squads = squads;
    this.pathfinder = pathfinder;

    generateTerrain(this, bf, pathfinder);

    this.selectionRect = this.add.rectangle(0, 0, 0, 0, 0x4a6a3a, 0.15);
    this.selectionRect.setStrokeStyle(1, 0x8b9a6a);
    this.selectionRect.setVisible(false);
    this.selectionRect.setDepth(100000);

    this.moveMarker = this.add.graphics();
    this.moveMarker.setDepth(99999);

    this.setupInput(bf);
    this.setupMinimap(bf);

    useOrionStore.getState().setPhaserReady(true);
    useOrionStore.getState().setFormations(
      squadsToFormationSummaries(this.squads, useOrionStore.getState().selectedFormationIds),
    );
    useOrionStore.getState().addEvent({
      time: 0,
      message: `${operation.operationName}: All formations report ready. Awaiting orders.`,
      category: 'radio',
    });

    const unsubOrder = useOrionStore.subscribe((state, prev) => {
      if (state.orderTarget && state.orderTarget !== prev.orderTarget && state.pendingOrder === 'move') {
        this.executeMoveOrder(state.orderTarget.x, state.orderTarget.y);
      }
      if (state.selectedFormationIds !== prev.selectedFormationIds) {
        this.syncSelectionHighlight(state.selectedFormationIds);
      }
    });
    this.unsubscribers.push(unsubOrder);
  }

  private setupMinimap(bf: (typeof BATTLEFIELDS)[keyof typeof BATTLEFIELDS]): void {
    const cam = this.cameras.add(0, 0, 160, 100);
    cam.setScroll(0, 0);
    cam.setBounds(0, 0, bf.width, bf.height);
    cam.setZoom(Math.min(160 / bf.width, 100 / bf.height));
    cam.setBackgroundColor(0x1a2018);
    this.minimapCam = cam;
  }

  private setupInput(_bf: (typeof BATTLEFIELDS)[keyof typeof BATTLEFIELDS]): void {
    this.input.mouse?.disableContextMenu();

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gos: unknown, _dx: number, dy: number) => {
      const cam = this.cameras.main;
      const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.25, 2.5);
      cam.setZoom(newZoom);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.dragStart = { x: pointer.x, y: pointer.y };
        this.isDragging = true;
        return;
      }

      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const pending = useOrionStore.getState().pendingOrder;

      if (pending === 'move') {
        this.showMoveMarker(world.x, world.y);
        useOrionStore.getState().setOrderTarget({ x: world.x, y: world.y });
        useOrionStore.getState().setPendingOrder(null);
        return;
      }

      const squad = this.pickSquadAt(world.x, world.y);
      if (squad && !squad.isEnemy) {
        useOrionStore.getState().selectFormation(squad.id, pointer.event.shiftKey);
        this.focusSquad(squad);
      } else if (!pointer.event.shiftKey) {
        useOrionStore.getState().clearSelection();
        this.syncSelectionHighlight([]);
      }

      this.dragStart = { x: pointer.x, y: pointer.y };
      this.isDragging = true;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !this.dragStart) return;

      if (pointer.rightButtonDown()) {
        const cam = this.cameras.main;
        cam.scrollX -= (pointer.x - this.dragStart.x) / cam.zoom;
        cam.scrollY -= (pointer.y - this.dragStart.y) / cam.zoom;
        this.dragStart = { x: pointer.x, y: pointer.y };
        return;
      }

      if (pointer.leftButtonDown() && this.selectionRect) {
        const startWorld = this.cameras.main.getWorldPoint(this.dragStart.x, this.dragStart.y);
        const endWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const x = Math.min(startWorld.x, endWorld.x);
        const y = Math.min(startWorld.y, endWorld.y);
        const w = Math.abs(endWorld.x - startWorld.x);
        const h = Math.abs(endWorld.y - startWorld.y);
        this.selectionRect.setPosition(x + w / 2, y + h / 2);
        this.selectionRect.setSize(w, h);
        this.selectionRect.setVisible(w > 8 && h > 8);
      }
    });

    this.input.on('pointerup', (_pointer: Phaser.Input.Pointer) => {
      if (this.selectionRect?.visible) {
        const bounds = this.selectionRect.getBounds();
        const selected = this.squads.filter((s) => {
          if (s.isEnemy) return false;
          const cx = s.soldiers.reduce((a, x) => a + x.x, 0) / s.soldiers.length;
          const cy = s.soldiers.reduce((a, x) => a + x.y, 0) / s.soldiers.length;
          return bounds.contains(cx, cy);
        });
        if (selected.length > 0) {
          useOrionStore.getState().clearSelection();
          for (const s of selected) {
            useOrionStore.getState().selectFormation(s.id, true);
          }
          this.syncSelectionHighlight(useOrionStore.getState().selectedFormationIds);
        }
        this.selectionRect.setVisible(false);
      }
      this.isDragging = false;
      this.dragStart = null;
    });

    this.input.keyboard?.on('keydown-W', () => {
      const cam = this.cameras.main;
      cam.scrollY -= 40 / cam.zoom;
    });
    this.input.keyboard?.on('keydown-S', () => {
      const cam = this.cameras.main;
      cam.scrollY += 40 / cam.zoom;
    });
    this.input.keyboard?.on('keydown-A', () => {
      const cam = this.cameras.main;
      cam.scrollX -= 40 / cam.zoom;
    });
    this.input.keyboard?.on('keydown-D', () => {
      const cam = this.cameras.main;
      cam.scrollX += 40 / cam.zoom;
    });
  }

  private pickSquadAt(x: number, y: number): SquadSim | undefined {
    for (const squad of this.squads) {
      for (const soldier of squad.soldiers) {
        if (Math.hypot(soldier.x - x, soldier.y - y) < 24) {
          return squad;
        }
      }
    }
    return undefined;
  }

  private focusSquad(squad: SquadSim): void {
    const cx = squad.soldiers.reduce((a, s) => a + s.x, 0) / squad.soldiers.length;
    const cy = squad.soldiers.reduce((a, s) => a + s.y, 0) / squad.soldiers.length;
    this.cameras.main.pan(cx, cy, 400, 'Sine.easeInOut');
  }

  private syncSelectionHighlight(ids: string[]): void {
    for (const squad of this.squads) {
      squad.selected = ids.includes(squad.id);
      for (const soldier of squad.soldiers) {
        const body = soldier.sprite.list[0] as Phaser.GameObjects.Rectangle;
        if (squad.selected && !squad.isEnemy) {
          body.setStrokeStyle(2, 0xc4a574);
        } else {
          body.setStrokeStyle(1, squad.isEnemy ? 0x8b2020 : 0x2a3a20);
        }
      }
    }
    useOrionStore.getState().setFormations(squadsToFormationSummaries(this.squads, ids));
  }

  private showMoveMarker(x: number, y: number): void {
    if (!this.moveMarker) return;
    this.moveMarker.clear();
    this.moveMarker.lineStyle(2, 0xc4a574, 0.9);
    this.moveMarker.strokeCircle(x, y, 16);
    this.moveMarker.lineBetween(x - 20, y, x + 20, y);
    this.moveMarker.lineBetween(x, y - 20, x, y + 20);
  }

  private executeMoveOrder(x: number, y: number): void {
    const ids = useOrionStore.getState().selectedFormationIds;
    const grid = worldToGridLabel(x, y);
    for (const id of ids) {
      const squad = getSquadById(this.squads, id);
      if (!squad || squad.isEnemy) continue;
      orderSquadMove(squad, x, y, this.pathfinder);
      useOrionStore.getState().addEvent({
        time: useOrionStore.getState().battleTime,
        message: `${squad.name}: Moving to grid ${grid}.`,
        category: 'radio',
      });
    }
    useOrionStore.getState().setFormations(
      squadsToFormationSummaries(this.squads, useOrionStore.getState().selectedFormationIds),
    );
  }

  update(_time: number, delta: number): void {
    const store = useOrionStore.getState();
    if (store.paused) return;

    const dt = (delta / 1000) * store.gameSpeed;
    store.tickBattleTime(dt);
    updateSquads(this.squads, dt);

    if (this.minimapCam) {
      const main = this.cameras.main;
      this.minimapCam.setScroll(main.scrollX, main.scrollY);
    }
  }

  shutdown(): void {
    for (const u of this.unsubscribers) u();
    useOrionStore.getState().setPhaserReady(false);
  }
}
