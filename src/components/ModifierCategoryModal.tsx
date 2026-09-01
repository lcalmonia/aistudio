import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ModifierCategory, ModifierCategoryType, ProductAddon } from '../types';
import {
  ModifierCategoryDraft,
  createInitialModifierCategoryDraft,
  isModifierCategoryDraftDirty,
} from '../utils/addonDraft';

interface ModifierCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (category: ModifierCategory) => Promise<void> | void;
  onSaveCategory?: (category: ModifierCategory) => Promise<void> | void;
  onDelete?: (categoryId: string) => Promise<void> | void;
  onDeleteCategory?: (categoryId: string) => Promise<void> | void;
  categoryToEdit?: ModifierCategory | null;
  initialItemType?: ModifierCategoryType;
  categories?: ModifierCategory[];
  addons?: ProductAddon[];
  productCategories?: string[];
}

export const ModifierCategoryModal: React.FC<ModifierCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveCategory,
  onDelete,
  onDeleteCategory,
  categoryToEdit = null,
  initialItemType,
  addons = [],
  productCategories = [],
}) => {
  const isEditing = Boolean(categoryToEdit);

  // Initial base snapshot for clean vs. dirty draft detection
  const [baseDraft, setBaseDraft] = useState<ModifierCategoryDraft>(() => {
    const draft = createInitialModifierCategoryDraft(categoryToEdit);
    if (!categoryToEdit && initialItemType) {
      draft.itemType = initialItemType;
    }
    return draft;
  });

  // Active form states
  const [name, setName] = useState<string>(baseDraft.name);
  const [itemType, setItemType] = useState<ModifierCategoryType>(baseDraft.itemType);
  const [required, setRequired] = useState<boolean>(baseDraft.required);
  const [selectionType, setSelectionType] = useState<'single' | 'multiple'>(baseDraft.selectionType);
  const [applicableTemperature, setApplicableTemperature] = useState<'Hot' | 'Cold' | 'Both' | 'All'>(
    baseDraft.applicableTemperature
  );
  const [selectedProductCategories, setSelectedProductCategories] = useState<string[]>(
    baseDraft.selectedProductCategories
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Current active draft representation
  const currentDraft: ModifierCategoryDraft = useMemo(
    () => ({
      name,
      itemType,
      required,
      selectionType,
      applicableTemperature,
      selectedProductCategories,
    }),
    [
      name,
      itemType,
      required,
      selectionType,
      applicableTemperature,
      selectedProductCategories,
    ]
  );

  // Check if any fields were actually modified compared to saved base draft
  const hasChanges = isModifierCategoryDraftDirty(currentDraft, baseDraft);

  const prevIsOpenRef = useRef(isOpen);
  const prevCategoryIdRef = useRef<string | undefined>(categoryToEdit?.id);

  // When modal is newly opened or switched to a different category ID:
  useEffect(() => {
    const wasClosed = !prevIsOpenRef.current && isOpen;
    const switchedCategory = isOpen && prevCategoryIdRef.current !== categoryToEdit?.id;

    if (wasClosed || switchedCategory) {
      const freshDraft = createInitialModifierCategoryDraft(categoryToEdit);
      if (!categoryToEdit && initialItemType) {
        freshDraft.itemType = initialItemType;
      }
      setBaseDraft(freshDraft);
      setName(freshDraft.name);
      setItemType(freshDraft.itemType);
      setRequired(freshDraft.required);
      setSelectionType(freshDraft.selectionType);
      setApplicableTemperature(freshDraft.applicableTemperature);
      setSelectedProductCategories(freshDraft.selectedProductCategories);
      setDeleteError(null);
    }

    prevIsOpenRef.current = isOpen;
    prevCategoryIdRef.current = categoryToEdit?.id;
  }, [isOpen, categoryToEdit?.id, initialItemType]);

  // Live cross-device & background synchronization:
  // If the form is clean (hasChanges === false), safely update baseDraft and form fields from latest server props.
  // If the user has active unsaved edits (hasChanges === true), do NOT touch form fields (draft protection).
  useEffect(() => {
    if (!isOpen) return;

    if (!hasChanges) {
      const freshDraft = createInitialModifierCategoryDraft(categoryToEdit);
      if (!categoryToEdit && initialItemType) {
        freshDraft.itemType = initialItemType;
      }
      setBaseDraft(freshDraft);
      setName(freshDraft.name);
      setItemType(freshDraft.itemType);
      setRequired(freshDraft.required);
      setSelectionType(freshDraft.selectionType);
      setApplicableTemperature(freshDraft.applicableTemperature);
      setSelectedProductCategories(freshDraft.selectedProductCategories);
    }
  }, [categoryToEdit, hasChanges, isOpen, initialItemType]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

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

    try {
      setIsSaving(true);
      const saveHandler = onSave || onSaveCategory;
      if (saveHandler) {
        await saveHandler(data);
      }
      // Upon successful save, update baseDraft to clear dirty state
      setBaseDraft({ ...currentDraft });
      onClose();
    } catch (err) {
      console.error('[ModifierCategoryModal] Error saving modifier category:', err);
      // Form draft remains intact so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToEdit) return;

    // Check for dependent addons
    const catNameKey = (categoryToEdit.name || '').trim().toLowerCase();
    const dependentCount = addons.filter((a) => (a.category || '').trim().toLowerCase() === catNameKey).length;
    if (dependentCount > 0) {
      setDeleteError(
        `Cannot delete "${categoryToEdit.name}" because ${dependentCount} option(s) are assigned to it. Please delete or reassign those options first.`
      );
      return;
    }

    if (confirm(`Delete modifier category "${categoryToEdit.name}"? This action cannot be undone.`)) {
      try {
        const deleteHandler = onDelete || onDeleteCategory;
        if (deleteHandler) {
          await deleteHandler(categoryToEdit.id);
        }
        onClose();
      } catch (err: any) {
        setDeleteError(err?.message || 'Failed to delete modifier category.');
      }
    }
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
          {deleteError && (
            <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[18px] mt-0.5">warning</span>
                <div>
                  <h5 className="text-xs font-bold text-[#ba1a1a]">Cannot Delete</h5>
                  <p className="text-[11px] text-[#410002] mt-0.5">{deleteError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteError(null)}
                className="p-1 text-[#ba1a1a] hover:bg-[#ffb4ab] rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

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
            {isEditing && (onDelete || onDeleteCategory) ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
              >
                Delete Category
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs text-[#4f453f] hover:bg-[#e8e1df] rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="px-5 py-1.5 bg-[#26170c] hover:bg-[#3d2b1f] disabled:bg-[#81756e] disabled:cursor-not-allowed text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[15px]">save</span>
                    {isEditing ? 'Save Changes' : 'Create Category'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
