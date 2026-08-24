import React, { useState } from 'react';
import confetti from 'canvas-confetti';

interface RewardsViewProps {
  onShowNotification: (msg: string) => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ onShowNotification }) => {
  const [stamps, setStamps] = useState<number>(7);
  const totalStamps = 10;

  const handleAddStamp = () => {
    if (stamps < totalStamps) {
      const next = stamps + 1;
      setStamps(next);
      if (next === totalStamps) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 }
        });
        onShowNotification('🎉 Customer unlocked a Free Handcrafted Drink reward!');
      } else {
        onShowNotification(`Added stamp (${next}/${totalStamps})! ☕`);
      }
    }
  };

  const handleRedeem = (rewardName: string) => {
    onShowNotification(`Redeemed "${rewardName}" voucher applied to ticket! ✨`);
  };

  return (
    <div className="pt-20 px-3.5 sm:px-5 max-w-lg mx-auto pb-28">
      <section className="mb-5 sm:mb-6">
        <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight">
          iLuvKeyks Club & Rewards
        </h2>
        <p className="text-sm sm:text-[15px] text-[#4f453f]">Customer loyalty cards & member perks</p>
      </section>

      {/* Digital Stamp Card */}
      <section className="p-4 sm:p-5 bg-[#3d2b1f] text-[#fbddca] rounded-2xl shadow-lg relative overflow-hidden mb-5 sm:mb-6 border border-[#26170c]">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#ac9181]">
              iLuvKeyks VIP Card
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-white mt-0.5">
              Mary Grace Santos
            </h3>
            <p className="text-[11px] sm:text-xs text-[#dec1af]">Gold Member • 520 pts</p>
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
          <span className="text-[11px] sm:text-xs leading-tight">{stamps} / {totalStamps} stamps to Free Handcrafted Drink</span>
          <button
            onClick={handleAddStamp}
            className="px-3 py-1 bg-[#fbddca] text-[#28180d] hover:bg-white font-bold rounded-full transition-all active:scale-95 text-xs whitespace-nowrap cursor-pointer self-end xs:self-auto"
          >
            + Add Stamp
          </button>
        </div>
      </section>

      {/* Available Member Vouchers */}
      <section className="space-y-3">
        <h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c]">Available Perks</h3>

        {[
          { title: 'Free Pastry / Cake Slice', desc: 'Valid for butter croissant or chocolate ganache cake', cost: '150 pts' },
          { title: 'Free Add-on / Espresso Shot', desc: 'Add extra shot, sweet cold foam or syrup to any drink', cost: '50 pts' },
          { title: 'Free Solo Tub Cake (Ube Leche Flan)', desc: 'Full-sized signature cake on tub treat', cost: '400 pts' },
        ].map((perk, i) => (
          <div
            key={i}
            className="p-3.5 sm:p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] flex items-center justify-between shadow-xs gap-2.5"
          >
            <div className="min-w-0 flex-1 pr-1">
              <h4 className="font-serif text-xs sm:text-sm font-bold text-[#26170c] leading-snug">{perk.title}</h4>
              <p className="text-[11px] sm:text-xs text-[#4f453f] mt-0.5 leading-relaxed">{perk.desc}</p>
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#5e604d] mt-1 inline-block">{perk.cost}</span>
            </div>
            <button
              onClick={() => handleRedeem(perk.title)}
              className="px-3 py-1.5 bg-[#5e604d] hover:bg-[#26170c] text-white text-[11px] sm:text-xs font-semibold rounded-full active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
            >
              Apply Perk
            </button>
          </div>
        ))}
      </section>
    </div>
  );
};
