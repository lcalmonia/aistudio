import { CustomerUser, Order, MenuItem, ProductAddon, PromoBundle, InventoryItem, StoreSettings } from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_MENU_ITEMS,
  DEFAULT_CATEGORIES,
  INITIAL_ADDONS,
  INITIAL_PROMO_BUNDLES,
  INVENTORY_ITEMS,
  DEFAULT_STORE_SETTINGS,
} from './initialData';

const CUSTOMERS_KEY = 'iluvkeyks_customers_v1';
const CURRENT_CUSTOMER_KEY = 'iluvkeyks_current_customer_v1';
const ADMIN_AUTH_KEY = 'iluvkeyks_admin_auth_v1';
const ORDERS_KEY = 'iluvkeyks_orders_v1';
const MENU_ITEMS_KEY = 'iluvkeyks_menu_items_v1';
const CATEGORIES_KEY = 'iluvkeyks_categories_v1';
const ADDONS_KEY = 'iluvkeyks_addons_v1';
const BUNDLES_KEY = 'iluvkeyks_bundles_v1';
const INVENTORY_KEY = 'iluvkeyks_inventory_v1';
const SETTINGS_KEY = 'iluvkeyks_settings_v1';

// -------------------------------------------------------------
// Customers & Customer Authentication
// -------------------------------------------------------------
export function getStoredCustomers(): CustomerUser[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CUSTOMERS;
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

export function saveCustomers(customers: CustomerUser[]): void {
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (e) {
    console.error('Failed to save customers to storage', e);
  }
}

export function getStoredCurrentCustomer(): CustomerUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_CUSTOMER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomerUser;
  } catch {
    return null;
  }
}

export function saveCurrentCustomer(customer: CustomerUser | null): void {
  try {
    if (customer) {
      localStorage.setItem(CURRENT_CUSTOMER_KEY, JSON.stringify(customer));
    } else {
      localStorage.removeItem(CURRENT_CUSTOMER_KEY);
    }
  } catch (e) {
    console.error('Failed to save current customer', e);
  }
}

export function registerCustomer(data: {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  address: string;
}): { success: boolean; customer?: CustomerUser; error?: string } {
  const customers = getStoredCustomers();
  const trimmedEmail = data.email.trim().toLowerCase();
  const trimmedMobile = data.mobile.trim();

  // Check uniqueness of email and phone
  const existingEmail = customers.find((c) => c.email.toLowerCase() === trimmedEmail);
  if (existingEmail) {
    return { success: false, error: 'An account with this email address already exists. Please log in.' };
  }

  // Generate unique sequential ID: CUST-00001, CUST-00002...
  const nextNum = customers.length + 1;
  const newId = `CUST-${String(nextNum).padStart(5, '0')}`;

  const newCustomer: CustomerUser = {
    id: newId,
    name: data.name.trim(),
    email: trimmedEmail,
    mobile: trimmedMobile,
    password: data.password || 'password123',
    address: data.address.trim(),
    createdAt: new Date().toISOString().split('T')[0],
    status: 'active',
    stamps: 1, // Welcome bonus stamp!
    points: 50,
  };

  const updatedCustomers = [...customers, newCustomer];
  saveCustomers(updatedCustomers);
  saveCurrentCustomer(newCustomer);

  return { success: true, customer: newCustomer };
}

export function authenticateCustomer(
  emailOrPhone: string,
  password?: string
): { success: boolean; customer?: CustomerUser; error?: string } {
  const customers = getStoredCustomers();
  const query = emailOrPhone.trim().toLowerCase();

  const customer = customers.find(
    (c) =>
      c.email.toLowerCase() === query ||
      c.mobile.replace(/\D/g, '').endsWith(query.replace(/\D/g, '')) ||
      c.id.toLowerCase() === query
  );

  if (!customer) {
    return {
      success: false,
      error: 'Account not found. Please check your email or phone number, or register for a new account.',
    };
  }

  // Password verification (if provided)
  if (password && customer.password && customer.password !== password) {
    return {
      success: false,
      error: 'Incorrect password. Please try again.',
    };
  }

  saveCurrentCustomer(customer);
  return { success: true, customer };
}

export function logoutCustomer(): void {
  saveCurrentCustomer(null);
}

// -------------------------------------------------------------
// Admin Authentication
// -------------------------------------------------------------
export function getStoredAdminAuth(): boolean {
  try {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveAdminAuth(isAuth: boolean): void {
  try {
    if (isAuth) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  } catch (e) {
    console.error('Failed to save admin auth', e);
  }
}

// -------------------------------------------------------------
// Orders Store
// -------------------------------------------------------------
export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders to storage', e);
  }
}

// -------------------------------------------------------------
// Menu, Addons, Bundles, Settings & Inventory
// -------------------------------------------------------------
export function getStoredMenuItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(MENU_ITEMS_KEY);
    if (!raw) return INITIAL_MENU_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MENU_ITEMS;
  } catch {
    return INITIAL_MENU_ITEMS;
  }
}

export function saveMenuItems(items: MenuItem[]): void {
  try {
    localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save menu items', e);
  }
}

export function getStoredCategories(): string[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: string[]): void {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories', e);
  }
}

export function getStoredAddons(): ProductAddon[] {
  try {
    const raw = localStorage.getItem(ADDONS_KEY);
    if (!raw) return INITIAL_ADDONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ADDONS;
  } catch {
    return INITIAL_ADDONS;
  }
}

export function saveAddons(addons: ProductAddon[]): void {
  try {
    localStorage.setItem(ADDONS_KEY, JSON.stringify(addons));
  } catch (e) {
    console.error('Failed to save addons', e);
  }
}

export function getStoredBundles(): PromoBundle[] {
  try {
    const raw = localStorage.getItem(BUNDLES_KEY);
    if (!raw) return INITIAL_PROMO_BUNDLES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PROMO_BUNDLES;
  } catch {
    return INITIAL_PROMO_BUNDLES;
  }
}

export function saveBundles(bundles: PromoBundle[]): void {
  try {
    localStorage.setItem(BUNDLES_KEY, JSON.stringify(bundles));
  } catch (e) {
    console.error('Failed to save promo bundles', e);
  }
}

export function getStoredInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) return INVENTORY_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INVENTORY_ITEMS;
  } catch {
    return INVENTORY_ITEMS;
  }
}

export function saveInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save inventory', e);
  }
}

export function getStoredSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_STORE_SETTINGS;
    return JSON.parse(raw) as StoreSettings;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function saveSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
