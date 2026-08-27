import { ProductAddon, PromoBundle, InventoryItem, StoreSettings } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';
import { customerService } from './customerService';

// -------------------------------------------------------------
// Category Service
// -------------------------------------------------------------
export const categoryService = {
  async listCategories(): Promise<string[]> {
    return storageAdapter.getCategories();
  },

  async saveCategories(categories: string[]): Promise<string[]> {
    storageAdapter.setCategories(categories);
    return categories;
  },

  async addCategory(categoryName: string): Promise<string[]> {
    const categories = storageAdapter.getCategories();
    const clean = categoryName.trim();
    if (!clean || categories.includes(clean)) return categories;
    const updated = [...categories, clean];
    storageAdapter.setCategories(updated);
    return updated;
  },
};

// -------------------------------------------------------------
// Add-on Service
// -------------------------------------------------------------
export const addonService = {
  async listAddons(): Promise<ProductAddon[]> {
    return storageAdapter.getAddons();
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
};

// -------------------------------------------------------------
// Promo Bundle Service
// -------------------------------------------------------------
export const promoService = {
  async listPromoBundles(): Promise<PromoBundle[]> {
    return storageAdapter.getPromoBundles();
  },

  async savePromoBundles(bundles: PromoBundle[]): Promise<PromoBundle[]> {
    storageAdapter.setPromoBundles(bundles);
    return bundles;
  },

  async createPromoBundle(bundle: Omit<PromoBundle, 'id'> & { id?: string }): Promise<PromoBundle> {
    const bundles = storageAdapter.getPromoBundles();
    const newBundle: PromoBundle = {
      ...bundle,
      id: bundle.id || generateEntityId('bundle'),
    };
    const updated = [...bundles, newBundle];
    storageAdapter.setPromoBundles(updated);
    return newBundle;
  },

  async updatePromoBundle(id: string, updates: Partial<PromoBundle>): Promise<PromoBundle | null> {
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
};

// -------------------------------------------------------------
// Inventory Service
// -------------------------------------------------------------
export const inventoryService = {
  async listInventory(): Promise<InventoryItem[]> {
    return storageAdapter.getInventory();
  },

  async saveInventory(items: InventoryItem[]): Promise<InventoryItem[]> {
    storageAdapter.setInventory(items);
    return items;
  },

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const items = storageAdapter.getInventory();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;
    const updated = { ...items[index], ...updates };
    items[index] = updated;
    storageAdapter.setInventory(items);
    return updated;
  },

  async recordStockMovement(id: string, delta: number): Promise<InventoryItem | null> {
    const items = storageAdapter.getInventory();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;
    const current = items[index];
    const newStock = Math.max(0, current.stock + delta);
    const newStatus = newStock <= 0 ? 'Critical' : newStock <= current.minThreshold ? 'Low Stock' : 'In Stock';
    const updated: InventoryItem = {
      ...current,
      stock: newStock,
      status: newStatus,
      lastRestocked: delta > 0 ? new Date().toISOString().split('T')[0] : current.lastRestocked,
    };
    items[index] = updated;
    storageAdapter.setInventory(items);
    return updated;
  },
};

// -------------------------------------------------------------
// Store Settings Service
// -------------------------------------------------------------
export const settingsService = {
  async getStoreSettings(): Promise<StoreSettings> {
    return storageAdapter.getStoreSettings();
  },

  async updateStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
    storageAdapter.setStoreSettings(settings);
    return settings;
  },
};

// -------------------------------------------------------------
// Loyalty & Rewards Service
// -------------------------------------------------------------
export const loyaltyService = {
  async getCustomerLoyalty(customerId: string): Promise<{ stamps: number; points: number } | null> {
    const customer = await customerService.getCustomer(customerId);
    if (!customer) return null;
    return {
      stamps: customer.stamps || 0,
      points: customer.points || 0,
    };
  },

  async addPoints(customerId: string, pointsEarned: number): Promise<number | null> {
    const customer = await customerService.getCustomer(customerId);
    if (!customer) return null;
    const newPoints = (customer.points || 0) + pointsEarned;
    await customerService.updateCustomer(customerId, { points: newPoints });
    return newPoints;
  },

  async addStamp(customerId: string, maxStamps: number = 10): Promise<{ stamps: number; unlockedReward: boolean } | null> {
    const customer = await customerService.getCustomer(customerId);
    if (!customer) return null;
    const currentStamps = customer.stamps || 0;
    const nextStamps = (currentStamps % maxStamps) + 1;
    const unlockedReward = nextStamps === maxStamps;
    await customerService.updateCustomer(customerId, { stamps: nextStamps });
    return { stamps: nextStamps, unlockedReward };
  },

  async redeemPoints(customerId: string, pointsCost: number): Promise<{ success: boolean; remainingPoints?: number; error?: string }> {
    const customer = await customerService.getCustomer(customerId);
    if (!customer) return { success: false, error: 'Customer not found.' };
    const currentPoints = customer.points || 0;
    if (currentPoints < pointsCost) {
      return { success: false, error: 'Insufficient loyalty reward points.' };
    }
    const remaining = currentPoints - pointsCost;
    await customerService.updateCustomer(customerId, { points: remaining });
    return { success: true, remainingPoints: remaining };
  },
};
