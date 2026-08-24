import React from 'react';
import { StoreSettings } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSwitchToCustomerPortal?: () => void;
  storeSettings?: StoreSettings;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onSwitchToCustomerPortal,
  storeSettings,
}) => {
  const storeName = storeSettings?.storeName || 'iLuvKeyks Coffee & Tea';
  const branchName = storeSettings?.branchName || 'Main Street Flagship';
  const logoUrl = storeSettings?.logoUrl;

  return (
    <>
      {/* Drawer Overlay */}
      <div
        id="drawer-overlay"
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[60] backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Navigation Drawer */}
      <nav
        id="nav-drawer"
        className={`fixed left-0 top-0 h-full z-[70] flex flex-col p-5 bg-[#f3ecea] w-72 rounded-r-2xl shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Manager Profile Header */}
        <div className="flex flex-col items-start gap-3 mb-4 pt-4">
          <div className="relative flex items-center gap-3">
            {logoUrl ? (
              <div
                className="w-14 h-14 rounded-2xl bg-cover bg-center border-2 border-[#dec1af] shadow-md flex-shrink-0"
                style={{
                  backgroundImage: `url('${logoUrl}')`,
                }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full bg-cover bg-center border-2 border-[#dec1af] shadow-md flex-shrink-0"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAG4Sv5jk1_QYa4DYdRGVDEk9jVKdqM6L0OmNooCyZDhiskjG9HmKNVymSWEHwWRBB3zcQshcS0AO0APyB8EaeDRaSJdIO-k8a-MeSlgIebZoURFObBg3l-brWk24_creLyxqVVufPbUVScUEQXPm7MBRBfQobhplJsCDuKg3Td1QvxOLmhq1F7FAjqTGOiDzD2UkdrEOyv8etAxVu5no2-83rFx0TFlfPEh_K-dNk0Bbaya1CmGywF')`,
                }}
              />
            )}
            <span className="absolute bottom-0 left-10 w-3.5 h-3.5 bg-[#8fbc8f] border-2 border-white rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.2 bg-[#26170c] text-white text-[10px] font-bold rounded">
                Admin
              </span>
              <h3 className="font-serif text-[17px] font-bold text-[#26170c] truncate max-w-[180px]">
                {storeName}
              </h3>
            </div>
            <p className="text-xs text-[#4f453f] font-medium truncate max-w-[200px] mt-0.5">{branchName}</p>
          </div>
        </div>

        {/* Customer Portal Quick Launcher Button */}
        {onSwitchToCustomerPortal && (
          <div className="mb-4 pb-3 border-b border-[#d2c4bc]/60">
            <button
              onClick={() => {
                onSwitchToCustomerPortal();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-[#26170c] to-[#3d2b1f] text-white rounded-xl shadow-md hover:opacity-95 transition-all cursor-pointer group active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#dec1af] group-hover:scale-110 transition-transform">
                  storefront
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold leading-tight">Customer Portal</p>
                  <p className="text-[10px] text-[#dec1af]">Open online order view</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#dec1af]">
                arrow_forward
              </span>
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {/* Menu Management (Admin Highlight) */}
          <button
            onClick={() => {
              onSelectTab('admin-menu');
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-left transition-all cursor-pointer ${
              currentTab === 'admin-menu'
                ? 'text-[#26170c] font-bold bg-[#e1e1c9] translate-x-1 shadow-sm'
                : 'text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px] text-[#26170c]">restaurant_menu</span>
              <span className="text-sm font-semibold">Menu Management</span>
            </div>
            <span className="px-1.5 py-0.5 bg-[#26170c] text-white text-[9px] font-bold rounded">
              ADMIN
            </span>
          </button>

          {/* Store Settings & Rebranding (Admin Highlight) */}
          <button
            onClick={() => {
              onSelectTab('settings');
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-left transition-all cursor-pointer ${
              currentTab === 'settings'
                ? 'text-[#26170c] font-bold bg-[#e1e1c9] translate-x-1 shadow-sm'
                : 'text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px] text-[#26170c]">tune</span>
              <span className="text-sm font-semibold">Store & Logo Settings</span>
            </div>
            <span className="px-1.5 py-0.5 bg-[#26170c] text-white text-[9px] font-bold rounded">
              ADMIN
            </span>
          </button>

          {/* Sales Overview / Dashboard */}
          <button
            onClick={() => {
              onSelectTab('home');
              onClose();
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-left transition-all cursor-pointer ${
              currentTab === 'home'
                ? 'text-[#26170c] font-bold bg-[#e1e1c9] translate-x-1 shadow-sm'
                : 'text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">monitoring</span>
            <span className="text-sm font-semibold">Sales Overview</span>
          </button>

          {/* Active Orders */}
          <button
            onClick={() => {
              onSelectTab('orders');
              onClose();
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-left transition-all cursor-pointer ${
              currentTab === 'orders'
                ? 'text-[#26170c] font-bold bg-[#e1e1c9] translate-x-1 shadow-sm'
                : 'text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">assignment</span>
            <span className="text-sm font-semibold">Barista Orders</span>
          </button>

          {/* Inventory */}
          <button
            onClick={() => {
              onSelectTab('inventory');
              onClose();
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-left transition-all cursor-pointer ${
              currentTab === 'inventory'
                ? 'text-[#26170c] font-bold bg-[#e1e1c9] translate-x-1 shadow-sm'
                : 'text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            <span className="text-sm font-semibold">Inventory & Stock</span>
          </button>

          {/* Customer Directory */}
          <button
            onClick={() => {
              onSelectTab('customers');
              onClose();
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-left transition-all cursor-pointer ${
              currentTab === 'customers'
                ? 'text-[#26170c] font-bold bg-[#e1e1c9] translate-x-1 shadow-sm'
                : 'text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">group</span>
            <span className="text-sm font-semibold">Customer Directory</span>
          </button>

          {/* Rewards & Loyalty */}
          <button
            onClick={() => {
              onSelectTab('rewards');
              onClose();
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-left transition-all cursor-pointer ${
              currentTab === 'rewards'
                ? 'text-[#26170c] font-bold bg-[#e1e1c9] translate-x-1 shadow-sm'
                : 'text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">stars</span>
            <span className="text-sm font-semibold">Rewards & Loyalty</span>
          </button>

          {/* Analytics / Stats */}
          <button
            onClick={() => {
              onSelectTab('stats');
              onClose();
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-left transition-all cursor-pointer ${
              currentTab === 'stats'
                ? 'text-[#26170c] font-bold bg-[#e1e1c9] translate-x-1 shadow-sm'
                : 'text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">bar_chart</span>
            <span className="text-sm font-semibold">Analytics & Reports</span>
          </button>

          {/* Profile / Shift Info */}
          <button
            onClick={() => {
              onSelectTab('profile');
              onClose();
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-left transition-all cursor-pointer ${
              currentTab === 'profile'
                ? 'text-[#26170c] font-bold bg-[#e1e1c9] translate-x-1 shadow-sm'
                : 'text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">build</span>
            <span className="text-sm font-semibold">Equipment & Machine</span>
          </button>
        </div>

        {/* Footer info in drawer */}
        <div className="mt-auto pt-4 border-t border-[#d2c4bc]/50 text-xs text-[#81756e]">
          <p className="font-medium text-[#26170c] truncate">{storeName}</p>
          <p className="text-[11px]">Admin & Barista Portal • PHP (₱)</p>
        </div>
      </nav>
    </>
  );
};

