import { PromoBundle } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

class PromoApiError extends Error {
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
    throw new PromoApiError(data.error || 'The promotion request could not be completed.', response.status);
  }
  return data;
}

export const promoService = {
  async listPromoBundles(): Promise<PromoBundle[]> {
    try {
      const response = await api<{ bundles: PromoBundle[] }>('/api/bundles', { method: 'GET' });
      if (response && Array.isArray(response.bundles) && response.bundles.length > 0) {
        storageAdapter.setPromoBundles(response.bundles);
        return response.bundles;
      }
    } catch (err) {
      console.warn('[PromoService] Server listPromoBundles failed, using local storage fallback:', err);
    }
    return storageAdapter.getPromoBundles();
  },

  async getPromoBundle(id: string): Promise<PromoBundle | null> {
    try {
      const response = await api<{ bundle: PromoBundle }>(`/api/bundles/${encodeURIComponent(id)}`, { method: 'GET' });
      if (response && response.bundle) {
        return response.bundle;
      }
    } catch (err) {
      console.warn(`[PromoService] Server getPromoBundle(${id}) failed, trying local storage:`, err);
    }
    const bundles = storageAdapter.getPromoBundles();
    return bundles.find((b) => b.id === id) || null;
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

    try {
      const response = await api<{ bundle: PromoBundle }>('/api/bundles', {
        method: 'POST',
        body: JSON.stringify(newBundle),
      });
      if (response && response.bundle) {
        const bundles = storageAdapter.getPromoBundles().filter((b) => b.id !== response.bundle.id);
        storageAdapter.setPromoBundles([response.bundle, ...bundles]);
        return response.bundle;
      }
    } catch (err) {
      console.warn('[PromoService] Server createPromoBundle failed, using local fallback:', err);
    }

    const bundles = storageAdapter.getPromoBundles();
    const updated = [...bundles, newBundle];
    storageAdapter.setPromoBundles(updated);
    return newBundle;
  },

  async updatePromoBundle(
    id: string,
    updates: Partial<PromoBundle>
  ): Promise<PromoBundle | null> {
    try {
      const response = await api<{ bundle: PromoBundle }>(`/api/bundles/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (response && response.bundle) {
        const bundles = storageAdapter.getPromoBundles();
        const index = bundles.findIndex((b) => b.id === id);
        if (index !== -1) {
          bundles[index] = response.bundle;
          storageAdapter.setPromoBundles(bundles);
        }
        return response.bundle;
      }
    } catch (err) {
      console.warn(`[PromoService] Server updatePromoBundle(${id}) failed, using local fallback:`, err);
    }

    const bundles = storageAdapter.getPromoBundles();
    const index = bundles.findIndex((b) => b.id === id);
    if (index === -1) return null;
    const updated = { ...bundles[index], ...updates };
    bundles[index] = updated;
    storageAdapter.setPromoBundles(bundles);
    return updated;
  },

  async deletePromoBundle(id: string): Promise<boolean> {
    try {
      await api<{ success: boolean }>(`/api/bundles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn(`[PromoService] Server deletePromoBundle(${id}) failed, using local fallback:`, err);
    }

    const bundles = storageAdapter.getPromoBundles();
    storageAdapter.setPromoBundles(bundles.filter((b) => b.id !== id));
    return true;
  },

  async toggleStock(id: string): Promise<PromoBundle | null> {
    const bundles = storageAdapter.getPromoBundles();
    const index = bundles.findIndex((b) => b.id === id);
    if (index === -1) return null;
    const updated = { ...bundles[index], available: !bundles[index].available };

    try {
      const response = await api<{ bundle: PromoBundle }>(`/api/bundles/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ available: updated.available }),
      });
      if (response && response.bundle) {
        bundles[index] = response.bundle;
        storageAdapter.setPromoBundles(bundles);
        return response.bundle;
      }
    } catch (err) {
      console.warn(`[PromoService] Server toggleStock(${id}) failed, using local fallback:`, err);
    }

    bundles[index] = updated;
    storageAdapter.setPromoBundles(bundles);
    return updated;
  },
};

