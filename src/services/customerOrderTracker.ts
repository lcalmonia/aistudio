import { Order } from '../types';
import { orderService } from './orderService';

export function startCustomerOrderTracking(
  order: Order,
  onUpdate: (updated: Order) => void,
  intervalMs = 2000,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const poll = async () => {
    if (stopped) return;
    try {
      const latest = await orderService.getOrder(order.id);
      if (!stopped && latest) onUpdate(latest);
    } catch (error) {
      console.warn('[CustomerOrderTracker] Unable to refresh order status:', error);
    } finally {
      if (!stopped) timer = setTimeout(poll, intervalMs);
    }
  };

  void poll();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
