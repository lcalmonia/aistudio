import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem } from '../types';
import {
  InventoryFormDraft,
  createInitialInventoryDraft,
  isInventoryDraftDirty,
} from '../utils/inventoryDraft';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  itemToEdit: InventoryItem | null;
  categories: string[];
  onAddCategory?: (category: string) => void;
}

const COMMON_UNITS = [
  'kg',
  'g',
  'mg',
  'liters',
  'ml',
  'bottles',
  'packs',
  'pcs',
  'boxes',
  'cartons',
  'cans',
  'cups',
  'jars',
  'rolls',
  'bags',
  'sachets',
  'tubs',
  'containers',
  'pieces',
  'dozen',
];

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  itemToEdit,
  categories,
  onAddCategory,
}) => {
  const isEdit = !!itemToEdit;

  // Initial base snapshot for clean vs dirty draft detection
  const [baseDraft, setBaseDraft] = useState<InventoryFormDraft>(() =>
    createInitialInventoryDraft(itemToEdit, categories[0] || 'Beans')
  );

  // Active user form draft states
  const [name, setName] = useState<string>(baseDraft.name);
  const [category, setCategory] = useState<string>(baseDraft.category);
  const [stock, setStock] = useState<number>(baseDraft.stock);
  const [unit, setUnit] = useState<string>(baseDraft.unit);
  const [minThreshold, setMinThreshold] = useState<number>(baseDraft.minThreshold);
  const [costPerUnit, setCostPerUnit] = useState<number>(baseDraft.costPerUnit);
  const [supplier, setSupplier] = useState<string>(baseDraft.supplier);
  const [notes, setNotes] = useState<string>(baseDraft.notes);
  const [isSaving, setIsSaving] = useState(false);

  // Inline new category creation
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Current active draft representation
  const currentDraft: InventoryFormDraft = useMemo(
    () => ({
      name,
      category,
      stock,
      unit,
      minThreshold,
      costPerUnit,
      supplier,
      notes,
    }),
    [name, category, stock, unit, minThreshold, costPerUnit, supplier, notes]
  );

  // Check if any fields were actually modified compared to saved base draft
  const hasChanges = isInventoryDraftDirty(currentDraft, baseDraft);

  const prevIsOpenRef = useRef(isOpen);
  const prevItemIdRef = useRef<string | undefined>(itemToEdit?.id);

  // When modal is newly opened or switched to a different item ID:
  useEffect(() => {
    const wasClosed = !prevIsOpenRef.current && isOpen;
    const switchedItem = isOpen && prevItemIdRef.current !== itemToEdit?.id;

    if (wasClosed || switchedItem) {
      const freshDraft = createInitialInventoryDraft(itemToEdit, categories[0] || 'Beans');
      setBaseDraft(freshDraft);
      setName(freshDraft.name);
      setCategory(freshDraft.category);
      setStock(freshDraft.stock);
      setUnit(freshDraft.unit);
      setMinThreshold(freshDraft.minThreshold);
      setCostPerUnit(freshDraft.costPerUnit);
      setSupplier(freshDraft.supplier);
      setNotes(freshDraft.notes);
      setIsAddingCategory(false);
      setNewCategoryName('');
      setShowDeleteConfirm(false);
    }

    prevIsOpenRef.current = isOpen;
    prevItemIdRef.current = itemToEdit?.id;
  }, [isOpen, itemToEdit?.id, categories]);

  // Live cross-device & background synchronization:
  // If the form is clean (hasChanges === false), safely update baseDraft and form fields from latest server props.
  // If the user has active unsaved edits (hasChanges === true), do NOT touch form fields (draft protection).
  useEffect(() => {
    if (!isOpen) return;

    if (!hasChanges) {
      const freshDraft = createInitialInventoryDraft(itemToEdit, categories[0] || 'Beans');
      setBaseDraft(freshDraft);
      setName(freshDraft.name);
      setCategory(freshDraft.category);
      setStock(freshDraft.stock);
      setUnit(freshDraft.unit);
      setMinThreshold(freshDraft.minThreshold);
      setCostPerUnit(freshDraft.costPerUnit);
      setSupplier(freshDraft.supplier);
      setNotes(freshDraft.notes);
    }
  }, [itemToEdit, categories, hasChanges, isOpen]);

  if (!isOpen) return null;

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (onAddCategory) {
      onAddCategory(trimmed);
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const calculateStatus = (currentStock: number, threshold: number): 'In Stock' | 'Low Stock' | 'Critical' => {
    if (currentStock <= 0) return 'Critical';
    if (currentStock <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    const numStock = Number(stock) || 0;
    const numThreshold = Number(minThreshold) || 0;

    const savedItem: InventoryItem = {
      ...(itemToEdit || {}),
      id: itemToEdit ? itemToEdit.id : `inv-${Date.now()}`,
      name: name.trim(),
      category: category || 'Beans',
      stock: numStock,
      unit: unit.trim() || 'pcs',
      status: calculateStatus(numStock, numThreshold),
      minThreshold: numThreshold,
      costPerUnit: Number(costPerUnit) || 0,
      supplier: supplier.trim() || undefined,
      notes: notes.trim() || undefined,
      lastRestocked: itemToEdit?.lastRestocked || new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    try {
      setIsSaving(true);
      await onSave(savedItem);
      // Upon successful save, update baseDraft to clear dirty state
      setBaseDraft({
        name: savedItem.name,
        category: savedItem.category,
        stock: savedItem.stock,
        unit: savedItem.unit,
        minThreshold: savedItem.minThreshold,
        costPerUnit: savedItem.costPerUnit || 0,
        supplier: savedItem.supplier || '',
        notes: savedItem.notes || '',
      });
      onClose();
    } catch (err) {
      console.error('[EditInventoryModal] Error saving inventory item:', err);
      // Preserve draft on failure to allow retry
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="edit-inventory-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div
        className="bg-[#fff8f5] w-full max-w-lg rounded-2xl shadow-2xl border border-[#dec1af]/50 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3ecea] bg-[#f9f2f0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#26170c] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#26170c]">
                {isEdit ? 'Edit Inventory Item' : 'New Inventory Item'}
              </h3>
              <p className="text-xs text-[#4f453f]">
                {isEdit ? 'Update stock levels, unit costs, and category' : 'Register raw materials, syrups, utensils, and supplies'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#e8e1df] text-[#4f453f] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-[#26170c]">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
              Item Name <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. French Vanilla Syrup (750ml), 16oz Cups"
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dec1af] focus:outline-none focus:ring-2 focus:ring-[#26170c] text-sm text-[#26170c] placeholder:text-[#81756e]/50 font-medium"
            />
          </div>

          {/* Category Selector with Inline Creator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f]">
                Inventory Category <span className="text-[#ba1a1a]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-xs text-[#26170c] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isAddingCategory ? 'close' : 'add'}
                </span>
                {isAddingCategory ? 'Cancel' : '+ New Category'}
              </button>
            </div>

            {isAddingCategory ? (
              <div className="flex gap-2 p-2 bg-[#f3ecea] rounded-xl border border-[#dec1af]/60">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Powders, Syrups, Pasta, Utensils"
                  className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-[#dec1af] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-3 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-lg hover:bg-[#3d2b1f] active:scale-95 transition-all"
                >
                  Add
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dec1af] focus:outline-none focus:ring-2 focus:ring-[#26170c] text-sm text-[#26170c] font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Stock Count and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
                Current Stock <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dec1af] focus:outline-none focus:ring-2 focus:ring-[#26170c] text-sm text-[#26170c] font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
                Unit of Measure <span className="text-[#ba1a1a]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="common-units-list"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. kg, bottles, pcs"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dec1af] focus:outline-none focus:ring-2 focus:ring-[#26170c] text-sm text-[#26170c] font-medium"
                />
                <datalist id="common-units-list">
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Alert Threshold and Cost Per Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
                Min Stock Alert Level
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dec1af] focus:outline-none focus:ring-2 focus:ring-[#26170c] text-sm text-[#26170c] font-medium"
                />
              </div>
              <p className="text-[10px] text-[#81756e] mt-1">Triggers 'Low Stock' alert</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
                Cost Per Unit (₱ PHP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-[#81756e] font-bold">₱</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3.5 py-2.5 bg-white rounded-xl border border-[#dec1af] focus:outline-none focus:ring-2 focus:ring-[#26170c] text-sm text-[#26170c] font-medium"
                />
              </div>
              <p className="text-[10px] text-[#81756e] mt-1">Used for valuation</p>
            </div>
          </div>

          {/* Supplier & Vendor Info */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
              Supplier / Distributor
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Monin PH, Allegro Coffee Co., Local Bakery"
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dec1af] focus:outline-none focus:ring-2 focus:ring-[#26170c] text-sm text-[#26170c] placeholder:text-[#81756e]/50 font-medium"
            />
          </div>

          {/* Storage Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
              Storage Notes & Bar Location
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Espresso bar shelf 1, Keep chilled at 4°C, Batch #2026-A"
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#dec1af] focus:outline-none focus:ring-2 focus:ring-[#26170c] text-sm text-[#26170c] placeholder:text-[#81756e]/50 font-medium resize-none"
            />
          </div>

          {/* Delete confirmation section */}
          {isEdit && onDelete && (
            <div className="pt-3 border-t border-[#f3ecea]">
              {showDeleteConfirm ? (
                <div className="p-3 bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#93000a]">Delete item permanently?</p>
                    <p className="text-[11px] text-[#4f453f]">This will remove "{name}" from inventory.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1 text-xs text-[#4f453f] font-semibold hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={async () => {
                        if (itemToEdit && onDelete) {
                          try {
                            setIsSaving(true);
                            await onDelete(itemToEdit.id);
                            onClose();
                          } catch (err) {
                            console.error('[EditInventoryModal] Delete error:', err);
                          } finally {
                            setIsSaving(false);
                          }
                        }
                      }}
                      className="px-3 py-1 bg-[#ba1a1a] text-white text-xs font-bold rounded-lg hover:bg-[#93000a] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-[#ba1a1a] hover:text-[#93000a] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete Inventory Item
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f3ecea]">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-[#4f453f] hover:bg-[#e8e1df] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Item to Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
