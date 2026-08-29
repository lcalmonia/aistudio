import { StoreSettings } from '../types';
import { storageAdapter } from './storageAdapter';
import { DEFAULT_STORE_SETTINGS } from '../data/initialData';

class SettingsApiError extends Error {
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
    throw new SettingsApiError(data.error || 'The settings request could not be completed.', response.status);
  }
  return data;
}

export const settingsService = {
  async getStoreSettings(): Promise<StoreSettings> {
    try {
      const response = await api<{ settings: StoreSettings }>('/api/settings', { method: 'GET' });
      if (response && response.settings) {
        storageAdapter.setStoreSettings(response.settings);
        return response.settings;
      }
    } catch (err) {
      console.warn('[SettingsService] Server getStoreSettings failed, using local fallback:', err);
    }
    return storageAdapter.getStoreSettings();
  },

  async updateStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
    try {
      const response = await api<{ settings: StoreSettings }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (response && response.settings) {
        storageAdapter.setStoreSettings(response.settings);
        return response.settings;
      }
    } catch (err) {
      console.warn('[SettingsService] Server updateStoreSettings failed, using local fallback:', err);
    }

    storageAdapter.setStoreSettings(settings);
    return settings;
  },

  async resetStoreSettings(): Promise<StoreSettings> {
    try {
      const response = await api<{ settings: StoreSettings }>('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset' }),
      });
      if (response && response.settings) {
        storageAdapter.setStoreSettings(response.settings);
        return response.settings;
      }
    } catch (err) {
      console.warn('[SettingsService] Server resetStoreSettings failed, using local fallback:', err);
    }

    storageAdapter.setStoreSettings(DEFAULT_STORE_SETTINGS);
    return DEFAULT_STORE_SETTINGS;
  },
};

