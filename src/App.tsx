import React, { useState, useEffect } from 'react';
import {
  INITIAL_ORDERS,
  INITIAL_MENU_ITEMS,
  INITIAL_ADDONS,
  INITIAL_PROMO_BUNDLES,
  DEFAULT_CATEGORIES,
  INVENTORY_ITEMS,
  DEFAULT_INVENTORY_CATEGORIES,
  DEFAULT_STORE_SETTINGS,
  INITIAL_CUSTOMERS,
} from './data/initialData';
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
import { generateOrderId, generateOrderNumber } from './services/idGenerator';
import { reportingService } from './services/reportingService';
import {
  getStoredCustomers,
  saveCustomers,
  getStoredCurrentCustomer,
  saveCurrentCustomer,
  getStoredAdminAuth,
  saveAdminAuth,
  getStoredOrders,
  saveOrders,
  getStoredMenuItems,
  saveMenuItems,
  getStoredCategories,
  saveCategories,
  getStoredAddons,
  saveAddons,
  getStoredBundles,
  saveBundles,
  getStoredInventory,
  saveInventory,
  getStoredSettings,
  saveSettings,
} from './data/storage';

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
  const [customers, setCustomers] = useState<CustomerUser[]>(() => getStoredCustomers());
  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(() => getStoredCurrentCustomer());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => getStoredAdminAuth());

  // Auth Modals State
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState<boolean>(false);
  const [customerAuthInitialMode, setCustomerAuthInitialMode] = useState<'login' | 'register'>('login');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);

  // Store Branding & Profile Settings State
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => getStoredSettings());

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => getStoredOrders());
  const [lastCustomerOrder, setLastCustomerOrder] = useState<Order | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('admin-menu');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Categories & Menu State
  const [categories, setCategories] = useState<string[]>(() => getStoredCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => getStoredMenuItems());
  const [addons, setAddons] = useState<ProductAddon[]>(() => getStoredAddons());
  const [promoBundles, setPromoBundles] = useState<PromoBundle[]>(() => getStoredBundles());

  // Inventory Management State
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => getStoredInventory());
  const [inventoryCategories, setInventoryCategories] = useState<string[]>(DEFAULT_INVENTORY_CATEGORIES);

  // Modals for Admin CRUD
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<MenuItem | null>(null);

  const [isBundleModalOpen, setIsBundleModalOpen] = useState<boolean>(false);
  const [bundleToEdit, setBundleToEdit] = useState<PromoBundle | null>(null);

  const [isAddonModalOpen, setIsAddonModalOpen] = useState<boolean>(false);
  const [addonToEdit, setAddonToEdit] = useState<ProductAddon | null>(null);

  // Live metrics calculation from real orders data
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

  // Sync state changes with persistence
  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveMenuItems(menuItems);
  }, [menuItems]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveAddons(addons);
  }, [addons]);

  useEffect(() => {
    saveBundles(promoBundles);
  }, [promoBundles]);

  useEffect(() => {
    saveInventory(inventoryItems);
  }, [inventoryItems]);

  useEffect(() => {
    saveSettings(storeSettings);
  }, [storeSettings]);

  // -------------------------------------------------------------
  // Customer Auth Handlers
  // -------------------------------------------------------------
  const handleCustomerLoginSuccess = (customer: CustomerUser) => {
    setCurrentCustomer(customer);
    saveCurrentCustomer(customer);
    setIsCustomerAuthModalOpen(false);
    setPortalMode('customer');
    showNotification(`Welcome back, ${customer.name}! (${customer.id}) ☕`);
  };

  const handleCustomerRegisterSuccess = (customer: CustomerUser) => {
    setCustomers((prev) => {
      const updated = [...prev, customer];
      saveCustomers(updated);
      return updated;
    });
    setCurrentCustomer(customer);
    saveCurrentCustomer(customer);
    setIsCustomerAuthModalOpen(false);
    setPortalMode('customer');
    showNotification(`Welcome to iLuvKeyks, ${customer.name}! ID: ${customer.id} 🎉`);
  };

  const handleCustomerLogout = () => {
    setCurrentCustomer(null);
    saveCurrentCustomer(null);
    setPortalMode('public');
    showNotification('You have been signed out.');
  };

  const handleUpdateCustomerProfile = (updated: Partial<CustomerUser>) => {
    if (!currentCustomer) return;
    const updatedUser = { ...currentCustomer, ...updated };
    setCurrentCustomer(updatedUser);
    saveCurrentCustomer(updatedUser);
    setCustomers((prev) => prev.map((c) => (c.id === updatedUser.id ? updatedUser : c)));
    showNotification('Profile updated successfully.');
  };

  // -------------------------------------------------------------
  // Admin Auth Handlers
  // -------------------------------------------------------------
  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    saveAdminAuth(true);
    setIsAdminAuthModalOpen(false);
    setPortalMode('admin');
    showNotification('Staff / Admin session authenticated.');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    saveAdminAuth(false);
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
  const handleSaveCategory = (newCategory: string, oldCategory?: string) => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    if (oldCategory && oldCategory !== trimmed) {
      setCategories((prev) => prev.map((c) => (c === oldCategory ? trimmed : c)));
      setMenuItems((prev) =>
        prev.map((item) => (item.category === oldCategory ? { ...item, category: trimmed } : item))
      );
      showNotification(`Category renamed to "${trimmed}" across all items.`);
    } else if (!categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
      showNotification(`New category "${trimmed}" added to menu catalog! 🎉`);
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    if (categories.length <= 1) {
      showNotification('At least one category must remain.');
      return;
    }
    const remaining = categories.filter((c) => c !== categoryToDelete);
    const fallback = remaining[0] || 'Coffee';
    setCategories(remaining);
    setMenuItems((prev) =>
      prev.map((item) =>
        item.category === categoryToDelete ? { ...item, category: fallback } : item
      )
    );
    showNotification(`Category "${categoryToDelete}" deleted. Products moved to "${fallback}".`);
  };

  // -------------------------------------------------------------
  // Order Management Handlers
  // -------------------------------------------------------------
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: newStatus,
            timeAgo: 'Updated just now',
          };
        }
        return ord;
      })
    );

    if (newStatus === 'Completed') {
      showNotification(`Order #${orderId} marked as Completed!`);
    } else if (newStatus === 'Ready') {
      showNotification(`Order #${orderId} is Ready for pickup/serving! 🛎️`);
    } else if (newStatus === 'Brewing') {
      showNotification(`Order #${orderId} sent to espresso bar. ☕`);
    }
  };

  const handleCreateOrder = (orderData: Partial<Order>) => {
    const newOrder: Order = {
      id: generateOrderId(),
      orderNumber: generateOrderNumber(),
      customerId: orderData.customerId || currentCustomer?.id,
      customerName: orderData.customerName || 'Walk-in Guest',
      customerPhone: orderData.customerPhone,
      timeAgo: 'Just now',
      timestamp: Date.now(),
      status: 'New',
      items: orderData.items || [],
      total: orderData.total || 0,
      subtotal: orderData.subtotal || orderData.total || 0,
      image:
        orderData.image ||
        (orderData.items?.[0]?.name.toLowerCase().includes('matcha')
          ? 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80'
          : 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80'),
      notes: orderData.notes,
      orderType: orderData.orderType || 'Dine-In',
      tableNumber: orderData.tableNumber || (orderData.orderType === 'Dine-In' ? 'Table 1' : undefined),
      paymentMethod: orderData.paymentMethod || 'Cash',
      isCustomerOrder: false,
    };

    setOrders((prev) => [newOrder, ...prev]);
    showNotification(`New POS Ticket #${newOrder.orderNumber} placed for ₱${newOrder.total.toFixed(2)}`);
  };

  const handlePlaceCustomerOrder = (customerOrder: Order) => {
    const enrichedOrder: Order = {
      ...customerOrder,
      id: customerOrder.id || generateOrderId(),
      orderNumber: customerOrder.orderNumber || generateOrderNumber(),
      customerId: currentCustomer?.id,
      customerName: customerOrder.customerName || currentCustomer?.name || 'Customer',
      customerEmail: currentCustomer?.email,
      customerPhone: customerOrder.customerPhone || currentCustomer?.mobile,
      timestamp: Date.now(),
      isCustomerOrder: true,
    };

    setOrders((prev) => [enrichedOrder, ...prev]);
    setLastCustomerOrder(enrichedOrder);

    // Update customer stamp balance
    if (currentCustomer) {
      const nextStamps = ((currentCustomer.stamps || 0) % 10) + 1;
      const nextPoints = (currentCustomer.points || 0) + Math.floor(enrichedOrder.total / 10);
      handleUpdateCustomerProfile({
        stamps: nextStamps,
        points: nextPoints,
      });
    }

    showNotification(`🎉 Order #${enrichedOrder.orderNumber} placed successfully! Barista notified.`);
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

  const handleSaveProduct = (product: MenuItem) => {
    if (productToEdit) {
      setMenuItems((prev) => prev.map((item) => (item.id === product.id ? product : item)));
      showNotification(`"${product.name}" updated successfully!`);
    } else {
      setMenuItems((prev) => [product, ...prev]);
      showNotification(`"${product.name}" added to menu catalog! ☕`);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const itemToDelete = menuItems.find((i) => i.id === productId);
    setMenuItems((prev) => prev.filter((item) => item.id !== productId));
    showNotification(`"${itemToDelete?.name || 'Item'}" removed from catalog.`);
  };

  const handleToggleProductAvailability = (productId: string) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const nextState = item.available === false ? true : false;
          showNotification(`"${item.name}" is now ${nextState ? 'Available' : 'Sold Out'}.`);
          return { ...item, available: nextState };
        }
        return item;
      })
    );
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

  const handleSaveBundle = (bundle: PromoBundle) => {
    if (bundleToEdit) {
      setPromoBundles((prev) => prev.map((b) => (b.id === bundle.id ? bundle : b)));
      showNotification(`Bundle "${bundle.name}" updated!`);
    } else {
      setPromoBundles((prev) => [bundle, ...prev]);
      showNotification(`New Combo Bundle "${bundle.name}" published! 🎉`);
    }
  };

  const handleDeleteBundle = (bundleId: string) => {
    setPromoBundles((prev) => prev.filter((b) => b.id !== bundleId));
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

  const handleSaveAddon = (addon: ProductAddon) => {
    if (addonToEdit) {
      setAddons((prev) => prev.map((a) => (a.id === addon.id ? addon : a)));
      showNotification(`Modifier "${addon.name}" updated!`);
    } else {
      setAddons((prev) => [...prev, addon]);
      showNotification(`New Modifier "${addon.name}" added!`);
    }
  };

  const handleDeleteAddon = (addonId: string) => {
    setAddons((prev) => prev.filter((a) => a.id !== addonId));
    showNotification('Modifier deleted.');
  };

  const handleToggleAddonStock = (addonId: string) => {
    setAddons((prev) =>
      prev.map((a) => {
        if (a.id === addonId) {
          const next = !a.inStock;
          showNotification(`Modifier "${a.name}" is now ${next ? 'In Stock' : 'Out of Stock'}.`);
          return { ...a, inStock: next };
        }
        return a;
      })
    );
  };

  // -------------------------------------------------------------
  // Store Settings Handlers
  // -------------------------------------------------------------
  const handleSaveStoreSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    showNotification('Store profile & branding settings applied successfully! ✨');
  };

  // -------------------------------------------------------------
  // Inventory Handlers
  // -------------------------------------------------------------
  const handleSaveInventoryItem = (item: InventoryItem) => {
    const exists = inventoryItems.some((i) => i.id === item.id);
    if (exists) {
      setInventoryItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      showNotification(`Inventory item "${item.name}" updated.`);
    } else {
      setInventoryItems((prev) => [...prev, item]);
      showNotification(`New inventory item "${item.name}" added.`);
    }
  };

  const handleDeleteInventoryItem = (itemId: string) => {
    setInventoryItems((prev) => prev.filter((i) => i.id !== itemId));
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
            activeOrdersCount={orders.filter((o) => o.status === 'New' || o.status === 'Brewing' || o.status === 'Preparing').length}
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
                onResetSettings={() => {
                  setStoreSettings(DEFAULT_STORE_SETTINGS);
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
                todaySales={todaySales}
                cupsServed={cupsServed}
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
