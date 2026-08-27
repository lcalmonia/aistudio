import React, { useEffect, useState } from 'react';
import { adminAuthService } from '../../services/adminAuthService';
import { AdminAccount, AdminPrincipal } from '../../types';

interface AdminAccountManagementViewProps {
  principal: AdminPrincipal;
  onSessionInvalidated: () => void;
  onShowNotification: (message: string) => void;
}

const EMPTY_FORM = {
  username: '',
  displayName: '',
  password: '',
  confirmPassword: '',
  active: true,
};

export const AdminAccountManagementView: React.FC<AdminAccountManagementViewProps> = ({
  principal,
  onSessionInvalidated,
  onShowNotification,
}) => {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetAccountId, setResetAccountId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await adminAuthService.listAccounts());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Admin accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }
    setSaving(true);
    try {
      const account = await adminAuthService.createAccount({
        username: form.username,
        displayName: form.displayName,
        password: form.password,
        active: form.active,
      });
      setAccounts((current) => [account, ...current]);
      setForm(EMPTY_FORM);
      onShowNotification(`Admin account ${account.username} created.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create Admin account.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (account: AdminAccount) => {
    setError(null);
    try {
      await adminAuthService.setAccountActive(account.id, !account.active);
      setAccounts((current) =>
        current.map((item) => (item.id === account.id ? { ...item, active: !item.active } : item)),
      );
      onShowNotification(`${account.username} ${account.active ? 'deactivated' : 'activated'}.`);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to update Admin status.');
    }
  };

  const handlePasswordReset = async (account: AdminAccount) => {
    setError(null);
    try {
      const result = await adminAuthService.resetAccountPassword(account.id, resetPassword);
      setResetAccountId(null);
      setResetPassword('');
      if (result.reauthenticationRequired) {
        onSessionInvalidated();
        return;
      }
      onShowNotification(`Password changed for ${account.username}.`);
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Unable to change password.');
    }
  };

  return (
    <div className="pt-20 px-3.5 sm:px-5 max-w-5xl mx-auto pb-28 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#81756e]">Access Control</span>
          <h2 className="font-serif text-2xl font-bold text-[#26170c]">Admin Accounts</h2>
          <p className="text-xs text-[#4f453f] mt-1">
            Signed in as {principal.displayName} · {principal.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
          </p>
        </div>
      </header>

      {error && <div className="p-3 rounded-xl bg-[#ffdad6] text-[#93000a] text-sm border border-[#ba1a1a]/20">{error}</div>}

      <section className="bg-[#f9f2f0] border border-[#f3ecea] rounded-2xl p-4 sm:p-5 shadow-sm">
        <h3 className="font-serif text-lg font-bold text-[#26170c]">Create Admin</h3>
        <p className="text-xs text-[#81756e] mt-1 mb-4">New accounts always receive the ADMIN role.</p>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="px-3 py-2.5 rounded-xl border border-[#dec1af] bg-white text-sm" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" required />
          <input className="px-3 py-2.5 rounded-xl border border-[#dec1af] bg-white text-sm" placeholder="Display name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
          <input className="px-3 py-2.5 rounded-xl border border-[#dec1af] bg-white text-sm" type="password" placeholder="Password (12+ characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" minLength={12} required />
          <input className="px-3 py-2.5 rounded-xl border border-[#dec1af] bg-white text-sm" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} autoComplete="new-password" minLength={12} required />
          <label className="flex items-center gap-2 text-sm font-semibold text-[#4f453f]">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Account active immediately
          </label>
          <button disabled={saving} className="px-4 py-2.5 rounded-xl bg-[#26170c] text-white text-sm font-bold disabled:opacity-60">
            {saving ? 'Creating…' : 'Create Admin Account'}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg font-bold text-[#26170c]">Authorized Accounts</h3>
        {loading ? (
          <div className="h-28 rounded-2xl bg-[#f3ecea] animate-pulse" />
        ) : accounts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#f9f2f0] border border-[#f3ecea] text-sm text-[#81756e]">No Admin accounts are available to manage.</div>
        ) : (
          accounts.map((account) => (
            <article key={account.id} className="p-4 rounded-2xl bg-[#f9f2f0] border border-[#f3ecea] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#26170c] text-[#fbddca] flex items-center justify-center font-serif font-bold">
                  {account.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-[#26170c]">{account.displayName}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${account.active ? 'bg-[#e1e1c9] text-[#636451]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
                      {account.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-[#81756e]">@{account.username} · ADMIN</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {account.canResetPassword && (
                    <button onClick={() => setResetAccountId(account.id)} className="px-3 py-2 rounded-xl bg-white border border-[#dec1af] text-xs font-bold text-[#26170c]">Change Password</button>
                  )}
                  {account.canChangeStatus && (
                    <button onClick={() => void handleStatus(account)} className="px-3 py-2 rounded-xl bg-[#26170c] text-white text-xs font-bold">
                      {account.active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
              {resetAccountId === account.id && (
                <div className="mt-3 pt-3 border-t border-[#dec1af]/50 flex flex-col sm:flex-row gap-2">
                  <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="New password (12+ characters)" minLength={12} autoComplete="new-password" className="flex-1 px-3 py-2 rounded-xl border border-[#dec1af] bg-white text-sm" />
                  <button onClick={() => void handlePasswordReset(account)} className="px-3 py-2 rounded-xl bg-[#26170c] text-white text-xs font-bold">Save Password</button>
                  <button onClick={() => { setResetAccountId(null); setResetPassword(''); }} className="px-3 py-2 rounded-xl bg-[#e8e1df] text-[#4f453f] text-xs font-bold">Cancel</button>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
};
