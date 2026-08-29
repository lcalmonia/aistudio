import { ProductAddon } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

class AddonApiError extends Error {
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
    throw new AddonApiError(data.error || 'The add-on request could not be completed.', response.status);
  }
  return data;
}

export const addonService = {
  async listAddons(): Promise<ProductAddon[]> {
    try {
      const response = await api<{ addons: ProductAddon[] }>('/api/addons', { method: 'GET' });
      if (response && Array.isArray(response.addons) && response.addons.length > 0) {
        storageAdapter.setAddons(response.addons);
        return response.addons;
      }
    } catch (err) {
      console.warn('[AddonService] Server listAddons failed, using local storage fallback:', err);
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

    try {
      const response = await api<{ addon: ProductAddon }>('/api/addons', {
        method: 'POST',
        body: JSON.stringify(newAddon),
      });
      if (response && response.addon) {
        const addons = storageAdapter.getAddons().filter((a) => a.id !== response.addon.id);
        storageAdapter.setAddons([...addons, response.addon]);
        return response.addon;
      }
    } catch (err) {
      console.warn('[AddonService] Server createAddon failed, using local fallback:', err);
    }

    const addons = storageAdapter.getAddons();
    const updated = [...addons, newAddon];
    storageAdapter.setAddons(updated);
    return newAddon;
  },

  async updateAddon(id: string, updates: Partial<ProductAddon>): Promise<ProductAddon | null> {
    try {
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
        }
        return response.addon;
      }
    } catch (err) {
      console.warn(`[AddonService] Server updateAddon(${id}) failed, using local fallback:`, err);
    }

    const addons = storageAdapter.getAddons();
    const index = addons.findIndex((a) => a.id === id);
    if (index === -1) return null;
    const updated = { ...addons[index], ...updates };
    addons[index] = updated;
    storageAdapter.setAddons(addons);
    return updated;
  },

  async deleteAddon(id: string): Promise<boolean> {
    try {
      await api<{ success: boolean }>(`/api/addons/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn(`[AddonService] Server deleteAddon(${id}) failed, using local fallback:`, err);
    }

    const addons = storageAdapter.getAddons();
    storageAdapter.setAddons(addons.filter((a) => a.id !== id));
    return true;
  },

  async toggleStock(id: string): Promise<ProductAddon | null> {
    try {
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
        }
        return response.addon;
      }
    } catch (err) {
      console.warn(`[AddonService] Server toggleStock(${id}) failed, using local fallback:`, err);
    }

    const addons = storageAdapter.getAddons();
    const index = addons.findIndex((a) => a.id === id);
    if (index === -1) return null;
    const updated = { ...addons[index], available: !addons[index].available };
    addons[index] = updated;
    storageAdapter.setAddons(addons);
    return updated;
  },
};

