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
  ModifierCategory,
  PromoBundle,
  InventoryItem,
  InventoryMovement,
  LoyaltyTransaction,
  StoreSettings,
  StaffUser,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  DEFAULT_CATEGORIES,
  DEFAULT_MODIFIER_CATEGORIES,
  INITIAL_ADDONS,
  INVENTORY_ITEMS,
  DEFAULT_INVENTORY_CATEGORIES,
  DEFAULT_STORE_SETTINGS,
  INITIAL_STAFF_USERS,
} from '../data/initialData';

const KEYS = {
  CUSTOMERS: 'iluvkeyks_customers_v2',
  CURRENT_CUSTOMER: 'iluvkeyks_current_customer_v2',
  STAFF_SESSION: 'iluvkeyks_staff_session_v2',
  STAFF_USERS: 'iluvkeyks_staff_users_v2',
  STAFF_CREDENTIALS: 'iluvkeyks_staff_cred_v2',
  CUSTOMER_CREDENTIALS: 'iluvkeyks_cust_cred_v2',
  ORDERS: 'iluvkeyks_orders_v2',
  // v3 deliberately invalidates the previous browser catalog cache.
  // The server database is the only authoritative source for catalog data.
  MENU_ITEMS: 'iluvkeyks_menu_items_v3',
  CATEGORIES: 'iluvkeyks_categories_v2',
  MODIFIER_CATEGORIES: 'iluvkeyks_modifier_categories_v2',
  ADDONS: 'iluvkeyks_addons_v2',
  BUNDLES: 'iluvkeyks_bundles_v3',
  INVENTORY: 'iluvkeyks_inventory_v2',
  INVENTORY_CATEGORIES: 'iluvkeyks_inv_cats_v2',
  INVENTORY_MOVEMENTS: 'iluvkeyks_inv_mov_v2',
  LOYALTY_TRANSACTIONS: 'iluvkeyks_loyalty_tx_v2',
  SETTINGS: 'iluvkeyks_settings_v2',
} as const;

const LEGACY_CATALOG_KEYS = [
  'iluvkeyks_menu_items_v2',
  'iluvkeyks_bundles_v2',
] as const;

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[StorageAdapter] Failed to parse key \"${key}\"`, err);
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[StorageAdapter] Failed to write key \"${key}\"`, err);
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch (err) {
    console.error(`[StorageAdapter] Failed to remove key \"${key}\"`, err);
  }
}

function clearLegacyCatalogCache(): void {
  LEGACY_CATALOG_KEYS.forEach(safeRemoveItem);
}

// Remove the old browser catalog cache before any catalog state is read.
clearLegacyCatalogCache();

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

  // Staff Session & Admin Accounts
  getStaffSession: (): StaffUser | null => safeGetItem<StaffUser | null>(KEYS.STAFF_SESSION, null),
  setStaffSession: (staff: StaffUser | null): void => {
    if (staff) {
      safeSetItem(KEYS.STAFF_SESSION, staff);
    } else {
      safeRemoveItem(KEYS.STAFF_SESSION);
    }
  },

  getStaffUsers: (): StaffUser[] => safeGetItem<StaffUser[]>(KEYS.STAFF_USERS, INITIAL_STAFF_USERS),
  setStaffUsers: (staffUsers: StaffUser[]): void => safeSetItem(KEYS.STAFF_USERS, staffUsers),

  getStaffCredentials: (): Record<string, string> => safeGetItem<Record<string, string>>(KEYS.STAFF_CREDENTIALS, {
    'super_admin_1': 'superadmin123',
    'admin_1': 'admin123',
    'staff_1': 'staff123',
  }),
  setStaffCredential: (staffId: string, passcodeOrHash: string): void => {
    const creds = safeGetItem<Record<string, string>>(KEYS.STAFF_CREDENTIALS, {
      'super_admin_1': 'superadmin123',
      'admin_1': 'admin123',
      'staff_1': 'staff123',
    });
    creds[staffId] = passcodeOrHash;
    safeSetItem(KEYS.STAFF_CREDENTIALS, creds);
  },

  // Orders
  getOrders: (): Order[] => safeGetItem<Order[]>(KEYS.ORDERS, INITIAL_ORDERS),
  setOrders: (orders: Order[]): void => safeSetItem(KEYS.ORDERS, orders),

  // Menu Items
  // Catalog data is server-authoritative. Local storage is only a post-hydration cache.
  getMenuItems: (): MenuItem[] => safeGetItem<MenuItem[]>(KEYS.MENU_ITEMS, []),
  setMenuItems: (items: MenuItem[]): void => safeSetItem(KEYS.MENU_ITEMS, items),
  clearCatalogCache: (): void => {
    safeRemoveItem(KEYS.MENU_ITEMS);
    safeRemoveItem(KEYS.BUNDLES);
    clearLegacyCatalogCache();
  },

  // Categories
  getCategories: (): string[] => safeGetItem<string[]>(KEYS.CATEGORIES, DEFAULT_CATEGORIES),
  setCategories: (categories: string[]): void => safeSetItem(KEYS.CATEGORIES, categories),

  // Modifier Categories
  getModifierCategories: (): ModifierCategory[] => safeGetItem<ModifierCategory[]>(KEYS.MODIFIER_CATEGORIES, DEFAULT_MODIFIER_CATEGORIES),
  setModifierCategories: (cats: ModifierCategory[]): void => safeSetItem(KEYS.MODIFIER_CATEGORIES, cats),

  // Addons & Modifiers
  getAddons: (): ProductAddon[] => safeGetItem<ProductAddon[]>(KEYS.ADDONS, INITIAL_ADDONS),
  setAddons: (addons: ProductAddon[]): void => safeSetItem(KEYS.ADDONS, addons),

  // Promo Bundles
  getPromoBundles: (): PromoBundle[] => safeGetItem<PromoBundle[]>(KEYS.BUNDLES, []),
  setPromoBundles: (bundles: PromoBundle[]): void => safeSetItem(KEYS.BUNDLES, bundles),

  // Inventory
  getInventory: (): InventoryItem[] => safeGetItem<InventoryItem[]>(KEYS.INVENTORY, INVENTORY_ITEMS),
  setInventory: (inventory: InventoryItem[]): void => safeSetItem(KEYS.INVENTORY, inventory),

  // Inventory Categories (Data-driven and admin expandable)
  getInventoryCategories: (): string[] => safeGetItem<string[]>(KEYS.INVENTORY_CATEGORIES, DEFAULT_INVENTORY_CATEGORIES),
  setInventoryCategories: (categories: string[]): void => safeSetItem(KEYS.INVENTORY_CATEGORIES, categories),

  // Inventory Movements (Stock audit trail)
  getInventoryMovements: (): InventoryMovement[] => safeGetItem<InventoryMovement[]>(KEYS.INVENTORY_MOVEMENTS, []),
  setInventoryMovements: (movements: InventoryMovement[]): void => safeSetItem(KEYS.INVENTORY_MOVEMENTS, movements),
  addInventoryMovement: (movement: InventoryMovement): void => {
    const movements = safeGetItem<InventoryMovement[]>(KEYS.INVENTORY_MOVEMENTS, []);
    safeSetItem(KEYS.INVENTORY_MOVEMENTS, [movement, ...movements]);
  },

  // Loyalty Transactions (Points and stamps audit trail)
  getLoyaltyTransactions: (): LoyaltyTransaction[] => safeGetItem<LoyaltyTransaction[]>(KEYS.LOYALTY_TRANSACTIONS, []),
  setLoyaltyTransactions: (transactions: LoyaltyTransaction[]): void => safeSetItem(KEYS.LOYALTY_TRANSACTIONS, transactions),
  addLoyaltyTransaction: (transaction: LoyaltyTransaction): void => {
    const transactions = safeGetItem<LoyaltyTransaction[]>(KEYS.LOYALTY_TRANSACTIONS, []);
    safeSetItem(KEYS.LOYALTY_TRANSACTIONS, [transaction, ...transactions]);
  },

  // Store Settings
  getStoreSettings: (): StoreSettings => safeGetItem<StoreSettings>(KEYS.SETTINGS, DEFAULT_STORE_SETTINGS),
  setStoreSettings: (settings: StoreSettings): void => safeSetItem(KEYS.SETTINGS, settings),
};
