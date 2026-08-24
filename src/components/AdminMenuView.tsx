import React, { useState, useMemo } from 'react';
import { MenuItem, ProductAddon, PromoBundle, ProductTemperature } from '../types';
import { DEFAULT_CATEGORIES } from '../data/initialData';

interface AdminMenuViewProps {
  menuItems: MenuItem[];
  addons: ProductAddon[];
  promoBundles: PromoBundle[];
  categories?: string[];
  onAddProduct: () => void;
  onEditProduct: (product: MenuItem) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleProductStock: (productId: string) => void;
  onAddBundle: () => void;
  onEditBundle: (bundle: PromoBundle) => void;
  onDeleteBundle: (bundleId: string) => void;
  onToggleBundleStock: (bundleId: string) => void;
  onAddAddon: () => void;
  onEditAddon: (addon: ProductAddon) => void;
  onDeleteAddon: (addonId: string) => void;
  onToggleAddonStock: (addonId: string) => void;
  onSaveCategory?: (newCategory: string, oldCategory?: string) => void;
  onDeleteCategory?: (category: string) => void;
}

export const AdminMenuView: React.FC<AdminMenuViewProps> = ({
  menuItems,
  addons,
  promoBundles,
  categories = DEFAULT_CATEGORIES,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleProductStock,
  onAddBundle,
  onEditBundle,
  onDeleteBundle,
  onToggleBundleStock,
  onAddAddon,
  onEditAddon,
  onDeleteAddon,
  onToggleAddonStock,
  onSaveCategory,
  onDeleteCategory,
}) => {
  // Navigation sub-tabs within Menu Admin
  const [adminTab, setAdminTab] = useState<'products' | 'bundles' | 'addons' | 'preview'>('products');

  // Search & Filters for Products
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'InStock' | 'OutOfStock'>('All');

  // Quick Category Add State
  const [isQuickAddCategoryOpen, setIsQuickAddCategoryOpen] = useState(false);
  const [quickCategoryInput, setQuickCategoryInput] = useState('');

  // Interactive Live Preview State
  const [previewProduct, setPreviewProduct] = useState<MenuItem>(menuItems[0] || {} as MenuItem);
  const [previewTemperature, setPreviewTemperature] = useState<'Hot' | 'Iced'>('Hot');
  const [previewSizeIdx, setPreviewSizeIdx] = useState<number>(0);
  const [previewSelectedAddons, setPreviewSelectedAddons] = useState<string[]>([]);

  // Category list combined with 'All'
  const filterCategoriesList = ['All', ...categories];

  // Quick Add category from Menu Bar
  const handleQuickAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickCategoryInput.trim();
    if (!trimmed) return;
    if (onSaveCategory) {
      onSaveCategory(trimmed);
    }
    setSelectedCategory(trimmed);
    setQuickCategoryInput('');
    setIsQuickAddCategoryOpen(false);
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

      const matchesTemp =
        temperatureFilter === 'All' ||
        item.temperature === temperatureFilter ||
        (temperatureFilter === 'Hot' && (item.temperature === 'Hot' || item.temperature === 'Both')) ||
        (temperatureFilter === 'Cold' && (item.temperature === 'Cold' || item.temperature === 'Both')) ||
        (temperatureFilter === 'N/A' && item.temperature === 'N/A');

      const matchesStock =
        stockFilter === 'All' ||
        (stockFilter === 'InStock' && item.available) ||
        (stockFilter === 'OutOfStock' && !item.available);

      return matchesSearch && matchesCategory && matchesTemp && matchesStock;
    });
  }, [menuItems, searchQuery, selectedCategory, temperatureFilter, stockFilter]);

  // Live preview calculated price in Peso
  const calculatedPreviewPrice = useMemo(() => {
    if (!previewProduct) return 0;
    let base = previewProduct.price || 0;
    if (previewProduct.sizes && previewProduct.sizes[previewSizeIdx]) {
      base += previewProduct.sizes[previewSizeIdx].priceDelta;
    }
    const addonPriceTotal = previewSelectedAddons.reduce((acc, addonId) => {
      const addon = addons.find((a) => a.id === addonId);
      return acc + (addon ? addon.price : 0);
    }, 0);
    return base + addonPriceTotal;
  }, [previewProduct, previewSizeIdx, previewSelectedAddons, addons]);

  const getTempBadge = (temp: ProductTemperature) => {
    switch (temp) {
      case 'Both':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e1e1c9] text-[#4f503e] border border-[#d2d2b8]">
            <span>🔥 Hot & ❄️ Iced</span>
          </span>
        );
      case 'Hot':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a]">
            <span>🔥 Hot Only</span>
          </span>
        );
      case 'Cold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e0f2fe] text-[#0369a1]">
            <span>❄️ Iced / Cold</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f3ecea] text-[#4f453f]">
            <span>🥐 Food / Treats</span>
          </span>
        );
    }
  };

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 max-w-5xl mx-auto space-y-4">
      {/* Top Admin Banner */}
      <div className="bg-[#26170c] text-[#f9f2f0] p-3.5 sm:p-5 rounded-2xl shadow-md border border-[#3d2b1f] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-[#e1e1c9] text-[#26170c] text-[10px] sm:text-[11px] font-bold rounded-full uppercase tracking-wider">
              iLuvKeyks Admin Portal
            </span>
            <span className="text-xs text-[#d2c4bc]">Menu & Product Master Control</span>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold mt-1 text-white tracking-tight">
            iLuvKeyks Coffee & Tea Master Menu
          </h1>
          <p className="text-xs text-[#d2c4bc] mt-0.5 max-w-xl">
            Upload photos, manage 12+ categories, set hot/cold product temperatures, adjust cup sizes & add-on modifiers, and configure combo deals in Philippine Peso (₱).
          </p>
        </div>

        {/* Quick Stats Chips */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 w-full lg:w-auto">
          <div className="bg-[#3d2b1f] px-2.5 py-1.5 rounded-xl border border-[#523d2e] text-center">
            <p className="text-[9px] sm:text-[10px] text-[#d2c4bc] uppercase font-bold">Categories</p>
            <p className="text-sm sm:text-base font-bold text-[#e1e1c9]">{categories.length}</p>
          </div>
          <div className="bg-[#3d2b1f] px-2.5 py-1.5 rounded-xl border border-[#523d2e] text-center">
            <p className="text-[9px] sm:text-[10px] text-[#d2c4bc] uppercase font-bold">Products</p>
            <p className="text-sm sm:text-base font-bold text-white">{menuItems.length}</p>
          </div>
          <div className="bg-[#3d2b1f] px-2.5 py-1.5 rounded-xl border border-[#523d2e] text-center">
            <p className="text-[9px] sm:text-[10px] text-[#d2c4bc] uppercase font-bold">Combos</p>
            <p className="text-sm sm:text-base font-bold text-[#e1e1c9]">{promoBundles.length}</p>
          </div>
          <div className="bg-[#3d2b1f] px-2.5 py-1.5 rounded-xl border border-[#523d2e] text-center">
            <p className="text-[9px] sm:text-[10px] text-[#d2c4bc] uppercase font-bold">Modifiers</p>
            <p className="text-sm sm:text-base font-bold text-white">{addons.length}</p>
          </div>
        </div>
      </div>

      {/* Admin Sub-Tabs */}
      <div className="flex bg-[#f3ecea] p-1 rounded-xl border border-[#e8e1df] gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setAdminTab('products')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
            adminTab === 'products'
              ? 'bg-white text-[#26170c] shadow-xs'
              : 'text-[#4f453f] hover:text-[#26170c]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
          <span>Products ({menuItems.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('bundles')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
            adminTab === 'bundles'
              ? 'bg-white text-[#26170c] shadow-xs'
              : 'text-[#4f453f] hover:text-[#26170c]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">loyalty</span>
          <span>Combos ({promoBundles.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('addons')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
            adminTab === 'addons'
              ? 'bg-white text-[#26170c] shadow-xs'
              : 'text-[#4f453f] hover:text-[#26170c]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Modifiers ({addons.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('preview')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
            adminTab === 'preview'
              ? 'bg-white text-[#26170c] shadow-xs'
              : 'text-[#4f453f] hover:text-[#26170c]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          <span>Live Preview</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCTS CATALOG */}
      {/* ========================================================================= */}
      {adminTab === 'products' && (
        <div className="space-y-4">
          {/* Action Bar: Search, Filters & "Add Product" CTA */}
          <div className="bg-[#fff8f5] p-3.5 rounded-2xl border border-[#e8e1df] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#81756e] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search coffee, pasta, cakes, coolers, rice meals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={onAddProduct}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                  Add New Product
                </button>
              </div>
            </div>

            {/* Dynamic Filter Pills */}
            <div className="pt-2 border-t border-[#f3ecea] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#81756e] uppercase tracking-wider">
                  Category ({categories.length}):
                </span>
                <button
                  onClick={() => setIsQuickAddCategoryOpen(!isQuickAddCategoryOpen)}
                  className="text-[11px] font-bold text-[#5e604d] hover:text-[#26170c] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">add_circle</span>
                  + Add Category
                </button>
              </div>

              {/* Quick Inline Add Category Input */}
              {isQuickAddCategoryOpen && (
                <form onSubmit={handleQuickAddCategorySubmit} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-[#5e604d] animate-fadeIn">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter new category name (e.g. Snack Platters)..."
                    value={quickCategoryInput}
                    onChange={(e) => setQuickCategoryInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#d2c4bc] focus:ring-2 focus:ring-[#5e604d]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-lg hover:bg-[#3d2b1f]"
                  >
                    Save Category
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickAddCategoryOpen(false);
                      setQuickCategoryInput('');
                    }}
                    className="px-2 py-1.5 text-xs text-[#4f453f] hover:bg-[#f3ecea] rounded-lg"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Category Pills Bar */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                {filterCategoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-[#26170c] text-white shadow-xs'
                        : 'bg-white text-[#4f453f] border border-[#d2c4bc] hover:bg-[#f3ecea]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature & Stock Filter Row */}
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 pt-2 text-xs text-[#4f453f]">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#81756e]">Temp:</span>
                  <select
                    value={temperatureFilter}
                    onChange={(e) => setTemperatureFilter(e.target.value)}
                    className="bg-white border border-[#d2c4bc] rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-[#5e604d]"
                  >
                    <option value="All">All Items</option>
                    <option value="Hot">Hot Available</option>
                    <option value="Cold">Cold / Iced Available</option>
                    <option value="Both">Both Hot & Iced</option>
                    <option value="N/A">Food / Pastries / Pasta</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#81756e]">Status:</span>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value as any)}
                    className="bg-white border border-[#d2c4bc] rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-[#5e604d]"
                  >
                    <option value="All">All ({menuItems.length})</option>
                    <option value="InStock">In Stock</option>
                    <option value="OutOfStock">Sold Out</option>
                  </select>
                </div>
              </div>

              <span className="text-[11px] text-[#81756e] font-medium whitespace-nowrap">
                Showing {filteredProducts.length} of {menuItems.length}
              </span>
            </div>
          </div>

          {/* Product Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredProducts.map((product) => {
              const productAddons = addons.filter((a) => product.addons?.includes(a.id));

              return (
                <div
                  key={product.id}
                  className={`bg-[#fff8f5] rounded-2xl border transition-all shadow-xs overflow-hidden flex flex-col justify-between ${
                    product.available ? 'border-[#e8e1df]' : 'border-[#d2c4bc] opacity-75 bg-[#f3ecea]'
                  }`}
                >
                  <div>
                    {/* Top Row: Photo & Core Info */}
                    <div className="p-3 sm:p-3.5 flex gap-2.5 sm:gap-3">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#e8e1df] border border-[#d2c4bc] flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {!product.available && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider bg-[#ba1a1a] px-1.5 py-0.5 rounded">
                              Sold Out
                            </span>
                          </div>
                        )}
                        {product.popular && product.available && (
                          <span className="absolute top-1 left-1 bg-[#5e604d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            ★ Star
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-[#81756e] uppercase tracking-wider block truncate">
                              {product.category}
                            </span>
                            <h3 className="font-serif text-sm sm:text-base font-bold text-[#26170c] truncate">
                              {product.name}
                            </h3>
                          </div>
                          <span className="font-serif font-bold text-sm sm:text-base text-[#26170c] whitespace-nowrap flex-shrink-0 ml-1">
                            ₱{product.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Temperature & Tag Badges */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getTempBadge(product.temperature)}
                          {product.tags?.slice(0, 2).map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 sm:px-2 py-0.5 bg-[#f3ecea] text-[#4f453f] rounded-full text-[9px] sm:text-[10px] font-semibold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#4f453f] line-clamp-2 mt-1 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Sizes and Add-ons summary bar */}
                    <div className="px-3 sm:px-3.5 py-1.5 bg-[#f9f2f0] border-t border-b border-[#f3ecea] text-xs text-[#4f453f] flex flex-wrap justify-between items-center gap-1.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="material-symbols-outlined text-[15px] text-[#5e604d] flex-shrink-0">straighten</span>
                        <span className="text-[10px] sm:text-[11px] font-medium truncate">
                          Sizes:{' '}
                          {product.sizes && product.sizes.length > 0
                            ? product.sizes.map((s) => `${s.name} (${s.volume})`).join(', ')
                            : 'Standard'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="material-symbols-outlined text-[15px] text-[#5e604d]">tune</span>
                        <span className="text-[10px] sm:text-[11px] font-medium">
                          {productAddons.length} mods
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Controls: In-Stock Toggle & Edit Actions */}
                  <div className="p-2.5 sm:p-3 bg-[#fff8f5] flex justify-between items-center gap-1.5 flex-wrap">
                    {/* Stock Switch */}
                    <button
                      onClick={() => onToggleProductStock(product.id)}
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                        product.available
                          ? 'bg-[#e1e1c9] text-[#636451] hover:bg-[#d5d5b8]'
                          : 'bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {product.available ? 'check_circle' : 'do_not_disturb_on'}
                      </span>
                      <span>{product.available ? 'In Stock' : 'Mark In Stock'}</span>
                    </button>

                    {/* Actions */}
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <button
                        onClick={() => {
                          setPreviewProduct(product);
                          setAdminTab('preview');
                        }}
                        title="Test in Live Customer Preview"
                        className="p-1 sm:p-1.5 rounded-lg text-[#4f453f] hover:bg-[#e8e1df] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[17px] sm:text-[18px]">visibility</span>
                      </button>

                      <button
                        onClick={() => onEditProduct(product)}
                        className="px-2.5 sm:px-3 py-1 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px] sm:text-[16px]">edit</span>
                        <span className="hidden xs:inline">Edit Product</span>
                        <span className="xs:hidden">Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Remove "${product.name}" from the menu?`)) {
                            onDeleteProduct(product.id);
                          }
                        }}
                        title="Delete Product"
                        className="p-1 sm:p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[17px] sm:text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-[#fff8f5] p-8 rounded-2xl border border-[#e8e1df] text-center space-y-2">
              <span className="material-symbols-outlined text-[40px] text-[#81756e]">search_off</span>
              <h4 className="font-serif text-lg font-bold text-[#26170c]">No products found</h4>
              <p className="text-xs text-[#4f453f] max-w-sm mx-auto">
                No menu items match your search or filter settings. Try adjusting your filters or click below to add a new product.
              </p>
              <button
                onClick={onAddProduct}
                className="mt-2 px-4 py-2 bg-[#26170c] text-white text-xs font-bold rounded-full hover:bg-[#3d2b1f]"
              >
                + Add New Product
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROMO BUNDLES & COMBOS */}
      {/* ========================================================================= */}
      {adminTab === 'bundles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#fff8f5] p-3.5 sm:p-4 rounded-2xl border border-[#e8e1df]">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c]">Promotional Bundles & Combos</h3>
              <p className="text-xs text-[#4f453f]">
                Manage package deals, morning coffee + pasta combos, and discount pricing rules in ₱.
              </p>
            </div>
            <button
              onClick={onAddBundle}
              className="w-full sm:w-auto px-4 py-2 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Create Promo Bundle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promoBundles.map((bundle) => (
              <div
                key={bundle.id}
                className={`bg-[#fff8f5] rounded-2xl border transition-all shadow-xs overflow-hidden flex flex-col justify-between ${
                  bundle.available ? 'border-[#e8e1df]' : 'border-[#d2c4bc] opacity-75 bg-[#f3ecea]'
                }`}
              >
                <div>
                  <div className="relative h-36 bg-[#26170c] overflow-hidden">
                    <img
                      src={bundle.image}
                      alt={bundle.name}
                      className="w-full h-full object-cover opacity-85"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap max-w-[90%]">
                      <span className="px-2.5 py-1 bg-[#e1e1c9] text-[#26170c] text-[11px] sm:text-xs font-bold rounded-full shadow-xs">
                        {bundle.discountBadge}
                      </span>
                      {bundle.timeSlot && (
                        <span className="px-2.5 py-1 bg-black/60 text-white text-[10px] font-semibold rounded-full backdrop-blur-xs">
                          {bundle.timeSlot}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-serif text-base sm:text-lg font-bold text-[#26170c] leading-tight">{bundle.name}</h4>
                      <div className="text-right flex-shrink-0">
                        <span className="font-serif text-base sm:text-lg font-bold text-[#26170c]">
                          ₱{bundle.price.toFixed(2)}
                        </span>
                        {bundle.originalPrice > bundle.price && (
                          <span className="block text-[11px] text-[#81756e] line-through">
                            ₱{bundle.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#4f453f] leading-relaxed">{bundle.description}</p>

                    {bundle.temperatureOption && (
                      <div className="p-2 bg-[#f9f2f0] rounded-lg text-xs text-[#4f453f] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#5e604d]">thermostat</span>
                        <span>{bundle.temperatureOption}</span>
                      </div>
                    )}

                    {/* Included items */}
                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-[#81756e] uppercase mb-1">Items Included:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {bundle.bundleItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-md text-[11px] sm:text-xs font-semibold"
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 bg-[#f9f2f0] border-t border-[#e8e1df] flex flex-wrap justify-between items-center gap-2">
                  <button
                    onClick={() => onToggleBundleStock(bundle.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      bundle.available ? 'bg-[#e1e1c9] text-[#636451]' : 'bg-[#ffdad6] text-[#ba1a1a]'
                    }`}
                  >
                    {bundle.available ? 'Bundle Active' : 'Bundle Paused'}
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onEditBundle(bundle)}
                      className="px-3 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-lg hover:bg-[#3d2b1f] flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Edit Combo</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete combo "${bundle.name}"?`)) onDeleteBundle(bundle.id);
                      }}
                      className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ADD-ONS & MODIFIERS LIBRARY */}
      {/* ========================================================================= */}
      {adminTab === 'addons' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#fff8f5] p-3.5 sm:p-4 rounded-2xl border border-[#e8e1df]">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c]">Add-ons & Modifiers Library</h3>
              <p className="text-xs text-[#4f453f]">
                Manage milk substitutes, syrups, extra shots, sweet creams, and temperature rules in ₱.
              </p>
            </div>
            <button
              onClick={onAddAddon}
              className="w-full sm:w-auto px-4 py-2 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Add New Modifier</span>
            </button>
          </div>

          {/* Grouped by Category */}
          {(['Milk', 'Shot', 'Syrup', 'Topping', 'Prep'] as const).map((cat) => {
            const catAddons = addons.filter((a) => a.category === cat);
            const categoryLabels: Record<string, string> = {
              Milk: 'Alternative Milks & Dairy Options',
              Shot: 'Espresso Shots & Roasts',
              Syrup: 'Syrups, Flavors & Sweeteners',
              Topping: 'Pearls, Creams & Toppings',
              Prep: 'Barista Prep & Temperature Rules',
            };

            return (
              <div key={cat} className="bg-[#fff8f5] p-3.5 sm:p-4 rounded-2xl border border-[#e8e1df] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-[#26170c] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#5e604d]" />
                    {categoryLabels[cat]}
                  </h4>
                  <span className="text-[11px] text-[#81756e] font-semibold">{catAddons.length} options</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {catAddons.map((addon) => (
                    <div
                      key={addon.id}
                      className="bg-white p-3 rounded-xl border border-[#d2c4bc] flex justify-between items-center shadow-2xs hover:border-[#81756e] transition-all gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#26170c] truncate">{addon.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs font-bold text-[#636451] whitespace-nowrap">
                            {addon.price > 0 ? `+₱${addon.price.toFixed(2)}` : 'Free'}
                          </span>
                          <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 bg-[#f3ecea] text-[#4f453f] rounded whitespace-nowrap">
                            {addon.applicableTemperature === 'Both'
                              ? 'Hot & Cold'
                              : addon.applicableTemperature === 'Hot'
                              ? 'Hot Only'
                              : 'Cold Only'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => onToggleAddonStock(addon.id)}
                          title={addon.available ? 'In Stock' : 'Out of Stock'}
                          className={`p-1 rounded-md text-xs font-bold cursor-pointer ${
                            addon.available ? 'text-[#636451] hover:bg-[#e1e1c9]' : 'text-[#ba1a1a] hover:bg-[#ffdad6]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {addon.available ? 'toggle_on' : 'toggle_off'}
                          </span>
                        </button>
                        <button
                          onClick={() => onEditAddon(addon)}
                          className="p-1 text-[#4f453f] hover:bg-[#f3ecea] rounded-md cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete modifier "${addon.name}"?`)) onDeleteAddon(addon.id);
                          }}
                          className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LIVE CUSTOMER & POS PREVIEW */}
      {/* ========================================================================= */}
      {adminTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-[#fff8f5] p-4 rounded-2xl border border-[#e8e1df] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#26170c]">
                Live Customer & Barista Screen Preview
              </h3>
              <p className="text-xs text-[#4f453f]">
                Test your product configuration, hot/cold beverage toggles, cup sizes, and modifier pricing.
              </p>
            </div>
            {/* Product Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#26170c]">Test Item:</span>
              <select
                value={previewProduct?.id}
                onChange={(e) => {
                  const p = menuItems.find((m) => m.id === e.target.value);
                  if (p) {
                    setPreviewProduct(p);
                    setPreviewSizeIdx(0);
                    setPreviewSelectedAddons([]);
                    if (p.temperature === 'Cold') setPreviewTemperature('Iced');
                    else setPreviewTemperature('Hot');
                  }
                }}
                className="bg-white border border-[#d2c4bc] rounded-xl px-3 py-1.5 text-xs font-bold text-[#26170c] focus:ring-2 focus:ring-[#5e604d]"
              >
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (₱{m.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Simulation Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#f9f2f0] p-5 rounded-2xl border border-[#e8e1df]">
            {/* Left: Customer View Interactive Configurator */}
            <div className="bg-white rounded-2xl p-5 border border-[#d2c4bc] shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#f3ecea]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#636451] bg-[#e1e1c9] px-2.5 py-0.5 rounded-full">
                  Customer App Preview
                </span>
                <span className="text-xs text-[#81756e] font-semibold">{previewProduct?.category}</span>
              </div>

              {/* Product Hero Image */}
              <div className="relative h-44 rounded-xl overflow-hidden bg-[#e8e1df]">
                <img
                  src={previewProduct?.image}
                  alt={previewProduct?.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-[#26170c] shadow-xs">
                  ₱{calculatedPreviewPrice.toFixed(2)}
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-[#26170c]">{previewProduct?.name}</h3>
                <p className="text-xs text-[#4f453f] mt-1 leading-relaxed">{previewProduct?.description}</p>
              </div>

              {/* Temperature Selector (If applicable) */}
              {previewProduct?.temperature !== 'N/A' && (
                <div>
                  <label className="block text-xs font-bold text-[#26170c] mb-1.5">
                    Select Temperature:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={previewProduct?.temperature === 'Cold'}
                      onClick={() => setPreviewTemperature('Hot')}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        previewTemperature === 'Hot'
                          ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffdad6] shadow-xs'
                          : 'bg-[#f9f2f0] text-[#4f453f] border-[#d2c4bc] disabled:opacity-30'
                      }`}
                    >
                      <span>🔥 Steamed & Hot</span>
                    </button>
                    <button
                      disabled={previewProduct?.temperature === 'Hot'}
                      onClick={() => setPreviewTemperature('Iced')}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        previewTemperature === 'Iced'
                          ? 'bg-[#e0f2fe] text-[#0369a1] border-[#e0f2fe] shadow-xs'
                          : 'bg-[#f9f2f0] text-[#4f453f] border-[#d2c4bc] disabled:opacity-30'
                      }`}
                    >
                      <span>❄️ Over Clear Ice</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {previewProduct?.sizes && previewProduct.sizes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[#26170c] mb-1.5">
                    Select Size & Volume:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {previewProduct.sizes.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewSizeIdx(idx)}
                        className={`p-2 rounded-xl text-center border transition-all ${
                          previewSizeIdx === idx
                            ? 'bg-[#26170c] text-white border-[#26170c] shadow-xs'
                            : 'bg-[#f9f2f0] text-[#4f453f] border-[#d2c4bc]'
                        }`}
                      >
                        <p className="text-xs font-bold">{s.name}</p>
                        <p className="text-[10px] opacity-80">{s.volume}</p>
                        {s.priceDelta !== 0 && (
                          <p className="text-[10px] font-semibold mt-0.5">
                            {s.priceDelta > 0 ? `+₱${s.priceDelta.toFixed(2)}` : `-₱${Math.abs(s.priceDelta).toFixed(2)}`}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons Checklist */}
              <div>
                <label className="block text-xs font-bold text-[#26170c] mb-1.5">
                  Custom Modifiers & Add-ons:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {addons
                    .filter((a) => previewProduct?.addons?.includes(a.id))
                    .map((addon) => {
                      const isChecked = previewSelectedAddons.includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            setPreviewSelectedAddons((prev) =>
                              prev.includes(addon.id) ? prev.filter((id) => id !== addon.id) : [...prev, addon.id]
                            );
                          }}
                          className={`w-full p-2 rounded-xl border text-xs flex justify-between items-center transition-all ${
                            isChecked
                              ? 'bg-[#e1e1c9] border-[#636451] font-semibold text-[#26170c]'
                              : 'bg-[#f9f2f0] border-[#d2c4bc] text-[#4f453f]'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">
                              {isChecked ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                            {addon.name}
                          </span>
                          <span className="text-[11px] font-bold text-[#636451]">
                            {addon.price > 0 ? `+₱${addon.price.toFixed(2)}` : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Right: Barista Kitchen Display Chit & Receipt Preview */}
            <div className="bg-[#fff8f5] rounded-2xl p-5 border border-[#d2c4bc] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-2 border-b border-[#f3ecea]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ba1a1a] bg-[#ffdad6] px-2.5 py-0.5 rounded-full">
                    Barista KDS Ticket Simulation
                  </span>
                  <span className="text-xs text-[#81756e]">Ticket #4295</span>
                </div>

                {/* Simulated Thermal Ticket */}
                <div className="mt-4 p-4 bg-white rounded-xl border border-dashed border-[#81756e] font-mono text-xs space-y-3 shadow-inner">
                  <div className="text-center pb-2 border-b border-dashed border-[#d2c4bc]">
                    <p className="font-bold text-sm tracking-wider">ILUVKEYKS COFFEE & TEA</p>
                    <p className="text-[10px] text-[#81756e]">Order Type: Counter / Take-Out</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-sm text-[#26170c]">
                      <span>
                        1x {previewProduct?.name} ({previewTemperature})
                      </span>
                      <span>₱{calculatedPreviewPrice.toFixed(2)}</span>
                    </div>

                    {previewProduct?.sizes && previewProduct?.sizes[previewSizeIdx] && (
                      <p className="text-[11px] text-[#4f453f] pl-3">
                        • Size: {previewProduct.sizes[previewSizeIdx]?.name} ({previewProduct.sizes[previewSizeIdx]?.volume})
                      </p>
                    )}

                    {previewSelectedAddons.map((id) => {
                      const a = addons.find((item) => item.id === id);
                      if (!a) return null;
                      return (
                        <p key={id} className="text-[11px] text-[#ba1a1a] font-bold pl-3">
                          + {a.name} ({a.price > 0 ? `₱${a.price.toFixed(2)}` : 'No Charge'})
                        </p>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-dashed border-[#d2c4bc] flex justify-between font-bold text-sm">
                    <span>TOTAL DUE</span>
                    <span>₱{calculatedPreviewPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f3ecea] flex justify-between items-center">
                <p className="text-[11px] text-[#81756e]">
                  Preview renders accurately across POS, Barista iPad KDS, and mobile guest menu.
                </p>
                <button
                  onClick={() => onEditProduct(previewProduct)}
                  className="px-3 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-lg hover:bg-[#3d2b1f] flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit This Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
