import { MenuItem } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

class MenuApiError extends Error {
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
    throw new MenuApiError(data.error || 'The menu request could not be completed.', response.status);
  }
  return data;
}

export const menuService = {
  async listMenuItems(): Promise<MenuItem[]> {
    try {
      const response = await api<{ menuItems: MenuItem[] }>('/api/menu-items', { method: 'GET' });
      if (response && Array.isArray(response.menuItems) && response.menuItems.length > 0) {
        storageAdapter.setMenuItems(response.menuItems);
        return response.menuItems;
      }
    } catch (err) {
      console.warn('[MenuService] Server listMenuItems failed, using local storage fallback:', err);
    }
    return storageAdapter.getMenuItems();
  },

  async getMenuItem(id: string): Promise<MenuItem | null> {
    try {
      const response = await api<{ menuItem: MenuItem }>(`/api/menu-items/${encodeURIComponent(id)}`, { method: 'GET' });
      if (response && response.menuItem) {
        return response.menuItem;
      }
    } catch (err) {
      console.warn(`[MenuService] Server getMenuItem(${id}) failed, trying local storage:`, err);
    }
    const items = storageAdapter.getMenuItems();
    return items.find((i) => i.id === id) || null;
  },

  async createMenuItem(item: Omit<MenuItem, 'id'> & { id?: string }): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...item,
      id: item.id || generateEntityId('menu'),
    };

    try {
      const response = await api<{ menuItem: MenuItem }>('/api/menu-items', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      if (response && response.menuItem) {
        const items = storageAdapter.getMenuItems().filter((i) => i.id !== response.menuItem.id);
        storageAdapter.setMenuItems([response.menuItem, ...items]);
        return response.menuItem;
      }
    } catch (err) {
      console.warn('[MenuService] Server createMenuItem failed, using local fallback:', err);
    }

    const items = storageAdapter.getMenuItems();
    const updated = [...items, newItem];
    storageAdapter.setMenuItems(updated);
    return newItem;
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    try {
      const response = await api<{ menuItem: MenuItem }>(`/api/menu-items/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (response && response.menuItem) {
        const items = storageAdapter.getMenuItems();
        const index = items.findIndex((i) => i.id === id);
        if (index !== -1) {
          items[index] = response.menuItem;
          storageAdapter.setMenuItems(items);
        }
        return response.menuItem;
      }
    } catch (err) {
      console.warn(`[MenuService] Server updateMenuItem(${id}) failed, using local fallback:`, err);
    }

    const items = storageAdapter.getMenuItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...items[index],
      ...updates,
    };

    items[index] = updatedItem;
    storageAdapter.setMenuItems(items);
    return updatedItem;
  },

  async deleteMenuItem(id: string): Promise<boolean> {
    try {
      await api<{ success: boolean }>(`/api/menu-items/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn(`[MenuService] Server deleteMenuItem(${id}) failed, using local fallback:`, err);
    }

    const items = storageAdapter.getMenuItems();
    const filtered = items.filter((i) => i.id !== id);
    storageAdapter.setMenuItems(filtered);
    return true;
  },

  async toggleAvailability(id: string): Promise<MenuItem | null> {
    try {
      const response = await api<{ menuItem: MenuItem }>(`/api/menu-items/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ toggleAvailability: true }),
      });
      if (response && response.menuItem) {
        const items = storageAdapter.getMenuItems();
        const index = items.findIndex((i) => i.id === id);
        if (index !== -1) {
          items[index] = response.menuItem;
          storageAdapter.setMenuItems(items);
        }
        return response.menuItem;
      }
    } catch (err) {
      console.warn(`[MenuService] Server toggleAvailability(${id}) failed, using local fallback:`, err);
    }

    const items = storageAdapter.getMenuItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...items[index],
      available: !items[index].available,
    };

    items[index] = updatedItem;
    storageAdapter.setMenuItems(items);
    return updatedItem;
  },

  async saveMenuItems(items: MenuItem[]): Promise<MenuItem[]> {
    storageAdapter.setMenuItems(items);
    return items;
  },
};

