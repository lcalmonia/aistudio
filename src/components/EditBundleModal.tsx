import React, { useState, useEffect } from 'react';
import { PromoBundle, MenuItem } from '../types';

interface EditBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bundle: PromoBundle) => void;
  onDelete?: (bundleId: string) => void;
  bundleToEdit: PromoBundle | null;
  menuItems: MenuItem[];
}

export const EditBundleModal: React.FC<EditBundleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  bundleToEdit,
  menuItems = [],
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(bundleToEdit);

  const [name, setName] = useState(bundleToEdit?.name || '');
  const [description, setDescription] = useState(bundleToEdit?.description || '');
  const [price, setPrice] = useState<number>(bundleToEdit?.price ?? 199.00);
  const [originalPrice, setOriginalPrice] = useState<number>(bundleToEdit?.originalPrice ?? 250.00);
  const [discountBadge, setDiscountBadge] = useState(bundleToEdit?.discountBadge || 'Save 20%');
  const [temperatureOption, setTemperatureOption] = useState(bundleToEdit?.temperatureOption || 'Choice of Hot or Iced Drink');
  const [timeSlot, setTimeSlot] = useState(bundleToEdit?.timeSlot || 'Daily until 11:30 AM');
  const [image, setImage] = useState(bundleToEdit?.image || menuItems[0]?.image || '');
  const [available, setAvailable] = useState<boolean>(bundleToEdit?.available ?? true);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    bundleToEdit?.bundleItems || [menuItems[0]?.name, menuItems[1]?.name].filter(Boolean)
  );

  useEffect(() => {
    if (bundleToEdit) {
      setName(bundleToEdit.name || '');
      setDescription(bundleToEdit.description || '');
      setPrice(bundleToEdit.price ?? 199.00);
      setOriginalPrice(bundleToEdit.originalPrice ?? 250.00);
      setDiscountBadge(bundleToEdit.discountBadge || 'Save 20%');
      setTemperatureOption(bundleToEdit.temperatureOption || 'Choice of Hot or Iced Drink');
      setTimeSlot(bundleToEdit.timeSlot || 'Daily until 11:30 AM');
      setImage(bundleToEdit.image || menuItems[0]?.image || '');
      setAvailable(bundleToEdit.available ?? true);
      setSelectedItems(bundleToEdit.bundleItems || []);
    } else {
      setName('');
      setDescription('');
      setPrice(199.00);
      setOriginalPrice(250.00);
      setDiscountBadge('Save 20%');
      setTemperatureOption('Choice of Hot or Iced Drink');
      setTimeSlot('Daily until 11:30 AM');
      setImage(menuItems[0]?.image || '');
      setAvailable(true);
      setSelectedItems([menuItems[0]?.name, menuItems[1]?.name].filter(Boolean));
    }
  }, [bundleToEdit, isOpen, menuItems]);

  const handleToggleItem = (itemName: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const bundle: PromoBundle = {
      id: bundleToEdit?.id || `bundle-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      bundleItems: selectedItems,
      price: Number(price),
      originalPrice: Number(originalPrice),
      discountBadge: discountBadge.trim(),
      image: image || menuItems[0]?.image,
      available,
      temperatureOption: temperatureOption.trim(),
      timeSlot: timeSlot.trim(),
    };

    onSave(bundle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#fff8f5] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-[#e8e1df] overflow-hidden my-auto">
        <div className="px-5 py-4 border-b border-[#f3ecea] flex justify-between items-center bg-[#f9f2f0]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-md">
              Promo Bundles
            </span>
            <h3 className="font-serif text-xl font-bold text-[#26170c] mt-0.5">
              {isEditing ? 'Edit Promo Bundle' : 'Create New Promo Bundle'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#4f453f] hover:bg-[#e8e1df] rounded-full">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1">Bundle / Combo Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Morning Artisanal Pair"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc] focus:ring-2 focus:ring-[#5e604d]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="e.g. Ethiopian pour over coffee served with avocado toast."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc]"
            />
          </div>

          {/* Included Items Selector */}
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1.5 flex items-center justify-between">
              <span>Select Included Menu Items ({selectedItems.length} selected)</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-[#d2c4bc]">
              {menuItems.map((item) => {
                const isSelected = selectedItems.includes(item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleItem(item.name)}
                    className={`p-2 rounded-lg text-left text-xs border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#e1e1c9] border-[#636451] font-semibold text-[#26170c]'
                        : 'bg-[#f9f2f0] border-transparent text-[#4f453f] hover:bg-[#eee7e4]'
                    }`}
                  >
                    <img src={item.image} alt={item.name} className="w-6 h-6 rounded-md object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                    <span className="truncate text-[11px]">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">Promo Price (₱)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-[#4f453f]">₱</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">Orig. Price (₱)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-[#4f453f]">₱</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">Promo Badge</label>
              <input
                type="text"
                placeholder="Save ₱60"
                value={discountBadge}
                onChange={(e) => setDiscountBadge(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">Temperature / Serving Option</label>
              <input
                type="text"
                placeholder="Choice of Hot or Iced Drink"
                value={temperatureOption}
                onChange={(e) => setTemperatureOption(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">Time of Day / Availability</label>
              <input
                type="text"
                placeholder="Daily until 11:30 AM"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc]"
              />
            </div>
          </div>

          {/* Bundle Image Selection */}
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1">Bundle Cover Photo URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#d2c4bc]"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#26170c] pt-2">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-[#26170c] accent-[#26170c]"
            />
            Bundle is currently active and available to order
          </label>
        </form>

        <div className="p-4 bg-[#f9f2f0] border-t border-[#e8e1df] flex justify-between items-center">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete bundle "${bundleToEdit.name}"?`)) {
                  onDelete(bundleToEdit.id);
                  onClose();
                }
              }}
              className="px-3 py-1.5 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors"
            >
              Delete Bundle
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#4f453f] hover:bg-[#e8e1df] rounded-full">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-[#26170c] text-white text-xs font-bold rounded-full hover:bg-[#3d2b1f] transition-all"
            >
              {isEditing ? 'Update Bundle' : 'Save Bundle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
