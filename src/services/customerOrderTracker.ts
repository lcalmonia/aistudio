import { Order } from '../types';
import { orderService } from './orderService';

const TERMINAL_STATUSES = new Set(['Completed', 'Cancelled']);

/**
 * Poll a single customer's order while it is active.
 *
 * The tracker intentionally uses a modest interval and pauses in background tabs
 * to avoid unnecessary function/database requests.
 */
export function startCustomerOrderTracking(
  order: Order,
  onUpdate: (updated: Order) => void,
  intervalMs = 15000,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const scheduleNext = () => {
    clearTimer();
    if (stopped || typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    timer = setTimeout(poll, intervalMs);
  };

  const poll = async () => {
    if (stopped || (typeof document !== 'undefined' && document.visibilityState !== 'visible')) return;

    try {
      const latest = await orderService.getOrder(order.id);
      if (stopped || !latest) return;

      onUpdate(latest);

      // Completed/cancelled orders no longer need live polling.
      if (TERMINAL_STATUSES.has(latest.status)) {
        stopped = true;
        clearTimer();
        return;
      }
    } catch (error) {
      console.warn('[CustomerOrderTracker] Unable to refresh order status:', error);
    } finally {
      if (!stopped) scheduleNext();
    }
  };

  const handleVisibilityChange = () => {
    if (stopped) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      void poll();
    } else {
      clearTimer();
    }
  };

  if (!TERMINAL_STATUSES.has(order.status)) {
    void poll();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  }

  return () => {
    stopped = true;
    clearTimer();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };
}
