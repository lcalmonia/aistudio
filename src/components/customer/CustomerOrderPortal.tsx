import React, { useState, useMemo, useEffect } from 'react';
import {
  MenuItem,
  ProductAddon,
  PromoBundle,
  CustomerCartItem,
  Order,
  StoreSettings,
  CustomerUser,
  ModifierCategory,
} from '../../types';
import { CustomerProductModal } from './CustomerProductModal';
import { orderService } from '../../services/orderService';
import { customerService } from '../../services/customerService';
import { loyaltyConfigService } from '../../services/loyaltyConfigService';
import { LoyaltyPerk, LoyaltySettings } from '../../types';
import { CustomerCartDrawer } from './CustomerCartDrawer';
import { CustomerOrderSuccessModal } from './CustomerOrderSuccessModal';
import { rewardClaimService } from '../../services/rewardClaimService';
import { rewardClaimService } from '../../services/rewardClaimService';

interface CustomerOrderPortalProps {
  menuItems: MenuItem[];
  categories: string[];
  addons: ProductAddon[];
  modifierCategories?: ModifierCategory[];
  promoBundles: PromoBundle[];
  orders: Order[];
  currentCustomer: CustomerUser;
  onPlaceCustomerOrder: (order: Order) => void;
  onSwitchToAdmin: () => void;
  onExitToLanding: () => void;
  onCustomerLogout: () => void;
  onUpdateCustomerProfile: (updated: Partial<CustomerUser>) => void;
  lastCustomerOrder: Order | null;
  storeSettings?: StoreSettings;
}

export const CustomerOrderPortal: React.FC<CustomerOrderPortalProps> = ({
  menuItems = [],
  categories = [],
  addons = [],
  modifierCategories = [],
  promoBundles = [],
  orders = [],
  currentCustomer,
  onPlaceCustomerOrder,
  onSwitchToAdmin,
  onExitToLanding,
  onCustomerLogout,
  onUpdateCustomerProfile,
  lastCustomerOrder,
  storeSettings,
}) => {
  // Store Settings
  const storeName = storeSettings?.storeName || 'iLuvKeyks';
  const tagline = storeSettings?.tagline || 'Coffee, Tea & Tub Cakes';
  const logoUrl = storeSettings?.logoUrl;
  const branchName = storeSettings?.branchName || 'Manila, PH';
  const freeDeliveryThreshold = storeSettings?.freeDeliveryThreshold ?? 500;

  // Active Customer Portal Tab
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'rewards' | 'profile'>('menu');

  // Navigation & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('All');

  // Cart State
  const [cartItems, setCartItems] = useState<CustomerCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(lastCustomerOrder);
  const [cancelledOrders, setCancelledOrders] = useState<Record<string, Order>>({});
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (lastCustomerOrder) {
      const updated = orders.find(
        (o) => o.id === lastCustomerOrder.id || o.orderNumber === lastCustomerOrder.orderNumber
      );
      if (updated) {
        setActiveTrackingOrder(updated);
      } else {
        setActiveTrackingOrder(lastCustomerOrder);
      }
    }
  }, [orders, lastCustomerOrder]);

  // Profile Edit State
  const [editName, setEditName] = useState(currentCustomer.name);
  const [editMobile, setEditMobile] = useState(currentCustomer.mobile);
  const [editAddress, setEditAddress] = useState(currentCustomer.address);
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [loyaltyPerks, setLoyaltyPerks] = useState<LoyaltyPerk[]>([]);
  useEffect(() => { loyaltyConfigService.get().then((data) => { setLoyaltySettings(data.settings); setLoyaltyPerks((data.perks || []).filter((p) => p.active)); }).catch(() => {}); }, []);

  // Filter available items
  const availableItems = useMemo(() => {
    return menuItems.filter((item) => item.available !== false);
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return availableItems.filter((item) => {
      if (!item) return false;
      const itemCategory = item.category || '';
      const matchesCategory =
        selectedCategory === 'All' || itemCategory.toLowerCase() === (selectedCategory || '').toLowerCase();
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        itemCategory.toLowerCase().includes(q);
      const matchesTag =
        activeTag === 'All'
          ? true
          : activeTag === 'Popular'
          ? item.popular
          : activeTag === 'Hot'
          ? item.temperature === 'Hot' || item.temperature === 'Both'
          : activeTag === 'Iced'
          ? item.temperature === 'Cold' || item.temperature === 'Both'
          : item.tags?.includes(activeTag);

      return matchesCategory && matchesSearch && matchesTag;
    });
  }, [availableItems, selectedCategory, searchQuery, activeTag]);

  // Customer-specific orders (filtered strictly by currentCustomer.id or name/phone)
  const myOrders = useMemo(() => {
    if (!currentCustomer) return [];
    const customerEmail = (currentCustomer.email || '').toLowerCase();
    const customerName = (currentCustomer.name || '').toLowerCase();
    return orders
      .map((o) => cancelledOrders[o.id] || o)
      .filter(
        (o) =>
          o &&
          (o.customerId === currentCustomer.id ||
            (customerEmail && o.customerEmail && o.customerEmail.toLowerCase() === customerEmail) ||
            (customerName && o.customerName && o.customerName.toLowerCase() === customerName))
      );
  }, [orders, currentCustomer, cancelledOrders]);

  // Cart calculations
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleOpenProduct = (product: MenuItem) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddToCart = (item: CustomerCartItem) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (p) =>
          p.menuItem.id === item.menuItem.id &&
          p.selectedTemperature === item.selectedTemperature &&
          p.selectedSize?.name === item.selectedSize?.name &&
          p.sweetnessLevel === item.sweetnessLevel &&
          p.iceLevel === item.iceLevel &&
          JSON.stringify(p.selectedAddons?.map((a) => a.id).sort()) ===
            JSON.stringify(item.selectedAddons?.map((a) => a.id).sort()) &&
          p.specialInstructions === item.specialInstructions
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += item.quantity;
        next[existingIdx].totalPrice = next[existingIdx].quantity * next[existingIdx].unitPrice;
        return next;
      }
      return [...prev, item];
    });

    setIsCartOpen(true);
  };

  const handleAddBundleToCart = (bundle: PromoBundle) => {
    const dummyMenuItem: MenuItem = {
      id: bundle.id,
      name: bundle.name,
      category: 'Combos & Promos',
      price: bundle.price,
      image: bundle.image,
      description: bundle.description,
      available: true,
      temperature: 'N/A',
      tags: ['Combo Bundle', 'Special Offer'],
    };

    const cartBundle: CustomerCartItem = {
      id: `cart-bundle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      menuItem: dummyMenuItem,
      quantity: 1,
      unitPrice: bundle.price,
      totalPrice: bundle.price,
      selectedTemperature: 'N/A',
      isBundle: true,
      bundleData: bundle,
    };

    setCartItems((prev) => [...prev, cartBundle]);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: nextQty,
              totalPrice: nextQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CustomerCartItem[]
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleFinalizeOrder = (newOrder: Order) => {
    onPlaceCustomerOrder(newOrder);
    setActiveTrackingOrder(newOrder);
    setIsSuccessModalOpen(true);
  };

  const handleCancelOrder = async (order: Order) => {
    if (order.status !== 'New') return;

    const confirmed = window.confirm(
      `Cancel order #${order.orderNumber}?\n\nThis can only be cancelled while the order is still New.`
    );

    if (!confirmed) return;

    setCancellingOrderId(order.id);

    try {
      const cancelled = await orderService.cancelCustomerOrder(
        order.id,
        currentCustomer.id,
        currentCustomer.email
      );

      if (cancelled) {
        setCancelledOrders((prev) => ({
          ...prev,
          [cancelled.id]: cancelled,
        }));

        setActiveTrackingOrder(cancelled);
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to cancel the order.';

      window.alert(message);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCustomerProfile({
      name: editName,
      mobile: editMobile,
      address: editAddress,
    });
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage(null);

    if (newPassword.length < 6 || newPassword.length > 128) {
      setPasswordChangeMessage('New password must be 6 to 128 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeMessage('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await customerService.changeCustomerPassword(currentCustomer.id, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChangeMessage('Password changed successfully.');
    } catch (error) {
      setPasswordChangeMessage(error instanceof Error ? error.message : 'Unable to change your password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const currentStamps = currentCustomer.stamps || 0;
  const stampCycle = loyaltySettings?.stampCycle || 10;
  const stampsArray = Array.from({ length: stampCycle }, (_, i) => i < currentStamps);
  const handleRedeemPerk = async (perk: LoyaltyPerk) => { const { loyaltyService } = await import('../../services/loyaltyService'); const result = perk.redemptionType === 'points' ? await loyaltyService.redeemPoints(currentCustomer.id, perk.redemptionCost, `Redeemed perk: ${perk.name}`) : await loyaltyService.redeemStamps(currentCustomer.id, perk.redemptionCost, `Redeemed perk: ${perk.name}`); if (!result.success) { window.alert(result.error || 'Unable to redeem this perk.'); return; } window.location.reload(); };

  return (
    <div className="min-h-screen bg-[#fff8f5] text-[#1d1b1a] flex flex-col font-sans pb-24 selection:bg-[#fbddca] selection:text-[#26170c] w-full max-w-full overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP CUSTOMER HEADER & ACCOUNT BAR                                      */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#fff8f5]/95 backdrop-blur-md border-b border-[#dec1af]/60 shadow-xs w-full">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-15 sm:h-18 flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Store Identity */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
            <button
              onClick={onExitToLanding}
              className="p-1 -ml-1 sm:p-1.5 sm:-ml-1.5 hover:bg-[#f3ecea] text-[#4f453f] hover:text-[#26170c] rounded-xl transition-colors cursor-pointer flex-shrink-0"
              title="Return to Public Website"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">arrow_back</span>
            </button>

            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Store Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-cover border border-[#dec1af] shadow-xs flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#26170c] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-[#dec1af]">local_cafe</span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <h1 className="font-serif text-sm sm:text-lg font-bold text-[#26170c] leading-none truncate">
                  {storeName}
                </h1>
                <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.2 bg-[#fbddca] text-[#26170c] text-[8px] sm:text-[9px] font-extrabold rounded-full uppercase tracking-wider flex-shrink-0">
                  Portal
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#4f453f] font-medium mt-0.5 truncate">
                {tagline}
              </p>
            </div>
          </div>

          {/* Right Customer Pill & Bag Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Customer ID Badge */}
            <button
              onClick={() => setActiveTab('profile')}
              className="px-2 sm:px-3 py-1.5 bg-[#f3ecea] hover:bg-[#e8e1df] rounded-xl border border-[#dec1af] flex items-center gap-1 sm:gap-1.5 text-xs font-bold text-[#26170c] transition-all cursor-pointer"
              title="View Profile & Customer ID"
            >
              <span className="w-5 h-5 rounded-full bg-[#26170c] text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                {currentCustomer.name.charAt(0)}
              </span>
              <span className="hidden sm:inline truncate max-w-[80px]">{currentCustomer.name.split(' ')[0]}</span>
              <span className="font-mono text-[9px] sm:text-[10px] text-[#636451] font-bold">
                {currentCustomer.id}
              </span>
            </button>

            {/* Logout / Exit Button */}
            <button
              onClick={onCustomerLogout}
              className="p-1.5 sm:p-2 text-[#81756e] hover:text-[#93000a] hover:bg-[#ffdad6]/40 rounded-xl transition-all cursor-pointer flex-shrink-0"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>

            {/* Customer Bag Button */}
            <button
              id="customer-cart-button"
              onClick={() => setIsCartOpen(true)}
              className="relative px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#26170c] hover:bg-[#3d2b1f] text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-md active:scale-95 transition-all cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">shopping_bag</span>
              <span className="hidden xs:inline">Bag</span>
              {totalCartCount > 0 && (
                <span className="bg-[#fbddca] text-[#26170c] px-1.5 sm:px-2 py-0.2 rounded-full text-[10px] sm:text-[11px] font-extrabold">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Portal Navigation Tabs */}
        <div className="max-w-5xl mx-auto px-3 sm:px-6 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar border-t border-[#f3ecea] w-full">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'menu'
                ? 'bg-[#26170c] text-[#fbddca] shadow-xs'
                : 'bg-white text-[#4f453f] hover:bg-[#f3ecea] border border-[#dec1af]/50'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">restaurant_menu</span>
            <span>Menu</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'orders'
                ? 'bg-[#26170c] text-[#fbddca] shadow-xs'
                : 'bg-white text-[#4f453f] hover:bg-[#f3ecea] border border-[#dec1af]/50'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">receipt_long</span>
            <span>My Orders ({myOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'rewards'
                ? 'bg-[#26170c] text-[#fbddca] shadow-xs'
                : 'bg-white text-[#4f453f] hover:bg-[#f3ecea] border border-[#dec1af]/50'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">stars</span>
            <span>Loyalty Stamp Card</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'profile'
                ? 'bg-[#26170c] text-[#fbddca] shadow-xs'
                : 'bg-white text-[#4f453f] hover:bg-[#f3ecea] border border-[#dec1af]/50'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">person</span>
            <span>Profile & Address</span>
          </button>
        </div>
      </header>

      {/* Active Order Live Tracker Banner (If placed order) */}
      {activeTrackingOrder && (
        <div className="bg-[#26170c] text-white px-4 py-2.5 shadow-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8fbc8f] animate-ping" />
              <span className="font-bold">Active Order #{activeTrackingOrder.orderNumber}:</span>
              <span className="text-[#dec1af]">Status: {activeTrackingOrder.status}</span>
            </div>
            <button
              onClick={() => setIsSuccessModalOpen(true)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#dec1af] rounded-lg text-xs font-bold transition-all cursor-pointer underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">receipt</span>
              <span>Live Tracker</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB CONTENT VIEWS                                                      */}
      {/* ========================================================================= */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 w-full pt-4 space-y-6 flex-1">
        {/* TAB 1: MENU CATALOG VIEW */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Promo Bundles & Combos */}
            {promoBundles && promoBundles.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#26170c]">loyalty</span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#26170c]">
                      Featured Value Combos
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[#81756e]">Save up to 25%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {promoBundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="bg-white rounded-2xl border border-[#dec1af]/50 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3 bg-[#f3ecea]">
                          <img
                            src={bundle.image}
                            alt={bundle.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#ba1a1a] text-white text-[10px] font-bold rounded-lg uppercase shadow-xs">
                            {bundle.discountBadge}
                          </span>
                        </div>

                        <h4 className="font-serif text-sm font-bold text-[#26170c] leading-tight">
                          {bundle.name}
                        </h4>
                        <p className="text-[11px] text-[#4f453f] mt-1 line-clamp-2">
                          {bundle.description}
                        </p>

                        <div className="mt-2 text-[10px] text-[#81756e] bg-[#f9f2f0] p-1.5 rounded-lg">
                          Includes: {bundle.bundleItems.join(' • ')}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#f3ecea] flex items-center justify-between">
                        <div>
                          <span className="text-xs text-[#81756e] line-through mr-1">
                            ₱{bundle.originalPrice.toFixed(2)}
                          </span>
                          <span className="font-serif font-bold text-sm text-[#26170c]">
                            ₱{bundle.price.toFixed(2)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddBundleToCart(bundle)}
                          className="px-3 py-1.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          <span>Add Combo</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Search & Tag Filter Bar */}
            <section className="bg-[#f9f2f0] rounded-3xl p-4 sm:p-5 border border-[#dec1af]/60 space-y-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#81756e] text-[20px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search coffee, spanish latte, matcha, cakes..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dec1af] rounded-2xl text-xs sm:text-sm text-[#26170c] placeholder:text-[#81756e] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-[#81756e] hover:text-[#26170c]"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>

                {/* Tag Quick Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  {['All', 'Popular', 'Hot', 'Iced'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        activeTag === tag
                          ? 'bg-[#26170c] text-white'
                          : 'bg-white text-[#4f453f] hover:bg-[#e8e1df] border border-[#dec1af]/50'
                      }`}
                    >
                      {tag === 'Hot' ? '🔥 Hot' : tag === 'Iced' ? '❄️ Iced' : tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-[#dec1af]/40">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-[#26170c] text-white shadow-xs'
                      : 'bg-white text-[#4f453f] hover:bg-[#eae2e0] border border-[#dec1af]/40'
                  }`}
                >
                  All Menu ({availableItems.length})
                </button>
                {categories.map((cat) => {
                  const count = availableItems.filter(
                    (item) => item.category.toLowerCase() === cat.toLowerCase()
                  ).length;
                  const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#26170c] text-white shadow-xs'
                          : 'bg-white text-[#4f453f] hover:bg-[#eae2e0] border border-[#dec1af]/40'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#f3ecea] text-[#81756e]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Menu Product Grid */}
            <section>
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-3xl border border-[#f3ecea] p-8 shadow-xs">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#f3ecea] flex items-center justify-center text-[#81756e] mb-3">
                    <span className="material-symbols-outlined text-[28px]">search_off</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-[#26170c]">No items found</h4>
                  <p className="text-xs text-[#4f453f] mt-1 max-w-sm mx-auto">
                    We couldn't find any menu item matching your search or category filter.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setActiveTag('All');
                    }}
                    className="mt-4 px-4 py-2 bg-[#26170c] text-white text-xs font-bold rounded-xl"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenProduct(item)}
                      className="bg-white rounded-3xl border border-[#f3ecea] hover:border-[#dec1af] p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        {/* Item Image with Temperature Badge */}
                        <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-3 bg-[#f3ecea]">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                            {item.popular && (
                              <span className="px-2 py-0.5 bg-[#26170c] text-[#dec1af] text-[10px] font-bold rounded-lg uppercase shadow-xs">
                                Popular
                              </span>
                            )}
                          </div>

                          {/* Temperature Badge */}
                          {item.temperature !== 'N/A' && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg flex items-center gap-1">
                              {item.temperature === 'Both' ? (
                                '🔥 Hot / ❄️ Iced'
                              ) : item.temperature === 'Hot' ? (
                                '🔥 Hot'
                              ) : (
                                '❄️ Iced'
                              )}
                            </span>
                          )}
                        </div>

                        {/* Category & Title */}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#81756e]">
                          {item.category}
                        </span>
                        <h4 className="font-serif text-base font-bold text-[#26170c] leading-snug mt-0.5 group-hover:text-[#5e4b3c] transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-xs text-[#4f453f] mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Price & Add Button */}
                      <div className="mt-4 pt-3 border-t border-[#f3ecea] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#81756e] block font-medium">Starts at</span>
                          <span className="font-serif font-bold text-base sm:text-lg text-[#26170c]">
                            ₱{item.price.toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProduct(item);
                          }}
                          className="px-3.5 py-2 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Customize</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: MY ORDERS VIEW */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#26170c]">
                  Order History & Live Status
                </h2>
                <p className="text-xs text-[#4f453f] mt-0.5">
                  Linked to Customer ID: <strong>{currentCustomer.id}</strong>
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-[#fbddca] text-[#26170c] rounded-full">
                {myOrders.length} Total Orders
              </span>
            </div>

            {myOrders.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-[#f3ecea] p-8 shadow-xs">
                <span className="material-symbols-outlined text-[40px] text-[#81756e] mb-2">receipt_long</span>
                <h4 className="font-serif text-lg font-bold text-[#26170c]">No Orders Placed Yet</h4>
                <p className="text-xs text-[#4f453f] mt-1 max-w-sm mx-auto">
                  Browse our catalog and enjoy freshly brewed coffee and handcrafted tub cakes!
                </p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="mt-4 px-5 py-2.5 bg-[#26170c] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Start an Order
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {myOrders.map((ord) => {
                  const isNew = ord.status === 'New';
                  const isBrewing = ord.status === 'Brewing' || ord.status === 'Preparing';
                  const isReady = ord.status === 'Ready';
                  const isCompleted = ord.status === 'Completed';

                  let badgeClass = 'bg-[#e1e1c9] text-[#636451]';
                  if (isNew) badgeClass = 'bg-[#ffdad6] text-[#93000a]';
                  if (isReady) badgeClass = 'bg-[#3d2b1f] text-[#ac9181]';
                  if (isCompleted) badgeClass = 'bg-[#e8e1df] text-[#4f453f]';

                  return (
                    <div
                      key={ord.id}
                      className="bg-white rounded-3xl border border-[#f3ecea] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-serif font-bold text-base text-[#26170c]">
                              #{ord.orderNumber}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                              {ord.status}
                            </span>
                            <span className="text-xs text-[#81756e]">• {ord.timeAgo}</span>
                          </div>
                          <p className="text-xs text-[#4f453f]">
                            {ord.orderType || 'Standard'} • {ord.paymentMethod || 'Cash'} • Customer: {ord.customerName}
                          </p>
                        </div>

                        <span className="font-serif text-lg font-bold text-[#26170c]">
                          ₱{ord.total.toFixed(2)}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="bg-[#f9f2f0] p-3 rounded-2xl space-y-1 text-xs">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[#26170c]">
                            <span>
                              <strong>{item.quantity}x</strong> {item.name}{' '}
                              {item.customization && (
                                <span className="text-[#81756e] text-[11px]">({item.customization})</span>
                              )}
                            </span>
                            <span className="font-medium text-[#4f453f]">₱{item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-1">
                        <span className="text-[11px] text-[#81756e]">
                          {ord.deliveryAddress ? `Deliver to: ${ord.deliveryAddress}` : ord.tableNumber ? `Table: ${ord.tableNumber}` : 'Takeout'}
                        </span>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {ord.status === 'New' && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(ord)}
                              disabled={cancellingOrderId === ord.id}
                              className="px-3.5 py-1.5 bg-[#ffdad6] text-[#93000a] text-xs font-bold rounded-xl border border-[#ffb4ab] hover:bg-[#ffb4ab] disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {cancellingOrderId === ord.id ? 'hourglass_top' : 'cancel'}
                              </span>
                              <span>
                                {cancellingOrderId === ord.id ? 'Cancelling...' : 'Cancel Order'}
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveTrackingOrder(ord);
                              setIsSuccessModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#3d2b1f] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">visibility</span>
                            <span>Track Order</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STAMP REWARDS VIEW */}
        {activeTab === 'rewards' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Digital Stamp Card */}
            <div className="bg-[#26170c] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-[#dec1af]/30 space-y-4 sm:space-y-5">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#dec1af]">
                    iLuvKeyks VIP Loyalty
                  </span>
                  <h3 className="font-serif text-lg sm:text-2xl font-bold mt-0.5 truncate">Digital Stamp Card</h3>
                  <p className="text-[11px] sm:text-xs text-[#dec1af]/80 truncate">
                    Member: {currentCustomer.name} • {currentCustomer.id}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[9px] sm:text-[10px] text-[#dec1af] uppercase font-bold block">Reward Points</span>
                  <span className="font-serif text-xl sm:text-2xl font-extrabold text-[#fbddca]">
                    {currentCustomer.points || 0} pts
                  </span>
                </div>
              </div>

              {/* 10-Stamp Grid */}
              <div>
                <p className="text-[11px] sm:text-xs text-[#dec1af] mb-2.5 sm:mb-3">
                  Collect 10 stamps to redeem a <strong>FREE Specialty Coffee or Tub Cake slice</strong>!
                </p>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-3.5 max-w-md mx-auto">
                  {stampsArray.map((isFilled, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border-2 transition-all p-1 ${
                        isFilled
                          ? 'bg-[#fbddca] border-[#fbddca] text-[#26170c] shadow-md scale-102'
                          : 'bg-white/5 border-white/20 text-white/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[24px]">
                        {idx === 9 ? 'cake' : 'local_cafe'}
                      </span>
                      <span className="text-[8px] sm:text-[10px] font-bold mt-0.5">#{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 sm:p-3 bg-white/10 rounded-xl sm:rounded-2xl text-center text-[11px] sm:text-xs text-[#dec1af]">
                🎉 You have <strong>{currentStamps} of {stampCycle} stamps</strong>. Only {Math.max(0, stampCycle - currentStamps)} more qualifying orders until your free reward!
              </div>
            </div>

            {/* Redeemable Perks */}
            <div>
              <h3 className="font-serif text-lg font-bold text-[#26170c] mb-3">Available VIP Perks</h3>
              {loyaltyPerks.length === 0 ? <div className="p-4 bg-white rounded-2xl border border-[#f3ecea] text-xs text-[#81756e]">No active perks are available right now.</div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">{loyaltyPerks.map((perk) => { const balance = perk.redemptionType === 'points' ? (currentCustomer.points || 0) : currentStamps; const canRedeem = balance >= perk.redemptionCost; const rewardName = perk.rewardSource === 'menu' ? (menuItems.find((item) => item.id === perk.menuItemId)?.name || 'Menu Product') : (perk.customItemName || 'Custom Item'); return <div key={perk.id} className="p-4 bg-white rounded-2xl border border-[#f3ecea] shadow-xs flex items-center justify-between gap-3"><div className="min-w-0"><h4 className="font-serif text-sm font-bold text-[#26170c]">{perk.name}</h4><p className="text-[11px] text-[#81756e]">{perk.description || rewardName}</p><span className="text-[10px] font-bold text-[#5e604d]">{perk.redemptionCost} {perk.redemptionType}</span></div><button onClick={() => handleRedeemPerk(perk)} disabled={!canRedeem} className="px-3 py-1.5 text-[11px] font-bold rounded-xl whitespace-nowrap bg-[#5e604d] text-white disabled:bg-[#e8e1df] disabled:text-[#81756e]">{canRedeem ? 'Redeem' : 'Not enough'}</button></div>; })}</div>}
            </div>
          </div>
        )}
        {/* TAB 4: PROFILE & ADDRESS VIEW */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-[#dec1af]/60 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-[#f3ecea]">
              <div className="w-14 h-14 rounded-full bg-[#26170c] text-white flex items-center justify-center font-bold text-xl">
                {currentCustomer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl font-bold text-[#26170c]">{currentCustomer.name}</h3>
                  <span className="px-2 py-0.5 bg-[#fbddca] text-[#26170c] font-mono text-[10px] font-bold rounded-md">
                    {currentCustomer.id}
                  </span>
                </div>
                <p className="text-xs text-[#81756e]">{currentCustomer.email}</p>
                <p className="text-[11px] text-[#5e604d] font-semibold mt-0.5">Verified Customer Account</p>
              </div>
            </div>

            {profileSavedToast && (
              <div className="p-3 bg-[#8fbc8f]/30 text-[#26170c] text-xs font-bold rounded-xl border border-[#8fbc8f] flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Profile and delivery address updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#4f453f] mb-1">Customer ID</label>
                <input
                  type="text"
                  disabled
                  value={currentCustomer.id}
                  className="w-full px-3.5 py-2.5 bg-[#f9f2f0] border border-[#d2c4bc] rounded-xl font-mono text-[#4f453f] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4f453f] mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-[#26170c] focus:ring-2 focus:ring-[#26170c]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4f453f] mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentCustomer.email}
                  className="w-full px-3.5 py-2.5 bg-[#f9f2f0] border border-[#d2c4bc] rounded-xl text-[#4f453f] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4f453f] mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-[#26170c] focus:ring-2 focus:ring-[#26170c]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4f453f] mb-1">Default Delivery Address</label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#dec1af] rounded-xl text-[#26170c] focus:ring-2 focus:ring-[#26170c]"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  Save Address & Changes
                </button>
                <button
                  type="button"
                  onClick={onCustomerLogout}
                  className="px-4 py-3 bg-[#ffdad6] text-[#93000a] font-bold rounded-xl hover:bg-[#ffb4ab] transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-[#f3ecea]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-[#26170c]">Password</h4>
                  <p className="text-[11px] text-[#81756e] mt-0.5">Change your password anytime using your current password.</p>
                </div>
                <button type="button" onClick={() => { setShowPasswordEditor((value) => !value); setPasswordChangeMessage(null); }} className="px-4 py-2 bg-[#f3ecea] hover:bg-[#e8e1df] text-[#26170c] font-bold rounded-xl border border-[#dec1af] transition-all cursor-pointer whitespace-nowrap">
                  {showPasswordEditor ? 'Close' : 'Change Password'}
                </button>
              </div>

              {showPasswordEditor && (
                <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                  <div>
                    <label className="block font-bold text-[#4f453f] mb-1">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-[#26170c] focus:ring-2 focus:ring-[#26170c]" autoComplete="current-password" required />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4f453f] mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-[#26170c] focus:ring-2 focus:ring-[#26170c]" autoComplete="new-password" minLength={6} maxLength={128} required />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4f453f] mb-1">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-[#26170c] focus:ring-2 focus:ring-[#26170c]" autoComplete="new-password" minLength={6} maxLength={128} required />
                  </div>
                  {passwordChangeMessage && <div className="p-3 bg-[#f9f2f0] border border-[#dec1af] rounded-xl text-xs font-semibold text-[#26170c]">{passwordChangeMessage}</div>}
                  <button type="submit" disabled={isChangingPassword} className="w-full py-3 bg-[#26170c] hover:bg-[#3d2b1f] disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer">
                    {isChangingPassword ? 'Changing Password...' : 'Save New Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Sticky Customer Bag Bar (When Bag has items) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-30 animate-bounceOnce">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 bg-[#26170c] hover:bg-[#3d2b1f] text-white rounded-2xl shadow-2xl flex items-center justify-between active:scale-98 transition-all border border-[#dec1af]/40 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                {totalCartCount}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block">View Order Bag</span>
                <span className="text-[10px] text-[#dec1af]">
                  {cartItems.length} item type{cartItems.length > 1 ? 's' : ''} • Ready for checkout
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base">₱{cartSubtotal.toFixed(2)}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </button>
        </div>
      )}

      {/* Product Customizer Modal */}
      <CustomerProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        addonsList={addons}
        modifierCategories={modifierCategories}
        onAddToCart={handleAddToCart}
      />

      {/* Customer Bag & Checkout Drawer */}
      <CustomerCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onPlaceOrder={handleFinalizeOrder}
        storeSettings={storeSettings}
        currentCustomer={currentCustomer}
      />

      {/* Order Confirmed & Live Status Modal */}
      <CustomerOrderSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        order={activeTrackingOrder}
        storeSettings={storeSettings}
      />
    </div>
  );
};
