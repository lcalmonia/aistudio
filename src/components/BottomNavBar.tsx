import React from 'react';

interface BottomNavBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewOrder: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewOrder,
}) => {
  return (
    <>
      {/* Floating Action Button (Quick New Counter / POS Order) */}
      <button
        id="fab-new-order"
        onClick={onOpenNewOrder}
        className="fixed bottom-20 right-4 sm:right-6 w-13 h-13 sm:w-14 sm:h-14 bg-[#26170c] hover:bg-[#3d2b1f] text-white rounded-full shadow-[0_6px_20px_rgba(38,23,12,0.35)] flex items-center justify-center active:scale-90 transition-all z-40 cursor-pointer group"
        aria-label="New Counter Order"
      >
        <span className="material-symbols-outlined text-[26px] group-hover:rotate-90 transition-transform duration-200">
          add
        </span>
      </button>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-between items-center px-1.5 xs:px-2 sm:px-3 pb-2.5 pt-1.5 bg-[#f9f2f0] border-t border-[#f3ecea] shadow-[0_-4px_16px_rgba(61,43,31,0.06)] rounded-t-2xl max-w-xl mx-auto">
        {/* Home / Dashboard */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 duration-150 cursor-pointer min-w-0 ${
            currentTab === 'home'
              ? 'bg-[#e1e1c9] text-[#636451] rounded-full px-1 xs:px-2 font-bold shadow-xs'
              : 'text-[#4f453f] hover:text-[#26170c] px-0.5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] xs:text-[20px]">home</span>
          <span className="text-[9px] xs:text-[10px] font-semibold tracking-tight truncate">Home</span>
        </button>

        {/* Menu (Products, Combos, Addons) */}
        <button
          onClick={() => onSelectTab('admin-menu')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 duration-150 cursor-pointer min-w-0 ${
            currentTab === 'admin-menu'
              ? 'bg-[#26170c] text-white rounded-full px-1 xs:px-2 font-bold shadow-xs'
              : 'text-[#4f453f] hover:text-[#26170c] px-0.5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] xs:text-[20px]">restaurant_menu</span>
          <span className="text-[9px] xs:text-[10px] font-semibold tracking-tight truncate">Menu</span>
        </button>

        {/* Orders / Barista Queue */}
        <button
          onClick={() => onSelectTab('orders')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 duration-150 cursor-pointer min-w-0 ${
            currentTab === 'orders' || currentTab === 'menu'
              ? 'bg-[#e1e1c9] text-[#636451] rounded-full px-1 xs:px-2 font-bold shadow-xs'
              : 'text-[#4f453f] hover:text-[#26170c] px-0.5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] xs:text-[20px]">local_cafe</span>
          <span className="text-[9px] xs:text-[10px] font-semibold tracking-tight truncate">Orders</span>
        </button>

        {/* Stats / Analytics */}
        <button
          onClick={() => onSelectTab('stats')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 duration-150 cursor-pointer min-w-0 ${
            currentTab === 'stats'
              ? 'bg-[#e1e1c9] text-[#636451] rounded-full px-1 xs:px-2 font-bold shadow-xs'
              : 'text-[#4f453f] hover:text-[#26170c] px-0.5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] xs:text-[20px]">monitoring</span>
          <span className="text-[9px] xs:text-[10px] font-semibold tracking-tight truncate">Stats</span>
        </button>

        {/* Inventory */}
        <button
          onClick={() => onSelectTab('inventory')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 duration-150 cursor-pointer min-w-0 ${
            currentTab === 'inventory'
              ? 'bg-[#e1e1c9] text-[#636451] rounded-full px-1 xs:px-2 font-bold shadow-xs'
              : 'text-[#4f453f] hover:text-[#26170c] px-0.5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] xs:text-[20px]">inventory_2</span>
          <span className="text-[9px] xs:text-[10px] font-semibold tracking-tight truncate">Stock</span>
        </button>
      </nav>
    </>
  );
};
