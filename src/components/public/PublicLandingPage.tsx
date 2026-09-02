import React, { useState } from 'react';
import { MenuItem, PromoBundle, StoreSettings, CustomerUser } from '../../types';

interface PublicLandingPageProps {
  menuItems: MenuItem[];
  promoBundles: PromoBundle[];
  categories: string[];
  storeSettings?: StoreSettings;
  currentCustomer: CustomerUser | null;
  onOrderOnline: () => void;
  onOpenCustomerAuth: (mode?: 'login' | 'register', prompt?: string) => void;
  onOpenAdminAuth: () => void;
  onCustomerLogout: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  menuItems = [],
  promoBundles = [],
  categories = [],
  storeSettings,
  currentCustomer,
  onOrderOnline,
  onOpenCustomerAuth,
  onOpenAdminAuth,
  onCustomerLogout,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const storeName = storeSettings?.storeName || 'iLuvKeyks';
  const tagline = storeSettings?.tagline || 'Coffee, Tea & Tub Cakes';
  const branchName = storeSettings?.branchName || 'Sampaloc, Manila';
  const phoneNumber = storeSettings?.phoneNumber || '+63 (917) 823-4567';
  const email = storeSettings?.email || 'orders@iluvkeyks.ph';
  const address = storeSettings?.address || '128 Mahogany Ave, Sampaloc, Manila';
  const openHours = storeSettings?.openHours || '7:00 AM - 10:00 PM Daily';
  const logoUrl = storeSettings?.logoUrl;
  const socialFb = storeSettings?.socialFb || 'facebook.com/iluvkeyks';
  const socialIg = storeSettings?.socialIg || '@iluvkeyks.ph';

  // Filtered menu items preview
  const displayItems = (menuItems || []).filter((item) => {
    if (!item) return false;
    if (activeCategory === 'All') return item.popular || item.tags?.includes('Bestseller') || true;
    return (item.category || '').toLowerCase() === activeCategory.toLowerCase();
  }).slice(0, 8);

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f5] text-[#1d1b1a] flex flex-col font-sans selection:bg-[#fbddca] selection:text-[#26170c]">
      {/* ========================================================================= */}
      {/* 1. PUBLIC TOP NAVIGATION                                                  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#fff8f5]/95 backdrop-blur-md border-b border-[#f3ecea] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Store Logo"
                className="w-10 h-10 rounded-2xl object-cover border border-[#dec1af] shadow-md flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#26170c] text-white flex items-center justify-center shadow-md flex-shrink-0">
                <span className="material-symbols-outlined text-[22px] text-[#dec1af]">local_cafe</span>
              </div>
            )}
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#26170c] leading-none tracking-tight block">
                {storeName}
              </span>
              <span className="text-[11px] font-medium text-[#4f453f] block mt-0.5">
                {tagline}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#4f453f]">
            <button
              onClick={() => scrollToSection('menu-preview')}
              className="hover:text-[#26170c] transition-colors cursor-pointer"
            >
              Menu Catalog
            </button>
            <button
              onClick={() => scrollToSection('promos')}
              className="hover:text-[#26170c] transition-colors cursor-pointer"
            >
              Combos & Promos
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-[#26170c] transition-colors cursor-pointer"
            >
              About Us
            </button>
            <button
              onClick={() => scrollToSection('location-hours')}
              className="hover:text-[#26170c] transition-colors cursor-pointer"
            >
              Hours & Location
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {currentCustomer ? (
              /* Authenticated Customer Pill */
              <div className="flex items-center gap-2">
                <button
                  onClick={onOrderOnline}
                  className="px-3.5 py-2 bg-[#f3ecea] hover:bg-[#e8e1df] text-[#26170c] rounded-xl text-xs font-bold border border-[#dec1af] transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Open Customer Portal"
                >
                  <span className="w-5 h-5 rounded-full bg-[#26170c] text-white text-[10px] flex items-center justify-center font-bold">
                    {currentCustomer.name.charAt(0)}
                  </span>
                  <span className="hidden sm:inline">{currentCustomer.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-[#636451] font-mono">({currentCustomer.id})</span>
                </button>
                <button
                  onClick={onCustomerLogout}
                  className="p-2 text-[#81756e] hover:text-[#93000a] hover:bg-[#ffdad6]/40 rounded-xl transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </div>
            ) : (
              /* Visitor Sign In Button */
              <button
                onClick={() => onOpenCustomerAuth('login', 'Sign in to access your loyalty stamps and place orders')}
                className="hidden sm:flex items-center gap-1 px-3 py-2 text-xs font-bold text-[#26170c] hover:bg-[#f3ecea] rounded-xl transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">account_circle</span>
                <span>Sign In</span>
              </button>
            )}

           

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 text-[#26170c] hover:bg-[#f3ecea] rounded-xl cursor-pointer"
              aria-label="Toggle navigation"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileNavOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Nav */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-[#f3ecea] bg-[#fff8f5] px-4 py-4 space-y-3 shadow-lg">
            <button
              onClick={() => scrollToSection('menu-preview')}
              className="block w-full text-left py-2 text-sm font-semibold text-[#26170c]"
            >
              Menu Catalog
            </button>
            <button
              onClick={() => scrollToSection('promos')}
              className="block w-full text-left py-2 text-sm font-semibold text-[#26170c]"
            >
              Combos & Promos
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left py-2 text-sm font-semibold text-[#26170c]"
            >
              About Us
            </button>
            <button
              onClick={() => scrollToSection('location-hours')}
              className="block w-full text-left py-2 text-sm font-semibold text-[#26170c]"
            >
              Hours & Location
            </button>
            {!currentCustomer && (
              <div className="pt-2 border-t border-[#dec1af]/40 flex gap-2">
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    onOpenCustomerAuth('login');
                  }}
                  className="flex-1 py-2 bg-[#f3ecea] text-[#26170c] text-xs font-bold rounded-xl text-center"
                >
                  Customer Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    onOpenCustomerAuth('register');
                  }}
                  className="flex-1 py-2 bg-[#26170c] text-white text-xs font-bold rounded-xl text-center"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO BANNER SECTION                                                    */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-[#fff8f5] via-[#fbf3ef] to-[#fff8f5] border-b border-[#f3ecea]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#fbddca] text-[#26170c] rounded-full text-xs font-bold shadow-xs">
              <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">local_fire_department</span>
              <span>Fresh Handcrafted Bakes & Specialty Brews</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-[54px] font-extrabold text-[#26170c] leading-[1.15] tracking-tight">
              Artisanal Coffee, Refreshing Teas & Signature Tub Cakes.
            </h1>

            <p className="text-sm sm:text-base text-[#4f453f] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience the perfect blend of rich espresso, creamy ceremonial matcha, savory rice meals, and our famous layered cakes on tub — prepared fresh daily in {branchName}.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onOrderOnline}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
              >
                <span className="material-symbols-outlined text-[20px] text-[#fbddca] group-hover:scale-110 transition-transform">
                  restaurant_menu
                </span>
                <span>ORDER ONLINE NOW</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              <button
                onClick={() => scrollToSection('menu-preview')}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#f3ecea] hover:bg-[#e8e1df] text-[#26170c] font-bold text-sm rounded-2xl border border-[#dec1af] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Explore Menu Preview</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>

            {/* Hero Value Props Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#dec1af]/40 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="p-2.5 bg-white/80 rounded-2xl border border-[#f3ecea] shadow-xs">
                <span className="material-symbols-outlined text-[20px] text-[#5e604d]">bolt</span>
                <h4 className="font-serif text-xs font-bold text-[#26170c] mt-0.5">Fast Pickup</h4>
                <p className="text-[10px] text-[#81756e]">Order ahead & skip line</p>
              </div>
              <div className="p-2.5 bg-white/80 rounded-2xl border border-[#f3ecea] shadow-xs">
                <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]">moped</span>
                <h4 className="font-serif text-xs font-bold text-[#26170c] mt-0.5">Hot Delivery</h4>
                <p className="text-[10px] text-[#81756e]">Direct to your doorstep</p>
              </div>
              <div className="p-2.5 bg-white/80 rounded-2xl border border-[#f3ecea] shadow-xs">
                <span className="material-symbols-outlined text-[20px] text-[#d97706]">stars</span>
                <h4 className="font-serif text-xs font-bold text-[#26170c] mt-0.5">Loyalty Perks</h4>
                <p className="text-[10px] text-[#81756e]">Earn free drinks & cakes</p>
              </div>
            </div>
          </div>

          {/* Right Hero Showcase Visuals */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md">
              {/* Main Feature Card */}
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEPK9an39rFEkfnp4LRaMqlPguV-s_RqdDV3FcNMZJuxAA2NG3s4Vj1YCqZGozzqYBUaORRDaOp1QySWD3zavJSY4WfpCoG_tOmX6LnCt7kbG-aSamCO4-gV_vKuAsnEqCQcBJQV1oJXYCXqiAz0xdScWn3LHH2FL9FY8Os11FNYgSA8OYNMaTpGUSs6lVsJ4RLjDLzmTHawjWGN39KIROIBlVnGpeNKU6y-nW8S2RGne8Y87fgfSG"
                  alt="Signature Spanish Latte & Treats"
                  className="w-full h-72 sm:h-80 object-cover"
                />
                <div className="p-4 bg-[#fff8f5]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5e604d]">
                        House Bestseller
                      </span>
                      <h3 className="font-serif text-base font-bold text-[#26170c]">
                        Spanish Latte & Ube Tub Cake Pair
                      </h3>
                    </div>
                    <span className="font-serif font-bold text-lg text-[#26170c]">₱295</span>
                  </div>
                </div>
              </div>

              {/* Floating review badge */}
              <div className="absolute -bottom-4 -left-4 bg-[#26170c] text-white p-3.5 rounded-2xl shadow-xl border border-white/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fbddca] text-[#26170c] flex items-center justify-center font-bold text-base">
                  ★ 4.9
                </div>
                <div>
                  <p className="text-xs font-bold">1,800+ Happy Foodies</p>
                  <p className="text-[10px] text-[#dec1af]">Rated Manila's Sweetest Cafe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROMOTIONS & COMBO DEALS                                               */}
      {/* ========================================================================= */}
      <section id="promos" className="py-14 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#ba1a1a]">
            Limited Time Offers
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#26170c] mt-1">
            Featured Combo Feasts & Bundles
          </h2>
          <p className="text-xs sm:text-sm text-[#4f453f] mt-2">
            Enjoy unbeatable savings when you pair your favorite cafe meals with signature drinks and cakes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promoBundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-[#f9f2f0] rounded-3xl p-4 sm:p-5 border border-[#f3ecea] shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[4/3]">
                  <img
                    src={bundle.image}
                    alt={bundle.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#ba1a1a] text-white text-[10px] font-extrabold rounded-full shadow-md">
                    {bundle.discountBadge}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#26170c] leading-tight">
                  {bundle.name}
                </h3>
                <p className="text-xs text-[#4f453f] mt-1.5 leading-relaxed">
                  {bundle.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {bundle.bundleItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-full text-[10px] font-semibold"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#dec1af]/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#81756e] line-through block">
                    ₱{bundle.originalPrice.toFixed(2)}
                  </span>
                  <span className="font-serif text-xl font-extrabold text-[#26170c]">
                    ₱{bundle.price.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={onOrderOnline}
                  className="px-4 py-2 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span>Order Bundle</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MENU CATALOG PREVIEW                                                   */}
      {/* ========================================================================= */}
      <section id="menu-preview" className="py-14 px-4 sm:px-6 bg-[#fbf3ef] border-y border-[#f3ecea]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#5e604d]">
                Handcrafted Favorites
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#26170c] mt-1">
                Explore the iLuvKeyks Menu
              </h2>
              <p className="text-xs sm:text-sm text-[#4f453f] mt-1">
                Browse our selection of freshly brewed coffee, milk tea, tub cakes, pasta, and savory meals.
              </p>
            </div>

            <button
              onClick={onOrderOnline}
              className="self-start md:self-auto px-5 py-2.5 bg-[#26170c] text-white text-xs font-bold rounded-2xl shadow-sm hover:bg-[#3d2b1f] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>View Full Menu & Order</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
            {['All', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                  activeCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-[#26170c] text-[#fbddca] shadow-sm'
                    : 'bg-white text-[#4f453f] border border-[#dec1af] hover:bg-[#f3ecea]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#f3ecea] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#f9f2f0]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.popular && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#ba1a1a] text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                        Bestseller
                      </span>
                    )}
                    {item.temperature !== 'N/A' && (
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-[#26170c]/80 backdrop-blur-xs text-white text-[9px] font-bold rounded-md">
                        {item.temperature}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-bold text-[#81756e] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#26170c] mt-0.5 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#4f453f] mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between">
                  <span className="font-serif text-base font-extrabold text-[#26170c]">
                    ₱{item.price.toFixed(2)}
                  </span>
                  <button
                    onClick={onOrderOnline}
                    className="px-3 py-1.5 bg-[#fbddca] hover:bg-[#26170c] hover:text-[#fbddca] text-[#26170c] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>Order</span>
                    <span className="material-symbols-outlined text-[14px]">add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onOrderOnline}
              className="px-8 py-3.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Click Here to Customize & Order Online</span>
              <span className="material-symbols-outlined text-[18px] text-[#fbddca]">shopping_bag</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ABOUT ILUVKEYKS                                                        */}
      {/* ========================================================================= */}
      <section id="about" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#5e604d]">
              Our Passion & Craft
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#26170c] leading-tight">
              Crafted with Love, Baked in Tubs, Brewed to Perfection.
            </h2>
            <p className="text-xs sm:text-sm text-[#4f453f] leading-relaxed">
              At {storeName}, we believe that every cup of coffee and every bite of cake should bring comfort to your day. Founded with a deep love for Filipino cafe culture, our kitchen pairs premium espresso roasts with delightful dessert innovations like our viral Tub Cakes.
            </p>
            <p className="text-xs sm:text-sm text-[#4f453f] leading-relaxed">
              Whether you're stopping by for your morning Spanish Latte, dining in with friends over Truffle Pasta, or ordering fresh tub cakes for family celebrations, we are committed to delivering warmth and quality in every single order.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea]">
                <h4 className="font-serif text-2xl font-bold text-[#26170c]">100%</h4>
                <p className="text-xs text-[#4f453f] font-medium">Locally Sourced & Artisanal</p>
              </div>
              <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea]">
                <h4 className="font-serif text-2xl font-bold text-[#26170c]">Daily</h4>
                <p className="text-xs text-[#4f453f] font-medium">Fresh Baked Batches</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
              alt="iLuvKeyks Cozy Cafe Atmosphere"
              className="rounded-3xl shadow-xl object-cover w-full h-80 sm:h-96 border-4 border-white"
            />
            <div className="absolute -bottom-4 -right-4 p-4 bg-[#26170c] text-white rounded-2xl shadow-xl max-w-xs border border-white/20">
              <p className="font-serif text-sm font-bold text-[#fbddca]">"The sweetest spot in town."</p>
              <p className="text-[11px] text-[#dec1af] mt-1">Dine-in, Takeout & Delivery available 7 days a week.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. LOCATION, HOURS & CONTACT INFO                                         */}
      {/* ========================================================================= */}
      <section id="location-hours" className="py-14 px-4 sm:px-6 bg-[#f9f2f0] border-t border-[#f3ecea]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Operating Hours */}
          <div className="p-6 bg-white rounded-3xl border border-[#f3ecea] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#fbddca] text-[#26170c] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[22px]">schedule</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#26170c]">Store Hours</h3>
              <p className="text-xs text-[#4f453f] mt-1">Open 7 days a week for dine-in & delivery</p>
              <div className="mt-4 p-3 bg-[#f9f2f0] rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-[#26170c]">
                  <span>Monday - Sunday:</span>
                  <span>{openHours}</span>
                </div>
                <div className="flex justify-between text-[#81756e]">
                  <span>Kitchen Last Call:</span>
                  <span>9:30 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Location & Address */}
          <div className="p-6 bg-white rounded-3xl border border-[#f3ecea] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#e1e1c9] text-[#636451] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[22px]">location_on</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#26170c]">Cafe Location</h3>
              <p className="text-xs text-[#4f453f] mt-1">{branchName}</p>
              <div className="mt-4 p-3 bg-[#f9f2f0] rounded-xl text-xs text-[#26170c] font-medium leading-relaxed">
                📍 {address}
              </div>
            </div>
          </div>

          {/* Card 3: Contact & Social */}
          <div className="p-6 bg-white rounded-3xl border border-[#f3ecea] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#dec1af] text-[#26170c] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[22px]">call</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#26170c]">Get in Touch</h3>
              <p className="text-xs text-[#4f453f] mt-1">Inquiries, bulk cake orders & reservations</p>
              <div className="mt-4 space-y-1.5 text-xs text-[#4f453f]">
                <p>📞 Phone: <span className="font-bold text-[#26170c]">{phoneNumber}</span></p>
                <p>✉️ Email: <span className="font-bold text-[#26170c]">{email}</span></p>
                <p>📸 Instagram: <span className="font-bold text-[#26170c]">{socialIg}</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER & STAFF ACCESS                                                  */}
      {/* ========================================================================= */}
      <footer className="bg-[#26170c] text-white py-12 px-4 sm:px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-[#fbddca] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">local_cafe</span>
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold">{storeName} Coffee & Tea</h3>
              <p className="text-xs text-[#dec1af]">{tagline} • {branchName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={onOrderOnline}
              className="px-4 py-2 bg-[#fbddca] text-[#26170c] font-bold rounded-xl hover:bg-white transition-all cursor-pointer"
            >
              Order Online
            </button>
            <button
              onClick={onOpenAdminAuth}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer text-xs"
              title="Store Manager & Barista Portal"
            >
              <span className="material-symbols-outlined text-[16px] text-[#dec1af]">admin_panel_settings</span>
              <span>Staff / Admin Portal</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-[#dec1af]/70">
          <p>© 2026 {storeName} Coffee & Tea. All rights reserved.</p>
          <p>Handcrafted drinks & artisanal tub cakes in Manila, Philippines.</p>
        </div>
      </footer>
    </div>
  );
};
