import { PromoBundle } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';
import { catalogImageService } from './catalogImageService';

export class PromoApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'PromoApiError';
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
    throw new PromoApiError(netErr?.message || 'Network error communicating with server.');
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new PromoApiError(data.error || 'The promotion request could not be completed.', response.status);
  }
  return data;
}

export const promoService = {
  async listPromoBundles(): Promise<PromoBundle[]> {
    try {
      const response = await api<{ bundles: PromoBundle[] }>('/api/bundles', { method: 'GET' });
      if (response && Array.isArray(response.bundles)) {
        storageAdapter.setPromoBundles(response.bundles);
        return response.bundles;
      }
    } catch (err) {
      if (err instanceof PromoApiError) {
        console.warn(`[PromoService] Server listPromoBundles error (${err.status}):`, err.message);
      } else {
        console.warn('[PromoService] Server listPromoBundles network failure:', err);
      }
    }
    // Never fall back to a stale local catalog. The server is authoritative.
    return [];
  },

  async getPromoBundle(id: string): Promise<PromoBundle | null> {
    try {
      const response = await api<{ bundle: PromoBundle }>(`/api/bundles/${encodeURIComponent(id)}`, { method: 'GET' });
      if (response && response.bundle) {
        return response.bundle;
      }
    } catch (err) {
      if (err instanceof PromoApiError && err.status === 404) {
        return null;
      }
      console.warn(`[PromoService] Server getPromoBundle(${id}) failed:`, err);
    }
    return null;
  },

  async savePromoBundles(bundles: PromoBundle[]): Promise<PromoBundle[]> {
    storageAdapter.setPromoBundles(bundles);
    return bundles;
  },

  async createPromoBundle(
    bundle: Omit<PromoBundle, 'id'> & { id?: string }
  ): Promise<PromoBundle> {
    const newBundle: PromoBundle = {
      ...bundle,
      id: bundle.id || generateEntityId('bundle'),
    };

    if (newBundle.image?.startsWith('data:image/')) {
      newBundle.image = await catalogImageService.persistImage(newBundle.image, 'bundle', newBundle.id);
    }

    const response = await api<{ bundle: PromoBundle }>('/api/bundles', {
      method: 'POST',
      body: JSON.stringify(newBundle),
    });
    if (response && response.bundle) {
      const bundles = storageAdapter.getPromoBundles().filter((b) => b.id !== response.bundle.id);
      storageAdapter.setPromoBundles([response.bundle, ...bundles]);
      return response.bundle;
    }

    throw new PromoApiError('Failed to create combo bundle on server.');
  },

  async updatePromoBundle(
    id: string,
    updates: Partial<PromoBundle>
  ): Promise<PromoBundle | null> {
    const serverUpdates: Partial<PromoBundle> = { ...updates };
    if (serverUpdates.image?.startsWith('data:image/')) {
      serverUpdates.image = await catalogImageService.persistImage(serverUpdates.image, 'bundle', id);
    }

    const response = await api<{ bundle: PromoBundle }>(`/api/bundles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(serverUpdates),
    });
    if (response && response.bundle) {
      const bundles = storageAdapter.getPromoBundles();
      const index = bundles.findIndex((b) => b.id === id);
      if (index !== -1) {
        bundles[index] = response.bundle;
        storageAdapter.setPromoBundles(bundles);
      } else {
        storageAdapter.setPromoBundles([response.bundle, ...bundles]);
      }
      return response.bundle;
    }

    throw new PromoApiError('Failed to update combo bundle on server.');
  },

  async deletePromoBundle(id: string): Promise<boolean> {
    await api<{ success: boolean }>(`/api/bundles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const bundles = storageAdapter.getPromoBundles();
    storageAdapter.setPromoBundles(bundles.filter((b) => b.id !== id));
    return true;
  },

  async toggleStock(id: string): Promise<PromoBundle | null> {
    const bundles = storageAdapter.getPromoBundles();
    const current = bundles.find((b) => b.id === id);
    const targetAvailability = current ? !current.available : true;

    const response = await api<{ bundle: PromoBundle }>(`/api/bundles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ available: targetAvailability }),
    });
    if (response && response.bundle) {
      const index = bundles.findIndex((b) => b.id === id);
      if (index !== -1) {
        bundles[index] = response.bundle;
        storageAdapter.setPromoBundles(bundles);
      } else {
        storageAdapter.setPromoBundles([response.bundle, ...bundles]);
      }
      return response.bundle;
    }

    throw new PromoApiError('Failed to toggle combo bundle availability on server.');
  },
};
