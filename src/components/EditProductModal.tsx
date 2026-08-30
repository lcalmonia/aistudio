import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MenuItem, ProductAddon, ProductSize, ProductTemperature, ModifierCategory, ModifierCategoryType } from '../types';
import { ModifierCategoryModal } from './ModifierCategoryModal';
import {
  ProductFormDraft,
  createInitialProductDraft,
  isProductDraftDirty,
  PRESET_CAFE_PHOTOS,
} from '../utils/productDraft';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: MenuItem) => Promise<void> | void;
  onDelete?: (productId: string) => Promise<void> | void;
  productToEdit: MenuItem | null;
  addonsList: ProductAddon[];
  modifierCategories?: ModifierCategory[];
  onSaveAddon?: (addon: ProductAddon) => void;
  onDeleteAddon?: (addonId: string) => void;
  onToggleAddonStock?: (addonId: string) => void;
  onSaveModifierCategory?: (category: ModifierCategory) => void;
  onDeleteModifierCategory?: (categoryId: string) => void;
  categoriesList?: string[];
  onSaveCategory?: (newCategory: string, oldCategory?: string) => void;
  onDeleteCategory?: (category: string) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  productToEdit,
  addonsList = [],
  modifierCategories = [],
  onSaveAddon,
  onDeleteAddon,
  onToggleAddonStock,
  onSaveModifierCategory,
  onDeleteModifierCategory,
  categoriesList = [],
  onSaveCategory,
  onDeleteCategory,
}) => {
  const isEditing = Boolean(productToEdit);

  // Initial base snapshot for clean vs. dirty draft detection
  const [baseDraft, setBaseDraft] = useState<ProductFormDraft>(() =>
    createInitialProductDraft(productToEdit, categoriesList[0] || 'Coffee')
  );

  // Active user form draft states
  const [name, setName] = useState<string>(baseDraft.name);
  const [category, setCategory] = useState<string>(baseDraft.category);
  const [price, setPrice] = useState<number>(baseDraft.price);
  const [description, setDescription] = useState<string>(baseDraft.description);
  const [image, setImage] = useState<string>(baseDraft.image);
  const [temperature, setTemperature] = useState<ProductTemperature>(baseDraft.temperature);
  const [popular, setPopular] = useState<boolean>(baseDraft.popular);
  const [available, setAvailable] = useState<boolean>(baseDraft.available);
  const [calories, setCalories] = useState<number>(baseDraft.calories);
  const [tagInput, setTagInput] = useState<string>(baseDraft.tagInput);
  const [allergenInput, setAllergenInput] = useState<string>(baseDraft.allergenInput);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(baseDraft.selectedAddonIds);
  const [sizes, setSizes] = useState<ProductSize[]>(baseDraft.sizes);
  const [isSaving, setIsSaving] = useState(false);

  // Current active draft representation
  const currentDraft: ProductFormDraft = useMemo(
    () => ({
      name,
      category,
      price,
      description,
      image,
      temperature,
      popular,
      available,
      calories,
      tagInput,
      allergenInput,
      selectedAddonIds,
      sizes,
    }),
    [
      name,
      category,
      price,
      description,
      image,
      temperature,
      popular,
      available,
      calories,
      tagInput,
      allergenInput,
      selectedAddonIds,
      sizes,
    ]
  );

  // Check if any fields were actually modified compared to saved base draft
  const hasChanges = isProductDraftDirty(currentDraft, baseDraft);

  const prevIsOpenRef = useRef(isOpen);
  const prevProductIdRef = useRef<string | undefined>(productToEdit?.id);

  // When modal is newly opened or switched to a different product ID:
  useEffect(() => {
    const wasClosed = !prevIsOpenRef.current && isOpen;
    const switchedProduct = isOpen && prevProductIdRef.current !== productToEdit?.id;

    if (wasClosed || switchedProduct) {
      const freshDraft = createInitialProductDraft(productToEdit, categoriesList[0] || 'Coffee');
      setBaseDraft(freshDraft);
      setName(freshDraft.name);
      setCategory(freshDraft.category);
      setPrice(freshDraft.price);
      setDescription(freshDraft.description);
      setImage(freshDraft.image);
      setTemperature(freshDraft.temperature);
      setPopular(freshDraft.popular);
      setAvailable(freshDraft.available);
      setCalories(freshDraft.calories);
      setTagInput(freshDraft.tagInput);
      setAllergenInput(freshDraft.allergenInput);
      setSelectedAddonIds(freshDraft.selectedAddonIds);
      setSizes(freshDraft.sizes);
    }

    prevIsOpenRef.current = isOpen;
    prevProductIdRef.current = productToEdit?.id;
  }, [isOpen, productToEdit?.id, categoriesList]);

  // Live cross-device & background synchronization:
  // If the form is clean (hasChanges === false), safely update baseDraft and form fields from latest server props.
  // If the user has active unsaved edits (hasChanges === true), do NOT touch form fields (draft protection).
  useEffect(() => {
    if (!isOpen) return;

    if (!hasChanges) {
      const freshDraft = createInitialProductDraft(productToEdit, categoriesList[0] || 'Coffee');
      setBaseDraft(freshDraft);
      setName(freshDraft.name);
      setCategory(freshDraft.category);
      setPrice(freshDraft.price);
      setDescription(freshDraft.description);
      setImage(freshDraft.image);
      setTemperature(freshDraft.temperature);
      setPopular(freshDraft.popular);
      setAvailable(freshDraft.available);
      setCalories(freshDraft.calories);
      setTagInput(freshDraft.tagInput);
      setAllergenInput(freshDraft.allergenInput);
      setSelectedAddonIds(freshDraft.selectedAddonIds);
      setSizes(freshDraft.sizes);
    }
  }, [productToEdit, categoriesList, hasChanges, isOpen]);

  // Category Manager & Inline Creator state
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingCategoryData, setEditingCategoryData] = useState<{ original: string; current: string } | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [managerNewCategoryInput, setManagerNewCategoryInput] = useState('');

  // Modifier Category Manager Sub-modal
  const [isModCatModalOpen, setIsModCatModalOpen] = useState(false);

  // Add-on Manager & In-place Editor Sub-state
  const [classificationFilter, setClassificationFilter] = useState<'All' | 'modifier' | 'addon'>('All');
  const [addonCategoryFilter, setAddonCategoryFilter] = useState<string>('All');
  const [addonSearch, setAddonSearch] = useState<string>('');
  const [isAddonEditorOpen, setIsAddonEditorOpen] = useState<boolean>(false);
  const [editingAddon, setEditingAddon] = useState<ProductAddon | null>(null);

  // Add-on form fields
  const [addonFormName, setAddonFormName] = useState('');
  const [addonFormCategory, setAddonFormCategory] = useState<string>('Syrup');
  const [addonFormType, setAddonFormType] = useState<ModifierCategoryType>('addon');
  const [addonFormPrice, setAddonFormPrice] = useState<number>(25.00);
  const [addonFormTemp, setAddonFormTemp] = useState<ProductAddon['applicableTemperature']>('Both');
  const [addonFormAvailable, setAddonFormAvailable] = useState<boolean>(true);
  const [addonFormSelectionType, setAddonFormSelectionType] = useState<'single' | 'multiple'>('multiple');
  const [addonFormRequired, setAddonFormRequired] = useState<boolean>(false);

  const [activePhotoTab, setActivePhotoTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isDragOver, setIsDragOver] = useState(false);

  // Dynamic available categories from both modifier categories and addons
  const availableAddonCategories = useMemo(() => {
    const catMap = new Map<string, string>();
    modifierCategories.forEach((c) => {
      if (c.name) catMap.set(c.name.toLowerCase(), c.name);
    });
    addonsList.forEach((a) => {
      if (a.category) catMap.set(a.category.toLowerCase(), a.category);
    });
    return Array.from(catMap.values());
  }, [modifierCategories, addonsList]);

  // Inline Category Creator Handlers
  const handleQuickAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (onSaveCategory) {
      onSaveCategory(trimmed);
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCategoryInline(false);
  };

  const handleManagerAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = managerNewCategoryInput.trim();
    if (!trimmed) return;
    if (onSaveCategory) {
      onSaveCategory(trimmed);
    }
    setManagerNewCategoryInput('');
  };

  const handleManagerSaveEditCategory = (original: string, updated: string) => {
    const trimmed = updated.trim();
    if (!trimmed || trimmed === original) {
      setEditingCategoryData(null);
      return;
    }
    if (onSaveCategory) {
      onSaveCategory(trimmed, original);
    }
    if (category === original) {
      setCategory(trimmed);
    }
    setEditingCategoryData(null);
  };

  const handleManagerDeleteCategory = (catToDelete: string) => {
    if (confirm(`Delete category "${catToDelete}"? Any menu items in this category will be reassigned.`)) {
      if (onDeleteCategory) {
        onDeleteCategory(catToDelete);
      }
      if (category === catToDelete) {
        setCategory(categoriesList.filter((c) => c !== catToDelete)[0] || 'Coffee');
      }
    }
  };

  // Open inline creator for brand new add-on
  const handleOpenNewAddon = () => {
    setEditingAddon(null);
    setAddonFormName('');
    const defaultCat = availableAddonCategories[0] || 'Syrup';
    setAddonFormCategory(defaultCat);
    const catConfig = modifierCategories.find((c) => c.name.toLowerCase() === defaultCat.toLowerCase());
    setAddonFormType(catConfig?.itemType || 'addon');
    setAddonFormPrice(25.00);
    setAddonFormTemp('Both');
    setAddonFormAvailable(true);
    setAddonFormSelectionType(catConfig?.selectionType || 'multiple');
    setAddonFormRequired(Boolean(catConfig?.required));
    setIsAddonEditorOpen(true);
  };

  // Open inline editor for an existing add-on
  const handleOpenEditExistingAddon = (addon: ProductAddon) => {
    setEditingAddon(addon);
    setAddonFormName(addon.name);
    setAddonFormCategory(addon.category);
    const catConfig = modifierCategories.find((c) => c.name.toLowerCase() === addon.category.toLowerCase());
    setAddonFormType(addon.itemType || catConfig?.itemType || 'addon');
    setAddonFormPrice(addon.price);
    setAddonFormTemp(addon.applicableTemperature);
    setAddonFormAvailable(addon.available);
    setAddonFormSelectionType(addon.selectionType || catConfig?.selectionType || 'multiple');
    setAddonFormRequired(Boolean(addon.required || catConfig?.required));
    setIsAddonEditorOpen(true);
  };

  // Save add-on to global catalog
  const handleSaveAddonForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonFormName.trim()) return;

    const newOrUpdatedAddon: ProductAddon = {
      id: editingAddon?.id || `addon-${Date.now()}`,
      name: addonFormName.trim(),
      category: addonFormCategory,
      itemType: addonFormType,
      price: Number(addonFormPrice),
      applicableTemperature: addonFormTemp,
      available: addonFormAvailable,
      selectionType: addonFormSelectionType,
      required: addonFormRequired,
    };

    if (onSaveAddon) {
      onSaveAddon(newOrUpdatedAddon);
    }

    if (!selectedAddonIds.includes(newOrUpdatedAddon.id)) {
      setSelectedAddonIds((prev) => [...prev, newOrUpdatedAddon.id]);
    }

    setIsAddonEditorOpen(false);
  };

  // Delete add-on from store
  const handleDeleteAddonGlobal = (addon: ProductAddon) => {
    if (confirm(`Remove modifier "${addon.name}" from all products?`)) {
      if (onDeleteAddon) {
        onDeleteAddon(addon.id);
      }
      setSelectedAddonIds((prev) => prev.filter((id) => id !== addon.id));
    }
  };

  // Toggle add-on selection for current product
  const handleToggleAddonSelected = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Select all currently filtered addons
  const handleSelectAllFilteredAddons = () => {
    const filteredIds = filteredAddonsList.map((a) => a.id);
    setSelectedAddonIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  // Deselect all currently filtered addons
  const handleDeselectAllFilteredAddons = () => {
    const filteredIdSet = new Set(filteredAddonsList.map((a) => a.id));
    setSelectedAddonIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
  };

  // Size temperature applicability toggle
  const handleSizeTempChange = (index: number, mode: 'Both' | 'Hot' | 'Cold') => {
    setSizes((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (mode === 'Both') {
          return { ...s, availableTemperatures: ['Hot', 'Cold', 'Both'], applicableTemperature: 'Both' };
        } else if (mode === 'Hot') {
          return { ...s, availableTemperatures: ['Hot'], applicableTemperature: 'Hot' };
        } else {
          return { ...s, availableTemperatures: ['Cold'], applicableTemperature: 'Cold' };
        }
      })
    );
  };

  // Photo handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Size row handlers
  const handleAddSize = () => {
    setSizes((prev) => [
      ...prev,
      {
        name: 'Extra Large',
        volume: '24oz',
        priceDelta: 35.00,
        availableTemperatures: temperature === 'Both' ? ['Hot', 'Cold', 'Both'] : undefined,
      },
    ]);
  };

  const handleRemoveSize = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSizeChange = (index: number, field: keyof ProductSize, val: string | number) => {
    setSizes((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const allergens = allergenInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const productData: MenuItem = {
      id: productToEdit?.id || `item-${Date.now()}`,
      name: name.trim(),
      category: category.trim() || 'Coffee',
      price: Number(price),
      description: description.trim(),
      image: image || PRESET_CAFE_PHOTOS[0].url,
      available,
      temperature,
      popular,
      calories: Number(calories) || 0,
      sizes: temperature === 'N/A' ? [] : sizes,
      addons: selectedAddonIds,
      tags: tags.length > 0 ? tags : ['Handcrafted'],
      allergens: allergens.length > 0 ? allergens : undefined,
    };

    try {
      setIsSaving(true);
      await onSave(productData);
      // Upon successful save, update baseDraft to clear dirty state
      setBaseDraft({ ...currentDraft });
      onClose();
    } catch (err) {
      console.error('[EditProductModal] Error saving product:', err);
      // Form draft remains intact so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAddonsList = useMemo(() => {
    return (addonsList || []).filter((a) => {
      if (!a) return false;

      const catConfig = modifierCategories.find(
        (c) => c.name.toLowerCase() === (a.category || '').toLowerCase()
      );
      const isModifier =
        a.itemType === 'modifier' ||
        catConfig?.itemType === 'modifier' ||
        a.selectionType === 'single' ||
        catConfig?.selectionType === 'single';

      const resolvedType: ModifierCategoryType = isModifier ? 'modifier' : 'addon';

      if (classificationFilter !== 'All' && resolvedType !== classificationFilter) {
        return false;
      }

      const matchesCategory =
        addonCategoryFilter === 'All' ||
        (a.category || '').toLowerCase() === addonCategoryFilter.toLowerCase();

      const matchesSearch =
        (a.name || '').toLowerCase().includes(addonSearch.toLowerCase()) ||
        (a.category || '').toLowerCase().includes(addonSearch.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [addonsList, modifierCategories, classificationFilter, addonCategoryFilter, addonSearch]);

  const filteredCategoriesForManager = (categoriesList || []).filter((c) =>
    (c || '').toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#fff8f5] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-[#e8e1df] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#f3ecea] flex justify-between items-center bg-[#f9f2f0]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-md">
              iLuvKeyks Menu Catalog
            </span>
            <h3 className="font-serif text-xl font-bold text-[#26170c] mt-0.5">
              {isEditing ? `Edit "${productToEdit.name}"` : 'Add New Menu Product'}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full text-[#4f453f] hover:bg-[#e8e1df] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Section 1: Photo Upload / Selector */}
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1.5 flex items-center justify-between">
              <span>Product Image / Photo *</span>
              <span className="text-[11px] font-normal text-[#81756e]">
                Live on guest menu & counter display
              </span>
            </label>

            {/* Photo Tabs */}
            <div className="flex gap-1.5 mb-2 bg-[#f3ecea] p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActivePhotoTab('upload')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activePhotoTab === 'upload' ? 'bg-white text-[#26170c] shadow-2xs' : 'text-[#4f453f]'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoTab('preset')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activePhotoTab === 'preset' ? 'bg-white text-[#26170c] shadow-2xs' : 'text-[#4f453f]'
                }`}
              >
                Cafe Photo Presets
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoTab('url')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activePhotoTab === 'url' ? 'bg-white text-[#26170c] shadow-2xs' : 'text-[#4f453f]'
                }`}
              >
                Image URL
              </button>
            </div>

            {/* Photo Tab 1: Upload / Drag and drop */}
            {activePhotoTab === 'upload' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all flex items-center gap-4 ${
                  isDragOver
                    ? 'border-[#5e604d] bg-[#e1e1c9]/20'
                    : 'border-[#d2c4bc] bg-white hover:border-[#81756e]'
                }`}
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#e8e1df] border border-[#d2c4bc] flex-shrink-0 shadow-xs">
                  <img
                    src={image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold text-[#26170c]">Drag & Drop product photo here</p>
                  <p className="text-[11px] text-[#81756e] mb-2">Supports JPG, PNG, WEBP high-res images</p>
                  <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-semibold rounded-lg cursor-pointer transition-all shadow-xs">
                    <span className="material-symbols-outlined text-[16px]">file_upload</span>
                    Browse Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Photo Tab 2: Presets */}
            {activePhotoTab === 'preset' && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-[#d2c4bc]">
                {PRESET_CAFE_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImage(preset.url)}
                    className={`relative rounded-lg overflow-hidden h-16 border-2 transition-all group ${
                      image === preset.url ? 'border-[#26170c] scale-95 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] text-white truncate px-1 py-0.5 font-medium">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Photo Tab 3: URL input */}
            {activePhotoTab === 'url' && (
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc] focus:ring-2 focus:ring-[#5e604d]"
                />
                {image && (
                  <img
                    src={image}
                    alt="Preview"
                    className="w-9 h-9 rounded-lg object-cover border border-[#d2c4bc]"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            )}
          </div>

          {/* Section 2: Basic Info & Category Management */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Spanish Latte, Truffle Pasta, Ube Cake"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
              />
            </div>

            {/* Dynamic Category Selector with Create & Manage Actions */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#26170c]">
                  Category *
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingCategoryInline(!isAddingCategoryInline)}
                    className="text-[11px] font-bold text-[#5e604d] hover:text-[#26170c] flex items-center gap-0.5 hover:underline"
                  >
                    <span className="material-symbols-outlined text-[13px]">add</span>
                    New Category
                  </button>
                  <span className="text-[#d2c4bc]">|</span>
                  <button
                    type="button"
                    onClick={() => setIsCategoryManagerOpen(true)}
                    className="text-[11px] font-bold text-[#636451] hover:text-[#26170c] flex items-center gap-0.5 hover:underline"
                  >
                    <span className="material-symbols-outlined text-[13px]">tune</span>
                    Manage
                  </button>
                </div>
              </div>

              {/* Inline Quick Add Input */}
              {isAddingCategoryInline ? (
                <div className="flex gap-1.5 mb-1.5 animate-fadeIn">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter new category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickAddCategory();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-[#5e604d] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    className="px-3 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-lg hover:bg-[#3d2b1f]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategoryInline(false);
                      setNewCategoryName('');
                    }}
                    className="px-2 py-1.5 bg-[#f3ecea] text-[#4f453f] text-xs font-semibold rounded-lg hover:bg-[#e8e1df]"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}

              {/* Category Select Dropdown */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Base Price in Philippine Peso */}
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">
                Base Price (₱ PHP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-[#4f453f]">₱</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
                />
              </div>
            </div>

            {/* Temperature Option (Applicability) */}
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#5e604d]">thermostat</span>
                Temperature Applicable
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['Both', 'Hot', 'Cold', 'N/A'] as ProductTemperature[]).map((temp) => (
                  <button
                    key={temp}
                    type="button"
                    onClick={() => setTemperature(temp)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      temperature === temp
                        ? 'bg-[#26170c] text-white border-[#26170c] shadow-xs'
                        : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                    }`}
                  >
                    {temp === 'Both' ? 'Hot & Iced' : temp === 'Cold' ? 'Iced Only' : temp === 'Hot' ? 'Hot Only' : 'Food (N/A)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Description */}
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1">
              Description & Tasting Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Signature espresso blend with condensed milk and steamed fresh milk. Silky and aromatic."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
            />
          </div>

          {/* Section 4: Sizes & Pricing Variants */}
          {temperature !== 'N/A' && (
            <div className="p-3.5 bg-[#f9f2f0] rounded-xl border border-[#e8e1df]">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <label className="text-xs font-bold text-[#26170c] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">straighten</span>
                    Cup Sizes & Price Modifiers (₱)
                  </label>
                  {temperature === 'Both' && (
                    <p className="text-[10px] text-[#81756e]">
                      Configure size availability per temperature (Hot, Iced, or Both).
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddSize}
                  className="text-[11px] font-bold text-[#5e604d] hover:text-[#26170c] flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add Size
                </button>
              </div>

              <div className="space-y-2">
                {sizes.map((s, idx) => {
                  const currentTempMode: 'Both' | 'Hot' | 'Cold' =
                    s.availableTemperatures?.length === 1 && s.availableTemperatures[0] === 'Hot'
                      ? 'Hot'
                      : s.availableTemperatures?.length === 1 && s.availableTemperatures[0] === 'Cold'
                      ? 'Cold'
                      : 'Both';

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-2.5 rounded-xl border border-[#d2c4bc]">
                      <div className="flex-1 flex gap-2 w-full">
                        <input
                          type="text"
                          placeholder="Size name (e.g. Regular, Large)"
                          value={s.name}
                          onChange={(e) => handleSizeChange(idx, 'name', e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs border rounded-lg bg-[#fdfaf8]"
                        />
                        <input
                          type="text"
                          placeholder="Volume (16oz)"
                          value={s.volume}
                          onChange={(e) => handleSizeChange(idx, 'volume', e.target.value)}
                          className="w-20 px-2 py-1 text-xs border rounded-lg bg-[#fdfaf8]"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-[#81756e]">+₱</span>
                          <input
                            type="number"
                            step="1"
                            placeholder="Price diff"
                            value={s.priceDelta}
                            onChange={(e) => handleSizeChange(idx, 'priceDelta', parseFloat(e.target.value) || 0)}
                            className="w-18 px-2 py-1 text-xs border rounded-lg bg-[#fdfaf8]"
                          />
                        </div>
                      </div>

                      {/* Temperature toggle for this size if product supports Both */}
                      {temperature === 'Both' && (
                        <div className="flex items-center gap-1 self-end sm:self-center">
                          {(['Both', 'Hot', 'Cold'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => handleSizeTempChange(idx, mode)}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                                currentTempMode === mode
                                  ? 'bg-[#26170c] text-white border-[#26170c]'
                                  : 'bg-[#f3ecea] text-[#4f453f] border-[#d2c4bc] hover:bg-[#e8e1df]'
                              }`}
                            >
                              {mode === 'Both' ? '🔥/❄️ Both' : mode === 'Hot' ? '🔥 Hot' : '❄️ Iced'}
                            </button>
                          ))}
                        </div>
                      )}

                      {sizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(idx)}
                          className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded transition-colors self-end sm:self-center cursor-pointer"
                          title="Remove Size"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 5: Applicable Add-ons & Modifiers Management */}
          <div className="p-3.5 bg-[#f9f2f0] rounded-2xl border border-[#e8e1df] space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <label className="text-xs font-bold text-[#26170c] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#5e604d]">tune</span>
                  Modifiers & Add-ons ({selectedAddonIds.length} enabled for this item)
                </label>
                <p className="text-[11px] text-[#81756e]">
                  Manage options, single-choice modifiers, and paid extra add-ons.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {onSaveModifierCategory && (
                  <button
                    type="button"
                    onClick={() => setIsModCatModalOpen(true)}
                    className="px-2.5 py-1.5 bg-white hover:bg-[#eee7e4] text-[#26170c] border border-[#d2c4bc] text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#5e604d]">category</span>
                    Manage Categories
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenNewAddon}
                  className="px-3 py-1.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Create Option
                </button>
              </div>
            </div>

            {/* Classification & Search Controls */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              {/* Classification Filter Tabs */}
              <div className="flex bg-white p-0.5 rounded-xl border border-[#d2c4bc] w-fit">
                {(['All', 'modifier', 'addon'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setClassificationFilter(type)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      classificationFilter === type
                        ? 'bg-[#26170c] text-white shadow-2xs'
                        : 'text-[#4f453f] hover:bg-[#f3ecea]'
                    }`}
                  >
                    {type === 'All' ? 'All Items' : type === 'modifier' ? '⚡ Modifiers' : '➕ Add-ons'}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#81756e] text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search modifiers & add-ons..."
                  value={addonSearch}
                  onChange={(e) => setAddonSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-[#d2c4bc]"
                />
              </div>
            </div>

            {/* Dynamic Category Filter Pills */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 overflow-x-auto scrolling-hide py-0.5 flex-1">
                <button
                  type="button"
                  onClick={() => setAddonCategoryFilter('All')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                    addonCategoryFilter === 'All'
                      ? 'bg-[#26170c] text-white'
                      : 'bg-white text-[#4f453f] border border-[#d2c4bc] hover:bg-[#eee7e4]'
                  }`}
                >
                  All Categories
                </button>
                {availableAddonCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAddonCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                      addonCategoryFilter === cat
                        ? 'bg-[#26170c] text-white'
                        : 'bg-white text-[#4f453f] border border-[#d2c4bc] hover:bg-[#eee7e4]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Quick Select All / Clear for this filtered set */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllFilteredAddons}
                  className="px-2 py-1 text-[10px] font-bold text-[#5e604d] hover:bg-white rounded border border-[#d2c4bc] bg-[#fdfaf8] transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllFilteredAddons}
                  className="px-2 py-1 text-[10px] font-bold text-[#81756e] hover:bg-white rounded border border-[#d2c4bc] bg-[#fdfaf8] transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Add-ons List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {filteredAddonsList.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-xs text-[#81756e] bg-white rounded-xl border border-dashed border-[#d2c4bc]">
                  No items found matching the current filter.
                </div>
              ) : (
                filteredAddonsList.map((addon) => {
                  const isChecked = selectedAddonIds.includes(addon.id);
                  const isModifier = addon.itemType === 'modifier' || addon.selectionType === 'single';

                  return (
                    <div
                      key={addon.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isChecked
                          ? 'bg-[#e1e1c9] border-[#636451]'
                          : 'bg-white border-[#d2c4bc] hover:border-[#81756e]'
                      }`}
                    >
                      <div
                        onClick={() => handleToggleAddonSelected(addon.id)}
                        className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                            isChecked
                              ? 'bg-[#26170c] border-[#26170c] text-white'
                              : 'bg-white border-[#d2c4bc]'
                          }`}
                        >
                          {isChecked && (
                            <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs truncate ${isChecked ? 'font-bold text-[#26170c]' : 'text-[#4f453f]'}`}>
                              {addon.name}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider flex-shrink-0 ${
                                isModifier
                                  ? 'bg-[#d8e2ff] text-[#001a41]'
                                  : 'bg-[#ffdcc1] text-[#6e3900]'
                              }`}
                            >
                              {isModifier ? 'Modifier' : 'Add-on'}
                            </span>
                            {!addon.available && (
                              <span className="text-[9px] bg-[#ffdad6] text-[#ba1a1a] px-1 rounded font-bold flex-shrink-0">
                                Out of Stock
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-[#81756e] mt-0.5">
                            <span className="bg-[#e8e1df] text-[#4f453f] px-1 rounded font-medium">
                              {addon.category}
                            </span>
                            <span className="font-bold text-[#5e604d]">
                              {addon.price > 0 ? `+₱${addon.price.toFixed(2)}` : 'Free'}
                            </span>
                            <span>
                              {addon.applicableTemperature === 'Hot' ? '🔥' : addon.applicableTemperature === 'Cold' ? '❄️' : '🔥/❄️'}
                            </span>
                            {addon.required && (
                              <span className="text-[#ba1a1a] font-bold text-[9px]">• Required</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Item Actions: Edit & Delete */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {onToggleAddonStock && (
                          <button
                            type="button"
                            title={addon.available ? 'Mark Out of Stock' : 'Mark In Stock'}
                            onClick={() => onToggleAddonStock(addon.id)}
                            className={`p-1 rounded hover:bg-[#e8e1df] transition-colors cursor-pointer ${
                              addon.available ? 'text-[#5e604d]' : 'text-[#ba1a1a]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {addon.available ? 'check_circle' : 'do_not_disturb_on'}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          title="Edit this option"
                          onClick={() => handleOpenEditExistingAddon(addon)}
                          className="p-1 text-[#4f453f] hover:text-[#26170c] hover:bg-[#e8e1df] rounded transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button
                          type="button"
                          title="Delete option from store"
                          onClick={() => handleDeleteAddonGlobal(addon)}
                          className="p-1 text-[#81756e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 6: Tags, Allergens, Calories & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">
                Tags & Promo Badges (comma separated)
              </label>
              <input
                type="text"
                placeholder="Best Seller, Signature, House Favorite"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-[#d2c4bc]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">
                Allergen Warnings
              </label>
              <input
                type="text"
                placeholder="e.g. Dairy, Oat, Eggs, Gluten, Nuts"
                value={allergenInput}
                onChange={(e) => setAllergenInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-[#d2c4bc]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">
                Estimated Calories (kcal)
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-[#d2c4bc]"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#26170c]">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-[#26170c] accent-[#26170c]"
                />
                In Stock & Active
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#26170c]">
                <input
                  type="checkbox"
                  checked={popular}
                  onChange={(e) => setPopular(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5e604d] accent-[#5e604d]"
                />
                Star / Highlight Item
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#f9f2f0] border-t border-[#e8e1df] flex justify-between items-center gap-2">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${productToEdit.name}" from the menu?`)) {
                  onDelete(productToEdit.id);
                  onClose();
                }
              }}
              className="px-3 py-2 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Delete Product
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#4f453f] hover:bg-[#e8e1df] rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || !name.trim()}
              onClick={handleSubmit}
              className="px-5 py-2 bg-[#26170c] hover:bg-[#3d2b1f] disabled:bg-[#81756e] disabled:cursor-not-allowed text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  {isEditing ? 'Save Changes' : 'Publish Product to Menu'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODAL 1: CATEGORY MANAGER */}
      {/* ========================================================================= */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#fff8f5] rounded-2xl w-full max-w-md shadow-2xl border border-[#e8e1df] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-[#f3ecea] flex justify-between items-center bg-[#f9f2f0]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-md">
                  Category Management
                </span>
                <h3 className="font-serif text-lg font-bold text-[#26170c] mt-0.5">
                  Store Categories ({categoriesList.length})
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                type="button"
                className="p-1 rounded-full text-[#4f453f] hover:bg-[#e8e1df]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {/* Add New Category Form */}
              <form onSubmit={handleManagerAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Create new category name..."
                  value={managerNewCategoryInput}
                  onChange={(e) => setManagerNewCategoryInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc] focus:ring-2 focus:ring-[#5e604d]"
                />
                <button
                  type="submit"
                  disabled={!managerNewCategoryInput.trim()}
                  className="px-4 py-2 bg-[#26170c] hover:bg-[#3d2b1f] disabled:bg-[#d2c4bc] text-white text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Create
                </button>
              </form>

              {/* Search filter for categories */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#81756e] text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-[#d2c4bc]"
                />
              </div>

              {/* Category Items List */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredCategoriesForManager.map((catName) => {
                  const isBeingEdited = editingCategoryData?.original === catName;

                  return (
                    <div
                      key={catName}
                      className="p-2.5 bg-white rounded-xl border border-[#d2c4bc] flex items-center justify-between gap-2 shadow-2xs hover:border-[#81756e] transition-all"
                    >
                      {isBeingEdited ? (
                        <div className="flex-1 flex gap-1.5 items-center">
                          <input
                            type="text"
                            autoFocus
                            value={editingCategoryData.current}
                            onChange={(e) =>
                              setEditingCategoryData({
                                ...editingCategoryData,
                                current: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleManagerSaveEditCategory(catName, editingCategoryData.current);
                              }
                            }}
                            className="flex-1 px-2.5 py-1 text-xs border border-[#5e604d] rounded-lg bg-[#fff8f5]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleManagerSaveEditCategory(catName, editingCategoryData.current)
                            }
                            className="px-2.5 py-1 bg-[#5e604d] text-white text-xs font-bold rounded-lg"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryData(null)}
                            className="px-2 py-1 bg-[#f3ecea] text-[#4f453f] text-xs rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-[#5e604d] flex-shrink-0" />
                            <span className="text-xs font-bold text-[#26170c] truncate">
                              {catName}
                            </span>
                            {category === catName && (
                              <span className="text-[10px] bg-[#e1e1c9] text-[#636451] font-semibold px-1.5 py-0.2 rounded">
                                Selected
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="Select for current product"
                              onClick={() => {
                                setCategory(catName);
                                setIsCategoryManagerOpen(false);
                              }}
                              className="px-2 py-1 bg-[#f3ecea] hover:bg-[#e1e1c9] text-[#26170c] text-[11px] font-semibold rounded-md transition-colors"
                            >
                              Select
                            </button>
                            <button
                              type="button"
                              title="Rename category"
                              onClick={() =>
                                setEditingCategoryData({ original: catName, current: catName })
                              }
                              className="p-1 text-[#4f453f] hover:text-[#26170c] hover:bg-[#f3ecea] rounded"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                            </button>
                            <button
                              type="button"
                              title="Delete category"
                              onClick={() => handleManagerDeleteCategory(catName)}
                              className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-[#f9f2f0] border-t border-[#e8e1df] text-right">
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="px-4 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-full hover:bg-[#3d2b1f]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 2: INLINE ADD-ON MODIFIER CREATOR / EDITOR */}
      {/* ========================================================================= */}
      {isAddonEditorOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#fff8f5] rounded-2xl w-full max-w-md shadow-2xl border border-[#e8e1df] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f3ecea] flex justify-between items-center bg-[#f9f2f0]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-md">
                  Modifier Master Editor
                </span>
                <h3 className="font-serif text-lg font-bold text-[#26170c] mt-0.5">
                  {editingAddon ? 'Edit Store Modifier' : 'Create Global Add-on'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddonEditorOpen(false)}
                className="p-1 text-[#4f453f] hover:bg-[#e8e1df] rounded-full"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAddonForm} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#26170c] mb-1">
                  Add-on / Modifier Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oatly Barista Oat Milk, Sweet Cold Foam"
                  value={addonFormName}
                  onChange={(e) => setAddonFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc] focus:ring-2 focus:ring-[#5e604d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#26170c] mb-1">Category / Group</label>
                  <select
                    value={addonFormCategory}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setAddonFormCategory(newCat);
                      const catConfig = modifierCategories.find((c) => c.name.toLowerCase() === newCat.toLowerCase());
                      if (catConfig) {
                        setAddonFormType(catConfig.itemType);
                        setAddonFormSelectionType(catConfig.selectionType);
                        setAddonFormRequired(Boolean(catConfig.required));
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc]"
                  >
                    {availableAddonCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#26170c] mb-1">Classification Type</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setAddonFormType('modifier')}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        addonFormType === 'modifier'
                          ? 'bg-[#26170c] text-white border-[#26170c]'
                          : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                      }`}
                    >
                      ⚡ Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddonFormType('addon')}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        addonFormType === 'addon'
                          ? 'bg-[#26170c] text-white border-[#26170c]'
                          : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                      }`}
                    >
                      ➕ Add-on
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#26170c] mb-1">Price (₱ PHP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-bold text-[#4f453f]">₱</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={addonFormPrice}
                      onChange={(e) => setAddonFormPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#26170c] mb-1">Selection Rule</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setAddonFormSelectionType('single')}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        addonFormSelectionType === 'single'
                          ? 'bg-[#26170c] text-white border-[#26170c]'
                          : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                      }`}
                    >
                      Single Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddonFormSelectionType('multiple')}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        addonFormSelectionType === 'multiple'
                          ? 'bg-[#26170c] text-white border-[#26170c]'
                          : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                      }`}
                    >
                      Multi Choice
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26170c] mb-1">Temperature Applicability</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Both', 'Hot', 'Cold'] as const).map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => setAddonFormTemp(temp)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        addonFormTemp === temp
                          ? 'bg-[#26170c] text-white border-[#26170c]'
                          : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                      }`}
                    >
                      {temp === 'Both' ? 'Hot & Iced' : temp === 'Hot' ? 'Hot Drinks Only' : 'Cold Drinks Only'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#26170c]">
                  <input
                    type="checkbox"
                    checked={addonFormRequired}
                    onChange={(e) => setAddonFormRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-[#26170c] accent-[#26170c]"
                  />
                  Required customer selection for this item
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#26170c]">
                  <input
                    type="checkbox"
                    checked={addonFormAvailable}
                    onChange={(e) => setAddonFormAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-[#26170c] accent-[#26170c]"
                  />
                  In Stock & Available Store-wide
                </label>
              </div>

              <div className="pt-3 border-t border-[#e8e1df] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddonEditorOpen(false)}
                  className="px-4 py-1.5 text-xs text-[#4f453f] hover:bg-[#e8e1df] rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-full hover:bg-[#3d2b1f] cursor-pointer shadow-xs"
                >
                  {editingAddon ? 'Save Changes' : 'Create Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 3: MODIFIER CATEGORY MANAGER MODAL */}
      {/* ========================================================================= */}
      {isModCatModalOpen && onSaveModifierCategory && (
        <ModifierCategoryModal
          isOpen={isModCatModalOpen}
          categories={modifierCategories}
          onClose={() => setIsModCatModalOpen(false)}
          onSave={onSaveModifierCategory}
          onDelete={onDeleteModifierCategory}
        />
      )}
    </div>
  );
};
