import { Order, OrderStatus } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateOrderId, generateOrderNumber } from './idGenerator';

export const orderService = {
  async listOrders(): Promise<Order[]> {
    return storageAdapter.getOrders();
  },

  async getOrder(id: string): Promise<Order | null> {
    const orders = storageAdapter.getOrders();
    return orders.find((o) => o.id === id || o.orderNumber === id) || null;
  },

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    const orders = storageAdapter.getOrders();
    return orders.filter((o) => o.customerId === customerId);
  },

  async createOrder(orderInput: Partial<Order>): Promise<Order> {
    const orders = storageAdapter.getOrders();

    const newOrder: Order = {
      id: orderInput.id || generateOrderId(),
      orderNumber: orderInput.orderNumber || generateOrderNumber(),
      customerId: orderInput.customerId,
      customerName: orderInput.customerName?.trim() || 'Guest Customer',
      customerEmail: orderInput.customerEmail,
      customerPhone: orderInput.customerPhone?.trim(),
      timeAgo: 'Just now',
      timestamp: Date.now(),
      status: orderInput.status || 'New',
      items: orderInput.items || [],
      total: orderInput.total || 0,
      subtotal: orderInput.subtotal || orderInput.total || 0,
      discount: orderInput.discount || 0,
      deliveryFee: orderInput.deliveryFee || 0,
      image: orderInput.image,
      notes: orderInput.notes?.trim(),
      orderType: orderInput.orderType || 'Dine-In',
      tableNumber: orderInput.tableNumber,
      deliveryAddress: orderInput.deliveryAddress?.trim(),
      paymentMethod: orderInput.paymentMethod || 'Cash',
      isCustomerOrder: orderInput.isCustomerOrder ?? false,
    };

    const updated = [newOrder, ...orders];
    storageAdapter.setOrders(updated);
    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const orders = storageAdapter.getOrders();
    const index = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (index === -1) return null;

    const updatedOrder: Order = {
      ...orders[index],
      status,
    };

    orders[index] = updatedOrder;
    storageAdapter.setOrders(orders);
    return updatedOrder;
  },

  async cancelOrder(orderId: string, reason?: string): Promise<Order | null> {
    const orders = storageAdapter.getOrders();
    const index = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (index === -1) return null;

    const updatedOrder: Order = {
      ...orders[index],
      status: 'Cancelled',
      notes: reason ? `${orders[index].notes || ''} [Cancelled: ${reason}]`.trim() : orders[index].notes,
    };

    orders[index] = updatedOrder;
    storageAdapter.setOrders(orders);
    return updatedOrder;
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    const orders = storageAdapter.getOrders();
    const filtered = orders.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
    storageAdapter.setOrders(filtered);
    return true;
  },

  async saveOrders(orders: Order[]): Promise<Order[]> {
    storageAdapter.setOrders(orders);
    return orders;
  },
};
