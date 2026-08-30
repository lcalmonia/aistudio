import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, ProductAddon, CustomerCartItem, ProductSize, ModifierCategory } from '../../types';

interface CustomerProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MenuItem | null;
  addonsList?: ProductAddon[];
  modifierCategories?: ModifierCategory[];
  onAddToCart: (cartItem: CustomerCartItem) => void;
}

interface DynamicModifierGroup {
  category: ModifierCategory;
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
  const safeAddonsList = useMemo(() => addonsList || [], [addonsList]);
  const safeCategories = useMemo(() => modifierCategories || [], [modifierCategories]);

  // Determine initial temperature
  const defaultTemp: 'Hot' | 'Iced' | 'N/A' = useMemo(() => {
    if (!product || product.temperature === 'N/A') return 'N/A';
    if (product.temperature === 'Cold') return 'Iced';
    return 'Hot';
  }, [product]);

  const [selectedTemperature, setSelectedTemperature] = useState<'Hot' | 'Iced' | 'N/A'>(defaultTemp);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [singleChoiceSelections, setSingleChoiceSelections] = useState<Record<string, string>>({});
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if temperature option is enabled for this product
  const isTemperatureOptionEnabled = useMemo(() => {
    if (!product || product.temperature !== 'Both') return false;
    if (Array.isArray(product.modifierCategoryIds)) {
      return product.modifierCategoryIds.some((id) => {
        const cat = safeCategories.find((c) => c.id === id || c.name.toLowerCase() === id.toLowerCase());
        return (
          id === 'modcat-temp' ||
          id === 'modcat-temperature' ||
          id.toLowerCase() === 'temperature' ||
          cat?.id === 'modcat-temp' ||
          cat?.name.toLowerCase() === 'temperature'
        );
      });
    }
    return true;
  }, [product, safeCategories]);

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

  // Dynamic Modifier Groups computation based on product.modifierCategoryIds and safeCategories
  const { dynamicModifierGroups, standaloneAddonItems } = useMemo(() => {
    if (!product) {
      return { dynamicModifierGroups: [], standaloneAddonItems: [] };
    }

    const assignedCatIds = Array.isArray(product.modifierCategoryIds)
      ? product.modifierCategoryIds
      : null;

    // Filter categories assigned to this product (excluding Temperature which is rendered as a top-level choice)
    const activeAssignedCategories = safeCategories.filter((cat) => {
      if (cat.active === false) return false;
      const isTempCat =
        cat.id === 'modcat-temp' ||
        cat.id === 'modcat-temperature' ||
        cat.name.toLowerCase() === 'temperature';
      if (isTempCat) return false;

      // Category assignment check
      if (assignedCatIds !== null) {
        const isDirectlyAssigned = assignedCatIds.some(
          (id) =>
            id === cat.id ||
            id.toLowerCase() === cat.name.toLowerCase() ||
            (cat.id === 'modcat-sweetness' && (id === 'modcat-sweetness' || id.toLowerCase() === 'sweetness level')) ||
            (cat.id === 'modcat-ice' && (id === 'modcat-ice' || id.toLowerCase() === 'ice preference'))
        );
        if (!isDirectlyAssigned) return false;
      } else {
        // Fallback if modifierCategoryIds not defined: check product category scoping
        if (cat.applicableCategories && cat.applicableCategories.length > 0) {
          if (!cat.applicableCategories.includes(product.category)) return false;
        }
      }

      // Check temperature compatibility for the category
      if (selectedTemperature === 'Hot' && cat.applicableTemperature === 'Cold') return false;
      if (selectedTemperature === 'Iced' && cat.applicableTemperature === 'Hot') return false;

      return true;
    });

    // Sort categories by sortOrder
    activeAssignedCategories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const groups: DynamicModifierGroup[] = [];
    const usedAddonIds = new Set<string>();

    activeAssignedCategories.forEach((cat) => {
      // Find addons matching this category
      const matchingItems = safeAddonsList.filter((addon) => {
        if (!addon || !addon.available) return false;

        const matchesCat =
          addon.category.toLowerCase() === cat.name.toLowerCase() ||
          addon.category === cat.id;
        if (!matchesCat) return false;

        // Temperature compatibility check for addon item
        if (addon.applicableTemperature === 'Hot' && selectedTemperature === 'Iced') return false;
        if (addon.applicableTemperature === 'Cold' && selectedTemperature === 'Hot') return false;

        // Product assigned addons whitelist check for addon items if applicable
        if (
          cat.itemType === 'addon' &&
          product.addons &&
          product.addons.length > 0 &&
          !product.addons.includes(addon.id)
        ) {
          return false;
        }

        return true;
      });

      // Sort items by sortOrder or price
      matchingItems.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      if (matchingItems.length > 0) {
        matchingItems.forEach((item) => usedAddonIds.add(item.id));
        groups.push({
          category: cat,
          items: matchingItems,
          isSingleChoice: cat.selectionType === 'single' || cat.itemType === 'modifier',
          isRequired: Boolean(cat.required),
        });
      }
    });

    // Check if there are any standalone product-assigned add-ons not in groups
    const standaloneAddons: ProductAddon[] = [];
    if (product.addons && product.addons.length > 0) {
      product.addons.forEach((addonId) => {
        if (!usedAddonIds.has(addonId)) {
          const found = safeAddonsList.find((a) => a.id === addonId && a.available !== false);
          if (found) {
            // Check temp compatibility
            if (found.applicableTemperature === 'Hot' && selectedTemperature === 'Iced') return;
            if (found.applicableTemperature === 'Cold' && selectedTemperature === 'Hot') return;
            standaloneAddons.push(found);
          }
        }
      });
    }

    return {
      dynamicModifierGroups: groups,
      standaloneAddonItems: standaloneAddons,
    };
  }, [product, safeCategories, safeAddonsList, selectedTemperature]);

  // Reset and initialize selections when product opens or changes
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
        if (initialTemp === 'Hot')
          return s.availableTemperatures.includes('Hot') || s.availableTemperatures.includes('Both');
        if (initialTemp === 'Iced')
          return s.availableTemperatures.includes('Cold') || s.availableTemperatures.includes('Both');
        return true;
      });
      setSelectedSize(validForInitial[0] || (initSizes.length > 0 ? initSizes[0] : null));

      // Initialize default single choices (e.g. 100% sweetness, regular ice, or first required item)
      const initialSingleChoices: Record<string, string> = {};
      dynamicModifierGroups.forEach((group) => {
        if (group.isSingleChoice && group.items.length > 0) {
          // If category is Sweetness Level, default to 100% item or first item
          if (group.category.name.toLowerCase().includes('sweetness')) {
            const standardSweet = group.items.find(
              (i) => i.name.includes('100%') || i.id.includes('100')
            );
            initialSingleChoices[group.category.id] = standardSweet
              ? standardSweet.id
              : group.items[0].id;
          } else if (group.category.name.toLowerCase().includes('ice') && initialTemp === 'Iced') {
            const standardIce = group.items.find(
              (i) => i.name.toLowerCase().includes('regular') || i.id.includes('reg')
            );
            initialSingleChoices[group.category.id] = standardIce
              ? standardIce.id
              : group.items[0].id;
          } else if (group.isRequired) {
            initialSingleChoices[group.category.id] = group.items[0].id;
          }
        }
      });

      setSingleChoiceSelections(initialSingleChoices);
      setSelectedAddonIds([]);
      setSpecialInstructions('');
      setQuantity(1);
      setValidationError(null);
    }
  }, [product, isOpen]);

  // Adjust selections when temperature changes
  useEffect(() => {
    if (availableSizes.length > 0) {
      const currentStillValid = availableSizes.some((s) => s.name === selectedSize?.name);
      if (!currentStillValid) {
        setSelectedSize(availableSizes[0]);
      }
    } else {
      setSelectedSize(null);
    }

    // Auto-select regular ice if switching to iced and ice category is present and empty
    if (selectedTemperature === 'Iced') {
      const iceGroup = dynamicModifierGroups.find((g) =>
        g.category.name.toLowerCase().includes('ice')
      );
      if (iceGroup && !singleChoiceSelections[iceGroup.category.id] && iceGroup.items.length > 0) {
        const standardIce = iceGroup.items.find(
          (i) => i.name.toLowerCase().includes('regular') || i.id.includes('reg')
        );
        setSingleChoiceSelections((prev) => ({
          ...prev,
          [iceGroup.category.id]: standardIce ? standardIce.id : iceGroup.items[0].id,
        }));
      }
    }
  }, [selectedTemperature, availableSizes, selectedSize, dynamicModifierGroups]);

  // Toggle multi-select items in a group or standalone add-ons
  const toggleAddon = (id: string) => {
    setValidationError(null);
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id]
    );
  };

  // Select single-choice modifier in a group
  const selectSingleChoice = (categoryId: string, addonId: string, isRequired: boolean) => {
    setValidationError(null);
    setSingleChoiceSelections((prev) => {
      if (prev[categoryId] === addonId) {
        // Deselect if not required
        if (isRequired) return prev;
        const next = { ...prev };
        delete next[categoryId];
        return next;
      }
      return {
        ...prev,
        [categoryId]: addonId,
      };
    });
  };

  // Calculate Unit Price
  const basePrice = product?.price || 0;
  const sizePriceDelta = selectedSize?.priceDelta || 0;

  // Active chosen modifier and add-on items
  const activeChosenAddonObjects = useMemo(() => {
    const chosenIds: string[] = [...selectedAddonIds];

    dynamicModifierGroups.forEach((group) => {
      if (group.isSingleChoice) {
        const selectedId = singleChoiceSelections[group.category.id];
        if (selectedId && group.items.some((i) => i.id === selectedId)) {
          chosenIds.push(selectedId);
        }
      }
    });

    return safeAddonsList.filter((a) => a && chosenIds.includes(a.id));
  }, [selectedAddonIds, singleChoiceSelections, dynamicModifierGroups, safeAddonsList]);

  const modifiersAndAddonsPrice = activeChosenAddonObjects.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );

  const unitPrice = basePrice + sizePriceDelta + modifiersAndAddonsPrice;
  const totalPrice = unitPrice * quantity;

  // Validate and handle Add to Bag
  const handleAdd = () => {
    if (!product) return;

    // Check required modifier groups
    for (const group of dynamicModifierGroups) {
      if (group.isRequired) {
        if (group.isSingleChoice) {
          const selectedId = singleChoiceSelections[group.category.id];
          const hasValidSelection = selectedId && group.items.some((i) => i.id === selectedId);
          if (!hasValidSelection) {
            setValidationError(`Please select an option for "${group.category.name}".`);
            return;
          }
        } else {
          const groupItemIds = group.items.map((i) => i.id);
          const hasSelectedInGroup = selectedAddonIds.some((id) => groupItemIds.includes(id));
          if (!hasSelectedInGroup) {
            setValidationError(`Please select at least one option for "${group.category.name}".`);
            return;
          }
        }
      }
    }

    // Extract sweetness and ice text for backward compatibility with KDS/Order formatting
    const sweetnessAddon = activeChosenAddonObjects.find(
      (a) =>
        a.category.toLowerCase() === 'sweetness level' ||
        a.category.toLowerCase() === 'sweetness'
    );
    const iceAddon =
      selectedTemperature === 'Iced'
        ? activeChosenAddonObjects.find(
            (a) =>
              a.category.toLowerCase() === 'ice preference' ||
              a.category.toLowerCase() === 'ice'
          )
        : undefined;

    const cartItem: CustomerCartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      menuItem: product,
      selectedTemperature,
      selectedSize: selectedSize || undefined,
      sweetnessLevel: sweetnessAddon ? sweetnessAddon.name : undefined,
      iceLevel: iceAddon ? iceAddon.name : undefined,
      selectedAddons: activeChosenAddonObjects,
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

          {/* Dynamic Temperature Option (Rendered ONLY if enabled for this product) */}
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
                  <span className="material-symbols-outlined text-[16px] text-amber-400">
                    local_fire_department
                  </span>
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
                  <span className="material-symbols-outlined text-[16px] text-sky-400">
                    ac_unit
                  </span>
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
                        <span className={isSelected ? 'text-[#dec1af]' : 'text-[#81756e]'}>
                          {s.volume}
                        </span>
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

          {/* DYNAMIC MODIFIER GROUPS (Rendered dynamically based on assigned modifier categories) */}
          {dynamicModifierGroups.map((group) => {
            const isSingle = group.isSingleChoice;
            return (
              <div
                key={group.category.id}
                className="bg-white p-3.5 rounded-2xl border border-[#f3ecea] space-y-2"
              >
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f]">
                    {group.category.name}
                    {group.isRequired ? (
                      <span className="text-[#ba1a1a] ml-1">* (Required)</span>
                    ) : (
                      <span className="text-[#81756e] font-normal ml-1">(Optional)</span>
                    )}
                  </label>
                  <span className="text-[10px] font-semibold text-[#81756e]">
                    {isSingle ? 'Choose 1' : 'Multiple Selection'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const isSelected = isSingle
                      ? singleChoiceSelections[group.category.id] === item.id
                      : selectedAddonIds.includes(item.id);

                    const handleClick = () => {
                      if (isSingle) {
                        selectSingleChoice(group.category.id, item.id, group.isRequired);
                      } else {
                        toggleAddon(item.id);
                      }
                    };

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={handleClick}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#26170c] text-white border-[#26170c] shadow-xs'
                            : 'bg-[#fff8f5] text-[#4f453f] border-[#dec1af] hover:bg-[#f3ecea]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isSingle ? (
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'border-white bg-white' : 'border-[#81756e]'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#26170c]" />
                              )}
                            </div>
                          ) : (
                            <div
                              className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-white text-[#26170c] border-white'
                                  : 'border-[#81756e]'
                              }`}
                            >
                              {isSelected && (
                                <span className="material-symbols-outlined text-[12px] font-bold">
                                  check
                                </span>
                              )}
                            </div>
                          )}
                          <span className="text-xs font-bold truncate">{item.name}</span>
                        </div>
                        <span
                          className={`text-xs font-bold flex-shrink-0 ${
                            isSelected ? 'text-[#dec1af]' : 'text-[#636451]'
                          }`}
                        >
                          {item.price > 0 ? `+₱${item.price.toFixed(2)}` : 'Included'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* STANDALONE ADD-ONS & EXTRAS (Optional extras directly in product.addons if any) */}
          {standaloneAddonItems.length > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-[#f3ecea] space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f]">
                  Add-ons & Extras (Optional)
                </label>
                <span className="text-[10px] text-[#81756e] font-semibold">
                  {selectedAddonIds.filter((id) =>
                    standaloneAddonItems.some((s) => s.id === id)
                  ).length}{' '}
                  chosen
                </span>
              </div>
              <div className="space-y-1.5">
                {standaloneAddonItems.map((addon) => {
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
