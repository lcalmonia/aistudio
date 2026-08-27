import { StoreSettings } from '../types';
import { storageAdapter } from './storageAdapter';
import { DEFAULT_STORE_SETTINGS } from '../data/initialData';

export const settingsService = {
  async getStoreSettings(): Promise<StoreSettings> {
    return storageAdapter.getStoreSettings();
  },

  async updateStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
    storageAdapter.setStoreSettings(settings);
    return settings;
  },

  async resetStoreSettings(): Promise<StoreSettings> {
    storageAdapter.setStoreSettings(DEFAULT_STORE_SETTINGS);
    return DEFAULT_STORE_SETTINGS;
  },
};
