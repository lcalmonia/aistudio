/**
 * Backward-compatibility proxy delegating to centralized services and storage adapter.
 * Direct localStorage access is isolated inside src/services/storageAdapter.ts.
 */

import { CustomerUser, Order, MenuItem, ProductAddon, PromoBundle, InventoryItem, StoreSettings } from '../types';
import { storageAdapter } from '../services/storageAdapter';
import { authService } from '../services/authService';

export const getStoredCustomers = (): CustomerUser[] => storageAdapter.getCustomers();
export const saveCustomers = (customers: CustomerUser[]): void => storageAdapter.setCustomers(customers);

export const getStoredCurrentCustomer = (): CustomerUser | null => storageAdapter.getCurrentCustomer();
export const saveCurrentCustomer = (customer: CustomerUser | null): void => storageAdapter.setCurrentCustomer(customer);

export const getStoredAdminAuth = (): boolean => authService.isStaffAuthenticated();
export const saveAdminAuth = (isAuth: boolean): void => {
  if (isAuth) {
    authService.loginStaff('staff', 'admin');
  } else {
    authService.logoutStaff();
  }
};

export const getStoredOrders = (): Order[] => storageAdapter.getOrders();
export const saveOrders = (orders: Order[]): void => storageAdapter.setOrders(orders);

export const getStoredMenuItems = (): MenuItem[] => storageAdapter.getMenuItems();
export const saveMenuItems = (items: MenuItem[]): void => storageAdapter.setMenuItems(items);

export const getStoredCategories = (): string[] => storageAdapter.getCategories();
export const saveCategories = (categories: string[]): void => storageAdapter.setCategories(categories);

export const getStoredAddons = (): ProductAddon[] => storageAdapter.getAddons();
export const saveAddons = (addons: ProductAddon[]): void => storageAdapter.setAddons(addons);

export const getStoredBundles = (): PromoBundle[] => storageAdapter.getPromoBundles();
export const saveBundles = (bundles: PromoBundle[]): void => storageAdapter.setPromoBundles(bundles);

export const getStoredInventory = (): InventoryItem[] => storageAdapter.getInventory();
export const saveInventory = (items: InventoryItem[]): void => storageAdapter.setInventory(items);

export const getStoredSettings = (): StoreSettings => storageAdapter.getStoreSettings();
export const saveSettings = (settings: StoreSettings): void => storageAdapter.setStoreSettings(settings);
