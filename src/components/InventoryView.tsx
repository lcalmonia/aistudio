import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { EditInventoryModal } from './EditInventoryModal';

interface InventoryViewProps {
  items: InventoryItem[];
  categories: string[];
  onSaveItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onAddCategory: (category: string) => void;
  onShowNotification: (msg: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items = [],
  categories = [],
  onSaveItem,
  onDeleteItem,
  onAddCategory,
  onShowNotification,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Low Stock' | 'In Stock'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  // Quick Restock Custom Prompt State
  const [restockModalItem, setRestockModalItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Low Stock'
          ? item.status === 'Low Stock' || item.status === 'Critical'
          : item.status === 'In Stock';

      return matchesCategory && matchesSearch && matchesStatus;
    });
  }, [items, selectedCategory, searchQuery, statusFilter]);

  // Summary Metrics
  const totalStockValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.costPerUnit || 0) * item.stock, 0);
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter((item) => item.status === 'Low Stock' || item.status === 'Critical').length;
  }, [items]);

  const handleOpenAdd = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleQuickAdjust = (item: InventoryItem, delta: number) => {
    const newStock = Math.max(0, parseFloat((item.stock + delta).toFixed(2)));
    let newStatus: 'In Stock' | 'Low Stock' | 'Critical' = 'In Stock';
    if (newStock <= 0) newStatus = 'Critical';
    else if (newStock <= item.minThreshold) newStatus = 'Low Stock';

    const updated: InventoryItem = {
      ...item,
      stock: newStock,
      status: newStatus,
      lastRestocked: delta > 0 ? new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : item.lastRestocked,
    };

    onSaveItem(updated);
    if (delta > 0) {
      onShowNotification(`+${delta} ${item.unit} added to "${item.name}"`);
    } else {
      onShowNotification(`${delta} ${item.unit} deducted from "${item.name}"`);
    }
  };

  const handleConfirmRestock = () => {
    if (!restockModalItem) return;
    const amount = Number(restockAmount) || 0;
    if (amount <= 0) return;
    handleQuickAdjust(restockModalItem, amount);
    setRestockModalItem(null);
  };

  return (
    <div className="pt-2 px-4 sm:px-6 max-w-4xl mx-auto pb-32">
      {/* Top Title & Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#26170c] tracking-tight">
              Inventory & Supplies
            </h2>
            <span className="px-2.5 py-0.5 bg-[#26170c] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              Stock Manager
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4f453f] mt-0.5">
            Manage beans, syrups, powders, juices, pasta products, and cafe packaging
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto px-4 py-2.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>+ Add Inventory Item</span>
        </button>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* Total SKUs */}
        <div className="p-3.5 bg-white rounded-2xl border border-[#f3ecea] shadow-xs">
          <div className="flex items-center justify-between text-[#81756e] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Items</span>
            <span className="material-symbols-outlined text-[18px] text-[#26170c]">category</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#26170c] font-serif">{items.length}</p>
          <p className="text-[10px] text-[#81756e] mt-0.5">{categories.length} active categories</p>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Low Stock' ? 'All' : 'Low Stock')}
          className={`p-3.5 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            lowStockCount > 0
              ? 'bg-[#ffdad6]/40 border-[#ba1a1a]/40 hover:bg-[#ffdad6]/60'
              : 'bg-white border-[#f3ecea]'
          }`}
        >
          <div className="flex items-center justify-between text-[#ba1a1a] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock</span>
            <span className="material-symbols-outlined text-[18px]">warning</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#93000a] font-serif">{lowStockCount}</p>
          <p className="text-[10px] text-[#93000a] mt-0.5 font-medium">
            {lowStockCount > 0 ? 'Action required (Click to filter)' : 'All supplies optimal'}
          </p>
        </div>

        {/* Total Stock Value */}
        <div className="p-3.5 bg-white rounded-2xl border border-[#f3ecea] shadow-xs">
          <div className="flex items-center justify-between text-[#81756e] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stock Valuation</span>
            <span className="material-symbols-outlined text-[18px] text-[#26170c]">payments</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#26170c] font-serif">
            ₱{totalStockValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#81756e] mt-0.5">Estimated on-hand worth</p>
        </div>

        {/* Restocked Today */}
        <div className="p-3.5 bg-white rounded-2xl border border-[#f3ecea] shadow-xs">
          <div className="flex items-center justify-between text-[#81756e] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Store Status</span>
            <span className="material-symbols-outlined text-[18px] text-[#8fbc8f]">check_circle</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#26170c] font-serif">Ready</p>
          <p className="text-[10px] text-[#81756e] mt-0.5">Barista bar stocked</p>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-[#f9f2f0] p-4 rounded-2xl border border-[#f3ecea] mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#81756e] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, supplier (e.g. Beans, Syrup, Cups)..."
              className="w-full pl-9 pr-3.5 py-2 bg-white rounded-xl border border-[#dec1af] focus:outline-none focus:ring-2 focus:ring-[#26170c] text-xs sm:text-sm text-[#26170c] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-[#81756e] hover:text-[#26170c]"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>

          {/* Status Quick Filter */}
          <div className="flex gap-1.5 self-start sm:self-auto bg-white p-1 rounded-xl border border-[#dec1af]">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'All'
                  ? 'bg-[#26170c] text-white shadow-xs'
                  : 'text-[#4f453f] hover:bg-[#f3ecea]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Low Stock')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'Low Stock'
                  ? 'bg-[#ba1a1a] text-white shadow-xs'
                  : 'text-[#93000a] hover:bg-[#ffdad6]/50'
              }`}
            >
              <span>Low Stock</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full font-bold">
                  {lowStockCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('In Stock')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'In Stock'
                  ? 'bg-[#636451] text-white shadow-xs'
                  : 'text-[#4f453f] hover:bg-[#f3ecea]'
              }`}
            >
              In Stock
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#26170c] text-white shadow-xs'
                : 'bg-white text-[#4f453f] hover:bg-[#eae2e0] border border-[#dec1af]/40'
            }`}
          >
            All Categories ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((it) => it.category.toLowerCase() === cat.toLowerCase()).length;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#26170c] text-white shadow-xs'
                    : 'bg-white text-[#4f453f] hover:bg-[#eae2e0] border border-[#dec1af]/40'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#f3ecea] text-[#81756e]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inventory Item Cards Grid / List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#f3ecea] shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#f3ecea] flex items-center justify-center text-[#81756e] mb-3">
            <span className="material-symbols-outlined text-[28px]">inventory_2</span>
          </div>
          <h4 className="font-serif text-lg font-bold text-[#26170c]">No inventory items found</h4>
          <p className="text-xs text-[#4f453f] mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All' || statusFilter !== 'All'
              ? 'No items matched your current filter criteria.'
              : 'Start by adding your coffee beans, syrups, utensils, and food ingredients.'}
          </p>
          <div className="flex justify-center gap-3 mt-4">
            {(searchQuery || selectedCategory !== 'All' || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setStatusFilter('All');
                }}
                className="px-4 py-2 bg-[#f3ecea] hover:bg-[#e8e1df] text-xs font-bold text-[#26170c] rounded-xl transition-all"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl transition-all"
            >
              + Add Item
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const isLow = item.status === 'Low Stock';
            const isCritical = item.status === 'Critical' || item.stock <= 0;
            const itemTotalVal = (item.costPerUnit || 0) * item.stock;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-white border transition-all duration-150 shadow-xs flex flex-col justify-between ${
                  isCritical
                    ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]/30'
                    : isLow
                    ? 'border-[#ba1a1a]/40 bg-[#fffbfb]'
                    : 'border-[#f3ecea] hover:border-[#dec1af]'
                }`}
              >
                {/* Header: Status and Category Tag */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-[#ba1a1a] text-white animate-pulse'
                            : isLow
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : 'bg-[#e1e1c9] text-[#636451]'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#f3ecea] text-[#4f453f] rounded-md">
                        {item.category}
                      </span>
                    </div>

                    {/* Edit & Delete Action Icons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-[#4f453f] hover:text-[#26170c] hover:bg-[#f3ecea] rounded-lg transition-all"
                        title="Edit Item"
                        aria-label={`Edit ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${item.name}" from inventory?`)) {
                            onDeleteItem(item.id);
                            onShowNotification(`"${item.name}" removed from inventory.`);
                          }
                        }}
                        className="p-1.5 text-[#81756e] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-all"
                        title="Delete Item"
                        aria-label={`Delete ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Item Name */}
                  <h4 className="font-serif text-base font-bold text-[#26170c] leading-snug">
                    {item.name}
                  </h4>

                  {/* Stock Level & Threshold */}
                  <div className="mt-2.5 p-2.5 bg-[#f9f2f0] rounded-xl border border-[#f3ecea]/80">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs text-[#4f453f] font-medium">On-Hand Stock</span>
                      <span className="text-sm font-bold text-[#26170c]">
                        {item.stock} <span className="text-xs font-semibold text-[#81756e]">{item.unit}</span>
                      </span>
                    </div>

                    {/* Stock Meter */}
                    <div className="w-full bg-[#e8e1df] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCritical
                            ? 'bg-[#ba1a1a]'
                            : isLow
                            ? 'bg-[#ba1a1a]/80'
                            : 'bg-[#636451]'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(8, (item.stock / (item.minThreshold * 2 || 10)) * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-[#81756e] mt-1 font-medium">
                      <span>Min Alert: {item.minThreshold} {item.unit}</span>
                      {item.costPerUnit ? (
                        <span>₱{item.costPerUnit} / {item.unit} (Val: ₱{itemTotalVal.toLocaleString('en-PH')})</span>
                      ) : (
                        <span>Cost not set</span>
                      )}
                    </div>
                  </div>

                  {/* Supplier & Notes */}
                  {(item.supplier || item.notes) && (
                    <div className="mt-2 text-[11px] text-[#81756e] space-y-0.5">
                      {item.supplier && (
                        <p className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">local_shipping</span>
                          <span className="font-semibold text-[#4f453f]">{item.supplier}</span>
                        </p>
                      )}
                      {item.notes && (
                        <p className="flex items-center gap-1 italic text-[#81756e]/90">
                          <span className="material-symbols-outlined text-[13px]">info</span>
                          <span>{item.notes}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Stock Controls (+ Restock, - Deduct, Custom) */}
                <div className="mt-3.5 pt-3 border-t border-[#f3ecea] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuickAdjust(item, -1)}
                      className="w-7 h-7 bg-[#f3ecea] hover:bg-[#e8e1df] text-[#26170c] rounded-lg font-bold flex items-center justify-center text-xs active:scale-95 transition-all cursor-pointer"
                      title="Deduct 1 unit"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(item, 1)}
                      className="w-7 h-7 bg-[#f3ecea] hover:bg-[#e8e1df] text-[#26170c] rounded-lg font-bold flex items-center justify-center text-xs active:scale-95 transition-all cursor-pointer"
                      title="Add 1 unit"
                    >
                      +1
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setRestockModalItem(item);
                      setRestockAmount(item.unit === 'kg' ? 10 : item.unit === 'pcs' || item.unit === 'cups' ? 100 : 5);
                    }}
                    className="px-3.5 py-1.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add_box</span>
                    <span>Restock</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Edit/Create Modal */}
      <EditInventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveItem}
        onDelete={onDeleteItem}
        itemToEdit={itemToEdit}
        categories={categories}
        onAddCategory={onAddCategory}
      />

      {/* Quick Restock Amount Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-[#dec1af] p-5 text-[#26170c]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#f3ecea]">
              <h3 className="font-serif text-base font-bold text-[#26170c]">
                Restock Supply
              </h3>
              <button
                onClick={() => setRestockModalItem(null)}
                className="text-[#81756e] hover:text-[#26170c]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#4f453f] mb-3">
              Add arriving shipment stock for <strong className="text-[#26170c]">{restockModalItem.name}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
                Quantity to Add ({restockModalItem.unit})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3.5 py-2.5 bg-[#f9f2f0] rounded-xl border border-[#dec1af] text-base font-bold text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                  autoFocus
                />
                <span className="text-sm font-semibold text-[#81756e]">
                  {restockModalItem.unit}
                </span>
              </div>

              {/* Quick increment buttons */}
              <div className="flex gap-2 mt-2">
                {[5, 10, 20, 50, 100].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setRestockAmount(inc)}
                    className="px-2.5 py-1 bg-[#f3ecea] hover:bg-[#e8e1df] text-[11px] font-bold rounded-lg text-[#26170c]"
                  >
                    +{inc}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-[#4f453f] hover:bg-[#f3ecea] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="px-4 py-2 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl shadow-md"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
