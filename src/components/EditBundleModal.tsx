import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PromoBundle, MenuItem } from '../types';
import { calculateBundleOriginalPrice, calculateBundleSavings } from '../utils/bundlePricing';
import { prepareUploadedImage } from '../utils/imageCompression';

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
  const isEditing = Boolean(bundleToEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(bundleToEdit?.name || '');
  const [description, setDescription] = useState(bundleToEdit?.description || '');
  const [price, setPrice] = useState<number>(bundleToEdit?.price ?? 199.00);
  const [discountBadge, setDiscountBadge] = useState(bundleToEdit?.discountBadge || 'Save 20%');
  const [temperatureOption, setTemperatureOption] = useState(bundleToEdit?.temperatureOption || 'Choice of Hot or Iced Drink');
  const [timeSlot, setTimeSlot] = useState(bundleToEdit?.timeSlot || 'Daily until 11:30 AM');
  const [image, setImage] = useState(bundleToEdit?.image || '');
  const [available, setAvailable] = useState<boolean>(bundleToEdit?.available ?? true);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    bundleToEdit?.bundleItems || [menuItems[0]?.name, menuItems[1]?.name].filter(Boolean)
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  // Dynamically calculate the combined original/base price from selected menu items
  const calculatedOriginalPrice = useMemo(() => {
    return calculateBundleOriginalPrice(selectedItems, menuItems);
  }, [selectedItems, menuItems]);

  // Dynamically compute savings between combined original price and promo price
  const { savingsAmount, savingsPercentage } = useMemo(() => {
    return calculateBundleSavings(calculatedOriginalPrice, price);
  }, [calculatedOriginalPrice, price]);

  useEffect(() => {
    if (bundleToEdit) {
      setName(bundleToEdit.name || '');
      setDescription(bundleToEdit.description || '');
      setPrice(bundleToEdit.price ?? 199.00);
      setDiscountBadge(bundleToEdit.discountBadge || 'Save 20%');
      setTemperatureOption(bundleToEdit.temperatureOption || 'Choice of Hot or Iced Drink');
      setTimeSlot(bundleToEdit.timeSlot || 'Daily until 11:30 AM');
      setImage(bundleToEdit.image || '');
      setAvailable(bundleToEdit.available ?? true);
      setSelectedItems(bundleToEdit.bundleItems || []);
    } else {
      setName('');
      setDescription('');
      setPrice(199.00);
      setDiscountBadge('Save 20%');
      setTemperatureOption('Choice of Hot or Iced Drink');
      setTimeSlot('Daily until 11:30 AM');
      setImage('');
      setAvailable(true);
      setSelectedItems([menuItems[0]?.name, menuItems[1]?.name].filter(Boolean));
    }
    setIsUploadingImage(false);
    setImageUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [bundleToEdit?.id, isOpen]);

  const handleToggleItem = (itemName: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemName) ? prev.filter((i) => i !== itemName) : [...prev, itemName]
    );
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;

    setImageUploadError('');
    setIsUploadingImage(true);
    try {
      const preparedImage = await prepareUploadedImage(file);
      setImage(preparedImage);
    } catch (error) {
      console.error('[EditBundleModal] Failed to prepare uploaded image', error);
      setImageUploadError('Unable to process this photo. Please choose another image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isUploadingImage) return;

    // Use calculated original price, falling back to bundle price if no items matched
    const finalOriginalPrice = calculatedOriginalPrice > 0 ? calculatedOriginalPrice : Number(price);

    const bundle: PromoBundle = {
      id: bundleToEdit?.id || `bundle-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      bundleItems: selectedItems,
      price: Number(price),
      originalPrice: finalOriginalPrice,
      discountBadge: discountBadge.trim() || (savingsAmount > 0 ? `Save ₱${savingsAmount.toFixed(0)}` : ''),
      image: image || undefined,
      available,
      temperatureOption: temperatureOption.trim(),
      timeSlot: timeSlot.trim(),
    };

    onSave(bundle);
    onClose();
  };

  if (!isOpen) return null;

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
          <button onClick={onClose} className="p-1 text-[#4f453f] hover:bg-[#e8e1df] rounded-full cursor-pointer">
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
              <span className="text-[11px] text-[#81756e] font-normal">Click to add/remove</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-[#d2c4bc]">
              {menuItems.map((item) => {
                const isSelected = selectedItems.includes(item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleItem(item.name)}
                    className={`p-2 rounded-lg text-left text-xs border transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#e1e1c9] border-[#636451] font-semibold text-[#26170c]'
                        : 'bg-[#f9f2f0] border-transparent text-[#4f453f] hover:bg-[#eee7e4]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img src={item.image} alt={item.name} className="w-6 h-6 rounded-md object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                      <span className="truncate text-[11px]">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#5e604d] flex-shrink-0">
                      ₱{Number(item.price || 0).toFixed(0)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">Bundle Price (₱) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-[#4f453f]">₱</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc] focus:ring-2 focus:ring-[#5e604d]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1 flex items-center justify-between">
                <span>Orig. Price (₱)</span>
                <span className="text-[9px] font-semibold text-[#5e604d] bg-[#e1e1c9] px-1 py-0.2 rounded">Auto</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-[#4f453f]">₱</span>
                <input
                  type="number"
                  step="0.01"
                  readOnly
                  tabIndex={-1}
                  value={calculatedOriginalPrice}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-[#f3ecea] text-[#26170c] font-bold rounded-xl border border-[#d2c4bc] cursor-default select-all"
                  title="Automatically calculated from the base prices of selected items"
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

          {/* Pricing & Savings Breakdown Card */}
          <div className="p-3 bg-[#f9f2f0] rounded-xl border border-[#e8e1df] flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[#81756e] block text-[10px] uppercase font-bold">Orig. Price</span>
                <span className="font-bold text-[#26170c] text-sm">₱{calculatedOriginalPrice.toFixed(2)}</span>
              </div>
              <span className="text-[#81756e] font-bold">−</span>
              <div>
                <span className="text-[#81756e] block text-[10px] uppercase font-bold">Bundle Price</span>
                <span className="font-bold text-[#26170c] text-sm">₱{Number(price || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[#81756e] block text-[10px] uppercase font-bold">Savings</span>
              <span className={`font-bold text-sm ${savingsAmount > 0 ? 'text-[#2e6b3e]' : 'text-[#81756e]'}`}>
                ₱{savingsAmount.toFixed(2)} {savingsPercentage > 0 ? `(${savingsPercentage}% OFF)` : ''}
              </span>
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

          {/* Bundle Cover Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1">Bundle Cover Photo</label>
            <div className="rounded-xl border border-[#d2c4bc] bg-white p-3 space-y-2">
              {image ? (
                <div className="relative overflow-hidden rounded-lg border border-[#e8e1df] bg-[#f9f2f0]">
                  <img src={image} alt="Bundle cover preview" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage('');
                      setImageUploadError('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[#26170c] text-white text-[10px] font-bold shadow-md cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="h-24 rounded-lg border border-dashed border-[#d2c4bc] bg-[#f9f2f0] flex items-center justify-center text-center px-4">
                  <div>
                    <span className="material-symbols-outlined text-[28px] text-[#81756e]">add_photo_alternate</span>
                    <p className="text-[11px] text-[#81756e]">Upload a cover photo for this bundle</p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full px-3 py-2 rounded-xl bg-[#26170c] text-white text-xs font-bold hover:bg-[#3d2b1f] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined align-middle text-[16px] mr-1">
                  {isUploadingImage ? 'progress_activity' : 'upload'}
                </span>
                {isUploadingImage ? 'Processing Photo...' : image ? 'Replace Cover Photo' : 'Upload Cover Photo'}
              </button>

              {imageUploadError && (
                <p className="text-[10px] font-semibold text-[#ba1a1a]">{imageUploadError}</p>
              )}
              <p className="text-[10px] text-[#81756e]">
                Upload an image file only. The photo is prepared the same way as menu item photos.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#26170c] pt-1">
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
              className="px-3 py-1.5 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
            >
              Delete Bundle
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#4f453f] hover:bg-[#e8e1df] rounded-full cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploadingImage}
              className="px-5 py-2 bg-[#26170c] text-white text-xs font-bold rounded-full hover:bg-[#3d2b1f] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Update Bundle' : 'Save Bundle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
