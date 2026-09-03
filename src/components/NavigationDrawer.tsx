import React from 'react';
import { AdminPrincipal, StoreSettings } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSwitchToCustomerPortal?: () => void;
  storeSettings?: StoreSettings;
  admin: AdminPrincipal;
  profilePictureVersion: number;
  onLogout: () => void;
}

type NavItem = { tab: string; label: string; icon: string; adminOnly?: boolean; superAdminOnly?: boolean };

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onSwitchToCustomerPortal,
  storeSettings,
  admin,
  profilePictureVersion,
  onLogout,
}) => {
  const storeName = storeSettings?.storeName || 'iLuvKeyks Coffee & Tea';
  const branchName = storeSettings?.branchName || 'Main Street Flagship';
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  const superAdminItems: NavItem[] = [
    { tab: 'home', label: 'Dashboard', icon: 'monitoring' },
    { tab: 'settings', label: 'Store & Logo Settings', icon: 'tune', superAdminOnly: true },
    { tab: 'orders', label: 'Barista Orders', icon: 'assignment' },
    { tab: 'admin-menu', label: 'Menu Management', icon: 'restaurant_menu' },
    { tab: 'inventory', label: 'Inventory & Stock', icon: 'inventory_2' },
    { tab: 'customers', label: 'Customer Directory', icon: 'group' },
    { tab: 'stats', label: 'Analytics & Reports', icon: 'bar_chart' },
    { tab: 'rewards', label: 'Rewards & Loyalty', icon: 'redeem', superAdminOnly: true },
    { tab: 'admins', label: 'Admin Accounts', icon: 'admin_panel_settings', superAdminOnly: true },
    { tab: 'profile', label: 'Admin Profile', icon: 'account_circle' },
  ];

  const adminItems: NavItem[] = [
    { tab: 'admin-menu', label: 'Menu Management', icon: 'restaurant_menu', adminOnly: true },
    { tab: 'settings', label: 'Store & Logo Settings', icon: 'tune', adminOnly: true },
    { tab: 'home', label: 'Sales Overview', icon: 'monitoring' },
    { tab: 'orders', label: 'Barista Orders', icon: 'assignment' },
    { tab: 'inventory', label: 'Inventory & Stock', icon: 'inventory_2' },
    { tab: 'customers', label: 'Customer Directory', icon: 'group' },
    { tab: 'stats', label: 'Analytics & Reports', icon: 'bar_chart' },
    { tab: 'profile', label: 'Admin Profile', icon: 'account_circle' },
  ];

  const items = isSuperAdmin ? superAdminItems : adminItems;

  return (
    <>
      <div
        id="drawer-overlay"
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[60] backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <nav
        id="nav-drawer"
        className={`fixed left-0 top-0 h-full z-[70] flex flex-col p-5 bg-[#f3ecea] w-72 rounded-r-2xl shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col items-start gap-3 mb-4 pt-4">
          <div className="relative flex items-center gap-3">
            {admin?.hasProfilePicture && admin?.profilePictureUrl ? (
              <img
                src={`${admin.profilePictureUrl}?v=${profilePictureVersion}`}
                alt="Admin profile"
                className="w-14 h-14 rounded-full object-cover border-2 border-[#dec1af] shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#26170c] text-[#fbddca] border-2 border-[#dec1af] shadow-md flex items-center justify-center font-serif text-xl font-bold">
                {(admin?.displayName || admin?.username || 'A').slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 left-10 w-3.5 h-3.5 bg-[#8fbc8f] border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-[#26170c] text-white text-[10px] font-bold rounded">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
              <h3 className="font-serif text-[17px] font-bold text-[#26170c] truncate max-w-[180px]">
                {admin?.displayName || 'Admin'}
              </h3>
            </div>
            <p className="text-xs text-[#4f453f] font-medium truncate max-w-[200px] mt-0.5">
              @{admin?.username || 'admin'} · {branchName}
            </p>
          </div>
        </div>

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
                <span className="material-symbols-outlined text-[20px] text-[#dec1af]">storefront</span>
                <div className="text-left">
                  <p className="text-xs font-bold leading-tight">Customer Portal</p>
                  <p className="text-[10px] text-[#dec1af]">Open online order view</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#dec1af]">arrow_forward</span>
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {items.map((item) => {
            const isActive = currentTab === item.tab;
            const showAdminBadge = item.adminOnly && !isSuperAdmin;
            return (
              <button
                key={item.tab}
                onClick={() => {
                  onSelectTab(item.tab);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-left transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#26170c] font-bold bg-[#e1e1c9] translate-x-1 shadow-sm'
                    : 'text-[#4f453f] hover:bg-[#e8e1df]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[22px] text-[#26170c]">{item.icon}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                {showAdminBadge && (
                  <span className="px-1.5 py-0.5 bg-[#26170c] text-white text-[9px] font-bold rounded">ADMIN</span>
                )}
                {isSuperAdmin && item.superAdminOnly && item.tab === 'rewards' && (
                  <span className="px-1.5 py-0.5 bg-[#636451] text-white text-[9px] font-bold rounded">SUPER</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-[#d2c4bc]/50 text-xs text-[#81756e]">
          <p className="font-medium text-[#26170c] truncate">{storeName}</p>
          <p className="text-[11px]">Protected {isSuperAdmin ? 'Super Admin' : 'Admin'} Portal • PHP (₱)</p>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#26170c] text-white text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[17px]">logout</span>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
};
