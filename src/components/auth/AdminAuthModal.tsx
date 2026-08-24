import React, { useState } from 'react';
import { StoreSettings } from '../../types';
import { saveAdminAuth } from '../../data/storage';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeSettings?: StoreSettings;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storeSettings,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const storeName = storeSettings?.storeName || 'iLuvKeyks';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.trim();
    if (!cleanPin) {
      setError('Please enter the Staff / Admin PIN or Password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Valid pins / passwords: 1234, admin, admin123, 0000
      if (['1234', 'admin', 'admin123', '0000', 'keyks2026'].includes(cleanPin.toLowerCase())) {
        saveAdminAuth(true);
        setLoading(false);
        onSuccess();
      } else {
        setLoading(false);
        setError('Invalid staff credentials. Default PIN: 1234');
      }
    }, 200);
  };

  const handleQuickFill = () => {
    setPin('1234');
    setError(null);
  };

  return (
    <div
      id="admin-auth-modal"
      className="fixed inset-0 z-[160] flex items-center justify-center p-3.5 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#fff8f5] w-full max-w-sm rounded-3xl shadow-2xl border border-[#26170c]/30 overflow-hidden my-auto flex flex-col text-[#26170c]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#26170c] text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-2 text-[#fbddca]">
            <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#dec1af]">
            Store Administration
          </span>
          <h3 className="font-serif text-xl font-bold mt-0.5">Staff & Barista Portal</h3>
          <p className="text-xs text-[#dec1af]/80 mt-0.5">
            Authorized management & KDS terminal
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#ffdad6] text-[#93000a] text-xs font-medium rounded-xl border border-[#ba1a1a]/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#4f453f] mb-1">
              Staff Passcode or PIN
            </label>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN (Default: 1234)"
                className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-sm text-[#26170c] font-mono tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                autoFocus
              />
            </div>
          </div>

          {/* Quick PIN button */}
          <button
            type="button"
            onClick={handleQuickFill}
            className="w-full py-1.5 px-3 bg-[#e1e1c9] hover:bg-[#d8d8bc] text-[#636451] rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">key</span>
            <span>Quick Fill Staff PIN (1234)</span>
          </button>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#f3ecea] hover:bg-[#e8e1df] text-[#4f453f] text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate</span>
                  <span className="material-symbols-outlined text-[15px]">lock_open</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="p-3 bg-[#f9f2f0] border-t border-[#f3ecea] text-center text-[11px] text-[#81756e]">
          Protected {storeName} Barista and POS System
        </div>
      </div>
    </div>
  );
};
