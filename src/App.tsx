import React, { useState, useEffect, useCallback } from 'react';
import {
  Order,
  OrderStatus,
  MenuItem,
  ProductAddon,
  PromoBundle,
  InventoryItem,
  StoreSettings,
  CustomerUser,
  AdminPrincipal,
  ModifierCategory,
} from './types';
import {
  authService,
  customerService,
  orderService,
  menuService,
  categoryService,
  addonService,
  modifierCategoryService,
  promoService,
  inventoryService,
  settingsService,
  loyaltyService,
  reportingService,
  storageAdapter,
  generateOrderId,
  generateOrderNumber,
} from './services';

// Portal & Navigation Components
import { PublicLandingPage } from './components/public/PublicLandingPage';
import { CustomerOrderPortal } from './components/customer/CustomerOrderPortal';
import { CustomerAuthModal } from './components/auth/CustomerAuthModal';
import { AdminAuthModal } from './components/auth/AdminAuthModal';
import { Header } from './components/Header';
import { NavigationDrawer } from './components/NavigationDrawer';
import { DashboardView } from './components/DashboardView';
import { ActiveOrdersView } from './components/ActiveOrdersView';
import { AdminMenuView } from './components/AdminMenuView';
import { SettingsView } from './components/SettingsView';
import { StatsView } from './components/StatsView';
import { InventoryView } from './components/InventoryView';
import { CustomerManagementView } from './components/admin/CustomerManagementView';
import { AdminAccountManagementView } from './components/admin/AdminAccountManagementView';
import { RewardsView } from './components/RewardsView';
import { ProfileView } from './components/ProfileView';
import { BottomNavBar } from './components/BottomNavBar';
import { NewOrderModal } from './components/NewOrderModal';
import { EditProductModal } from './components/EditProductModal';
import { EditBundleModal } from './components/EditBundleModal';
import { EditAddonModal } from './components/EditAddonModal';
import { adminAuthService } from './services/adminAuthService';
import { parseRouteFromPath, syncBrowserUrl } from './services/routeService';

export default function App() {
  // -------------------------------------------------------------
  // Portal Mode: 'public' | 'customer' | 'admin'
  // -------------------------------------------------------------
  const [portalMode, setPortalMode] = useState<'public' | 'customer' | 'admin'>(() => {
    const route = parseRouteFromPath();
    return route.portalMode;
  });

  // Customer & Auth State
  const [customers, setCustomers] = useState<CustomerUser[]>(() => storageAdapter.getCustomers());
  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(() => authService.getCurrentCustomer());
  const [adminPrincipal, setAdminPrincipal] = useState<AdminPrincipal | null>(null);
  const [profilePictureVersion, setProfilePictureVersion] = useState(0);
  const isAdminAuthenticated = adminPrincipal !== null;

  // Auth Modals State
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState<boolean>(false);
  const [customerAuthInitialMode, setCustomerAuthInitialMode] = useState<'login' | 'register'>('login');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);

  // Store Branding & Profile Settings State
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => storageAdapter.getStoreSettings());

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => storageAdapter.getOrders());
  const [lastCustomerOrder, setLastCustomerOrder] = useState<Order | null>(null);
  const [isSyncingOrders, setIsSyncingOrders] = useState<boolean>(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const route = parseRouteFromPath();
    return route.adminTab;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Categories & Menu State
  const [categories, setCategories] = useState<string[]>(() => storageAdapter.getCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => storageAdapter.getMenuItems());
  const [addons, setAddons] = useState<ProductAddon[]>(() => storageAdapter.getAddons());
  const [modifierCategories, setModifierCategories] = useState<ModifierCategory[]>(() => storageAdapter.getModifierCategories());
  const [promoBundles, setPromoBundles] = useState<PromoBundle[]>(() => storageAdapter.getPromoBundles());

  // Inventory Management State
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => storageAdapter.getInventory());
  const [inventoryCategories, setInventoryCategories] = useState<string[]>(() => [
    'Coffee Beans',
    'Dairy & Plant Milk',
    'Syrups & Flavors',
    'Pastry Ingredients',
    'Packaging & Cups',
    'Tea & Infusions',
  ]);

  // Modals for Admin CRUD
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<MenuItem | null>(null);

  const [isBundleModalOpen, setIsBundleModalOpen] = useState<boolean>(false);
  const [bundleToEdit, setBundleToEdit] = useState<PromoBundle | null>(null);

  const [isAddonModalOpen, setIsAddonModalOpen] = useState<boolean>(false);
  const [addonToEdit, setAddonToEdit] = useState<ProductAddon | null>(null);

  // Live metrics calculation from real orders data via reportingService
  const [extraLoggedCups, setExtraLoggedCups] = useState<number>(0);
  const todaySales = reportingService.calculateTotalSales(orders);
  const cupsServed = reportingService.calculateCupsServed(orders) + extraLoggedCups;
  const dailyGoal = 100;
  const newMembers = customers.length;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Initial data loading through Service Layer
  useEffect(() => {
    async function initServicesData() {
      try {
        const [
          loadedCustomers,
          loadedOrders,
          loadedMenuItems,
          loadedCategories,
          loadedAddons,
          loadedModifierCats,
          loadedBundles,
          loadedInventory,
          loadedSettings,
          loadedInventoryCats,
        ] = await Promise.all([
          customerService.listCustomers(),
          orderService.listOrders(),
          menuService.listMenuItems(),
          categoryService.listCategories(),
          addonService.listAddons(),
          modifierCategoryService.listCategories(),
          promoService.listPromoBundles(),
          inventoryService.listInventory(),
          settingsService.getStoreSettings(),
          inventoryService.listCategories(),
        ]);

        setCustomers(loadedCustomers);
        setOrders(loadedOrders);
        setMenuItems(loadedMenuItems);
        setCategories(loadedCategories);
        setAddons(loadedAddons);
        setModifierCategories(loadedModifierCats);
        setPromoBundles(loadedBundles);
        setInventoryItems(loadedInventory);
        setStoreSettings(loadedSettings);
        setInventoryCategories(loadedInventoryCats);
      } catch (err) {
        console.error('[App] Failed to load data from services', err);
      }
    }

    initServicesData();
  }, []);

  useEffect(() => {
    let active = true;
    adminAuthService
      .getSession()
      .then((session) => {
        if (!active) return;
        setAdminPrincipal(session);
        const route = parseRouteFromPath();
        if (route.portalMode === 'admin' && session) {
          setPortalMode('admin');
          setCurrentTab(route.adminTab);
        } else if (route.portalMode === 'admin' && !session) {
          setIsAdminAuthModalOpen(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setAdminPrincipal(null);
        const route = parseRouteFromPath();
        if (route.portalMode === 'admin') {
          setIsAdminAuthModalOpen(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromPath();
      if (route.portalMode === 'admin') {
        if (adminPrincipal) {
          setPortalMode('admin');
          setCurrentTab(route.adminTab);
        } else {
          setPortalMode('public');
          setIsAdminAuthModalOpen(true);
        }
      } else if (route.portalMode === 'customer') {
        setPortalMode(currentCustomer ? 'customer' : 'public');
      } else {
        setPortalMode('public');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [adminPrincipal, currentCustomer]);

  useEffect(() => {
    if (portalMode === 'admin' && adminPrincipal) {
      syncBrowserUrl('admin', currentTab);
    } else if (portalMode === 'customer') {
      syncBrowserUrl('customer');
    } else if (portalMode === 'public') {
      syncBrowserUrl('public', undefined, true);
    }
  }, [portalMode, currentTab, adminPrincipal]);

  // -------------------------------------------------------------
  // Real-Time Cross-Device Order & Catalog Synchronization Engine
  // -------------------------------------------------------------
  const refreshOrders = useCallback(async () => {
    try {
      setIsSyncingOrders(true);
      const latestOrders = await orderService.listOrders();
      setOrders(latestOrders);

      // If customer has an active order tracking modal, update its status
      setLastCustomerOrder((prev) => {
        if (!prev) return null;
        const matched = latestOrders.find((o) => o.id === prev.id || o.orderNumber === prev.orderNumber);
        return matched || prev;
      });
    } catch (err) {
      console.warn('[App] Background order sync error:', err);
    } finally {
      setIsSyncingOrders(false);
    }
  }, []);

  const refreshCatalogAndInventory = useCallback(async () => {
    try {
      const [mItems, cats, ads, bundles, invItems, invCats, sets] = await Promise.all([
        menuService.listMenuItems(),
        categoryService.listCategories(),
        addonService.listAddons(),
        promoService.listPromoBundles(),
        inventoryService.listInventory(),
        inventoryService.listCategories(),
        settingsService.getStoreSettings(),
      ]);
      setMenuItems(mItems);
      setCategories(cats);
      setAddons(ads);
      setPromoBundles(bundles);
      setInventoryItems(invItems);
      setInventoryCategories(invCats);
      setStoreSettings(sets);
    } catch (err) {
      console.warn('[App] Background catalog/inventory/settings sync error:', err);
    }
  }, []);

  // Poll every 1 second only while the Admin Orders view is active and the tab is visible
  const shouldPollOrders = portalMode === 'admin' && adminPrincipal && (currentTab === 'orders' || currentTab === 'menu');

  useEffect(() => {
    if (!shouldPollOrders) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshOrders();
      }
    }, 1000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshOrders();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [refreshOrders, shouldPollOrders]);

  // Poll catalog and inventory every 6 seconds or on window focus
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshCatalogAndInventory();
      }
    }, 6000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshCatalogAndInventory();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [refreshCatalogAndInventory]);

  // -------------------------------------------------------------
  // Customer Auth Handlers
  // -------------------------------------------------------------
  const handleCustomerLoginSuccess = (customer: CustomerUser) => {
    setCurrentCustomer(customer);
    authService.updateCurrentCustomerSession(customer);
    setIsCustomerAuthModalOpen(false);
    setPortalMode('customer');
    showNotification(`Welcome back, ${customer.name}! (${customer.id}) ☕`);
  };

  const handleCustomerRegisterSuccess = async (customer: CustomerUser) => {
    const updated = await customerService.listCustomers();
    setCustomers(updated);
    setCurrentCustomer(customer);
    authService.updateCurrentCustomerSession(customer);
    setIsCustomerAuthModalOpen(false);
    setPortalMode('customer');
    showNotification(`Welcome to iLuvKeyks, ${customer.name}! ID: ${customer.id} 🎉`);
  };

  const handleCustomerLogout = () => {
    authService.logoutCustomer();
    setCurrentCustomer(null);
    setPortalMode('public');
    showNotification('You have been signed out.');
  };

  const handleUpdateCustomerProfile = async (updated: Partial<CustomerUser>) => {
    if (!currentCustomer) return;
    const res = await customerService.updateCustomer(currentCustomer.id, updated);
    if (res.success && res.customer) {
      setCurrentCustomer(res.customer);
      setCustomers((prev) => prev.map((c) => (c.id === res.customer!.id ? res.customer! : c)));
      showNotification('Profile updated successfully.');
    }
  };

  // -------------------------------------------------------------
  // Admin Auth Handlers
  // -------------------------------------------------------------
  const handleAdminLoginSuccess = (admin: AdminPrincipal) => {
    setAdminPrincipal(admin);
    setIsAdminAuthModalOpen(false);
    setPortalMode('admin');
    showNotification(`${admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} session authenticated.`);
  };

  const handleAdminLogout = async () => {
    try {
      await adminAuthService.logout();
    } catch {
      showNotification('Unable to log out. Please try again.');
      return;
    }
    setAdminPrincipal(null);
    setPortalMode('public');
    setIsDrawerOpen(false);
    showNotification('Admin logged out.');
  };

  const handleAdminSessionInvalidated = () => {
    setAdminPrincipal(null);
    setPortalMode('public');
    setIsDrawerOpen(false);
    showNotification('Password changed. Sign in again to continue.');
  };

  const handleProfileChanged = (hasProfilePicture: boolean) => {
    setAdminPrincipal((current) =>
      current
        ? {
            ...current,
            hasProfilePicture,
            profilePictureUrl: hasProfilePicture ? '/api/auth/profile-picture' : null,
          }
        : current,
    );
    setProfilePictureVersion((version) => version + 1);
  };

  // -------------------------------------------------------------
  // Navigation & Access Triggers
  // -------------------------------------------------------------
  const handleTriggerOrderOnline = () => {
    if (currentCustomer) {
      setPortalMode('customer');
    } else {
      setCustomerAuthInitialMode('login');
      setIsCustomerAuthModalOpen(true);
    }
  };

  const handleTriggerCustomerAuth = (mode: 'login' | 'register') => {
    setCustomerAuthInitialMode(mode);
    setIsCustomerAuthModalOpen(true);
  };

  const handleTriggerAdminPortal = () => {
    if (isAdminAuthenticated) {
      setPortalMode('admin');
    } else {
      setIsAdminAuthModalOpen(true);
    }
  };

  // -------------------------------------------------------------
  // Category Management Handlers
  // -------------------------------------------------------------
  const handleSaveCategory = async (newCategory: string, oldCategory?: string) => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    try {
      if (oldCategory && oldCategory !== trimmed) {
        const updatedCats = await categoryService.renameCategory(oldCategory, trimmed);
        const updatedMenu = await menuService.listMenuItems();
        setCategories(updatedCats);
        setMenuItems(updatedMenu);
        showNotification(`Category renamed to "${trimmed}" across all items.`);
      } else if (!categories.includes(trimmed)) {
        const updatedCats = await categoryService.addCategory(trimmed);
        setCategories(updatedCats);
        showNotification(`New category "${trimmed}" added to menu catalog! 🎉`);
      }
    } catch (err: any) {
      console.error('[Category] Save error:', err);
      showNotification(`⚠️ Category update failed: ${err?.message || 'Could not sync with server'}`);
    }
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    if (categories.length <= 1) {
      showNotification('At least one category must remain.');
      return;
    }
    try {
      const remaining = categories.filter((c) => c !== categoryToDelete);
      const fallback = remaining[0] || 'Coffee';
      const updatedCats = await categoryService.deleteCategory(categoryToDelete, fallback);
      const updatedMenu = await menuService.listMenuItems();
      setCategories(updatedCats);
      setMenuItems(updatedMenu);
      showNotification(`Category "${categoryToDelete}" deleted. Products moved to "${fallback}".`);
    } catch (err: any) {
      console.error('[Category] Delete error:', err);
      showNotification(`⚠️ Category deletion failed: ${err?.message || 'Could not sync with server'}`);
    }
  };

  // -------------------------------------------------------------
  // Order Management Handlers
  // -------------------------------------------------------------
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const updated = await orderService.updateOrderStatus(orderId, newStatus);
    if (updated) {
      setOrders(await orderService.listOrders());
    }

    if (newStatus === 'Completed') {
      showNotification(`Order #${orderId} marked as Completed!`);
    } else if (newStatus === 'Ready') {
      showNotification(`Order #${orderId} is Ready for pickup/serving! 🛎️`);
    } else if (newStatus === 'Brewing') {
      showNotification(`Order #${orderId} sent to espresso bar. ☕`);
    }
  };

  const handleCreateOrder = async (orderData: Partial<Order>) => {
    if (isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    try {
    const created = await orderService.createOrder({
      ...orderData,
      customerId: orderData.customerId || currentCustomer?.id,
      customerName: orderData.customerName || 'Walk-in Guest',
      status: 'New',
      orderType: orderData.orderType || 'Dine-In',
      tableNumber: orderData.tableNumber || (orderData.orderType === 'Dine-In' ? 'Table 1' : undefined),
      paymentMethod: orderData.paymentMethod || 'Cash',
      isCustomerOrder: false,
    });

    setOrders((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
    showNotification(`New POS Ticket #${created.orderNumber} placed for ₱${created.total.toFixed(2)}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handlePlaceCustomerOrder = async (customerOrder: Order) => {
    if (isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    try {
    const created = await orderService.createOrder({
      ...customerOrder,
      customerId: currentCustomer?.id,
      customerName: customerOrder.customerName || currentCustomer?.name || 'Customer',
      customerEmail: currentCustomer?.email,
      customerPhone: customerOrder.customerPhone || currentCustomer?.mobile,
      isCustomerOrder: true,
    });

    setOrders((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
    setLastCustomerOrder(created);

    // Update customer stamps and points via loyaltyService
    if (currentCustomer) {
      const rewardCalc = loyaltyService.calculateOrderRewards(
        created.total,
        currentCustomer.stamps || 0,
        currentCustomer.points || 0
      );
      await loyaltyService.addStamp(currentCustomer.id);
      await loyaltyService.addPoints(currentCustomer.id, rewardCalc.earnedPoints);
      const updatedCust = await customerService.getCustomer(currentCustomer.id);
      if (updatedCust) {
        setCurrentCustomer(updatedCust);
        setCustomers(await customerService.listCustomers());
      }
    }

    showNotification(`🎉 Order #${created.orderNumber} placed successfully! Barista notified.`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // -------------------------------------------------------------
  // Product CRUD Handlers
  // -------------------------------------------------------------
  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (item: MenuItem) => {
    setProductToEdit(item);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (product: MenuItem) => {
    try {
      if (productToEdit) {
        await menuService.updateMenuItem(product.id, product);
        showNotification(`"${product.name}" updated successfully!`);
      } else {
        await menuService.createMenuItem(product);
        showNotification(`"${product.name}" added to menu catalog! ☕`);
      }
      setMenuItems(await menuService.listMenuItems());
    } catch (err: any) {
      console.error('[Product] Save error:', err);
      showNotification(`⚠️ Failed to save product: ${err?.message || 'Server error'}`);
      throw err;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const itemToDelete = menuItems.find((i) => i.id === productId);
    try {
      await menuService.deleteMenuItem(productId);
      setMenuItems(await menuService.listMenuItems());
      showNotification(`"${itemToDelete?.name || 'Item'}" removed from catalog.`);
    } catch (err: any) {
      console.error('[Product] Delete error:', err);
      showNotification(`⚠️ Failed to delete product: ${err?.message || 'Server error'}`);
    }
  };

  const handleToggleProductAvailability = async (productId: string) => {
    try {
      const updated = await menuService.toggleAvailability(productId);
      if (updated) {
        setMenuItems(await menuService.listMenuItems());
        showNotification(`"${updated.name}" is now ${updated.available !== false ? 'Available' : 'Sold Out'}.`);
      }
    } catch (err: any) {
      console.error('[Product] Toggle availability error:', err);
      showNotification(`⚠️ Failed to update availability: ${err?.message || 'Server error'}`);
    }
  };

  // -------------------------------------------------------------
  // Bundle CRUD Handlers
  // -------------------------------------------------------------
  const handleOpenAddBundle = () => {
    setBundleToEdit(null);
    setIsBundleModalOpen(true);
  };

  const handleOpenEditBundle = (bundle: PromoBundle) => {
    setBundleToEdit(bundle);
    setIsBundleModalOpen(true);
  };

  const handleSaveBundle = async (bundle: PromoBundle) => {
    try {
      if (bundleToEdit) {
        await promoService.updatePromoBundle(bundle.id, bundle);
        showNotification(`Bundle "${bundle.name}" updated!`);
      } else {
        await promoService.createPromoBundle(bundle);
        showNotification(`New Combo Bundle "${bundle.name}" published! 🎉`);
      }
      setPromoBundles(await promoService.listPromoBundles());
    } catch (err: any) {
      console.error('[Bundle] Save error:', err);
      showNotification(`⚠️ Failed to save combo bundle: ${err?.message || 'Server error'}`);
    }
  };

  const handleDeleteBundle = async (bundleId: string) => {
    try {
      await promoService.deletePromoBundle(bundleId);
      setPromoBundles(await promoService.listPromoBundles());
      showNotification('Combo Bundle removed.');
    } catch (err: any) {
      console.error('[Bundle] Delete error:', err);
      showNotification(`⚠️ Failed to remove bundle: ${err?.message || 'Server error'}`);
    }
  };

  const handleToggleBundleStock = async (bundleId: string) => {
    try {
      const updated = await promoService.toggleStock(bundleId);
      if (updated) {
        setPromoBundles(await promoService.listPromoBundles());
        showNotification(`Combo "${updated.name}" is now ${updated.available !== false ? 'Active' : 'Paused'}.`);
      }
    } catch (err: any) {
      console.error('[Bundle] Toggle stock error:', err);
      showNotification(`⚠️ Failed to toggle combo availability: ${err?.message || 'Server error'}`);
    }
  };

  // -------------------------------------------------------------
  // Addon / Modifier CRUD Handlers
  // -------------------------------------------------------------
  const handleOpenAddAddon = () => {
    setAddonToEdit(null);
    setIsAddonModalOpen(true);
  };

  const handleOpenEditAddon = (addon: ProductAddon) => {
    setAddonToEdit(addon);
    setIsAddonModalOpen(true);
  };

  const handleSaveAddon = async (addon: ProductAddon) => {
    try {
      if (addonToEdit) {
        await addonService.updateAddon(addon.id, addon);
        showNotification(`Modifier "${addon.name}" updated!`);
      } else {
        await addonService.createAddon(addon);
        showNotification(`New Modifier "${addon.name}" added!`);
      }
      setAddons(await addonService.listAddons());
    } catch (err: any) {
      console.error('[Addon] Save error:', err);
      showNotification(`⚠️ Failed to save modifier: ${err?.message || 'Server error'}`);
    }
  };

  const handleDeleteAddon = async (addonId: string) => {
    try {
      await addonService.deleteAddon(addonId);
      setAddons(await addonService.listAddons());
      showNotification('Modifier deleted.');
    } catch (err: any) {
      console.error('[Addon] Delete error:', err);
      showNotification(`⚠️ Failed to delete modifier: ${err?.message || 'Server error'}`);
    }
  };

  const handleToggleAddonStock = async (addonId: string) => {
    try {
      const updated = await addonService.toggleStock(addonId);
      if (updated) {
        setAddons(await addonService.listAddons());
        showNotification(`Modifier "${updated.name}" is now ${updated.available !== false ? 'In Stock' : 'Out of Stock'}.`);
      }
    } catch (err: any) {
      console.error('[Addon] Toggle stock error:', err);
      showNotification(`⚠️ Failed to toggle modifier stock: ${err?.message || 'Server error'}`);
    }
  };

  const handleSaveModifierCategory = async (category: ModifierCategory) => {
    try {
      const existing = modifierCategories.some((mc) => mc.id === category.id);
      if (existing) {
        await modifierCategoryService.updateCategory(category.id, category);
        showNotification(`Category "${category.name}" updated!`);
      } else {
        await modifierCategoryService.createCategory(category);
        showNotification(`New category "${category.name}" created!`);
      }
      setModifierCategories(await modifierCategoryService.listCategories());
    } catch (err: any) {
      console.error('[ModifierCategory] Save error:', err);
      showNotification(`⚠️ Failed to save modifier category: ${err?.message || 'Server error'}`);
    }
  };

  const handleDeleteModifierCategory = async (categoryId: string) => {
    try {
      await modifierCategoryService.deleteCategory(categoryId);
      setModifierCategories(await modifierCategoryService.listCategories());
      showNotification('Modifier category deleted.');
    } catch (err: any) {
      console.error('[ModifierCategory] Delete error:', err);
      showNotification(`⚠️ Failed to delete modifier category: ${err?.message || 'Server error'}`);
    }
  };

  // -------------------------------------------------------------
  // Store Settings Handlers
  // -------------------------------------------------------------
  const handleSaveStoreSettings = async (newSettings: StoreSettings) => {
    try {
      await settingsService.updateStoreSettings(newSettings);
      setStoreSettings(newSettings);
      showNotification('Store profile & branding settings applied successfully! ✨');
    } catch (err: any) {
      console.error('[Settings] Save error:', err);
      showNotification(`⚠️ Failed to save settings: ${err?.message || 'Server error'}`);
      throw err;
    }
  };

  // -------------------------------------------------------------
  // Inventory Handlers
  // -------------------------------------------------------------
  const handleSaveInventoryItem = async (item: InventoryItem) => {
    try {
      const exists = inventoryItems.some((i) => i.id === item.id);
      if (exists) {
        await inventoryService.updateInventoryItem(item.id, item);
        showNotification(`Inventory item "${item.name}" updated.`);
      } else {
        await inventoryService.createInventoryItem(item);
        showNotification(`New inventory item "${item.name}" added.`);
      }
      setInventoryItems(await inventoryService.listInventory());
    } catch (err: any) {
      console.error('[Inventory] Save error:', err);
      showNotification(`⚠️ Failed to save inventory item: ${err?.message || 'Server error'}`);
    }
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    try {
      await inventoryService.deleteInventoryItem(itemId);
      setInventoryItems(await inventoryService.listInventory());
      showNotification('Inventory item removed.');
    } catch (err: any) {
      console.error('[Inventory] Delete error:', err);
      showNotification(`⚠️ Failed to delete inventory item: ${err?.message || 'Server error'}`);
    }
  };

  const handleAddInventoryCategory = async (category: string) => {
    try {
      const updated = await inventoryService.addCategory(category);
      setInventoryCategories(updated);
      showNotification(`Inventory category "${category}" added.`);
    } catch (err: any) {
      console.error('[Inventory] Add category error:', err);
      showNotification(`⚠️ Failed to add inventory category: ${err?.message || 'Server error'}`);
    }
  };

  const handleLogBrew = () => {
    setExtraLoggedCups((prev) => prev + 1);
    showNotification('Quick Brew logged! +1 Cup to Daily Counter ☕');
  };

  return (
    <div className="min-h-screen bg-[#fff8f5] text-[#1d1b1a] flex flex-col font-sans selection:bg-[#fbddca] selection:text-[#26170c]">
      {/* ========================================================================= */}
      {/* 1. PUBLIC WEBSITE PORTAL                                                  */}
      {/* ========================================================================= */}
      {portalMode === 'public' && (
        <PublicLandingPage
          storeSettings={storeSettings}
          menuItems={menuItems}
          categories={categories}
          promoBundles={promoBundles}
          currentCustomer={currentCustomer}
          onOrderOnline={handleTriggerOrderOnline}
          onOpenCustomerAuth={handleTriggerCustomerAuth}
          onOpenAdminAuth={handleTriggerAdminPortal}
          onCustomerLogout={handleCustomerLogout}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. CUSTOMER ORDERING PORTAL (Requires Authenticated Customer)            */}
      {/* ========================================================================= */}
      {portalMode === 'customer' && currentCustomer && (
        <CustomerOrderPortal
          menuItems={menuItems}
          categories={categories}
          addons={addons}
          modifierCategories={modifierCategories}
          promoBundles={promoBundles}
          orders={orders}
          currentCustomer={currentCustomer}
          onPlaceCustomerOrder={handlePlaceCustomerOrder}
          onSwitchToAdmin={handleTriggerAdminPortal}
          onExitToLanding={() => setPortalMode('public')}
          onCustomerLogout={handleCustomerLogout}
          onUpdateCustomerProfile={handleUpdateCustomerProfile}
          lastCustomerOrder={lastCustomerOrder}
          storeSettings={storeSettings}
        />
      )}

      {/* Fallback if user navigates to customer portal without auth */}
      {portalMode === 'customer' && !currentCustomer && (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#fff8f5]">
          <div className="bg-white rounded-3xl border border-[#dec1af] p-8 max-w-md w-full text-center shadow-lg space-y-4">
            <span className="material-symbols-outlined text-[48px] text-[#26170c]">lock</span>
            <h3 className="font-serif text-2xl font-bold text-[#26170c]">Sign In Required</h3>
            <p className="text-xs text-[#4f453f]">
              Please sign in or register a free customer account to place orders, track live status, and collect stamp rewards.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setCustomerAuthInitialMode('login');
                  setIsCustomerAuthModalOpen(true);
                }}
                className="w-full py-3 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Sign In to Order
              </button>
              <button
                onClick={() => {
                  setCustomerAuthInitialMode('register');
                  setIsCustomerAuthModalOpen(true);
                }}
                className="w-full py-2.5 bg-[#f3ecea] hover:bg-[#e8e1df] text-[#26170c] font-bold rounded-xl text-xs border border-[#dec1af] cursor-pointer"
              >
                Create New Account
              </button>
              <button
                onClick={() => setPortalMode('public')}
                className="text-xs text-[#81756e] hover:underline pt-1 cursor-pointer"
              >
                Return to Public Website
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADMIN & BARISTA MANAGEMENT PORTAL                                     */}
      {/* ========================================================================= */}
      {portalMode === 'admin' && adminPrincipal && (
        <>
          {/* Admin Header */}
          <Header
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenCartOrPOS={() => setIsNewOrderModalOpen(true)}
            activeOrdersCount={reportingService.calculateActiveOrdersCount(orders)}
            currentTab={currentTab}
            onSwitchToCustomerPortal={() => {
              if (currentCustomer) {
                setPortalMode('customer');
              } else {
                setCustomerAuthInitialMode('login');
                setIsCustomerAuthModalOpen(true);
              }
            }}
            storeSettings={storeSettings}
            admin={adminPrincipal}
            profilePictureVersion={profilePictureVersion}
            onLogout={() => void handleAdminLogout()}
          />

          {/* Navigation Drawer */}
          <NavigationDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            currentTab={currentTab}
            onSelectTab={(tab) => {
              setCurrentTab(tab);
              setIsDrawerOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSwitchToCustomerPortal={() => {
              if (currentCustomer) {
                setPortalMode('customer');
              } else {
                setCustomerAuthInitialMode('login');
                setIsCustomerAuthModalOpen(true);
              }
            }}
            storeSettings={storeSettings}
            admin={adminPrincipal}
            profilePictureVersion={profilePictureVersion}
            onLogout={() => void handleAdminLogout()}
          />

          {/* Main Admin Tab View Content */}
          <main className="flex-1 w-full max-w-5xl mx-auto">
            {/* Menu Management View */}
            {currentTab === 'admin-menu' && (
              <AdminMenuView
                menuItems={menuItems}
                categories={categories}
                addons={addons}
                modifierCategories={modifierCategories}
                promoBundles={promoBundles}
                onOpenAddProduct={handleOpenAddProduct}
                onOpenEditProduct={handleOpenEditProduct}
                onToggleAvailability={handleToggleProductAvailability}
                onDeleteProduct={handleDeleteProduct}
                onOpenAddBundle={handleOpenAddBundle}
                onOpenEditBundle={handleOpenEditBundle}
                onDeleteBundle={handleDeleteBundle}
                onToggleBundleStock={handleToggleBundleStock}
                onOpenAddAddon={handleOpenAddAddon}
                onOpenEditAddon={handleOpenEditAddon}
                onDeleteAddon={handleDeleteAddon}
                onToggleAddonStock={handleToggleAddonStock}
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
                onSaveModifierCategory={handleSaveModifierCategory}
                onDeleteModifierCategory={handleDeleteModifierCategory}
                onShowNotification={showNotification}
                onSwitchToCustomerPortal={() => {
                  if (currentCustomer) {
                    setPortalMode('customer');
                  } else {
                    setCustomerAuthInitialMode('login');
                    setIsCustomerAuthModalOpen(true);
                  }
                }}
              />
            )}

            {/* Store Branding & Profile Settings */}
            {currentTab === 'settings' && (
              <SettingsView
                settings={storeSettings}
                onSaveSettings={handleSaveStoreSettings}
                onResetSettings={async () => {
                  const reset = await settingsService.resetStoreSettings();
                  setStoreSettings(reset);
                  showNotification('Settings reset to default!');
                }}
                onShowNotification={showNotification}
                onSwitchToCustomerPortal={() => {
                  if (currentCustomer) {
                    setPortalMode('customer');
                  } else {
                    setCustomerAuthInitialMode('login');
                    setIsCustomerAuthModalOpen(true);
                  }
                }}
              />
            )}

            {/* Customer Directory View */}
            {currentTab === 'customers' && (
              <CustomerManagementView
                customers={customers}
                orders={orders}
                onShowNotification={showNotification}
              />
            )}

            {/* Dashboard / Sales Overview View */}
            {currentTab === 'home' && (
              <DashboardView
                orders={orders}
                onViewAllOrders={() => {
                  setCurrentTab('orders');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectOrder={() => {
                  setCurrentTab('orders');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                cupsServed={cupsServed}
                dailyGoal={dailyGoal}
                todaySales={todaySales}
                newMembers={customers.length}
                onLogBrew={handleLogBrew}
                onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
              />
            )}

            {/* Active Orders / Barista KDS View */}
            {(currentTab === 'orders' || currentTab === 'menu') && (
              <ActiveOrdersView
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
                onShowNotification={showNotification}
                onRefreshOrders={refreshOrders}
                isSyncing={isSyncingOrders}
              />
            )}

            {/* Stats View */}
            {currentTab === 'stats' && (
              <StatsView
                orders={orders}
                menuItems={menuItems}
                dailyGoal={dailyGoal}
              />
            )}

            {/* Inventory View */}
            {currentTab === 'inventory' && (
              <InventoryView
                items={inventoryItems}
                categories={inventoryCategories}
                onSaveItem={handleSaveInventoryItem}
                onDeleteItem={handleDeleteInventoryItem}
                onAddCategory={handleAddInventoryCategory}
                onShowNotification={showNotification}
              />
            )}

            {/* Rewards View */}
            {currentTab === 'rewards' && (
              <RewardsView onShowNotification={showNotification} />
            )}

            {/* Profile View */}
            {currentTab === 'profile' && (
              <ProfileView
                admin={adminPrincipal}
                profilePictureVersion={profilePictureVersion}
                onProfileChanged={handleProfileChanged}
                onShowNotification={showNotification}
              />
            )}

            {currentTab === 'admins' && (
              <AdminAccountManagementView
                principal={adminPrincipal}
                onSessionInvalidated={handleAdminSessionInvalidated}
                onShowNotification={showNotification}
              />
            )}
          </main>

          {/* POS / New Order Entry Modal */}
          <NewOrderModal
            isOpen={isNewOrderModalOpen}
            onClose={() => setIsNewOrderModalOpen(false)}
            onCreateOrder={handleCreateOrder}
            menuItems={menuItems}
            categories={categories}
          />

          {/* Admin: Edit/Add Product Modal */}
          <EditProductModal
            isOpen={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            onSave={handleSaveProduct}
            onDelete={handleDeleteProduct}
            productToEdit={productToEdit}
            addonsList={addons}
            modifierCategories={modifierCategories}
            onSaveAddon={handleSaveAddon}
            onDeleteAddon={handleDeleteAddon}
            onToggleAddonStock={handleToggleAddonStock}
            onSaveModifierCategory={handleSaveModifierCategory}
            onDeleteModifierCategory={handleDeleteModifierCategory}
            categoriesList={categories}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
          />

          {/* Admin: Edit/Add Promo Bundle Modal */}
          <EditBundleModal
            isOpen={isBundleModalOpen}
            onClose={() => setIsBundleModalOpen(false)}
            onSave={handleSaveBundle}
            onDelete={handleDeleteBundle}
            bundleToEdit={bundleToEdit}
            menuItems={menuItems}
          />

          {/* Admin: Edit/Add Modifier Modal */}
          <EditAddonModal
            isOpen={isAddonModalOpen}
            onClose={() => setIsAddonModalOpen(false)}
            onSave={handleSaveAddon}
            onDelete={handleDeleteAddon}
            addonToEdit={addonToEdit}
            modifierCategories={modifierCategories}
            productCategories={categories}
          />

          {/* Bottom Navigation & Floating Action Button */}
          <BottomNavBar
            currentTab={currentTab}
            onSelectTab={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
          />
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS (Customer Auth & Staff Admin Auth)                              */}
      {/* ========================================================================= */}
      <CustomerAuthModal
        isOpen={isCustomerAuthModalOpen}
        onClose={() => setIsCustomerAuthModalOpen(false)}
        onLoginSuccess={handleCustomerLoginSuccess}
        onRegisterSuccess={handleCustomerRegisterSuccess}
        onSuccess={handleCustomerLoginSuccess}
        initialMode={customerAuthInitialMode}
        storeSettings={storeSettings}
      />

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        storeSettings={storeSettings}
      />

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[160] bg-[#26170c] text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce border border-[#dec1af]/30 max-w-[90%] text-center">
          <span className="w-2 h-2 rounded-full bg-[#8fbc8f] animate-ping" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
