import React, { useState, useEffect } from 'react';
import { CustomerUser, StoreSettings } from '../../types';
import { registerCustomer, authenticateCustomer, getStoredCustomers } from '../../data/storage';

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
  const [mobile, setMobile] = useState('+63 ');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const storeName = storeSettings?.storeName || 'iLuvKeyks';
  const demoCustomers = getStoredCustomers().slice(0, 3);

  const handleRegister = (e: React.FormEvent) => {
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
      setError('Please enter a valid mobile number (e.g. +63 917 123 4567).');
      return;
    }
    if (!address.trim()) {
      setError('Please provide your complete delivery / home address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = registerCustomer({
        name,
        email,
        mobile,
        password: password || 'password123',
        address,
      });

      setLoading(false);
      if (res.success && res.customer) {
        if (onRegisterSuccess) {
          onRegisterSuccess(res.customer);
        } else if (onSuccess) {
          onSuccess(res.customer);
        }
      } else {
        setError(res.error || 'Registration failed. Please check your details.');
      }
    }, 300);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginIdentifier.trim()) {
      setError('Please enter your registered email or mobile number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = authenticateCustomer(loginIdentifier, loginPassword);
      setLoading(false);
      if (res.success && res.customer) {
        if (onLoginSuccess) {
          onLoginSuccess(res.customer);
        } else if (onSuccess) {
          onSuccess(res.customer);
        }
      } else {
        setError(res.error || 'Invalid credentials. Please try again.');
      }
    }, 250);
  };

  const handleQuickLogin = (demo: CustomerUser) => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const res = authenticateCustomer(demo.email);
      setLoading(false);
      if (res.success && res.customer) {
        if (onLoginSuccess) {
          onLoginSuccess(res.customer);
        } else if (onSuccess) {
          onSuccess(res.customer);
        }
      }
    }, 200);
  };

  return (
    <div
      id="customer-auth-modal"
      className="fixed inset-0 z-[160] flex items-center justify-center p-3.5 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#fff8f5] w-full max-w-md rounded-3xl shadow-2xl border border-[#dec1af]/70 overflow-hidden my-auto max-h-[94vh] flex flex-col text-[#26170c]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#26170c] text-white p-5 sm:p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-2 text-[#dec1af]">
            <span className="material-symbols-outlined text-[26px]">local_cafe</span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#dec1af]">
            {storeName} Coffee & Tea
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-bold mt-0.5">
            {mode === 'login' ? 'Welcome Back!' : 'Create Customer Account'}
          </h3>
          <p className="text-xs text-[#dec1af]/85 mt-1 max-w-xs mx-auto leading-relaxed">
            {promptMessage}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-white/10 rounded-2xl mt-4 border border-white/15">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#fbddca] text-[#26170c] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#fbddca] text-[#26170c] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-[#ffdad6] text-[#93000a] text-xs font-medium rounded-xl border border-[#ba1a1a]/30 flex items-start gap-2 animate-shake">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
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
                    placeholder="e.g. mary.grace@example.com or 09175554321"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                    required
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#81756e] text-[18px]">
                    person
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#4f453f]">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-[#81756e]">Default: password123</span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
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
                className="w-full py-3 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
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

              {/* Quick Demo Accounts Helper */}
              <div className="pt-3 border-t border-[#f3ecea]">
                <span className="text-[11px] font-bold text-[#81756e] uppercase tracking-wider block mb-2 text-center">
                  Quick 1-Click Demo Accounts
                </span>
                <div className="space-y-1.5">
                  {demoCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleQuickLogin(c)}
                      className="w-full p-2 bg-[#f9f2f0] hover:bg-[#dec1af]/30 border border-[#dec1af]/50 rounded-xl text-left flex items-center justify-between text-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#26170c] text-white text-[10px] flex items-center justify-center font-bold">
                          {c.name.charAt(0)}
                        </span>
                        <div>
                          <p className="font-bold text-[#26170c] leading-tight">{c.name}</p>
                          <p className="text-[10px] text-[#81756e]">{c.id} • {c.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#5e604d] group-hover:translate-x-0.5 transition-transform flex items-center">
                        Select →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
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
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#4f453f] mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@example.com"
                    className="w-full px-3 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
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
                    className="w-full px-3 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
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
                  placeholder="Choose a secure password"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4f453f] mb-1">
                  Complete Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Unit #, Street, Barangay, City, Postal Code"
                  className="w-full px-3.5 py-2 bg-white border border-[#dec1af] rounded-xl text-xs text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]"
                  required
                />
              </div>

              <div className="p-3 bg-[#e1e1c9]/50 rounded-xl border border-[#dec1af]/40 text-[11px] text-[#4f453f] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#5e604d]">stars</span>
                <span>Includes 1st Free Welcome Loyalty Stamp + 50 bonus reward points!</span>
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
                    <span>Complete Registration & Order</span>
                    <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer switch */}
        <div className="p-3.5 bg-[#f9f2f0] border-t border-[#dec1af]/40 text-center text-xs text-[#4f453f]">
          {mode === 'login' ? (
            <span>
              New to {storeName}?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-bold text-[#26170c] hover:underline cursor-pointer ml-1"
              >
                Create an account
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-bold text-[#26170c] hover:underline cursor-pointer ml-1"
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
