import { InventoryItem } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';
import { DEFAULT_INVENTORY_CATEGORIES } from '../data/initialData';

export const inventoryService = {
  async listInventory(): Promise<InventoryItem[]> {
    return storageAdapter.getInventory();
  },

  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    const items = storageAdapter.getInventory();
    return items.find((i) => i.id === id) || null;
  },

  async createInventoryItem(
    item: Omit<InventoryItem, 'id'> & { id?: string }
  ): Promise<InventoryItem> {
    const items = storageAdapter.getInventory();
    const newItem: InventoryItem = {
      ...item,
      id: item.id || generateEntityId('inv'),
    };
    const updated = [...items, newItem];
    storageAdapter.setInventory(updated);
    return newItem;
  },

  async updateInventoryItem(
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem | null> {
    const items = storageAdapter.getInventory();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;
    const updated = { ...items[index], ...updates };
    items[index] = updated;
    storageAdapter.setInventory(items);
    return updated;
  },

  async deleteInventoryItem(id: string): Promise<boolean> {
    const items = storageAdapter.getInventory();
    storageAdapter.setInventory(items.filter((i) => i.id !== id));
    return true;
  },

  async recordStockMovement(id: string, delta: number): Promise<InventoryItem | null> {
    const items = storageAdapter.getInventory();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;
    const current = items[index];
    const newStock = Math.max(0, current.stock + delta);
    const newStatus =
      newStock <= 0
        ? 'Critical'
        : newStock <= current.minThreshold
        ? 'Low Stock'
        : 'In Stock';
    const updated: InventoryItem = {
      ...current,
      stock: newStock,
      status: newStatus,
      lastRestocked: delta > 0 ? new Date().toISOString().split('T')[0] : current.lastRestocked,
    };
    items[index] = updated;
    storageAdapter.setInventory(items);
    return updated;
  },

  async saveInventory(items: InventoryItem[]): Promise<InventoryItem[]> {
    storageAdapter.setInventory(items);
    return items;
  },

  async listCategories(): Promise<string[]> {
    return DEFAULT_INVENTORY_CATEGORIES;
  },
};
