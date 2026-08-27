/**
 * Local Development Storage Adapter
 * 
 * NOTE: This is a TEMPORARY local development persistence adapter.
 * The production application will connect to Netlify Functions and persistent
 * server database storage. UI components and business logic must never call
 * localStorage directly.
 */

import {
  CustomerUser,
  Order,
  MenuItem,
  ProductAddon,
  PromoBundle,
  InventoryItem,
  StoreSettings,
  StaffUser,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_MENU_ITEMS,
  DEFAULT_CATEGORIES,
  INITIAL_ADDONS,
  INITIAL_PROMO_BUNDLES,
  INVENTORY_ITEMS,
  DEFAULT_STORE_SETTINGS,
} from '../data/initialData';

const KEYS = {
  CUSTOMERS: 'iluvkeyks_customers_v2',
  CURRENT_CUSTOMER: 'iluvkeyks_current_customer_v2',
  STAFF_SESSION: 'iluvkeyks_staff_session_v2',
  CUSTOMER_CREDENTIALS: 'iluvkeyks_cust_cred_v2',
  ORDERS: 'iluvkeyks_orders_v2',
  MENU_ITEMS: 'iluvkeyks_menu_items_v2',
  CATEGORIES: 'iluvkeyks_categories_v2',
  ADDONS: 'iluvkeyks_addons_v2',
  BUNDLES: 'iluvkeyks_bundles_v2',
  INVENTORY: 'iluvkeyks_inventory_v2',
  SETTINGS: 'iluvkeyks_settings_v2',
} as const;

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[StorageAdapter] Failed to parse key "${key}"`, err);
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[StorageAdapter] Failed to write key "${key}"`, err);
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch (err) {
    console.error(`[StorageAdapter] Failed to remove key "${key}"`, err);
  }
}

// Customers
export const storageAdapter = {
  getCustomers: (): CustomerUser[] => safeGetItem<CustomerUser[]>(KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
  setCustomers: (customers: CustomerUser[]): void => safeSetItem(KEYS.CUSTOMERS, customers),

  getCurrentCustomer: (): CustomerUser | null => safeGetItem<CustomerUser | null>(KEYS.CURRENT_CUSTOMER, null),
  setCurrentCustomer: (customer: CustomerUser | null): void => {
    if (customer) {
      safeSetItem(KEYS.CURRENT_CUSTOMER, customer);
    } else {
      safeRemoveItem(KEYS.CURRENT_CUSTOMER);
    }
  },

  // Customer Password Store (development only mock credential vault)
  getCustomerCredentials: (): Record<string, string> => safeGetItem<Record<string, string>>(KEYS.CUSTOMER_CREDENTIALS, {}),
  setCustomerCredential: (customerId: string, passwordHashOrDevString: string): void => {
    const creds = safeGetItem<Record<string, string>>(KEYS.CUSTOMER_CREDENTIALS, {});
    creds[customerId] = passwordHashOrDevString;
    safeSetItem(KEYS.CUSTOMER_CREDENTIALS, creds);
  },

  // Staff Session
  getStaffSession: (): StaffUser | null => safeGetItem<StaffUser | null>(KEYS.STAFF_SESSION, null),
  setStaffSession: (staff: StaffUser | null): void => {
    if (staff) {
      safeSetItem(KEYS.STAFF_SESSION, staff);
    } else {
      safeRemoveItem(KEYS.STAFF_SESSION);
    }
  },

  // Orders
  getOrders: (): Order[] => safeGetItem<Order[]>(KEYS.ORDERS, INITIAL_ORDERS),
  setOrders: (orders: Order[]): void => safeSetItem(KEYS.ORDERS, orders),

  // Menu Items
  getMenuItems: (): MenuItem[] => safeGetItem<MenuItem[]>(KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS),
  setMenuItems: (items: MenuItem[]): void => safeSetItem(KEYS.MENU_ITEMS, items),

  // Categories
  getCategories: (): string[] => safeGetItem<string[]>(KEYS.CATEGORIES, DEFAULT_CATEGORIES),
  setCategories: (categories: string[]): void => safeSetItem(KEYS.CATEGORIES, categories),

  // Addons
  getAddons: (): ProductAddon[] => safeGetItem<ProductAddon[]>(KEYS.ADDONS, INITIAL_ADDONS),
  setAddons: (addons: ProductAddon[]): void => safeSetItem(KEYS.ADDONS, addons),

  // Promo Bundles
  getPromoBundles: (): PromoBundle[] => safeGetItem<PromoBundle[]>(KEYS.BUNDLES, INITIAL_PROMO_BUNDLES),
  setPromoBundles: (bundles: PromoBundle[]): void => safeSetItem(KEYS.BUNDLES, bundles),

  // Inventory
  getInventory: (): InventoryItem[] => safeGetItem<InventoryItem[]>(KEYS.INVENTORY, INVENTORY_ITEMS),
  setInventory: (inventory: InventoryItem[]): void => safeSetItem(KEYS.INVENTORY, inventory),

  // Store Settings
  getStoreSettings: (): StoreSettings => safeGetItem<StoreSettings>(KEYS.SETTINGS, DEFAULT_STORE_SETTINGS),
  setStoreSettings: (settings: StoreSettings): void => safeSetItem(KEYS.SETTINGS, settings),
};
