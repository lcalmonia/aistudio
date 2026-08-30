import React, { useState, useEffect } from 'react';
import { ProductAddon, ModifierCategory, ModifierCategoryType } from '../types';

interface EditAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addon: ProductAddon) => void;
  onDelete?: (addonId: string) => void;
  addonToEdit: ProductAddon | null;
  modifierCategories?: ModifierCategory[];
  productCategories?: string[];
}

export const EditAddonModal: React.FC<EditAddonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  addonToEdit,
  modifierCategories = [],
  productCategories = [],
}) => {
  const isEditing = Boolean(addonToEdit);

  const [name, setName] = useState(addonToEdit?.name || '');
  const [category, setCategory] = useState<string>(addonToEdit?.category || (modifierCategories[0]?.name || 'Syrup & Sweetener'));
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [itemType, setItemType] = useState<ModifierCategoryType>(addonToEdit?.itemType || 'addon');
  const [price, setPrice] = useState<number>(addonToEdit?.price ?? 25.00);
  const [applicableTemperature, setApplicableTemperature] = useState<ProductAddon['applicableTemperature']>(
    addonToEdit?.applicableTemperature || 'Both'
  );
  const [available, setAvailable] = useState<boolean>(addonToEdit?.available ?? true);
  const [required, setRequired] = useState<boolean>(addonToEdit?.required ?? false);
  const [selectionType, setSelectionType] = useState<'single' | 'multiple'>(addonToEdit?.selectionType || 'single');
  const [applicableCategories, setApplicableCategories] = useState<string[]>(addonToEdit?.applicableCategories || []);

  useEffect(() => {
    if (addonToEdit) {
      setName(addonToEdit.name || '');
      const existingInList = modifierCategories.some((mc) => mc.name.toLowerCase() === addonToEdit.category.toLowerCase());
      if (existingInList || ['Milk', 'Shot', 'Syrup', 'Topping', 'Prep'].includes(addonToEdit.category)) {
        setCategory(addonToEdit.category);
        setIsCustomCategory(false);
      } else {
        setCategory('__custom__');
        setCustomCategory(addonToEdit.category);
        setIsCustomCategory(true);
      }
      setItemType(addonToEdit.itemType || 'addon');
      setPrice(addonToEdit.price ?? 25.00);
      setApplicableTemperature(addonToEdit.applicableTemperature || 'Both');
      setAvailable(addonToEdit.available ?? true);
      setRequired(addonToEdit.required ?? false);
      setSelectionType(addonToEdit.selectionType || 'single');
      setApplicableCategories(addonToEdit.applicableCategories || []);
    } else {
      setName('');
      setCategory(modifierCategories[0]?.name || 'Syrup & Sweetener');
      setIsCustomCategory(false);
      setCustomCategory('');
      setItemType('addon');
      setPrice(25.00);
      setApplicableTemperature('Both');
      setAvailable(true);
      setRequired(false);
      setSelectionType('single');
      setApplicableCategories([]);
    }
  }, [addonToEdit, isOpen, modifierCategories]);

  const toggleCategorySelection = (catName: string) => {
    setApplicableCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  const handleCategoryChange = (val: string) => {
    if (val === '__custom__') {
      setIsCustomCategory(true);
      setCategory('__custom__');
    } else {
      setIsCustomCategory(false);
      setCategory(val);
      // Auto-inherit itemType and settings from modifierCategory if matched
      const matchedModCat = modifierCategories.find((mc) => mc.name.toLowerCase() === val.toLowerCase());
      if (matchedModCat) {
        setItemType(matchedModCat.itemType);
        if (matchedModCat.required !== undefined) setRequired(matchedModCat.required);
        if (matchedModCat.selectionType) setSelectionType(matchedModCat.selectionType);
        if (matchedModCat.applicableTemperature) setApplicableTemperature(matchedModCat.applicableTemperature);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const resolvedCategory = isCustomCategory ? (customCategory.trim() || 'Custom') : category;

    const addon: ProductAddon = {
      id: addonToEdit?.id || `addon-${Date.now()}`,
      name: name.trim(),
      category: resolvedCategory,
      itemType,
      price: Math.max(0, Number(price) || 0),
      applicableTemperature,
      available,
      required,
      selectionType,
      applicableCategories: applicableCategories.length > 0 ? applicableCategories : undefined,
    };

    onSave(addon);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#fff8f5] rounded-2xl w-full max-w-lg shadow-2xl border border-[#e8e1df] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#f3ecea] flex justify-between items-center bg-[#f9f2f0]">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                itemType === 'modifier' ? 'bg-[#e1e1c9] text-[#636451]' : 'bg-[#e2d5cc] text-[#26170c]'
              }`}>
                {itemType === 'modifier' ? 'Modifier Item' : 'Add-on Option'}
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#26170c] mt-0.5">
              {isEditing ? `Edit "${addonToEdit.name}"` : 'Add Modifier / Add-on Item'}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-[#4f453f] hover:bg-[#e8e1df] rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Classification Selection */}
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1.5">
              Item Classification *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType('modifier')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  itemType === 'modifier'
                    ? 'bg-[#26170c] text-white border-[#26170c] shadow-xs'
                    : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Modifier (Choice/Style)</span>
              </button>
              <button
                type="button"
                onClick={() => setItemType('addon')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  itemType === 'addon'
                    ? 'bg-[#26170c] text-white border-[#26170c] shadow-xs'
                    : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Add-on (Extra Ingredient)</span>
              </button>
            </div>
          </div>

          {/* Name & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#26170c] mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Oat Milk, Sugar Free Vanilla, Extra Egg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">
                Additional Price (₱)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-[#4f453f]">₱</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
                />
              </div>
              <span className="text-[10px] text-[#81756e]">Set 0 for free modifier</span>
            </div>
          </div>

          {/* Category Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">
                Group Category *
              </label>
              <select
                value={isCustomCategory ? '__custom__' : category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
              >
                {modifierCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.itemType === 'modifier' ? 'Modifier' : 'Add-on'})
                  </option>
                ))}
                <option value="Milk">Alternative Milk</option>
                <option value="Shot">Espresso Shot</option>
                <option value="Syrup">Syrup & Sweetener</option>
                <option value="Topping">Topping & Dusting</option>
                <option value="Prep">Barista Prep / Temp</option>
                <option value="__custom__">+ Enter Custom Category...</option>
              </select>
            </div>

            {isCustomCategory && (
              <div>
                <label className="block text-xs font-bold text-[#26170c] mb-1">
                  Custom Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Side Dips, Egg Styles"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
                />
              </div>
            )}
          </div>

          {/* Temperature Applicability */}
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1.5">
              Temperature Applicability
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Both', 'Hot', 'Cold', 'All'] as const).map((temp) => (
                <button
                  key={temp}
                  type="button"
                  onClick={() => setApplicableTemperature(temp)}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border text-center transition-all ${
                    applicableTemperature === temp
                      ? 'bg-[#26170c] text-white border-[#26170c]'
                      : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                  }`}
                >
                  {temp === 'Both' ? 'Hot & Iced' : temp === 'Hot' ? 'Hot Only' : temp === 'Cold' ? 'Iced Only' : 'All Products'}
                </button>
              ))}
            </div>
          </div>

          {/* Applicable Product Categories (Filter) */}
          {productCategories.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1.5">
                Applicable Menu Categories ({applicableCategories.length === 0 ? 'All Categories' : `${applicableCategories.length} selected`})
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white rounded-xl border border-[#d2c4bc]">
                {productCategories.map((prodCat) => {
                  const isSelected = applicableCategories.includes(prodCat);
                  return (
                    <button
                      key={prodCat}
                      type="button"
                      onClick={() => toggleCategorySelection(prodCat)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[#26170c] text-white border-[#26170c]'
                          : 'bg-[#fff8f5] text-[#4f453f] border-[#e8e1df] hover:bg-[#eee7e4]'
                      }`}
                    >
                      {prodCat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock & Availability Checkbox */}
          <div className="p-3 bg-[#f9f2f0] rounded-xl border border-[#e8e1df] flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#26170c]">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-[#26170c] accent-[#26170c]"
              />
              <span>Currently In Stock & Available for Ordering</span>
            </label>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {available ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[#e8e1df] flex justify-between items-center">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${addonToEdit.name}"?`)) {
                    onDelete(addonToEdit.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors"
              >
                Delete Item
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs text-[#4f453f] hover:bg-[#e8e1df] rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-full transition-colors shadow-2xs"
              >
                {isEditing ? 'Save Changes' : 'Create Item'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
