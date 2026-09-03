import { MenuItem } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';
import { catalogImageService } from './catalogImageService';

export class MenuApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'MenuApiError';
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
    throw new MenuApiError(netErr?.message || 'Network error communicating with server.');
  }

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
      if (response && Array.isArray(response.menuItems)) {
        storageAdapter.setMenuItems(response.menuItems);
        return response.menuItems;
      }
    } catch (err) {
      if (err instanceof MenuApiError) {
        console.warn(`[MenuService] Server listMenuItems error (${err.status}):`, err.message);
      } else {
        console.warn('[MenuService] Server listMenuItems network failure:', err);
      }
    }
    // Never fall back to a stale local catalog. The server is authoritative.
    return [];
  },

  async getMenuItem(id: string): Promise<MenuItem | null> {
    try {
      const response = await api<{ menuItem: MenuItem }>(`/api/menu-items/${encodeURIComponent(id)}`, { method: 'GET' });
      if (response && response.menuItem) {
        return response.menuItem;
      }
    } catch (err) {
      if (err instanceof MenuApiError && err.status === 404) {
        return null;
      }
      console.warn(`[MenuService] Server getMenuItem(${id}) failed:`, err);
    }
    // Never resolve a deleted/stale item from browser storage.
    return null;
  },

  async createMenuItem(item: Omit<MenuItem, 'id'> & { id?: string }): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...item,
      id: item.id || generateEntityId('menu'),
    };

    if (newItem.image?.startsWith('data:image/')) {
      newItem.image = await catalogImageService.persistImage(newItem.image, 'menu', newItem.id);
    }

    const response = await api<{ menuItem: MenuItem }>('/api/menu-items', {
      method: 'POST',
      body: JSON.stringify(newItem),
    });

    if (response && response.menuItem) {
      const items = storageAdapter.getMenuItems().filter((i) => i.id !== response.menuItem.id);
      storageAdapter.setMenuItems([response.menuItem, ...items]);
      return response.menuItem;
    }

    throw new MenuApiError('Failed to create menu item on server.');
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    const serverUpdates: Partial<MenuItem> = { ...updates };
    if (serverUpdates.image?.startsWith('data:image/')) {
      serverUpdates.image = await catalogImageService.persistImage(serverUpdates.image, 'menu', id);
    }

    const response = await api<{ menuItem: MenuItem }>(`/api/menu-items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(serverUpdates),
    });

    if (response && response.menuItem) {
      const items = storageAdapter.getMenuItems();
      const index = items.findIndex((i) => i.id === id);
      if (index !== -1) {
        items[index] = response.menuItem;
        storageAdapter.setMenuItems(items);
      } else {
        storageAdapter.setMenuItems([response.menuItem, ...items]);
      }
      return response.menuItem;
    }

    throw new MenuApiError('Failed to update menu item on server.');
  },

  async deleteMenuItem(id: string): Promise<boolean> {
    await api<{ success: boolean }>(`/api/menu-items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const items = storageAdapter.getMenuItems();
    const filtered = items.filter((i) => i.id !== id);
    storageAdapter.setMenuItems(filtered);
    return true;
  },

  async toggleAvailability(id: string): Promise<MenuItem | null> {
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
      } else {
        storageAdapter.setMenuItems([response.menuItem, ...items]);
      }
      return response.menuItem;
    }

    throw new MenuApiError('Failed to toggle availability on server.');
  },

  async saveMenuItems(items: MenuItem[]): Promise<MenuItem[]> {
    storageAdapter.setMenuItems(items);
    return items;
  },
};
