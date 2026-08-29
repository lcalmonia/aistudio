import { StoreSettings } from '../types';
import { storageAdapter } from './storageAdapter';
import { DEFAULT_STORE_SETTINGS } from '../data/initialData';

export class SettingsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'SettingsApiError';
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
    throw new SettingsApiError(netErr?.message || 'Network error communicating with server.');
  }

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
      if (err instanceof SettingsApiError) {
        console.warn(`[SettingsService] Server getStoreSettings error (${err.status}):`, err.message);
      } else {
        console.warn('[SettingsService] Server getStoreSettings network failure, using local storage fallback:', err);
      }
    }
    return storageAdapter.getStoreSettings();
  },

  async updateStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
    const response = await api<{ settings: StoreSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    if (response && response.settings) {
      storageAdapter.setStoreSettings(response.settings);
      return response.settings;
    }

    throw new SettingsApiError('Failed to update store settings on server.');
  },

  async resetStoreSettings(): Promise<StoreSettings> {
    const response = await api<{ settings: StoreSettings }>('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ action: 'reset' }),
    });
    if (response && response.settings) {
      storageAdapter.setStoreSettings(response.settings);
      return response.settings;
    }

    throw new SettingsApiError('Failed to reset store settings on server.');
  },
};

