import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CustomerUser } from '../types';
import { loyaltyService } from '../services/auxiliaryServices';

interface RewardsViewProps {
  currentCustomer?: CustomerUser | null;
  customers?: CustomerUser[];
  onShowNotification: (msg: string) => void;
  onOpenCustomerAuth?: () => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  currentCustomer,
  customers = [],
  onShowNotification,
  onOpenCustomerAuth,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(currentCustomer?.id || (customers[0]?.id ?? ''));
  const totalStamps = 10;

  // Active customer context
  const activeCustomer = currentCustomer || customers.find((c) => c.id === selectedCustomerId) || null;
  const stamps = activeCustomer?.stamps || 0;
  const points = activeCustomer?.points || 0;

  const handleAddStamp = async () => {
    if (!activeCustomer) {
      onShowNotification('Please select or sign in as a registered customer.');
      return;
    }

    const res = await loyaltyService.addStamp(activeCustomer.id, totalStamps);
    if (res) {
      if (res.unlockedReward) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
        });
        onShowNotification('🎉 Customer unlocked a Free Handcrafted Drink reward!');
      } else {
        onShowNotification(`Added stamp (${res.stamps}/${totalStamps}) for ${activeCustomer.name}! ☕`);
      }
    }
  };

  const handleRedeem = async (rewardName: string, pointCost: number) => {
    if (!activeCustomer) {
      onShowNotification('Please select or sign in as a registered customer.');
      return;
    }

    const res = await loyaltyService.redeemPoints(activeCustomer.id, pointCost);
    if (res.success) {
      onShowNotification(`Redeemed "${rewardName}" voucher applied to order! ✨ (${res.remainingPoints} pts remaining)`);
    } else {
      onShowNotification(res.error || 'Unable to redeem reward.');
    }
  };

  return (
    <div className="pt-20 px-3.5 sm:px-5 max-w-lg mx-auto pb-28">
      <section className="mb-5 sm:mb-6">
        <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight">
          iLuvKeyks Club & Rewards
        </h2>
        <p className="text-sm sm:text-[15px] text-[#4f453f]">Customer loyalty cards & member perks</p>
      </section>

      {/* Customer Selector if in Staff Mode */}
      {!currentCustomer && customers.length > 0 && (
        <div className="mb-4 p-3 bg-[#f9f2f0] rounded-xl border border-[#f3ecea]">
          <label className="block text-xs font-bold text-[#4f453f] mb-1">
            Active Member Card Preview:
          </label>
          <select
            value={activeCustomer?.id || ''}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-lg text-xs font-semibold text-[#26170c]"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.id}) • {c.points || 0} pts
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Digital Stamp Card */}
      {!activeCustomer ? (
        <div className="p-6 bg-[#3d2b1f] text-[#fbddca] rounded-2xl shadow-lg text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#fbddca]/20 text-[#fbddca] flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[26px]">loyalty</span>
          </div>
          <h3 className="font-serif text-lg font-bold text-white">Join the iLuvKeyks Loyalty Club</h3>
          <p className="text-xs text-[#dec1af] mt-1 max-w-xs mx-auto">
            Create an account or sign in to track your loyalty stamps, redeem free coffee, and unlock exclusive treats.
          </p>
          {onOpenCustomerAuth && (
            <button
              onClick={onOpenCustomerAuth}
              className="mt-4 px-4 py-2 bg-[#fbddca] text-[#28180d] hover:bg-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              Sign In or Register
            </button>
          )}
        </div>
      ) : (
        <section className="p-4 sm:p-5 bg-[#3d2b1f] text-[#fbddca] rounded-2xl shadow-lg relative overflow-hidden mb-5 sm:mb-6 border border-[#26170c]">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#ac9181]">
                iLuvKeyks VIP Card
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white mt-0.5">
                {activeCustomer.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#dec1af]">
                Member ID: {activeCustomer.id} • {points} pts
              </p>
            </div>
            <span className="material-symbols-outlined text-[#fbddca] text-[28px] sm:text-[32px]">
              stars
            </span>
          </div>

          {/* Stamps Grid */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 my-3 sm:my-4">
            {Array.from({ length: totalStamps }).map((_, index) => {
              const isStamped = index < stamps;
              const isReward = index === totalStamps - 1;
              return (
                <div
                  key={index}
                  className={`h-10 sm:h-12 rounded-xl flex items-center justify-center border transition-all ${
                    isStamped
                      ? 'bg-[#fbddca] text-[#28180d] border-[#dec1af] shadow-xs'
                      : 'bg-[#26170c]/50 text-[#ac9181]/40 border-[#ac9181]/20'
                  }`}
                >
                  {isStamped ? (
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                      {isReward ? 'redeem' : 'coffee'}
                    </span>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 text-xs mt-3 pt-3 border-t border-[#ac9181]/30">
            <span className="text-[11px] sm:text-xs leading-tight">
              {stamps} / {totalStamps} stamps to Free Handcrafted Drink
            </span>
            <button
              onClick={handleAddStamp}
              className="px-3 py-1 bg-[#fbddca] text-[#28180d] hover:bg-white font-bold rounded-full transition-all active:scale-95 text-xs whitespace-nowrap cursor-pointer self-end xs:self-auto"
            >
              + Add Stamp
            </button>
          </div>
        </section>
      )}

      {/* Available Member Vouchers */}
      <section className="space-y-3">
        <h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c]">Available Perks</h3>

        {[
          { title: 'Free Pastry / Cake Slice', desc: 'Valid for butter croissant or chocolate ganache cake', cost: 150, label: '150 pts' },
          { title: 'Free Add-on / Espresso Shot', desc: 'Add extra shot, sweet cold foam or syrup to any drink', cost: 50, label: '50 pts' },
          { title: 'Free Solo Tub Cake (Ube Leche Flan)', desc: 'Full-sized signature cake on tub treat', cost: 400, label: '400 pts' },
        ].map((perk, i) => (
          <div
            key={i}
            className="p-3.5 sm:p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] flex items-center justify-between shadow-xs gap-2.5"
          >
            <div className="min-w-0 flex-1 pr-1">
              <h4 className="font-serif text-xs sm:text-sm font-bold text-[#26170c] leading-snug">{perk.title}</h4>
              <p className="text-[11px] sm:text-xs text-[#4f453f] mt-0.5 leading-relaxed">{perk.desc}</p>
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#5e604d] mt-1 inline-block">{perk.label}</span>
            </div>
            <button
              onClick={() => handleRedeem(perk.title, perk.cost)}
              disabled={!activeCustomer || points < perk.cost}
              className={`px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-full active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                activeCustomer && points >= perk.cost
                  ? 'bg-[#5e604d] hover:bg-[#26170c] text-white'
                  : 'bg-[#e8e1df] text-[#81756e] cursor-not-allowed'
              }`}
            >
              Apply Perk
            </button>
          </div>
        ))}
      </section>
    </div>
  );
};
