import React, { useEffect, useState } from 'react';
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
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setForgotMode(false);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const storeName = storeSettings?.storeName || 'iLuvKeyks';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) return setError('Please enter your full name.');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address.');
    if (!mobile.trim() || mobile.length < 8) return setError('Please enter a valid mobile number.');
    if (!password.trim() || password.length < 6) return setError('Password must be at least 6 characters.');
    if (!address.trim()) return setError('Please provide your complete delivery / home address.');

    setLoading(true);
    try {
      const res = await authService.registerCustomer({
        name: name.trim(), email: email.trim(), mobile: mobile.trim(), password: password.trim(), address: address.trim(),
      });
      if (res.success && res.customer) {
        onRegisterSuccess?.(res.customer);
        onSuccess?.(res.customer);
        onClose();
      } else {
        setError(res.error || 'Registration failed. Please check your details.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginIdentifier.trim()) return setError('Please enter your registered email or mobile number.');
    if (!loginPassword.trim()) return setError('Please enter your password.');

    setLoading(true);
    try {
      const res = await authService.loginCustomer(loginIdentifier.trim(), loginPassword.trim());
      if (res.success && res.customer) {
        onLoginSuccess?.(res.customer);
        onSuccess?.(res.customer);
        onClose();
      } else {
        setError(res.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered email or mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.requestCustomerPasswordReset(forgotIdentifier.trim());
      if (res.success) {
        setSuccess('Your password reset request has been sent to Super Admin. Please wait for approval.');
        setForgotIdentifier('');
      } else {
        setError(res.error || 'Unable to submit the password reset request.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="customer-auth-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#fff8f5] w-full max-w-md rounded-2xl shadow-2xl border border-[#dec1af] overflow-hidden flex flex-col max-h-[90vh] animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#26170c] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dec1af] text-[#26170c] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">local_cafe</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">{forgotMode ? 'Forgot Password' : mode === 'login' ? `Sign In to ${storeName}` : `Join ${storeName} Rewards`}</h3>
              <p className="text-[11px] text-[#dec1af]">{forgotMode ? 'Request a password reset from Super Admin' : mode === 'login' ? 'Access your saved addresses, loyalty stamps & points' : 'Earn stamps, redeem free coffee & track your orders'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {!forgotMode && promptMessage && <div className="bg-[#fbddca]/40 px-4 py-2 border-b border-[#dec1af]/40 text-xs text-[#4f453f]">{promptMessage}</div>}

        {!forgotMode && <div className="flex border-b border-[#f3ecea] bg-white">
          <button type="button" onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className={`flex-1 py-3 text-xs sm:text-sm font-bold ${mode === 'login' ? 'text-[#26170c] border-b-2 border-[#26170c] bg-[#fff8f5]' : 'text-[#81756e]'}`}>Sign In</button>
          <button type="button" onClick={() => { setMode('register'); setError(null); setSuccess(null); }} className={`flex-1 py-3 text-xs sm:text-sm font-bold ${mode === 'register' ? 'text-[#26170c] border-b-2 border-[#26170c] bg-[#fff8f5]' : 'text-[#81756e]'}`}>Create Account</button>
        </div>}

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">{error}</div>}
          {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl">{success}</div>}

          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="p-3 bg-[#dec1af]/20 rounded-xl text-xs text-[#4f453f]">Enter the email or mobile number registered to your customer account. A Super Admin must approve the reset before your password changes.</div>
              <input type="text" value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)} placeholder="Email address or mobile number" className="w-full px-3.5 py-3 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-2 focus:ring-[#26170c]" required />
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#26170c] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer">{loading ? 'Sending Request...' : 'Request Password Reset'}</button>
              <button type="button" onClick={() => { setForgotMode(false); setError(null); setSuccess(null); }} className="w-full py-2 text-xs font-bold text-[#26170c] hover:underline cursor-pointer">Back to Sign In</button>
            </form>
          ) : mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div><label className="block text-xs font-bold text-[#4f453f] mb-1">Email Address or Mobile Number *</label><input type="text" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} placeholder="e.g. name@example.com or 09170000000" className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm" required /></div>
              <div><label className="block text-xs font-bold text-[#4f453f] mb-1">Password *</label><input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter your password" className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm" required /></div>
              <div className="text-right"><button type="button" onClick={() => { setForgotMode(true); setError(null); setSuccess(null); }} className="text-xs font-bold text-[#26170c] hover:underline cursor-pointer">Forgot Password?</button></div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#26170c] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer">{loading ? 'Signing In...' : 'Sign In & Continue Order'}</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm" required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm" required /><input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile Number" className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm" required /></div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create Password (at least 6 characters)" className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm" required />
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery / Home Address" rows={2} className="w-full px-3.5 py-2.5 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm" required />
              <div className="bg-[#dec1af]/20 p-3 rounded-xl text-[10px] text-[#4f453f]">Get 50 bonus reward points + 1 stamp immediately upon signing up!</div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#26170c] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer">{loading ? 'Creating Account...' : 'Create Customer Account'}</button>
            </form>
          )}
        </div>

        {!forgotMode && <div className="px-5 py-3 bg-[#f9f2f0] border-t border-[#f3ecea] text-center text-[11px] text-[#81756e]">
          {mode === 'login' ? <>Don't have an account yet? <button type="button" onClick={() => { setMode('register'); setError(null); }} className="font-bold text-[#26170c] hover:underline cursor-pointer">Create one here</button></> : <>Already registered? <button type="button" onClick={() => { setMode('login'); setError(null); }} className="font-bold text-[#26170c] hover:underline cursor-pointer">Sign in here</button></>}
        </div>}
      </div>
    </div>
  );
};
