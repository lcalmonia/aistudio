import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, ProductAddon, CustomerCartItem, ProductSize, ModifierCategory } from '../../types';

interface CustomerProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MenuItem | null;
  addonsList: ProductAddon[];
  modifierCategories?: ModifierCategory[];
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

interface ModifierGroup {
  categoryInfo?: ModifierCategory;
  items: ProductAddon[];
  isSingleChoice: boolean;
  isRequired: boolean;
}

export const CustomerProductModal: React.FC<CustomerProductModalProps> = ({
  isOpen,
  onClose,
  product,
  addonsList = [],
  modifierCategories = [],
  onAddToCart,
}) => {
  const safeAddonsList = addonsList || [];
  const safeCategories = modifierCategories || [];

  // Determine initial temperature
  const defaultTemp: 'Hot' | 'Iced' | 'N/A' =
    !product || product.temperature === 'N/A'
      ? 'N/A'
      : product.temperature === 'Cold'
      ? 'Iced'
      : 'Hot';

  const [selectedTemperature, setSelectedTemperature] = useState<'Hot' | 'Iced' | 'N/A'>(defaultTemp);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [sweetnessLevel, setSweetnessLevel] = useState<string>('100%');
  const [iceLevel, setIceLevel] = useState<string>('Regular Ice');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [singleChoiceSelections, setSingleChoiceSelections] = useState<Record<string, string>>({});
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Compute available sizes for the current temperature
  const availableSizes = useMemo(() => {
    if (!product || !product.sizes || product.sizes.length === 0) return [];
    if (selectedTemperature === 'N/A') return product.sizes;

    return product.sizes.filter((s) => {
      if (!s.availableTemperatures || s.availableTemperatures.length === 0) {
        if (s.applicableTemperature) {
          if (s.applicableTemperature === 'All' || s.applicableTemperature === 'Both') return true;
          if (s.applicableTemperature === 'Hot' && selectedTemperature === 'Hot') return true;
          if (s.applicableTemperature === 'Cold' && selectedTemperature === 'Iced') return true;
          return false;
        }
        return true;
      }
      if (selectedTemperature === 'Hot') {
        return s.availableTemperatures.includes('Hot') || s.availableTemperatures.includes('Both');
      }
      if (selectedTemperature === 'Iced') {
        return s.availableTemperatures.includes('Cold') || s.availableTemperatures.includes('Both');
      }
      return true;
    });
  }, [product, selectedTemperature]);

  // Reset and initialize when product or open state changes
  useEffect(() => {
    if (product && isOpen) {
      const initialTemp =
        product.temperature === 'N/A'
          ? 'N/A'
          : product.temperature === 'Cold'
          ? 'Iced'
          : 'Hot';
      setSelectedTemperature(initialTemp);

      // Determine initial size
      const initSizes = product.sizes || [];
      const validForInitial = initSizes.filter((s) => {
        if (!s.availableTemperatures || s.availableTemperatures.length === 0) return true;
        if (initialTemp === 'Hot') return s.availableTemperatures.includes('Hot') || s.availableTemperatures.includes('Both');
        if (initialTemp === 'Iced') return s.availableTemperatures.includes('Cold') || s.availableTemperatures.includes('Both');
        return true;
      });
      setSelectedSize(validForInitial[0] || (initSizes.length > 0 ? initSizes[0] : null));

      setSweetnessLevel('100%');
      setIceLevel('Regular Ice');
      setSelectedAddonIds([]);
      setSingleChoiceSelections({});
      setSpecialInstructions('');
      setQuantity(1);
      setValidationError(null);
    }
  }, [product, isOpen]);

  // Update selected size when temperature changes if current size is no longer valid
  useEffect(() => {
    if (availableSizes.length > 0) {
      const currentStillValid = availableSizes.some((s) => s.name === selectedSize?.name);
      if (!currentStillValid) {
        setSelectedSize(availableSizes[0]);
      }
    } else {
      setSelectedSize(null);
    }
  }, [selectedTemperature, availableSizes, selectedSize]);

  // Check if beverage categories or modifier categories support sweetness/ice
  const isBeverage =
    Boolean(product) &&
    product!.temperature !== 'N/A' &&
    !['Pasta', 'Pastries', 'Cakes on Tub', 'Rice Meals', 'Pika-Pika', 'Cakes'].includes(product!.category);
  const isColdDrink = selectedTemperature === 'Iced';

  const isTemperatureOptionEnabled =
    product?.temperature === 'Both' &&
    (!Array.isArray(product.modifierCategoryIds) ||
      product.modifierCategoryIds.some(
        (id) => id === 'modcat-temp' || id === 'modcat-temperature' || id.toLowerCase() === 'temperature'
      ));

  const isSweetnessEnabled = Array.isArray(product?.modifierCategoryIds)
    ? product.modifierCategoryIds.some(
        (id) => id === 'modcat-sweetness' || id.toLowerCase().includes('sweetness')
      )
    : isBeverage;

  const isIceEnabled = Array.isArray(product?.modifierCategoryIds)
    ? isColdDrink &&
      product.modifierCategoryIds.some(
        (id) => id === 'modcat-ice' || id.toLowerCase().includes('ice')
      )
    : isBeverage && isColdDrink;

  // Filter applicable add-ons and modifiers for this product and temperature
  const relevantAddons = useMemo(() => {
    if (!product) return [];
    return safeAddonsList.filter((addon) => {
      if (!addon || !addon.available) return false;

      // Check product-level assigned modifier categories if explicitly configured
      if (Array.isArray(product.modifierCategoryIds)) {
        const catConfig = safeCategories.find(
          (c) => c.name.toLowerCase() === addon.category.toLowerCase()
        );
        const matchesCategory = product.modifierCategoryIds.some(
          (id) =>
            id === addon.category ||
            id.toLowerCase() === addon.category.toLowerCase() ||
            (catConfig && id === catConfig.id)
        );
        if (!matchesCategory) return false;
      }

      // Product assigned addons whitelist check
      if (product.addons && product.addons.length > 0) {
        if (!product.addons.includes(addon.id)) return false;
      }

      // Check product category applicability if configured
      if (addon.applicableCategories && addon.applicableCategories.length > 0) {
        if (!addon.applicableCategories.includes(product.category)) return false;
      }

      // Check temperature applicability
      if (addon.applicableTemperature === 'All') return true;
      if (addon.applicableTemperature === 'Both' && selectedTemperature !== 'N/A') return true;
      if (addon.applicableTemperature === 'Hot' && selectedTemperature === 'Hot') return true;
      if (addon.applicableTemperature === 'Cold' && selectedTemperature === 'Iced') return true;
      if (addon.applicableTemperature === 'Both') return true;

      return true;
    });
  }, [safeAddonsList, product, selectedTemperature, safeCategories]);

  // Group items by category and separate Modifiers from Add-ons
  const { modifierGroups, addonItems } = useMemo(() => {
    const modGroups: Record<string, ModifierGroup> = {};

    const extraAddons: ProductAddon[] = [];

    relevantAddons.forEach((addon) => {
      const catConfig = safeCategories.find(
        (c) => c.name.toLowerCase() === addon.category.toLowerCase()
      );

      const isModifier =
        addon.itemType === 'modifier' ||
        catConfig?.itemType === 'modifier' ||
        addon.selectionType === 'single' ||
        catConfig?.selectionType === 'single';

      if (isModifier) {
        const catName = addon.category || 'Options';
        if (!modGroups[catName]) {
          modGroups[catName] = {
            categoryInfo: catConfig,
            items: [],
            isSingleChoice: addon.selectionType === 'single' || catConfig?.selectionType === 'single',
            isRequired: Boolean(addon.required || catConfig?.required),
          };
        }
        modGroups[catName].items.push(addon);
      } else {
        extraAddons.push(addon);
      }
    });

    return {
      modifierGroups: modGroups,
      addonItems: extraAddons,
    };
  }, [relevantAddons, safeCategories]);

  // Toggle multi-select add-ons
  const toggleAddon = (id: string) => {
    setValidationError(null);
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id]
    );
  };

  // Select single-choice modifier
  const selectSingleChoice = (categoryName: string, addonId: string) => {
    setValidationError(null);
    setSingleChoiceSelections((prev) => {
      if (prev[categoryName] === addonId) {
        // Deselect if not required
        const group = modifierGroups[categoryName];
        if (group?.isRequired) return prev;
        const next = { ...prev };
        delete next[categoryName];
        return next;
      }
      return {
        ...prev,
        [categoryName]: addonId,
      };
    });
  };

  // Calculate Unit Price
  const basePrice = product?.price || 0;
  const sizePriceDelta = selectedSize?.priceDelta || 0;

  const multiAddonsPrice = selectedAddonIds.reduce((sum, id) => {
    const found = safeAddonsList.find((a) => a.id === id);
    return sum + (found ? found.price : 0);
  }, 0);

  const singleModifiersPrice = Object.values(singleChoiceSelections).reduce((sum, id) => {
    const found = safeAddonsList.find((a) => a.id === id);
    return sum + (found ? found.price : 0);
  }, 0);

  const unitPrice = basePrice + sizePriceDelta + multiAddonsPrice + singleModifiersPrice;
  const totalPrice = unitPrice * quantity;

  // Validate and handle Add to Bag
  const handleAdd = () => {
    if (!product) return;
    // Check required modifier groups
    for (const [catName, group] of Object.entries(modifierGroups) as [string, ModifierGroup][]) {
      if (group.isRequired && !singleChoiceSelections[catName]) {
        setValidationError(`Please select an option for "${catName}".`);
        return;
      }
    }

    const allChosenIds = [
      ...selectedAddonIds,
      ...Object.values(singleChoiceSelections),
    ];

    const chosenAddons = safeAddonsList.filter((a) => a && allChosenIds.includes(a.id));

    const cartItem: CustomerCartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      menuItem: product,
      selectedTemperature,
      selectedSize: selectedSize || undefined,
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

  if (!isOpen || !product) return null;

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
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-transform active:scale-95 cursor-pointer z-10"
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
          {/* Description & Tasting Notes */}
          {product.description && (
            <p className="text-xs sm:text-sm text-[#4f453f] leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Validation Notice */}
          {validationError && (
            <div className="p-2.5 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl text-xs font-bold text-[#ba1a1a] flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{validationError}</span>
            </div>
          )}

          {/* Temperature Choice (If Both and enabled) */}
          {isTemperatureOptionEnabled && (
            <div className="bg-white p-3.5 rounded-2xl border border-[#f3ecea]">
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

          {/* Cup / Serving Size (Temperature-Aware) */}
          {availableSizes.length > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-[#f3ecea]">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f]">
                  Cup / Serving Size
                </label>
                {selectedTemperature !== 'N/A' && (
                  <span className="text-[10px] text-[#81756e] font-semibold">
                    {selectedTemperature === 'Hot' ? '🔥 Hot Sizes' : '❄️ Iced Sizes'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableSizes.map((s) => {
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

          {/* Sweetness Level */}
          {isSweetnessEnabled && (
            <div className="bg-white p-3.5 rounded-2xl border border-[#f3ecea]">
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

          {/* Ice Level */}
          {isIceEnabled && (
            <div className="bg-white p-3.5 rounded-2xl border border-[#f3ecea]">
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

          {/* SECTION 1: MODIFIERS (Single choice, preparation choices, flavor options) */}
          {(Object.entries(modifierGroups) as [string, ModifierGroup][]).map(([catName, group]) => (
            <div key={catName} className="bg-white p-3.5 rounded-2xl border border-[#f3ecea] space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f]">
                  {catName}
                  {group.isRequired ? (
                    <span className="text-[#ba1a1a] ml-1">* (Required)</span>
                  ) : (
                    <span className="text-[#81756e] font-normal ml-1">(Optional)</span>
                  )}
                </label>
                <span className="text-[10px] font-semibold text-[#81756e]">
                  {group.isSingleChoice ? 'Choose 1' : 'Multiple Selection'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((mod) => {
                  const isSelected = singleChoiceSelections[catName] === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => selectSingleChoice(catName, mod.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#26170c] text-white border-[#26170c] shadow-xs'
                          : 'bg-[#fff8f5] text-[#4f453f] border-[#dec1af] hover:bg-[#f3ecea]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-white bg-white' : 'border-[#81756e]'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#26170c]" />}
                        </div>
                        <span className="text-xs font-bold truncate">{mod.name}</span>
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ${isSelected ? 'text-[#dec1af]' : 'text-[#636451]'}`}>
                        {mod.price > 0 ? `+₱${mod.price.toFixed(2)}` : 'Included'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* SECTION 2: ADD-ONS (Optional Extras, Milks, Syrups, Toppings) */}
          {addonItems.length > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-[#f3ecea] space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f]">
                  Add-ons & Extras (Optional)
                </label>
                <span className="text-[10px] text-[#81756e] font-semibold">
                  {selectedAddonIds.length} chosen
                </span>
              </div>
              <div className="space-y-1.5">
                {addonItems.map((addon) => {
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
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                            isChecked
                              ? 'bg-[#26170c] border-[#26170c] text-white'
                              : 'border-[#dec1af] bg-white'
                          }`}
                        >
                          {isChecked && (
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#26170c] truncate">{addon.name}</p>
                          <span className="text-[10px] text-[#81756e] font-medium uppercase">
                            {addon.category}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#26170c] flex-shrink-0">
                        +₱{addon.price.toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#f3ecea]">
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
