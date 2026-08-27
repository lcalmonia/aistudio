import React, { useState, useEffect } from 'react';
import {
  Order,
  OrderStatus,
  MenuItem,
  ProductAddon,
  PromoBundle,
  InventoryItem,
  StoreSettings,
  CustomerUser,
} from './types';
import {
  authService,
  customerService,
  orderService,
  menuService,
  categoryService,
  addonService,
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
import { RewardsView } from './components/RewardsView';
import { ProfileView } from './components/ProfileView';
import { BottomNavBar } from './components/BottomNavBar';
import { NewOrderModal } from './components/NewOrderModal';
import { EditProductModal } from './components/EditProductModal';
import { EditBundleModal } from './components/EditBundleModal';
import { EditAddonModal } from './components/EditAddonModal';

export default function App() {
  // -------------------------------------------------------------
  // Portal Mode: 'public' | 'customer' | 'admin'
  // -------------------------------------------------------------
  const [portalMode, setPortalMode] = useState<'public' | 'customer' | 'admin'>('public');

  // Customer & Auth State
  const [customers, setCustomers] = useState<CustomerUser[]>(() => storageAdapter.getCustomers());
  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(() => authService.getCurrentCustomer());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => authService.isStaffAuthenticated());

  // Auth Modals State
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState<boolean>(false);
  const [customerAuthInitialMode, setCustomerAuthInitialMode] = useState<'login' | 'register'>('login');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);

  // Store Branding & Profile Settings State
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => storageAdapter.getStoreSettings());

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => storageAdapter.getOrders());
  const [lastCustomerOrder, setLastCustomerOrder] = useState<Order | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('admin-menu');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Categories & Menu State
  const [categories, setCategories] = useState<string[]>(() => storageAdapter.getCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => storageAdapter.getMenuItems());
  const [addons, setAddons] = useState<ProductAddon[]>(() => storageAdapter.getAddons());
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
  const handleAdminLoginSuccess = () => {
    authService.setStaffAuthenticated(true);
    setIsAdminAuthenticated(true);
    setIsAdminAuthModalOpen(false);
    setPortalMode('admin');
    showNotification('Staff / Admin session authenticated.');
  };

  const handleAdminLogout = () => {
    authService.logoutStaff();
    setIsAdminAuthenticated(false);
    setPortalMode('public');
    showNotification('Staff / Admin logged out.');
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

    if (oldCategory && oldCategory !== trimmed) {
      await categoryService.renameCategory(oldCategory, trimmed);
      // Update menu items in category
      const updatedMenu = menuItems.map((item) =>
        item.category === oldCategory ? { ...item, category: trimmed } : item
      );
      await menuService.saveMenuItems(updatedMenu);
      setCategories(await categoryService.listCategories());
      setMenuItems(updatedMenu);
      showNotification(`Category renamed to "${trimmed}" across all items.`);
    } else if (!categories.includes(trimmed)) {
      const updatedCats = await categoryService.addCategory(trimmed);
      setCategories(updatedCats);
      showNotification(`New category "${trimmed}" added to menu catalog! 🎉`);
    }
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    if (categories.length <= 1) {
      showNotification('At least one category must remain.');
      return;
    }
    const remaining = categories.filter((c) => c !== categoryToDelete);
    const fallback = remaining[0] || 'Coffee';
    await categoryService.deleteCategory(categoryToDelete);
    const updatedMenu = menuItems.map((item) =>
      item.category === categoryToDelete ? { ...item, category: fallback } : item
    );
    await menuService.saveMenuItems(updatedMenu);
    setCategories(remaining);
    setMenuItems(updatedMenu);
    showNotification(`Category "${categoryToDelete}" deleted. Products moved to "${fallback}".`);
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
  };

  const handlePlaceCustomerOrder = async (customerOrder: Order) => {
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
    if (productToEdit) {
      await menuService.updateMenuItem(product.id, product);
      showNotification(`"${product.name}" updated successfully!`);
    } else {
      await menuService.createMenuItem(product);
      showNotification(`"${product.name}" added to menu catalog! ☕`);
    }
    setMenuItems(await menuService.listMenuItems());
  };

  const handleDeleteProduct = async (productId: string) => {
    const itemToDelete = menuItems.find((i) => i.id === productId);
    await menuService.deleteMenuItem(productId);
    setMenuItems(await menuService.listMenuItems());
    showNotification(`"${itemToDelete?.name || 'Item'}" removed from catalog.`);
  };

  const handleToggleProductAvailability = async (productId: string) => {
    const updated = await menuService.toggleAvailability(productId);
    if (updated) {
      setMenuItems(await menuService.listMenuItems());
      showNotification(`"${updated.name}" is now ${updated.available !== false ? 'Available' : 'Sold Out'}.`);
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
    if (bundleToEdit) {
      await promoService.updatePromoBundle(bundle.id, bundle);
      showNotification(`Bundle "${bundle.name}" updated!`);
    } else {
      await promoService.createPromoBundle(bundle);
      showNotification(`New Combo Bundle "${bundle.name}" published! 🎉`);
    }
    setPromoBundles(await promoService.listPromoBundles());
  };

  const handleDeleteBundle = async (bundleId: string) => {
    await promoService.deletePromoBundle(bundleId);
    setPromoBundles(await promoService.listPromoBundles());
    showNotification('Combo Bundle removed.');
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
    if (addonToEdit) {
      await addonService.updateAddon(addon.id, addon);
      showNotification(`Modifier "${addon.name}" updated!`);
    } else {
      await addonService.createAddon(addon);
      showNotification(`New Modifier "${addon.name}" added!`);
    }
    setAddons(await addonService.listAddons());
  };

  const handleDeleteAddon = async (addonId: string) => {
    await addonService.deleteAddon(addonId);
    setAddons(await addonService.listAddons());
    showNotification('Modifier deleted.');
  };

  const handleToggleAddonStock = async (addonId: string) => {
    const updated = await addonService.toggleStock(addonId);
    if (updated) {
      setAddons(await addonService.listAddons());
      showNotification(`Modifier "${updated.name}" is now ${updated.available !== false ? 'In Stock' : 'Out of Stock'}.`);
    }
  };

  // -------------------------------------------------------------
  // Store Settings Handlers
  // -------------------------------------------------------------
  const handleSaveStoreSettings = async (newSettings: StoreSettings) => {
    await settingsService.updateStoreSettings(newSettings);
    setStoreSettings(newSettings);
    showNotification('Store profile & branding settings applied successfully! ✨');
  };

  // -------------------------------------------------------------
  // Inventory Handlers
  // -------------------------------------------------------------
  const handleSaveInventoryItem = async (item: InventoryItem) => {
    const exists = inventoryItems.some((i) => i.id === item.id);
    if (exists) {
      await inventoryService.updateInventoryItem(item.id, item);
      showNotification(`Inventory item "${item.name}" updated.`);
    } else {
      await inventoryService.createInventoryItem(item);
      showNotification(`New inventory item "${item.name}" added.`);
    }
    setInventoryItems(await inventoryService.listInventory());
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    await inventoryService.deleteInventoryItem(itemId);
    setInventoryItems(await inventoryService.listInventory());
    showNotification('Inventory item removed.');
  };

  const handleAddInventoryCategory = (category: string) => {
    if (!inventoryCategories.includes(category)) {
      setInventoryCategories((prev) => [...prev, category]);
      showNotification(`Inventory category "${category}" added.`);
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
      {portalMode === 'admin' && (
        <>
          {/* Admin Header */}
          <Header
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            activeOrdersCount={reportingService.calculateActiveOrdersCount(orders)}
            onSwitchToCustomerPortal={() => {
              if (currentCustomer) {
                setPortalMode('customer');
              } else {
                setCustomerAuthInitialMode('login');
                setIsCustomerAuthModalOpen(true);
              }
            }}
            onSwitchToPublic={() => setPortalMode('public')}
            storeSettings={storeSettings}
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
          />

          {/* Main Admin Tab View Content */}
          <main className="flex-1 w-full max-w-5xl mx-auto">
            {/* Menu Management View */}
            {currentTab === 'admin-menu' && (
              <AdminMenuView
                menuItems={menuItems}
                categories={categories}
                addons={addons}
                promoBundles={promoBundles}
                onOpenAddProduct={handleOpenAddProduct}
                onOpenEditProduct={handleOpenEditProduct}
                onToggleAvailability={handleToggleProductAvailability}
                onDeleteProduct={handleDeleteProduct}
                onOpenAddBundle={handleOpenAddBundle}
                onOpenEditBundle={handleOpenEditBundle}
                onDeleteBundle={handleDeleteBundle}
                onOpenAddAddon={handleOpenAddAddon}
                onOpenEditAddon={handleOpenEditAddon}
                onDeleteAddon={handleDeleteAddon}
                onToggleAddonStock={handleToggleAddonStock}
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
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
              <ProfileView onShowNotification={showNotification} />
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
            onSaveAddon={handleSaveAddon}
            onDeleteAddon={handleDeleteAddon}
            onToggleAddonStock={handleToggleAddonStock}
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
