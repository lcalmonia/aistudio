import { MenuItem } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

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

function requireSuperAdminForCatalogMutation(): void {
  const session = storageAdapter.getStaffSession();
  if (session?.role !== 'super_admin') {
    throw new MenuApiError('Only Super Admin can create, edit, delete, or otherwise modify menu products.', 403);
  }
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
        console.warn('[MenuService] Server listMenuItems network failure, using local storage fallback:', err);
      }
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
      if (err instanceof MenuApiError && err.status === 404) {
        return null;
      }
      console.warn(`[MenuService] Server getMenuItem(${id}) failed, trying local storage:`, err);
    }
    const items = storageAdapter.getMenuItems();
    return items.find((i) => i.id === id) || null;
  },

  async createMenuItem(item: Omit<MenuItem, 'id'> & { id?: string }): Promise<MenuItem> {
    requireSuperAdminForCatalogMutation();

    const newItem: MenuItem = {
      ...item,
      id: item.id || generateEntityId('menu'),
    };

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
    requireSuperAdminForCatalogMutation();

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
      } else {
        storageAdapter.setMenuItems([response.menuItem, ...items]);
      }
      return response.menuItem;
    }

    throw new MenuApiError('Failed to update menu item on server.');
  },

  async deleteMenuItem(id: string): Promise<boolean> {
    requireSuperAdminForCatalogMutation();

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
    requireSuperAdminForCatalogMutation();
    storageAdapter.setMenuItems(items);
    return items;
  },
};
