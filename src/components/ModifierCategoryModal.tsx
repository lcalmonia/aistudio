import React, { useState, useEffect } from 'react';
import { ModifierCategory, ModifierCategoryType } from '../types';

interface ModifierCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: ModifierCategory) => void;
  onDelete?: (categoryId: string) => void;
  categoryToEdit: ModifierCategory | null;
  productCategories?: string[];
}

export const ModifierCategoryModal: React.FC<ModifierCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  categoryToEdit,
  productCategories = [],
}) => {
  const isEditing = Boolean(categoryToEdit);

  const [name, setName] = useState(categoryToEdit?.name || '');
  const [itemType, setItemType] = useState<ModifierCategoryType>(categoryToEdit?.itemType || 'modifier');
  const [required, setRequired] = useState<boolean>(categoryToEdit?.required ?? false);
  const [selectionType, setSelectionType] = useState<'single' | 'multiple'>(categoryToEdit?.selectionType || 'single');
  const [applicableTemperature, setApplicableTemperature] = useState<'Hot' | 'Cold' | 'Both' | 'All'>(
    categoryToEdit?.applicableTemperature || 'Both'
  );
  const [selectedProductCategories, setSelectedProductCategories] = useState<string[]>(
    categoryToEdit?.applicableCategories || []
  );

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setItemType(categoryToEdit.itemType || 'modifier');
      setRequired(categoryToEdit.required ?? false);
      setSelectionType(categoryToEdit.selectionType || 'single');
      setApplicableTemperature(categoryToEdit.applicableTemperature || 'Both');
      setSelectedProductCategories(categoryToEdit.applicableCategories || []);
    } else {
      setName('');
      setItemType('modifier');
      setRequired(false);
      setSelectionType('single');
      setApplicableTemperature('Both');
      setSelectedProductCategories([]);
    }
  }, [categoryToEdit, isOpen]);

  const toggleProductCategory = (cat: string) => {
    setSelectedProductCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSelectAllProductCategories = () => {
    if (selectedProductCategories.length === productCategories.length) {
      setSelectedProductCategories([]);
    } else {
      setSelectedProductCategories([...productCategories]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: ModifierCategory = {
      id: categoryToEdit?.id || `modcat-${Date.now()}`,
      name: name.trim(),
      itemType,
      required,
      selectionType,
      applicableCategories: selectedProductCategories,
      applicableTemperature,
      active: categoryToEdit?.active ?? true,
      sortOrder: categoryToEdit?.sortOrder ?? 0,
    };

    onSave(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#fff8f5] rounded-2xl w-full max-w-lg shadow-2xl border border-[#e8e1df] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#f3ecea] flex justify-between items-center bg-[#f9f2f0]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-md">
              Catalog Configuration
            </span>
            <h3 className="font-serif text-lg font-bold text-[#26170c] mt-0.5">
              {isEditing ? `Edit Category "${categoryToEdit.name}"` : 'Create Modifier / Add-on Category'}
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Classification: Modifier vs Add-on */}
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1.5">
              System Classification <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType('modifier')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  itemType === 'modifier'
                    ? 'bg-[#26170c] text-white border-[#26170c] shadow-xs'
                    : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Modifier Group</span>
                </div>
                <p className={`text-[10px] mt-1 ${itemType === 'modifier' ? 'text-white/80' : 'text-[#81756e]'}`}>
                  Flavors, sweetness levels, ice amounts, rice meal choices.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setItemType('addon')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  itemType === 'addon'
                    ? 'bg-[#26170c] text-white border-[#26170c] shadow-xs'
                    : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Purchasable Add-on</span>
                </div>
                <p className={`text-[10px] mt-1 ${itemType === 'addon' ? 'text-white/80' : 'text-[#81756e]'}`}>
                  Extra milk options, syrups, shots, and gourmet toppings.
                </p>
              </button>
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rice Meal Options, Pika-Pika Flavors, Sweetness Level"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
            />
          </div>

          {/* Selection Rules: Single vs Multiple & Required vs Optional */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#f9f2f0] rounded-xl border border-[#e8e1df]">
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">
                Selection Rule
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#26170c]">
                  <input
                    type="radio"
                    name="selectionType"
                    checked={selectionType === 'single'}
                    onChange={() => setSelectionType('single')}
                    className="accent-[#26170c]"
                  />
                  <span>Single Choice (Radio)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#26170c]">
                  <input
                    type="radio"
                    name="selectionType"
                    checked={selectionType === 'multiple'}
                    onChange={() => setSelectionType('multiple')}
                    className="accent-[#26170c]"
                  />
                  <span>Multiple Choices (Checkbox)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">
                Requirement
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#26170c] mt-2">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-[#26170c] accent-[#26170c]"
                />
                <span>Mandatory (Required to order)</span>
              </label>
              <p className="text-[10px] text-[#81756e] mt-1">
                e.g. Must pick flavor or sweetness level.
              </p>
            </div>
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
                  {temp === 'Both' ? 'Hot & Iced' : temp === 'Hot' ? 'Hot Only' : temp === 'Cold' ? 'Iced Only' : 'All Items'}
                </button>
              ))}
            </div>
          </div>

          {/* Applicable Product Categories */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#26170c]">
                Applicable Menu Categories ({selectedProductCategories.length === 0 ? 'Applies to All' : `${selectedProductCategories.length} selected`})
              </label>
              <button
                type="button"
                onClick={handleSelectAllProductCategories}
                className="text-[11px] text-[#5e604d] hover:text-[#26170c] font-bold"
              >
                {selectedProductCategories.length === productCategories.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-xl border border-[#d2c4bc]">
              {productCategories.map((cat) => {
                const isSelected = selectedProductCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleProductCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-[#26170c] text-white border-[#26170c]'
                        : 'bg-[#fff8f5] text-[#4f453f] border-[#e8e1df] hover:bg-[#eee7e4]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-[#81756e] mt-1">
              Leave blank to automatically make available across all relevant products.
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-[#e8e1df] flex justify-between items-center">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete modifier category "${categoryToEdit.name}"?`)) {
                    onDelete(categoryToEdit.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors"
              >
                Delete Category
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
                {isEditing ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
