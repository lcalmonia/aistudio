import React, { useState, useEffect } from 'react';
import { CustomerUser, StoreSettings } from '../../types';
import { authService } from '../../services/authService';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: CustomerUser) => void;
  onLoginSuccess?: (customer: CustomerUser) => void;
  onRegisterSuccess?: (customer: CustomerUser) => void;
  initialMode?: 'login' | 'register';
  promptMessage?: string;
  storeSettings?: StoreSettings;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onLoginSuccess,
  onRegisterSuccess,
  initialMode = 'login',
  promptMessage = 'Please sign in or create an account to start your order',
  storeSettings,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Sync mode when initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const storeName = storeSettings?.storeName || 'iLuvKeyks';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!mobile.trim() || mobile.length < 8) {
      setError('Please enter a valid mobile number.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!address.trim()) {
      setError('Please provide your complete delivery / home address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.registerCustomer({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password: password.trim(),
        address: address.trim(),
      });

      setLoading(false);
      if (res.success && res.customer) {
        if (onRegisterSuccess) {
          onRegisterSuccess(res.customer);
        } else if (onSuccess) {
          onSuccess(res.customer);
        }
        onClose();
      } else {
        setError(res.error || 'Registration failed. Please check your details.');
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginIdentifier.trim()) {
      setError('Please enter your registered email or mobile number.');
      return;
    }
    if (!loginPassword.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.loginCustomer(loginIdentifier.trim(), loginPassword.trim());
      setLoading(false);
      if (res.success && res.customer) {
        if (onLoginSuccess) {
          onLoginSuccess(res.customer);
        } else if (onSuccess) {
          onSuccess(res.customer);
        }
        onClose();
      } else {
        setError(res.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div
      id="customer-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="bg-[#fff8f5] w-full max-w-md rounded-2xl shadow-2xl border border-[#dec1af] overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#26170c] text-white p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#dec1af]/10 blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-[#dec1af] text-[#26170c] flex items-center justify-center font-serif font-bold text-lg shadow-sm">
              <span className="material-symbols-outlined text-[22px]">local_cafe</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold leading-tight">
                {mode === 'login' ? `Sign In to ${storeName}` : `Join ${storeName} Rewards`}
              </h3>
              <p className="text-[11px] text-[#dec1af]">
                {mode === 'login'
                  ? 'Access your saved addresses, loyalty stamps & points'
                  : 'Earn stamps, redeem free coffee & track your orders'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Prompt Badge */}
        {promptMessage && (
          <div className="bg-[#fbddca]/40 px-4 py-2 border-b border-[#dec1af]/40 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#5e604d]">info</span>
            <span className="text-xs text-[#4f453f] font-medium">{promptMessage}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-[#f3ecea] bg-white">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'text-[#26170c] border-b-2 border-[#26170c] bg-[#fff8f5]'
                : 'text-[#81756e] hover:text-[#26170c]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'text-[#26170c] border-b-2 border-[#26170c] bg-[#fff8f5]'
                : 'text-[#81756e] hover:text-[#26170c]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Create Account</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-shake">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* ============================================================= */
            /* LOGIN FORM                                                    */
            /* ============================================================= */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#4f453f] mb-1">
                  Email Address or Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. name@example.com or 09170000000"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                    required
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#81756e] text-[18px]">
                    person
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4f453f] mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                    required
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#81756e] text-[18px]">
                    lock
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In & Continue Order</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ============================================================= */
            /* REGISTRATION FORM                                             */
            /* ============================================================= */
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#4f453f] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Cruz"
                  className="w-full px-3.5 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4f453f] mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria@example.com"
                    className="w-full px-3.5 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4f453f] mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+63 917 000 0000"
                    className="w-full px-3.5 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4f453f] mb-1">
                  Create Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4f453f] mb-1">
                  Delivery / Home Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Unit/House No., Street, Barangay, City (used for cafe deliveries)"
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                  required
                />
              </div>

              {/* Loyalty Perks Callout */}
              <div className="bg-[#dec1af]/20 p-3 rounded-xl border border-[#dec1af]/40 flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-[#5e604d]">loyalty</span>
                <div>
                  <p className="text-xs font-bold text-[#26170c]">Instant Loyalty Perks</p>
                  <p className="text-[10px] text-[#4f453f]">
                    Get 50 bonus reward points + 1 stamp immediately upon signing up!
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Customer Account</span>
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#f9f2f0] border-t border-[#f3ecea] text-center">
          <p className="text-[11px] text-[#81756e]">
            {mode === 'login' ? (
              <>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="font-bold text-[#26170c] hover:underline cursor-pointer"
                >
                  Create one here
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-[#26170c] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
