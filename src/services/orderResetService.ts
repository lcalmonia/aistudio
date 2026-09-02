import { storageAdapter } from './storageAdapter';

class OrderResetApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
  }
}

export const orderResetService = {
  async resetAllOrders(): Promise<number> {
    const response = await fetch('/api/orders-reset', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      deletedOrders?: number;
    };

    if (!response.ok) {
      throw new OrderResetApiError(data.error || 'Unable to reset orders.', response.status);
    }

    storageAdapter.setOrders([]);
    return Number(data.deletedOrders || 0);
  },
};
