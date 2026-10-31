import { useGameStore, INFANTRY_ORDERS } from '../../store/gameStore';
import { GameBridge } from '../../game/GameBridge';
import type { OrderId } from '../../types/game';

const IMPLEMENTED: OrderId[] = ['move', 'cover'];

export function CommandPanel() {
  const selected = useGameStore((s) => s.selectedFormationIds);
  const pendingOrder = useGameStore((s) => s.pendingOrder);
  const setPendingOrder = useGameStore((s) => s.setPendingOrder);

  const hasSelection = selected.length > 0;

  const activateOrder = (orderId: OrderId) => {
    if (!hasSelection) return;
    setPendingOrder({ orderId, formationIds: selected });
    GameBridge.setOrderMode(orderId, selected);
  };

  return (
    <aside className="panel right-panel">
      <h2>Command Interface</h2>
      {!hasSelection ? (
        <p className="panel-hint">Select a formation on the map or organisation panel.</p>
      ) : (
        <p className="panel-hint">
          {selected.length} formation(s) selected
          {pendingOrder ? ` — ${pendingOrder.orderId.toUpperCase()} active (click map)` : ''}
        </p>
      )}
      <div className="order-grid">
        {INFANTRY_ORDERS.map((order) => {
          const active = pendingOrder?.orderId === order.id;
          return (
            <button
              key={order.id}
              type="button"
              className={active ? 'order-btn active' : 'order-btn'}
              disabled={!hasSelection || !IMPLEMENTED.includes(order.id)}
              title={order.hint}
              onClick={() => activateOrder(order.id)}
            >
              <span>{order.label}</span>
              {!IMPLEMENTED.includes(order.id) && <span className="tag">Soon</span>}
            </button>
          );
        })}
      </div>
      {pendingOrder && (
        <button
          type="button"
          className="secondary-btn cancel-order"
          onClick={() => {
            setPendingOrder(null);
            GameBridge.setOrderMode(null, []);
          }}
        >
          Cancel order
        </button>
      )}
    </aside>
  );
}
