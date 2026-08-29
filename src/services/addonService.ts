import { ProductAddon } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

export class AddonApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AddonApiError';
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
    throw new AddonApiError(netErr?.message || 'Network error communicating with server.');
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new AddonApiError(data.error || 'The add-on request could not be completed.', response.status);
  }
  return data;
}

export const addonService = {
  async listAddons(): Promise<ProductAddon[]> {
    try {
      const response = await api<{ addons: ProductAddon[] }>('/api/addons', { method: 'GET' });
      if (response && Array.isArray(response.addons)) {
        storageAdapter.setAddons(response.addons);
        return response.addons;
      }
    } catch (err) {
      if (err instanceof AddonApiError) {
        console.warn(`[AddonService] Server listAddons error (${err.status}):`, err.message);
      } else {
        console.warn('[AddonService] Server listAddons network failure, using local storage fallback:', err);
      }
    }
    return storageAdapter.getAddons();
  },

  async getAddon(id: string): Promise<ProductAddon | null> {
    try {
      const response = await api<{ addon: ProductAddon }>(`/api/addons/${encodeURIComponent(id)}`, { method: 'GET' });
      if (response && response.addon) {
        return response.addon;
      }
    } catch (err) {
      if (err instanceof AddonApiError && err.status === 404) {
        return null;
      }
      console.warn(`[AddonService] Server getAddon(${id}) failed, trying local storage:`, err);
    }
    const addons = storageAdapter.getAddons();
    return addons.find((a) => a.id === id) || null;
  },

  async saveAddons(addons: ProductAddon[]): Promise<ProductAddon[]> {
    storageAdapter.setAddons(addons);
    return addons;
  },

  async createAddon(addon: Omit<ProductAddon, 'id'> & { id?: string }): Promise<ProductAddon> {
    const newAddon: ProductAddon = {
      ...addon,
      id: addon.id || generateEntityId('addon'),
    };

    const response = await api<{ addon: ProductAddon }>('/api/addons', {
      method: 'POST',
      body: JSON.stringify(newAddon),
    });
    if (response && response.addon) {
      const addons = storageAdapter.getAddons().filter((a) => a.id !== response.addon.id);
      storageAdapter.setAddons([...addons, response.addon]);
      return response.addon;
    }

    throw new AddonApiError('Failed to create modifier on server.');
  },

  async updateAddon(id: string, updates: Partial<ProductAddon>): Promise<ProductAddon | null> {
    const response = await api<{ addon: ProductAddon }>(`/api/addons/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (response && response.addon) {
      const addons = storageAdapter.getAddons();
      const index = addons.findIndex((a) => a.id === id);
      if (index !== -1) {
        addons[index] = response.addon;
        storageAdapter.setAddons(addons);
      } else {
        storageAdapter.setAddons([...addons, response.addon]);
      }
      return response.addon;
    }

    throw new AddonApiError('Failed to update modifier on server.');
  },

  async deleteAddon(id: string): Promise<boolean> {
    await api<{ success: boolean }>(`/api/addons/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const addons = storageAdapter.getAddons();
    storageAdapter.setAddons(addons.filter((a) => a.id !== id));
    return true;
  },

  async toggleStock(id: string): Promise<ProductAddon | null> {
    const response = await api<{ addon: ProductAddon }>(`/api/addons/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ toggleStock: true }),
    });
    if (response && response.addon) {
      const addons = storageAdapter.getAddons();
      const index = addons.findIndex((a) => a.id === id);
      if (index !== -1) {
        addons[index] = response.addon;
        storageAdapter.setAddons(addons);
      } else {
        storageAdapter.setAddons([...addons, response.addon]);
      }
      return response.addon;
    }

    throw new AddonApiError('Failed to toggle modifier stock on server.');
  },
};

