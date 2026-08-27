import React, { useState } from 'react';
import { MenuItem, Order, OrderItem } from '../types';
import { generateOrderId, generateOrderNumber } from '../services/idGenerator';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (newOrder: Order) => void;
  menuItems: MenuItem[];
  categories?: string[];
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onCreateOrder,
  menuItems,
  categories = [],
}) => {
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState<{
    item: MenuItem;
    quantity: number;
    customization: string;
    temperature?: 'Hot' | 'Iced';
  }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  // Combine unique categories from props and actual menu items
  const allCategoryList = ['All', ...Array.from(new Set([...categories, ...menuItems.map((m) => m.category)]))];

  const filteredMenuItems = (activeCategory === 'All'
    ? menuItems
    : menuItems.filter((m) => m.category === activeCategory)
  ).filter((m) => m.available);

  const handleAddItem = (item: MenuItem) => {
    const defaultTemp = item.temperature === 'Cold' ? 'Iced' : 'Hot';
    setSelectedItems((prev) => {
      const existing = prev.find((p) => p.item.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.item.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [
        ...prev,
        {
          item,
          quantity: 1,
          customization: item.temperature === 'N/A' ? 'Freshly prepared' : `${defaultTemp}, Regular 16oz`,
          temperature: item.temperature === 'N/A' ? undefined : defaultTemp,
        },
      ];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((p) => p.item.id !== itemId));
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((p) => {
          if (p.item.id === itemId) {
            const newQty = p.quantity + delta;
            return newQty > 0 ? { ...p, quantity: newQty } : null;
          }
          return p;
        })
        .filter(Boolean) as {
        item: MenuItem;
        quantity: number;
        customization: string;
        temperature?: 'Hot' | 'Iced';
      }[]
    );
  };

  const calculateTotal = () => {
    return selectedItems.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;

    const orderNum = generateOrderNumber();
    const items: OrderItem[] = selectedItems.map((s) => ({
      name: s.item.name,
      quantity: s.quantity,
      customization: s.customization + (customNote ? ` • ${customNote}` : ''),
      price: s.item.price,
      temperature: s.temperature,
    }));

    const newOrder: Order = {
      id: generateOrderId(),
      orderNumber: orderNum,
      customerName: customerName.trim() || 'Dine-in Guest',
      timeAgo: 'Just now',
      timestamp: Date.now(),
      status: 'New',
      items,
      total: calculateTotal(),
      subtotal: calculateTotal(),
      image: selectedItems[0]?.item.image,
    };

    onCreateOrder(newOrder);
    setCustomerName('');
    setSelectedItems([]);
    setCustomNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#fff8f5] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-[#e8e1df] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#f3ecea] flex justify-between items-center bg-[#f9f2f0]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e1e1c9] text-[#636451] px-2 py-0.5 rounded-md">
              POS Terminal
            </span>
            <h3 className="font-serif text-xl font-bold text-[#26170c] mt-0.5">New Barista Order</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#4f453f] hover:bg-[#e8e1df] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-[#26170c] mb-1.5">
              Customer Name / Table #
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Maria, Table 3, Takeout #12..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm bg-white rounded-xl border border-[#d2c4bc] focus:outline-none focus:ring-2 focus:ring-[#5e604d]"
              />
              <div className="flex gap-1">
                {['Maria', 'Ken', 'Sofia'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCustomerName(name)}
                    className="px-2 py-1 bg-[#f3ecea] hover:bg-[#e1e1c9] text-xs font-medium text-[#4f453f] rounded-lg transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#26170c] mb-1.5">
              Select Category
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrolling-hide">
              {allCategoryList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'bg-[#26170c] text-white'
                      : 'bg-[#f3ecea] text-[#4f453f] hover:bg-[#e8e1df]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Menu Grid */}
          <div className="grid grid-cols-2 gap-2.5 max-h-44 overflow-y-auto pr-1">
            {filteredMenuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleAddItem(item)}
                className="p-2.5 bg-[#f9f2f0] hover:bg-[#f3ecea] border border-[#e8e1df] rounded-xl flex items-center gap-2.5 cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-[#26170c] truncate">{item.name}</h5>
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] text-[#5e604d] font-semibold">₱{item.price.toFixed(2)}</p>
                    {item.temperature !== 'N/A' && (
                      <span className="text-[9px] text-[#81756e]">
                        {item.temperature === 'Both' ? '🔥/❄️' : item.temperature === 'Hot' ? '🔥' : '❄️'}
                      </span>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-[#636451]">add_circle</span>
              </div>
            ))}
          </div>

          {/* Current Order Summary */}
          <div>
            <label className="block text-xs font-semibold text-[#26170c] mb-1.5">
              Order Ticket ({selectedItems.length} items)
            </label>
            {selectedItems.length === 0 ? (
              <div className="p-4 bg-[#f3ecea] rounded-xl text-center text-xs text-[#81756e]">
                No items added yet. Tap items from the menu above.
              </div>
            ) : (
              <div className="space-y-2 bg-[#f9f2f0] p-3 rounded-xl border border-[#e8e1df]">
                {selectedItems.map((sel) => (
                  <div key={sel.item.id} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[#26170c]">{sel.item.name}</span>
                      <p className="text-[11px] text-[#81756e]">₱{sel.item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(sel.item.id, -1)}
                        className="w-6 h-6 rounded-full bg-[#e8e1df] text-[#26170c] font-bold flex items-center justify-center hover:bg-[#d2c4bc]"
                      >
                        -
                      </button>
                      <span className="font-bold text-[#26170c]">{sel.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(sel.item.id, 1)}
                        className="w-6 h-6 rounded-full bg-[#26170c] text-white font-bold flex items-center justify-center hover:bg-[#3d2b1f]"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(sel.item.id)}
                        className="text-[#ba1a1a] hover:opacity-80 ml-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Custom Note input */}
                <div className="pt-2 border-t border-[#d2c4bc]/40">
                  <input
                    type="text"
                    placeholder="Barista notes (e.g. Less sweet, extra ice, oat milk)..."
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-[#d2c4bc] focus:outline-none"
                  />
                </div>

                {/* Total */}
                <div className="pt-2 flex justify-between items-center font-bold text-sm text-[#26170c] border-t border-[#d2c4bc]/40">
                  <span>Order Total</span>
                  <span>₱{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f9f2f0] border-t border-[#e8e1df] flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#4f453f] hover:bg-[#e8e1df] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedItems.length === 0}
            onClick={handleSubmit}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
              selectedItems.length === 0
                ? 'bg-[#d2c4bc] text-[#81756e] cursor-not-allowed'
                : 'bg-[#26170c] hover:bg-[#3d2b1f] text-white active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Send to Kitchen (₱{calculateTotal().toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};
