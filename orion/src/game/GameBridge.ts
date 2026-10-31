import Phaser from 'phaser';
import type { OperationConfig, OrderId } from '../types/game';
import type { Squad } from './phaser/entities/Squad';

type SelectionListener = (formationIds: string[]) => void;
type OrderModeListener = (active: boolean, orderId: OrderId | null) => void;

class GameBridgeImpl {
  private game: Phaser.Game | null = null;
  private battlefieldSceneKey = 'BattlefieldScene';
  private selectionListeners = new Set<SelectionListener>();
  private orderModeListeners = new Set<OrderModeListener>();

  setGame(game: Phaser.Game) {
    this.game = game;
  }

  clear() {
    this.game = null;
  }

  getScene(): Phaser.Scene | null {
    if (!this.game) return null;
    return this.game.scene.getScene(this.battlefieldSceneKey);
  }

  startBattlefield(operation: OperationConfig) {
    if (!this.game) return;
    this.game.scene.start(this.battlefieldSceneKey, { operation });
  }

  focusFormation(formationId: string) {
    const scene = this.getScene() as { focusFormation?: (id: string) => void } | null;
    scene?.focusFormation?.(formationId);
  }

  issueMoveOrder(formationIds: string[], worldX: number, worldY: number) {
    const scene = this.getScene() as {
      issueOrder?: (ids: string[], order: OrderId, x: number, y: number) => void;
    } | null;
    scene?.issueOrder?.(formationIds, 'move', worldX, worldY);
  }

  setOrderMode(orderId: OrderId | null, formationIds: string[]) {
    const scene = this.getScene() as {
      setOrderMode?: (order: OrderId | null, ids: string[]) => void;
    } | null;
    scene?.setOrderMode?.(orderId, formationIds);
    for (const l of this.orderModeListeners) l(orderId !== null, orderId);
  }

  getSquads(): Squad[] {
    const scene = this.getScene() as { getSquads?: () => Squad[] } | null;
    return scene?.getSquads?.() ?? [];
  }

  onSelectionChange(listener: SelectionListener) {
    this.selectionListeners.add(listener);
    return () => this.selectionListeners.delete(listener);
  }

  emitSelection(formationIds: string[]) {
    for (const l of this.selectionListeners) l(formationIds);
  }

  onOrderModeChange(listener: OrderModeListener) {
    this.orderModeListeners.add(listener);
    return () => this.orderModeListeners.delete(listener);
  }
}

export const GameBridge = new GameBridgeImpl();
