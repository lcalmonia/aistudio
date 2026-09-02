import React, { useEffect, useState } from 'react';
import { AdminPrincipal } from '../types';
import { RewardClaim, rewardClaimService } from '../services/rewardClaimService';

interface RewardClaimsBannerProps {
  currentTab: string;
  admin: AdminPrincipal;
}

export const RewardClaimsBanner: React.FC<RewardClaimsBannerProps> = ({ currentTab, admin }) => {
  const [claims, setClaims] = useState<RewardClaim[]>([]);

  const refresh = async () => {
    if (currentTab !== 'orders') return;
    try {
      setClaims(await rewardClaimService.listPendingClaims());
    } catch (error) {
      console.warn('[RewardClaimsBanner] Sync error:', error);
    }
  };

  useEffect(() => {
    if (currentTab !== 'orders') {
      setClaims([]);
      return;
    }
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [currentTab, admin.id]);

  if (currentTab !== 'orders' || claims.length === 0) return null;

  const fulfill = async (claim: RewardClaim) => {
    try {
      await rewardClaimService.fulfillClaim(claim.id);
      await refresh();
      window.alert(`Reward fulfilled for ${claim.customerName}: ${claim.perkName}.`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to fulfill reward claim.');
    }
  };

  const reject = async (claim: RewardClaim) => {
    if (!window.confirm(`Reject ${claim.customerName}'s claim for ${claim.perkName}?`)) return;
    try {
      await rewardClaimService.rejectClaim(claim.id);
      await refresh();
      window.alert(`Reward claim rejected for ${claim.customerName}.`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to reject reward claim.');
    }
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-40 px-3 sm:px-5 pointer-events-none">
      <div className="w-full max-w-[1400px] mx-auto pointer-events-auto rounded-b-2xl border border-[#d2c4bc] border-t-0 bg-[#f3ecea] shadow-lg p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[21px] text-[#26170c]">redeem</span>
            <div className="min-w-0">
              <p className="font-serif font-bold text-sm sm:text-base text-[#26170c]">Reward Claims</p>
              <p className="text-[10px] text-[#81756e]">Customers waiting for their preferred perks</p>
            </div>
          </div>
          <span className="flex-shrink-0 px-2 py-1 rounded-full bg-[#26170c] text-white text-[9px] font-bold">{claims.length} PENDING</span>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {claims.map((claim) => (
            <div key={claim.id} className="min-w-[270px] sm:min-w-[340px] flex-1 bg-white rounded-xl border border-[#dec1af] px-3 py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#26170c] truncate">{claim.customerName} <span className="font-mono text-[9px] text-[#81756e]">({claim.customerId})</span></p>
                <p className="text-[11px] text-[#4f453f] truncate">Preferred perk: <strong>{claim.perkName}</strong></p>
                <p className="text-[9px] text-[#81756e]">{claim.redemptionCost} {claim.redemptionType}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button type="button" onClick={() => reject(claim)} className="px-2 py-1.5 rounded-lg border border-[#d2c4bc] text-[#93000a] text-[9px] font-bold cursor-pointer">Reject</button>
                <button type="button" onClick={() => fulfill(claim)} className="px-2.5 py-1.5 rounded-lg bg-[#26170c] text-white text-[9px] font-bold cursor-pointer">Fulfill</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
