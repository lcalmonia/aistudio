import React from 'react';

interface ProfileViewProps {
  onShowNotification: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onShowNotification }) => {
  return (
    <div className="pt-20 px-3.5 sm:px-5 max-w-lg mx-auto pb-28">
      {/* Profile Header */}
      <section className="p-4 sm:p-5 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm flex items-center gap-3.5 sm:gap-4 mb-5 sm:mb-6">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cover bg-center border-2 border-[#dec1af] shadow-md flex-shrink-0"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAG4Sv5jk1_QYa4DYdRGVDEk9jVKdqM6L0OmNooCyZDhiskjG9HmKNVymSWEHwWRBB3zcQshcS0AO0APyB8EaeDRaSJdIO-k8a-MeSlgIebZoURFObBg3l-brWk24_creLyxqVVufPbUVScUEQXPm7MBRBfQobhplJsCDuKg3Td1QvxOLmhq1F7FAjqTGOiDzD2UkdrEOyv8etAxVu5no2-83rFx0TFlfPEh_K-dNk0Bbaya1CmGywF')`
          }}
        />
        <div className="min-w-0 flex-1">
          <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-full inline-block">
            Lead Manager
          </span>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#26170c] mt-1 truncate">
            Store Manager
          </h3>
          <p className="text-xs text-[#4f453f] truncate">iLuvKeyks Coffee and Tea • Main Branch</p>
        </div>
      </section>

      {/* Shift Overview */}
      <section className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
        <h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c]">Current Shift Info</h3>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="p-3 sm:p-4 bg-[#f9f2f0] rounded-xl border border-[#f3ecea]">
            <span className="text-[11px] sm:text-xs text-[#81756e]">Shift Timing</span>
            <p className="font-bold text-xs sm:text-sm text-[#26170c] mt-0.5">06:00 - 14:00</p>
          </div>
          <div className="p-3 sm:p-4 bg-[#f9f2f0] rounded-xl border border-[#f3ecea]">
            <span className="text-[11px] sm:text-xs text-[#81756e]">Baristas on Floor</span>
            <p className="font-bold text-xs sm:text-sm text-[#26170c] mt-0.5">3 Staff Active</p>
          </div>
          <div className="p-3 sm:p-4 bg-[#f9f2f0] rounded-xl border border-[#f3ecea]">
            <span className="text-[11px] sm:text-xs text-[#81756e]">La Marzocco Temp</span>
            <p className="font-bold text-xs sm:text-sm text-[#26170c] mt-0.5">93.5°C (Optimal)</p>
          </div>
          <div className="p-3 sm:p-4 bg-[#f9f2f0] rounded-xl border border-[#f3ecea]">
            <span className="text-[11px] sm:text-xs text-[#81756e]">Grinder Calibration</span>
            <p className="font-bold text-xs sm:text-sm text-[#26170c] mt-0.5">Dialed at 2.4</p>
          </div>
        </div>
      </section>

      {/* Equipment Maintenance Actions */}
      <section className="p-4 sm:p-5 bg-[#eee7e4] rounded-2xl border border-[#e8e1df]">
        <h4 className="font-serif text-sm sm:text-base font-bold text-[#26170c] mb-1.5 sm:mb-2">
          Barista Machine Care
        </h4>
        <p className="text-xs text-[#4f453f] mb-3.5 sm:mb-4 leading-relaxed">
          Group head flush scheduled in 45 minutes. Water hardness test logged today at 80ppm.
        </p>
        <button
          onClick={() => onShowNotification('Group heads backflushed and steam wands sanitized! ✨')}
          className="w-full py-2.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          Log Clean & Backflush Cycle
        </button>
      </section>
    </div>
  );
};
