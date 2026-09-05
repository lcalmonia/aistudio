import { Order, OrderStatus } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateOrderId, generateOrderNumber } from './idGenerator';

class OrderApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new OrderApiError(data.error || 'The order request could not be completed.', response.status);
  }
  return data;
}

export const orderService = {
  async listOrders(options: { customerId?: string; orderId?: string; orderNumber?: string; status?: OrderStatus; startDate?: string; endDate?: string; limit?: number; } = {}): Promise<Order[]> {
    try {
      const params = new URLSearchParams();
      if (options.customerId) params.set('customerId', options.customerId);
      if (options.orderId) params.set('orderId', options.orderId);
      if (options.orderNumber) params.set('orderNumber', options.orderNumber);
      if (options.status) params.set('status', options.status);
      if (options.startDate) params.set('startDate', options.startDate);
      if (options.endDate) params.set('endDate', options.endDate);
      if (options.limit) params.set('limit', options.limit.toString());
      const qs = params.toString();
      const response = await api<{ orders: Order[] }>(`/api/orders${qs ? `?${qs}` : ''}`, { method: 'GET' });
      if (response && Array.isArray(response.orders)) {
        if (!options.customerId && !options.orderId && !options.status && !options.startDate && !options.endDate) storageAdapter.setOrders(response.orders);
        return response.orders;
      }
    } catch (err) {
      console.warn('[OrderService] Server listOrders failed, using local storage fallback:', err);
    }
    let local = storageAdapter.getOrders();
    if (options.customerId) local = local.filter((o) => o.customerId === options.customerId);
    if (options.orderId) local = local.filter((o) => o.id === options.orderId);
    if (options.orderNumber) local = local.filter((o) => o.orderNumber === options.orderNumber || o.orderNumber === `#${options.orderNumber}`);
    if (options.status) local = local.filter((o) => o.status === options.status);
    if (options.startDate) { const startMs = new Date(options.startDate).getTime(); if (!isNaN(startMs)) local = local.filter((o) => o.timestamp >= startMs); }
    if (options.endDate) { const endMs = new Date(options.endDate).getTime(); if (!isNaN(endMs)) local = local.filter((o) => o.timestamp <= endMs); }
    return local;
  },

  async getOrder(id: string): Promise<Order | null> {
    try { const response = await api<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`, { method: 'GET' }); if (response && response.order) return response.order; }
    catch (err) { console.warn(`[OrderService] Server getOrder(${id}) failed, trying local fallback:`, err); }
    const orders = storageAdapter.getOrders();
    return orders.find((o) => o.id === id || o.orderNumber === id || o.orderNumber === `#${id}`) || null;
  },

  async getCustomerOrders(customerId: string): Promise<Order[]> { return this.listOrders({ customerId }); },

  async createOrder(orderInput: Partial<Order>): Promise<Order> {
    const rawItems = orderInput.items || [];
    const sanitizedItems = rawItems.map((item) => ({ name: item.name, quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)), customization: item.customization || undefined, price: Math.max(0, Number(item.price) || 0), completed: item.completed, temperature: item.temperature, size: item.size }));
    const payload = { id: orderInput.id || generateOrderId(), orderNumber: orderInput.orderNumber || generateOrderNumber(), customerId: orderInput.customerId, customerName: orderInput.customerName?.trim() || 'Guest Customer', customerEmail: orderInput.customerEmail?.trim(), customerPhone: orderInput.customerPhone?.trim(), status: orderInput.status || 'New', items: sanitizedItems, total: orderInput.total || 0, subtotal: orderInput.subtotal ?? orderInput.total ?? 0, discount: orderInput.discount ?? 0, deliveryFee: orderInput.deliveryFee ?? 0, image: orderInput.image, notes: orderInput.notes?.trim(), orderType: orderInput.orderType || 'Dine-In', tableNumber: orderInput.tableNumber?.trim(), deliveryAddress: orderInput.deliveryAddress?.trim(), paymentMethod: orderInput.paymentMethod || 'Cash', isCustomerOrder: orderInput.isCustomerOrder ?? false, timestamp: orderInput.timestamp || Date.now(), timeAgo: orderInput.timeAgo || 'Just now' };
    try {
      const response = await api<{ order: Order }>('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
      if (response && response.order) { const saved = response.order; const local = storageAdapter.getOrders(); storageAdapter.setOrders([saved, ...local.filter((o) => o.id !== saved.id && o.orderNumber !== saved.orderNumber)]); return saved; }
    } catch (err) { console.warn('[OrderService] Server createOrder failed, persisting to local storage:', err); }
    const fallbackOrder: Order = { ...payload, id: payload.id, orderNumber: payload.orderNumber, customerName: payload.customerName, status: payload.status as OrderStatus, items: payload.items, total: payload.total, timeAgo: payload.timeAgo, timestamp: payload.timestamp };
    const local = storageAdapter.getOrders(); storageAdapter.setOrders([fallbackOrder, ...local.filter((o) => o.id !== fallbackOrder.id)]); return fallbackOrder;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, paymentMethod?: 'GCash' | 'Maya' | 'Cash' | 'Card'): Promise<Order | null> {
    try {
      const response = await api<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify({ status, ...(paymentMethod ? { paymentMethod } : {}) }) });
      if (response && response.order) { const updated = response.order; const local = storageAdapter.getOrders(); storageAdapter.setOrders(local.map((o) => (o.id === updated.id || o.orderNumber === updated.orderNumber ? updated : o))); return updated; }
    } catch (err) { console.warn(`[OrderService] Server updateOrderStatus(${orderId}, ${status}) failed, applying locally:`, err); }
    const local = storageAdapter.getOrders(); const index = local.findIndex((o) => o.id === orderId || o.orderNumber === orderId); if (index === -1) return null;
    const updatedOrder: Order = { ...local[index], status, ...(paymentMethod ? { paymentMethod } : {}), updatedAt: new Date().toISOString(), completedAt: status === 'Completed' ? new Date().toISOString() : local[index].completedAt, cancelledAt: status === 'Cancelled' ? new Date().toISOString() : local[index].cancelledAt };
    local[index] = updatedOrder; storageAdapter.setOrders(local); return updatedOrder;
  },

  async cancelCustomerOrder(orderId: string, customerId: string, customerEmail?: string): Promise<Order | null> {
    try {
      const response = await api<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify({ action: 'customer-cancel', customerId, customerEmail }) });
      if (response && response.order) { const updated = response.order; const local = storageAdapter.getOrders(); storageAdapter.setOrders(local.map((o) => o.id === updated.id || o.orderNumber === updated.orderNumber ? updated : o)); return updated; }
    } catch (err) { console.warn(`[OrderService] Customer cancellation failed for ${orderId}:`, err); throw err; }
    return null;
  },

  async cancelOrder(orderId: string, reason?: string): Promise<Order | null> { return this.updateOrderStatus(orderId, 'Cancelled'); },

  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      await api<{ deleted: boolean }>(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE', body: JSON.stringify({}) });
      const local = storageAdapter.getOrders();
      storageAdapter.setOrders(local.filter((o) => o.id !== orderId && o.orderNumber !== orderId));
      return true;
    } catch (err) {
      console.warn(`[OrderService] Server deleteOrder(${orderId}) failed:`, err);
      throw err;
    }
  },

  async saveOrders(orders: Order[]): Promise<Order[]> { storageAdapter.setOrders(orders); return orders; },
};
