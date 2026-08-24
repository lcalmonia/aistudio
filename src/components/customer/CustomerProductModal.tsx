import React, { useState, useEffect } from 'react';
import { MenuItem, ProductAddon, CustomerCartItem, ProductSize } from '../../types';

interface CustomerProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MenuItem | null;
  addonsList: ProductAddon[];
  onAddToCart: (cartItem: CustomerCartItem) => void;
}

const SWEETNESS_OPTIONS = [
  { label: '100% Regular', value: '100%' },
  { label: '75% Less Sweet', value: '75%' },
  { label: '50% Half Sweet', value: '50%' },
  { label: '25% Mild', value: '25%' },
  { label: '0% No Sugar', value: '0%' },
];

const ICE_OPTIONS = [
  { label: 'Regular Ice', value: 'Regular Ice' },
  { label: 'Less Ice', value: 'Less Ice' },
  { label: 'Extra Ice', value: 'Extra Ice' },
  { label: 'No Ice', value: 'No Ice' },
];

export const CustomerProductModal: React.FC<CustomerProductModalProps> = ({
  isOpen,
  onClose,
  product,
  addonsList,
  onAddToCart,
}) => {
  if (!isOpen || !product) return null;

  // Determine available temperatures
  const defaultTemp: 'Hot' | 'Iced' | 'N/A' =
    product.temperature === 'N/A'
      ? 'N/A'
      : product.temperature === 'Cold'
      ? 'Iced'
      : 'Hot';

  const [selectedTemperature, setSelectedTemperature] = useState<'Hot' | 'Iced' | 'N/A'>(defaultTemp);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const [sweetnessLevel, setSweetnessLevel] = useState<string>('100%');
  const [iceLevel, setIceLevel] = useState<string>('Regular Ice');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (product) {
      const initialTemp = product.temperature === 'N/A'
        ? 'N/A'
        : product.temperature === 'Cold'
        ? 'Iced'
        : 'Hot';
      setSelectedTemperature(initialTemp);
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
      setSweetnessLevel('100%');
      setIceLevel('Regular Ice');
      setSelectedAddonIds([]);
      setSpecialInstructions('');
      setQuantity(1);
    }
  }, [product, isOpen]);

  // Check if beverage categories support sweetness/ice
  const isBeverage = product.temperature !== 'N/A' && !['Pasta', 'Pastries', 'Cakes on Tub', 'Rice Meals', 'Pika-Pika', 'Cakes'].includes(product.category);
  const isColdDrink = selectedTemperature === 'Iced';

  // Filter applicable add-ons for this product
  const applicableAddons = addonsList.filter((addon) => {
    if (!addon.available) return false;
    if (product.addons && product.addons.length > 0) {
      return product.addons.includes(addon.id);
    }
    // Default matching
    if (addon.applicableTemperature === 'All') return true;
    if (addon.applicableTemperature === 'Both' && selectedTemperature !== 'N/A') return true;
    if (addon.applicableTemperature === 'Hot' && selectedTemperature === 'Hot') return true;
    if (addon.applicableTemperature === 'Cold' && selectedTemperature === 'Iced') return true;
    return false;
  });

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id]
    );
  };

  // Calculate Unit Price
  const basePrice = product.price;
  const sizePriceDelta = selectedSize?.priceDelta || 0;
  const addonsPrice = selectedAddonIds.reduce((sum, id) => {
    const found = addonsList.find((a) => a.id === id);
    return sum + (found ? found.price : 0);
  }, 0);

  const unitPrice = basePrice + sizePriceDelta + addonsPrice;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    const chosenAddons = addonsList.filter((a) => selectedAddonIds.includes(a.id));
    const cartItem: CustomerCartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      menuItem: product,
      selectedTemperature: selectedTemperature,
      selectedSize: selectedSize,
      sweetnessLevel: isBeverage ? sweetnessLevel : undefined,
      iceLevel: isBeverage && isColdDrink ? iceLevel : undefined,
      selectedAddons: chosenAddons,
      specialInstructions: specialInstructions.trim() || undefined,
      quantity,
      unitPrice,
      totalPrice,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div
      id="customer-product-modal"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#fff8f5] w-full max-w-lg rounded-3xl shadow-2xl border border-[#dec1af]/60 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Image */}
        <div className="relative h-48 sm:h-56 w-full bg-[#f3ecea] overflow-hidden flex-shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-transform active:scale-95 cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          {/* Badges on Image */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#26170c]/80 text-[#dec1af] backdrop-blur-xs mb-1">
                {product.category}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white leading-tight drop-shadow-sm">
                {product.name}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-white/80 font-medium">Base Price</span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-white drop-shadow-sm">
                ₱{product.price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Customizer Form */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-[#26170c]">
          {/* Description & Calories */}
          <p className="text-xs sm:text-sm text-[#4f453f] leading-relaxed">
            {product.description}
          </p>

          {/* Temperature Choice (If Both) */}
          {product.temperature === 'Both' && (
            <div className="bg-white p-3 rounded-2xl border border-[#f3ecea]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-2">
                Temperature Option <span className="text-[#ba1a1a]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemperature('Hot')}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    selectedTemperature === 'Hot'
                      ? 'bg-[#26170c] text-white border-[#26170c] shadow-sm'
                      : 'bg-[#fff8f5] text-[#4f453f] border-[#dec1af] hover:bg-[#f3ecea]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-400">local_fire_department</span>
                  <span>Hot Brewed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemperature('Iced')}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    selectedTemperature === 'Iced'
                      ? 'bg-[#26170c] text-white border-[#26170c] shadow-sm'
                      : 'bg-[#fff8f5] text-[#4f453f] border-[#dec1af] hover:bg-[#f3ecea]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-sky-400">ac_unit</span>
                  <span>Iced & Chilled</span>
                </button>
              </div>
            </div>
          )}

          {/* Size Choice (If available) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="bg-white p-3 rounded-2xl border border-[#f3ecea]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-2">
                Cup / Serving Size
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.sizes.map((s) => {
                  const isSelected = selectedSize?.name === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#26170c] text-white border-[#26170c] shadow-sm'
                          : 'bg-[#fff8f5] text-[#4f453f] border-[#dec1af] hover:bg-[#f3ecea]'
                      }`}
                    >
                      <span className="text-xs font-bold">{s.name}</span>
                      <div className="flex justify-between items-baseline mt-1 text-[11px]">
                        <span className={isSelected ? 'text-[#dec1af]' : 'text-[#81756e]'}>{s.volume}</span>
                        <span className="font-bold">
                          {s.priceDelta > 0 ? `+₱${s.priceDelta}` : 'Default'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sweetness Level (Beverages) */}
          {isBeverage && (
            <div className="bg-white p-3 rounded-2xl border border-[#f3ecea]">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f]">
                  Sweetness Level
                </label>
                <span className="text-xs font-bold text-[#26170c]">{sweetnessLevel}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {SWEETNESS_OPTIONS.map((opt) => {
                  const isSelected = sweetnessLevel === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSweetnessLevel(opt.value)}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#26170c] text-white border-[#26170c]'
                          : 'bg-[#fff8f5] text-[#4f453f] border-[#dec1af] hover:bg-[#f3ecea]'
                      }`}
                    >
                      {opt.value}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ice Level (Cold Beverages) */}
          {isBeverage && isColdDrink && (
            <div className="bg-white p-3 rounded-2xl border border-[#f3ecea]">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f]">
                  Ice Preference
                </label>
                <span className="text-xs font-bold text-[#26170c]">{iceLevel}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {ICE_OPTIONS.map((opt) => {
                  const isSelected = iceLevel === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setIceLevel(opt.value)}
                      className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#26170c] text-white border-[#26170c]'
                          : 'bg-[#fff8f5] text-[#4f453f] border-[#dec1af] hover:bg-[#f3ecea]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons & Modifiers */}
          {applicableAddons.length > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-[#f3ecea]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-2">
                Add-ons & Modifiers (Optional)
              </label>
              <div className="space-y-2">
                {applicableAddons.map((addon) => {
                  const isChecked = selectedAddonIds.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#f9f2f0] border-[#26170c] shadow-xs'
                          : 'bg-[#fff8f5] border-[#f3ecea] hover:bg-[#f3ecea]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-[#26170c] border-[#26170c] text-white'
                              : 'border-[#dec1af] bg-white'
                          }`}
                        >
                          {isChecked && (
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#26170c]">{addon.name}</p>
                          <span className="text-[10px] text-[#81756e] font-medium uppercase">
                            {addon.category}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#26170c]">
                        +₱{addon.price.toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="bg-white p-3 rounded-2xl border border-[#f3ecea]">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
              Special Instructions
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra hot, separate lid, warm the pastry..."
              className="w-full px-3 py-2 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af] focus:outline-none focus:ring-1 focus:ring-[#26170c] font-medium"
            />
          </div>
        </div>

        {/* Modal Sticky Bottom Bar with Quantity & Add to Bag Button */}
        <div className="p-4 bg-[#f9f2f0] border-t border-[#dec1af]/60 flex items-center justify-between gap-3">
          {/* Quantity Counter */}
          <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-2xl border border-[#dec1af] shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-xl bg-[#f3ecea] hover:bg-[#e8e1df] text-[#26170c] font-bold flex items-center justify-center text-sm active:scale-95 transition-all cursor-pointer"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="text-sm font-bold text-[#26170c] min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 rounded-xl bg-[#26170c] text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Add to Bag Button */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-3 px-4 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              <span>Add to Bag</span>
            </div>
            <span className="font-serif font-bold text-sm sm:text-base">
              ₱{totalPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
