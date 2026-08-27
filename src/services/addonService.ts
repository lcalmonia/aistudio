import { ProductAddon } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

export const addonService = {
  async listAddons(): Promise<ProductAddon[]> {
    return storageAdapter.getAddons();
  },

  async getAddon(id: string): Promise<ProductAddon | null> {
    const addons = storageAdapter.getAddons();
    return addons.find((a) => a.id === id) || null;
  },

  async saveAddons(addons: ProductAddon[]): Promise<ProductAddon[]> {
    storageAdapter.setAddons(addons);
    return addons;
  },

  async createAddon(addon: Omit<ProductAddon, 'id'> & { id?: string }): Promise<ProductAddon> {
    const addons = storageAdapter.getAddons();
    const newAddon: ProductAddon = {
      ...addon,
      id: addon.id || generateEntityId('addon'),
    };
    const updated = [...addons, newAddon];
    storageAdapter.setAddons(updated);
    return newAddon;
  },

  async updateAddon(id: string, updates: Partial<ProductAddon>): Promise<ProductAddon | null> {
    const addons = storageAdapter.getAddons();
    const index = addons.findIndex((a) => a.id === id);
    if (index === -1) return null;
    const updated = { ...addons[index], ...updates };
    addons[index] = updated;
    storageAdapter.setAddons(addons);
    return updated;
  },

  async deleteAddon(id: string): Promise<boolean> {
    const addons = storageAdapter.getAddons();
    storageAdapter.setAddons(addons.filter((a) => a.id !== id));
    return true;
  },

  async toggleStock(id: string): Promise<ProductAddon | null> {
    const addons = storageAdapter.getAddons();
    const index = addons.findIndex((a) => a.id === id);
    if (index === -1) return null;
    const updated = { ...addons[index], available: !addons[index].available };
    addons[index] = updated;
    storageAdapter.setAddons(addons);
    return updated;
  },
};
