import React, { useState } from 'react';
import { ProductAddon } from '../types';

interface EditAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addon: ProductAddon) => void;
  onDelete?: (addonId: string) => void;
  addonToEdit: ProductAddon | null;
}

export const EditAddonModal: React.FC<EditAddonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  addonToEdit,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(addonToEdit);

  const [name, setName] = useState(addonToEdit?.name || '');
  const [category, setCategory] = useState<ProductAddon['category']>(addonToEdit?.category || 'Syrup');
  const [price, setPrice] = useState<number>(addonToEdit?.price ?? 0.75);
  const [applicableTemperature, setApplicableTemperature] = useState<ProductAddon['applicableTemperature']>(
    addonToEdit?.applicableTemperature || 'Both'
  );
  const [available, setAvailable] = useState<boolean>(addonToEdit?.available ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const addon: ProductAddon = {
      id: addonToEdit?.id || `addon-${Date.now()}`,
      name: name.trim(),
      category,
      price: Number(price),
      applicableTemperature,
      available,
    };

    onSave(addon);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#fff8f5] rounded-2xl w-full max-w-md shadow-2xl border border-[#e8e1df] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f3ecea] flex justify-between items-center bg-[#f9f2f0]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-md">
              Add-on Modifier
            </span>
            <h3 className="font-serif text-lg font-bold text-[#26170c] mt-0.5">
              {isEditing ? 'Edit Modifier' : 'Add New Modifier'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#4f453f] hover:bg-[#e8e1df] rounded-full">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#26170c] mb-1">Modifier / Add-on Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Artisanal Lavender Syrup"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductAddon['category'])}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc]"
              >
                <option value="Milk">Alternative Milk</option>
                <option value="Shot">Espresso Shot</option>
                <option value="Syrup">Syrup & Sweetener</option>
                <option value="Topping">Topping & Dusting</option>
                <option value="Prep">Barista Prep / Temp</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26170c] mb-1">Price (₱)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-[#4f453f]">₱</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc]"
                />
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
                  onClick={() => setApplicableTemperature(temp)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    applicableTemperature === temp
                      ? 'bg-[#26170c] text-white border-[#26170c]'
                      : 'bg-white text-[#4f453f] border-[#d2c4bc] hover:bg-[#f3ecea]'
                  }`}
                >
                  {temp === 'Both' ? 'Hot & Iced' : temp === 'Hot' ? 'Hot Drinks Only' : 'Cold Drinks Only'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#26170c]">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-[#26170c] accent-[#26170c]"
            />
            Currently In Stock / Available
          </label>

          <div className="pt-3 border-t border-[#e8e1df] flex justify-between items-center">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete modifier "${addonToEdit.name}"?`)) {
                    onDelete(addonToEdit.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full"
              >
                Delete
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button onClick={onClose} type="button" className="px-4 py-1.5 text-xs text-[#4f453f] hover:bg-[#e8e1df] rounded-full">
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-full hover:bg-[#3d2b1f]"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
