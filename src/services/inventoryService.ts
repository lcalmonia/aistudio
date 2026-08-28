import { InventoryItem, InventoryMovement } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

export const inventoryService = {
  /**
   * Helper to compute dynamic stock status
   */
  calculateDynamicStatus(stock: number, minThreshold: number): 'In Stock' | 'Low Stock' | 'Critical' {
    if (stock <= 0) return 'Critical';
    if (stock <= minThreshold) return 'Low Stock';
    return 'In Stock';
  },

  async listInventory(options?: { includeInactive?: boolean }): Promise<InventoryItem[]> {
    const items = storageAdapter.getInventory();
    if (options?.includeInactive) {
      return items;
    }
    // Return all items by default, with dynamic status recalculated
    return items.map((item) => ({
      ...item,
      status: this.calculateDynamicStatus(item.stock, item.minThreshold),
      active: item.active !== false,
    }));
  },

  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    const items = storageAdapter.getInventory();
    const found = items.find((i) => i.id === id);
    if (!found) return null;
    return {
      ...found,
      status: this.calculateDynamicStatus(found.stock, found.minThreshold),
      active: found.active !== false,
    };
  },

  async createInventoryItem(
    item: Omit<InventoryItem, 'id'> & { id?: string }
  ): Promise<InventoryItem> {
    const items = storageAdapter.getInventory();
    const nowIso = new Date().toISOString();
    const stockVal = Math.max(0, Number(item.stock) || 0);
    const minVal = Math.max(0, Number(item.minThreshold) || 0);
    const costVal = Math.max(0, Number(item.costPerUnit) || 0);

    const newItem: InventoryItem = {
      ...item,
      id: item.id || generateEntityId('inv'),
      name: item.name.trim(),
      category: item.category?.trim() || 'General',
      stock: stockVal,
      unit: item.unit?.trim() || 'pcs',
      minThreshold: minVal,
      costPerUnit: costVal,
      supplier: item.supplier?.trim() || undefined,
      description: item.description?.trim() || undefined,
      sku: item.sku?.trim() || undefined,
      notes: item.notes?.trim() || undefined,
      active: item.active !== false,
      status: this.calculateDynamicStatus(stockVal, minVal),
      createdAt: nowIso,
      updatedAt: nowIso,
      lastRestocked: stockVal > 0 ? new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
    };

    const updated = [...items, newItem];
    storageAdapter.setInventory(updated);

    // If initial stock > 0, record initial stock movement
    if (stockVal > 0) {
      storageAdapter.addInventoryMovement({
        id: generateEntityId('mov'),
        inventoryItemId: newItem.id,
        itemName: newItem.name,
        type: 'addition',
        quantity: stockVal,
        previousQuantity: 0,
        resultingQuantity: stockVal,
        reason: 'Initial stock registration',
        timestamp: Date.now(),
        createdAt: nowIso,
      });
    }

    return newItem;
  },

  async updateInventoryItem(
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem | null> {
    const items = storageAdapter.getInventory();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const current = items[index];
    const newStock = updates.stock !== undefined ? Math.max(0, Number(updates.stock) || 0) : current.stock;
    const newThreshold = updates.minThreshold !== undefined ? Math.max(0, Number(updates.minThreshold) || 0) : current.minThreshold;
    const nowIso = new Date().toISOString();

    const updated: InventoryItem = {
      ...current,
      ...updates,
      stock: newStock,
      minThreshold: newThreshold,
      status: this.calculateDynamicStatus(newStock, newThreshold),
      active: updates.active !== undefined ? updates.active : (current.active !== false),
      updatedAt: nowIso,
    };

    items[index] = updated;
    storageAdapter.setInventory(items);
    return updated;
  },

  async deactivateInventoryItem(id: string): Promise<boolean> {
    const items = storageAdapter.getInventory();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return false;

    items[index] = {
      ...items[index],
      active: false,
      updatedAt: new Date().toISOString(),
    };
    storageAdapter.setInventory(items);
    return true;
  },

  async deleteInventoryItem(id: string): Promise<boolean> {
    const items = storageAdapter.getInventory();
    // Prefer soft deletion / deactivation if historical movements exist
    const movements = storageAdapter.getInventoryMovements().filter((m) => m.inventoryItemId === id);
    if (movements.length > 0) {
      return this.deactivateInventoryItem(id);
    }

    storageAdapter.setInventory(items.filter((i) => i.id !== id));
    return true;
  },

  async adjustStock(
    id: string,
    delta: number,
    reason?: string,
    staffName?: string
  ): Promise<InventoryItem | null> {
    return this.recordStockMovement(id, delta, reason, staffName);
  },

  async recordStockMovement(
    id: string,
    delta: number,
    reason?: string,
    staffName?: string
  ): Promise<InventoryItem | null> {
    const items = storageAdapter.getInventory();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const current = items[index];
    const prevStock = current.stock;
    const newStock = Math.max(0, parseFloat((current.stock + delta).toFixed(2)));
    const actualDelta = newStock - prevStock;
    const nowIso = new Date().toISOString();

    const updated: InventoryItem = {
      ...current,
      stock: newStock,
      status: this.calculateDynamicStatus(newStock, current.minThreshold),
      updatedAt: nowIso,
      lastRestocked: delta > 0 ? new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : current.lastRestocked,
    };

    items[index] = updated;
    storageAdapter.setInventory(items);

    // Record traceable movement
    const movementType: InventoryMovement['type'] = delta > 0 ? 'addition' : delta < 0 ? 'deduction' : 'adjustment';
    storageAdapter.addInventoryMovement({
      id: generateEntityId('mov'),
      inventoryItemId: current.id,
      itemName: current.name,
      type: movementType,
      quantity: Math.abs(actualDelta),
      previousQuantity: prevStock,
      resultingQuantity: newStock,
      reason: reason || (delta > 0 ? 'Restock / Delivery' : 'Bar usage / adjustment'),
      timestamp: Date.now(),
      createdAt: nowIso,
      staffName,
    });

    return updated;
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    const items = storageAdapter.getInventory();
    return items.filter((item) => {
      const status = this.calculateDynamicStatus(item.stock, item.minThreshold);
      return (status === 'Low Stock' || status === 'Critical') && item.active !== false;
    });
  },

  async listCategories(): Promise<string[]> {
    return storageAdapter.getInventoryCategories();
  },

  async addCategory(category: string): Promise<string[]> {
    const trimmed = category.trim();
    if (!trimmed) return storageAdapter.getInventoryCategories();
    const categories = storageAdapter.getInventoryCategories();
    if (!categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...categories, trimmed];
      storageAdapter.setInventoryCategories(updated);
      return updated;
    }
    return categories;
  },

  async listMovements(inventoryItemId?: string): Promise<InventoryMovement[]> {
    const movements = storageAdapter.getInventoryMovements();
    if (inventoryItemId) {
      return movements.filter((m) => m.inventoryItemId === inventoryItemId);
    }
    return movements;
  },

  async saveInventory(items: InventoryItem[]): Promise<InventoryItem[]> {
    storageAdapter.setInventory(items);
    return items;
  },
};
