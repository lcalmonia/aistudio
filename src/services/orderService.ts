import { Order, OrderStatus } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateOrderId, generateOrderNumber } from './idGenerator';
import { parseRouteFromPath } from './routeService';

class OrderApiError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new OrderApiError(data.error || 'The order request could not be completed.', response.status);
  return data;
}

async function resolveDeliveryFee(address: string | undefined, subtotal: number): Promise<number | null> {
  if (!address || subtotal < 0) return null;
  try {
    const params = new URLSearchParams({ address, subtotal: String(subtotal) });
    const response = await api<{ policy?: { fee?: number } }>(`/api/delivery-zones?${params.toString()}`, { method: 'GET' });
    return response.policy ? Math.max(0, Number(response.policy.fee) || 0) : null;
  } catch (err) { console.warn('[OrderService] Delivery-zone lookup failed; retaining cart fee:', err); return null; }
}

// Admin order polling normally only needs records that changed since the last sync.
// Keep a short-lived full-sync cursor so the normal 5-second polling loop does not
// repeatedly download the same 200 orders and their line items.
let lastAdminOrderSyncAt: string | null = null;
let lastAdminOrderFullSyncAt = 0;
const ADMIN_ORDER_FULL_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const ADMIN_ORDER_SYNC_OVERLAP_MS = 2000;

export const orderService = {
  async listOrders(options: { customerId?: string; orderId?: string; orderNumber?: string; status?: OrderStatus; startDate?: string; endDate?: string; limit?: number; } = {}): Promise<Order[]> {
    // The app's initial no-filter order load is only required by the admin portal.
    // Public/customer pages already load their own customer-specific order data when needed.
    // Returning the local cache here avoids a full orders query during public startup.
    const hasFilters = Boolean(
      options.customerId ||
      options.orderId ||
      options.orderNumber ||
      options.status ||
      options.startDate ||
      options.endDate ||
      options.limit
    );
    if (!hasFilters && parseRouteFromPath().portalMode !== 'admin') {
      return storageAdapter.getOrders();
    }

    const isUnfilteredAdminList = !hasFilters && parseRouteFromPath().portalMode === 'admin';

    // After the first full admin load, poll only rows whose updated_at changed.
    // A periodic full sync keeps the local cache resilient to out-of-band deletes
    // or other changes that cannot be represented by an update cursor.
    if (isUnfilteredAdminList && lastAdminOrderSyncAt && Date.now() - lastAdminOrderFullSyncAt < ADMIN_ORDER_FULL_SYNC_INTERVAL_MS) {
      try {
        const params = new URLSearchParams({ updatedSince: lastAdminOrderSyncAt });
        const response = await api<{ orders: Order[]; serverTime: string }>(`/api/orders/updates?${params.toString()}`, { method: 'GET' });
        if (response && Array.isArray(response.orders)) {
          const current = storageAdapter.getOrders();
          const byId = new Map(current.map((order) => [order.id, order]));
          for (const updated of response.orders) byId.set(updated.id, updated);
          const merged = Array.from(byId.values()).sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
          storageAdapter.setOrders(merged);
          lastAdminOrderSyncAt = response.serverTime || new Date().toISOString();
          return merged;
        }
      } catch (err) {
        console.warn('[OrderService] Incremental order sync failed; falling back to full sync:', err);
      }
    }

    try {
      const params = new URLSearchParams();
      if (options.customerId) params.set('customerId', options.customerId); if (options.orderId) params.set('orderId', options.orderId); if (options.orderNumber) params.set('orderNumber', options.orderNumber); if (options.status) params.set('status', options.status); if (options.startDate) params.set('startDate', options.startDate); if (options.endDate) params.set('endDate', options.endDate); if (options.limit) params.set('limit', options.limit.toString());
      const qs = params.toString(); const response = await api<{ orders: Order[] }>(`/api/orders${qs ? `?${qs}` : ''}`, { method: 'GET' });
      if (response && Array.isArray(response.orders)) {
        if (!options.customerId && !options.orderId && !options.status && !options.startDate && !options.endDate) {
          storageAdapter.setOrders(response.orders);
          if (isUnfilteredAdminList) {
            lastAdminOrderSyncAt = new Date(Date.now() - ADMIN_ORDER_SYNC_OVERLAP_MS).toISOString();
            lastAdminOrderFullSyncAt = Date.now();
          }
        }
        return response.orders;
      }
    } catch (err) { console.warn('[OrderService] Server listOrders failed, using local storage fallback:', err); }
    let local = storageAdapter.getOrders(); if (options.customerId) local = local.filter((o) => o.customerId === options.customerId); if (options.orderId) local = local.filter((o) => o.id === options.orderId); if (options.orderNumber) local = local.filter((o) => o.orderNumber === options.orderNumber || o.orderNumber === `#${options.orderNumber}`); if (options.status) local = local.filter((o) => o.status === options.status); if (options.startDate) { const startMs = new Date(options.startDate).getTime(); if (!isNaN(startMs)) local = local.filter((o) => o.timestamp >= startMs); } if (options.endDate) { const endMs = new Date(options.endDate).getTime(); if (!isNaN(endMs)) local = local.filter((o) => o.timestamp <= endMs); } return local;
  },
  async getOrder(id: string): Promise<Order | null> { try { const response = await api<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`, { method: 'GET' }); if (response && response.order) return response.order; } catch (err) { console.warn(`[OrderService] Server getOrder(${id}) failed, trying local fallback:`, err); } const orders = storageAdapter.getOrders(); return orders.find((o) => o.id === id || o.orderNumber === id || o.orderNumber === `#${id}`) || null; },
  async getCustomerOrders(customerId: string): Promise<Order[]> { return this.listOrders({ customerId }); },
  async createOrder(orderInput: Partial<Order>): Promise<Order> {
    const rawItems = orderInput.items || [];
    const sanitizedItems = rawItems.map((item) => ({ name: item.name, quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)), customization: item.customization || undefined, price: Math.max(0, Number(item.price) || 0), completed: item.completed, temperature: item.temperature, size: item.size }));
    const subtotal = Math.max(0, Number(orderInput.subtotal ?? orderInput.total ?? 0));
    const discount = Math.max(0, Number(orderInput.discount ?? 0));
    let deliveryFee = Math.max(0, Number(orderInput.deliveryFee ?? 0));
    if (orderInput.orderType === 'Delivery') { const zoneFee = await resolveDeliveryFee(orderInput.deliveryAddress?.trim(), subtotal); if (zoneFee !== null) deliveryFee = zoneFee; }
    const calculatedTotal = Math.max(0, subtotal - discount + deliveryFee);
    const payload = { id: orderInput.id || generateOrderId(), orderNumber: orderInput.orderNumber || generateOrderNumber(), customerId: orderInput.customerId, customerName: orderInput.customerName?.trim() || 'Guest Customer', customerEmail: orderInput.customerEmail?.trim(), customerPhone: orderInput.customerPhone?.trim(), status: orderInput.status || 'New', items: sanitizedItems, total: calculatedTotal, subtotal, discount, deliveryFee, image: orderInput.image, notes: orderInput.notes?.trim(), orderType: orderInput.orderType || 'Dine-In', tableNumber: orderInput.tableNumber?.trim(), deliveryAddress: orderInput.deliveryAddress?.trim(), paymentMethod: orderInput.paymentMethod || 'Cash', isCustomerOrder: orderInput.isCustomerOrder ?? false, timestamp: orderInput.timestamp || Date.now(), timeAgo: orderInput.timeAgo || 'Just now' };
    try { const response = await api<{ order: Order }>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }); if (response && response.order) { const saved = response.order; const local = storageAdapter.getOrders(); storageAdapter.setOrders([saved, ...local.filter((o) => o.id !== saved.id && o.orderNumber !== saved.orderNumber)]); return saved; } } catch (err) { console.warn('[OrderService] Server createOrder failed, persisting to local storage:', err); }
    const fallbackOrder: Order = { ...payload, id: payload.id, orderNumber: payload.orderNumber, customerName: payload.customerName, status: payload.status as OrderStatus, items: payload.items, total: payload.total, timeAgo: payload.timeAgo, timestamp: payload.timestamp }; const local = storageAdapter.getOrders(); storageAdapter.setOrders([fallbackOrder, ...local.filter((o) => o.id !== fallbackOrder.id)]); return fallbackOrder;
  },
  async updateOrderStatus(orderId: string, status: OrderStatus, paymentMethod?: 'GCash' | 'Maya' | 'Cash' | 'Card'): Promise<Order | null> { try { const response = await api<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify({ status, ...(paymentMethod ? { paymentMethod } : {}) }) }); if (response && response.order) { const updated = response.order; const local = storageAdapter.getOrders(); storageAdapter.setOrders(local.map((o) => (o.id === updated.id || o.orderNumber === updated.orderNumber ? updated : o))); return updated; } } catch (err) { console.warn(`[OrderService] Server updateOrderStatus(${orderId}, ${status}) failed, applying locally:`, err); } const local = storageAdapter.getOrders(); const index = local.findIndex((o) => o.id === orderId || o.orderNumber === orderId); if (index === -1) return null; const updatedOrder: Order = { ...local[index], status, ...(paymentMethod ? { paymentMethod } : {}), updatedAt: new Date().toISOString(), completedAt: status === 'Completed' ? new Date().toISOString() : local[index].completedAt, cancelledAt: status === 'Cancelled' ? new Date().toISOString() : local[index].cancelledAt }; local[index] = updatedOrder; storageAdapter.setOrders(local); return updatedOrder; },
  async cancelCustomerOrder(orderId: string, customerId: string, customerEmail?: string): Promise<Order | null> { try { const response = await api<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify({ action: 'customer-cancel', customerId, customerEmail }) }); if (response && response.order) { const updated = response.order; const local = storageAdapter.getOrders(); storageAdapter.setOrders(local.map((o) => o.id === updated.id || o.orderNumber === updated.orderNumber ? updated : o)); return updated; } } catch (err) { console.warn(`[OrderService] Customer cancellation failed for ${orderId}:`, err); throw err; } return null; },
  async cancelOrder(orderId: string, reason?: string): Promise<Order | null> { return this.updateOrderStatus(orderId, 'Cancelled'); },
  async deleteOrder(orderId: string): Promise<boolean> { try { await api<{ deleted: boolean }>(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE', body: JSON.stringify({}) }); const local = storageAdapter.getOrders(); storageAdapter.setOrders(local.filter((o) => o.id !== orderId && o.orderNumber !== orderId)); return true; } catch (err) { console.warn(`[OrderService] Server deleteOrder(${orderId}) failed:`, err); throw err; } },
  async saveOrders(orders: Order[]): Promise<Order[]> { storageAdapter.setOrders(orders); return orders; },
};