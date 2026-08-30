import React, { useRef, useState } from 'react';
import { adminAuthService } from '../services/adminAuthService';
import { AdminPrincipal } from '../types';

interface ProfileViewProps {
  admin: AdminPrincipal;
  profilePictureVersion: number;
  onProfileChanged: (hasProfilePicture: boolean) => void;
  onShowNotification: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  admin,
  profilePictureVersion,
  onProfileChanged,
  onShowNotification,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await adminAuthService.uploadProfilePicture(file);
      onProfileChanged(true);
      onShowNotification('Profile picture updated.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload profile picture.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError(null);
    try {
      await adminAuthService.removeProfilePicture();
      onProfileChanged(false);
      onShowNotification('Profile picture removed.');
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove profile picture.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-20 px-3.5 sm:px-5 max-w-lg mx-auto pb-28">
      <section className="p-4 sm:p-5 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm mb-5 sm:mb-6">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#26170c] text-[#fbddca] border-2 border-[#dec1af] shadow-md flex items-center justify-center font-serif text-2xl font-bold flex-shrink-0">
            {admin?.hasProfilePicture && admin?.profilePictureUrl ? (
              <img src={`${admin.profilePictureUrl}?v=${profilePictureVersion}`} alt="Admin profile" className="w-full h-full object-cover" />
            ) : (
              (admin?.displayName || admin?.username || 'A').slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-full inline-block">
              {admin?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
            </span>
            <h3 className="font-serif text-xl font-bold text-[#26170c] mt-1 truncate">{admin?.displayName || 'Admin'}</h3>
            <p className="text-xs text-[#4f453f] truncate">@{admin?.username || 'admin'}</p>
          </div>
        </div>

        {error && <div className="mt-3 p-3 rounded-xl bg-[#ffdad6] text-[#93000a] text-xs">{error}</div>}

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
          <button disabled={busy} onClick={() => fileInputRef.current?.click()} className="flex-1 py-2.5 bg-[#26170c] text-white text-xs font-bold rounded-xl disabled:opacity-60">
            Change Profile Picture
          </button>
          <button disabled={busy || !admin.hasProfilePicture} onClick={() => void handleRemove()} className="flex-1 py-2.5 bg-[#e8e1df] text-[#4f453f] text-xs font-bold rounded-xl disabled:opacity-50">
            Remove Profile Picture
          </button>
        </div>
        <p className="text-[10px] text-[#81756e] mt-2">JPEG, PNG, or WebP only. Maximum file size: 2 MB.</p>
      </section>

      <section className="p-4 sm:p-5 bg-[#eee7e4] rounded-2xl border border-[#e8e1df]">
        <h4 className="font-serif text-sm sm:text-base font-bold text-[#26170c] mb-1.5">Current Admin Session</h4>
        <p className="text-xs text-[#4f453f] leading-relaxed">
          This protected session uses an HttpOnly cookie and expires automatically. Use Logout when leaving this device.
        </p>
      </section>
    </div>
  );
};
