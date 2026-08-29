import { InventoryItem, InventoryMovement } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

export class InventoryApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'InventoryApiError';
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch (netErr: any) {
    throw new InventoryApiError(netErr?.message || 'Network error communicating with server.');
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new InventoryApiError(data.error || 'The inventory request could not be completed.', response.status);
  }
  return data;
}

export const inventoryService = {
  /**
   * Helper to compute dynamic stock status
   */
  calculateDynamicStatus(stock: number, minThreshold: number): 'In Stock' | 'Low Stock' | 'Critical' {
    if (stock <= 0) return 'Critical';
    if (stock <= minThreshold * 0.3) return 'Critical';
    if (stock <= minThreshold) return 'Low Stock';
    return 'In Stock';
  },

  async listInventory(options?: { includeInactive?: boolean }): Promise<InventoryItem[]> {
    try {
      const response = await api<{ items: InventoryItem[] }>('/api/inventory', { method: 'GET' });
      if (response && Array.isArray(response.items)) {
        storageAdapter.setInventory(response.items);
        if (options?.includeInactive) {
          return response.items;
        }
        return response.items.filter((item) => item.active !== false);
      }
    } catch (err) {
      if (err instanceof InventoryApiError) {
        console.warn(`[InventoryService] Server listInventory error (${err.status}):`, err.message);
      } else {
        console.warn('[InventoryService] Server listInventory network failure, using local storage fallback:', err);
      }
    }

    const items = storageAdapter.getInventory();
    if (options?.includeInactive) {
      return items;
    }
    return items
      .filter((item) => item.active !== false)
      .map((item) => ({
        ...item,
        status: this.calculateDynamicStatus(item.stock, item.minThreshold),
        active: item.active !== false,
      }));
  },

  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    try {
      const response = await api<{ item: InventoryItem }>(`/api/inventory/${encodeURIComponent(id)}`, { method: 'GET' });
      if (response && response.item) {
        return response.item;
      }
    } catch (err) {
      if (err instanceof InventoryApiError && err.status === 404) {
        return null;
      }
      console.warn(`[InventoryService] Server getInventoryItem(${id}) failed, trying local storage:`, err);
    }

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
      lastRestocked: stockVal > 0 ? new Date().toISOString().split('T')[0] : undefined,
    };

    const response = await api<{ item: InventoryItem }>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(newItem),
    });
    if (response && response.item) {
      const items = storageAdapter.getInventory().filter((i) => i.id !== response.item.id);
      storageAdapter.setInventory([response.item, ...items]);
      return response.item;
    }

    throw new InventoryApiError('Failed to create inventory item on server.');
  },

  async updateInventoryItem(
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem | null> {
    const response = await api<{ item: InventoryItem }>(`/api/inventory/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (response && response.item) {
      const items = storageAdapter.getInventory();
      const index = items.findIndex((i) => i.id === id);
      if (index !== -1) {
        items[index] = response.item;
        storageAdapter.setInventory(items);
      } else {
        storageAdapter.setInventory([response.item, ...items]);
      }
      return response.item;
    }

    throw new InventoryApiError('Failed to update inventory item on server.');
  },

  async deactivateInventoryItem(id: string): Promise<boolean> {
    await api<{ item: InventoryItem }>(`/api/inventory/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    });

    const items = storageAdapter.getInventory();
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        active: false,
        updatedAt: new Date().toISOString(),
      };
      storageAdapter.setInventory(items);
    }
    return true;
  },

  async deleteInventoryItem(id: string): Promise<boolean> {
    await api<{ success: boolean }>(`/api/inventory/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const items = storageAdapter.getInventory();
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
    const movementType: 'addition' | 'deduction' | 'adjustment' = delta > 0 ? 'addition' : delta < 0 ? 'deduction' : 'adjustment';
    const absQty = Math.abs(delta);

    const response = await api<{ item: InventoryItem }>(`/api/inventory/${encodeURIComponent(id)}/stock`, {
      method: 'POST',
      body: JSON.stringify({
        type: movementType,
        quantity: absQty,
        reason,
        staffName,
      }),
    });
    if (response && response.item) {
      const items = storageAdapter.getInventory();
      const index = items.findIndex((i) => i.id === id);
      if (index !== -1) {
        items[index] = response.item;
        storageAdapter.setInventory(items);
      } else {
        storageAdapter.setInventory([response.item, ...items]);
      }
      return response.item;
    }

    throw new InventoryApiError('Failed to record stock movement on server.');
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    const items = await this.listInventory();
    return items.filter((item) => {
      const status = this.calculateDynamicStatus(item.stock, item.minThreshold);
      return (status === 'Low Stock' || status === 'Critical') && item.active !== false;
    });
  },

  async listCategories(): Promise<string[]> {
    try {
      const response = await api<{ categories: string[] }>('/api/inventory/categories', { method: 'GET' });
      if (response && Array.isArray(response.categories)) {
        storageAdapter.setInventoryCategories(response.categories);
        return response.categories;
      }
    } catch (err) {
      if (err instanceof InventoryApiError) {
        console.warn(`[InventoryService] Server listCategories error (${err.status}):`, err.message);
      } else {
        console.warn('[InventoryService] Server listCategories network failure, using local storage fallback:', err);
      }
    }
    return storageAdapter.getInventoryCategories();
  },

  async addCategory(category: string): Promise<string[]> {
    const trimmed = category.trim();
    if (!trimmed) return this.listCategories();

    const response = await api<{ categories: string[] }>('/api/inventory/categories', {
      method: 'POST',
      body: JSON.stringify({ category: trimmed }),
    });
    if (response && Array.isArray(response.categories)) {
      storageAdapter.setInventoryCategories(response.categories);
      return response.categories;
    }

    throw new InventoryApiError('Failed to add inventory category on server.');
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

