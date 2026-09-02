import React from 'react';
import { AdminPrincipal, StoreSettings } from '../types';
import { RewardClaimsBanner } from './RewardClaimsBanner';

interface HeaderProps {
  onOpenDrawer: () => void;
  onOpenCartOrPOS: () => void;
  activeOrdersCount: number;
  currentTab: string;
  onSwitchToCustomerPortal?: () => void;
  storeSettings?: StoreSettings;
  admin: AdminPrincipal;
  profilePictureVersion: number;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDrawer,
  onOpenCartOrPOS,
  activeOrdersCount,
  currentTab,
  onSwitchToCustomerPortal,
  storeSettings,
  admin,
  profilePictureVersion,
  onLogout,
}) => {
  const storeName = storeSettings?.storeName || 'iLuvKeyks';
  const logoUrl = storeSettings?.logoUrl;
  const branchName = storeSettings?.branchName || 'Main St. Live';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-5 h-16 bg-[#fff8f5] border-b border-[#f3ecea]/80 shadow-[0_2px_8px_rgba(61,43,31,0.04)]">
        <div className="flex items-center gap-3">
          <button
            id="menu-drawer-button"
            onClick={onOpenDrawer}
            className="text-[#26170c] hover:opacity-80 transition-opacity active:scale-95 duration-150 p-1.5 -ml-1.5 rounded-full hover:bg-[#f3ecea]"
            aria-label="Open Navigation Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-7 h-7 rounded-lg object-cover border border-[#dec1af]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#26170c] text-[#dec1af] flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">local_cafe</span>
              </div>
            )}
            <h1 className="font-serif text-[17px] sm:text-[19px] font-bold text-[#26170c] tracking-tight truncate max-w-[150px] sm:max-w-[240px]">{storeName}</h1>
            <span className="hidden xs:inline px-1.5 py-0.5 bg-[#26170c] text-white text-[9px] font-bold rounded">
              {admin.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'ADMIN'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {onSwitchToCustomerPortal && (
            <button onClick={onSwitchToCustomerPortal} className="px-2.5 sm:px-3 py-1.5 bg-[#f3ecea] hover:bg-[#e1e1c9] text-[#26170c] text-xs font-bold rounded-xl border border-[#dec1af]/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs" title="Open Customer Order Storefront">
              <span className="material-symbols-outlined text-[16px] text-[#636451]">storefront</span>
              <span className="hidden sm:inline">Customer Portal</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#f3ecea] rounded-full text-xs font-medium text-[#4f453f]">
            <span className="w-2 h-2 rounded-full bg-[#8fbc8f] animate-pulse"></span>
            <span className="truncate max-w-[120px]">{branchName}</span>
          </div>

          <button onClick={() => onLogout()} className="px-2.5 py-1.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5" title="Logout">
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span className="hidden sm:inline">Logout</span>
          </button>

          <button onClick={onOpenDrawer} className="w-9 h-9 rounded-full overflow-hidden bg-[#e1e1c9] text-[#26170c] border border-[#dec1af] flex items-center justify-center font-serif font-bold" aria-label={`${admin?.displayName || admin?.username || 'Admin'} profile menu`}>
            {admin?.hasProfilePicture && admin?.profilePictureUrl ? (
              <img src={`${admin.profilePictureUrl}?v=${profilePictureVersion}`} alt="Admin profile" className="w-full h-full object-cover" />
            ) : (
              (admin?.displayName || admin?.username || 'A').slice(0, 1).toUpperCase()
            )}
          </button>

          <button id="cart-pos-button" onClick={onOpenCartOrPOS} className="relative text-[#26170c] hover:opacity-80 transition-opacity active:scale-95 duration-150 p-1.5 rounded-full hover:bg-[#f3ecea]" aria-label="Open Cart and POS">
            <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
            {activeOrdersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#26170c] text-white text-[10px] font-bold rounded-full px-1">{activeOrdersCount}</span>
            )}
          </button>
        </div>
      </header>

      <RewardClaimsBanner currentTab={currentTab} admin={admin} />
    </>
  );
};
