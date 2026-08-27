import { PromoBundle } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

export const promoService = {
  async listPromoBundles(): Promise<PromoBundle[]> {
    return storageAdapter.getPromoBundles();
  },

  async getPromoBundle(id: string): Promise<PromoBundle | null> {
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
    const bundles = storageAdapter.getPromoBundles();
    const newBundle: PromoBundle = {
      ...bundle,
      id: bundle.id || generateEntityId('bundle'),
    };
    const updated = [...bundles, newBundle];
    storageAdapter.setPromoBundles(updated);
    return newBundle;
  },

  async updatePromoBundle(
    id: string,
    updates: Partial<PromoBundle>
  ): Promise<PromoBundle | null> {
    const bundles = storageAdapter.getPromoBundles();
    const index = bundles.findIndex((b) => b.id === id);
    if (index === -1) return null;
    const updated = { ...bundles[index], ...updates };
    bundles[index] = updated;
    storageAdapter.setPromoBundles(bundles);
    return updated;
  },

  async deletePromoBundle(id: string): Promise<boolean> {
    const bundles = storageAdapter.getPromoBundles();
    storageAdapter.setPromoBundles(bundles.filter((b) => b.id !== id));
    return true;
  },

  async toggleStock(id: string): Promise<PromoBundle | null> {
    const bundles = storageAdapter.getPromoBundles();
    const index = bundles.findIndex((b) => b.id === id);
    if (index === -1) return null;
    const updated = { ...bundles[index], available: !bundles[index].available };
    bundles[index] = updated;
    storageAdapter.setPromoBundles(bundles);
    return updated;
  },
};
