import React, { useState, useRef, useEffect } from 'react';
import { StoreSettings } from '../types';

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings) => Promise<boolean | void> | void;
  onResetSettings?: () => Promise<StoreSettings | void> | void;
  onShowNotification: (msg: string) => void;
  onSwitchToCustomerPortal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetSettings,
  onShowNotification,
  onSwitchToCustomerPortal,
}) => {
  const [formData, setFormData] = useState<StoreSettings>(() => ({ ...settings }));
  const [baseSettings, setBaseSettings] = useState<StoreSettings>(() => ({ ...settings }));
  const [activeTab, setActiveTab] = useState<'branding' | 'location' | 'ordering' | 'preview'>('branding');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if any fields were actually modified compared to saved base settings
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(baseSettings);

  const handleInputChange = (field: keyof StoreSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowNotification('Please upload an image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onShowNotification('File is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Url = event.target.result as string;
        handleInputChange('logoUrl', base64Url);
        onShowNotification('Store logo loaded! Click Save to apply live. ☕✨');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleInputChange('logoUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onShowNotification('Logo cleared. Click Save to apply.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || isSaving) return;

    if (!formData.storeName.trim()) {
      onShowNotification('Store Name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveSettings(formData);
      // Upon successful save, update baseSettings to clear dirty state
      setBaseSettings({ ...formData });
    } catch (err) {
      console.error('[SettingsView] Error persisting settings:', err);
      // Keep formData intact - unsaved edits are never lost
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all store settings to original defaults?')) {
      if (onResetSettings) {
        try {
          const resetRes = await onResetSettings();
          if (resetRes) {
            setFormData({ ...resetRes });
            setBaseSettings({ ...resetRes });
          }
        } catch (err) {
          console.error('[SettingsView] Reset error:', err);
        }
      } else {
        setFormData({ ...baseSettings });
      }
    }
  };

  return (
    <div className="pt-20 px-3 sm:px-5 max-w-3xl mx-auto pb-28">
      {/* Header Bar - Compact & Clean */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#dec1af]/40">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-[#26170c] text-white text-[9px] font-bold rounded">
                ADMIN
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#26170c] tracking-tight leading-tight">
                Store & Branding Settings
              </h2>
            </div>
            <p className="text-[11px] text-[#6e635d] mt-0.5">
              Manage store name, logo, branch details, and receipt info.
            </p>
          </div>

          {onSwitchToCustomerPortal && (
            <button
              type="button"
              onClick={onSwitchToCustomerPortal}
              className="px-2.5 py-1.5 bg-[#f3ecea] hover:bg-[#e1e1c9] text-[#26170c] text-[11px] font-bold rounded-xl border border-[#dec1af]/60 transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
              title="Preview changes in Customer Storefront"
            >
              <span className="material-symbols-outlined text-[15px] text-[#636451]">visibility</span>
              <span className="hidden xs:inline">Customer Portal</span>
            </button>
          )}
        </div>

        {/* Segmented Sub-Tabs */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'branding'
                ? 'bg-[#26170c] text-white shadow-xs'
                : 'bg-[#f3ecea] text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">store</span>
            <span>Branding & Logo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'location'
                ? 'bg-[#26170c] text-white shadow-xs'
                : 'bg-[#f3ecea] text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">location_on</span>
            <span>Branch & Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ordering')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ordering'
                ? 'bg-[#26170c] text-white shadow-xs'
                : 'bg-[#f3ecea] text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">receipt_long</span>
            <span>Receipt & Wi-Fi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-[#26170c] text-white shadow-xs'
                : 'bg-[#f3ecea] text-[#4f453f] hover:bg-[#e8e1df]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">devices</span>
            <span>Live Mockup</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* ========================================================================= */}
        {/* TAB 1: BRANDING & LOGO                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'branding' && (
          <div className="space-y-3">
            {/* Store Name & Tagline Card */}
            <div className="bg-[#f9f2f0] p-3.5 sm:p-4 rounded-2xl border border-[#f3ecea]">
              <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-[#dec1af]/40">
                <span className="material-symbols-outlined text-[18px] text-[#26170c]">edit_note</span>
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#26170c]">
                  Store Identity
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                    Store Name <span className="text-[#8b2616]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.storeName}
                    onChange={(e) => handleInputChange('storeName', e.target.value)}
                    placeholder="e.g. iLuvKeyks Coffee & Tea"
                    className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm font-bold text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                  />
                  <p className="text-[10px] text-[#81756e] mt-0.5">
                    Shown on header, receipts, and order statuses.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    placeholder="e.g. Coffee, Tea & Tub Cakes"
                    className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                  />
                  <p className="text-[10px] text-[#81756e] mt-0.5">
                    Shown underneath store name in customer portal.
                  </p>
                </div>
              </div>
            </div>

            {/* Logo Upload & Customizer Card (No Presets) */}
            <div className="bg-[#f9f2f0] p-3.5 sm:p-4 rounded-2xl border border-[#f3ecea]">
              <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-[#dec1af]/40">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#26170c]">photo_camera</span>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#26170c]">
                    Store Logo
                  </h3>
                </div>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-[11px] text-[#8b2616] hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete</span>
                    Remove Logo
                  </button>
                )}
              </div>

              {/* Logo Preview & Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5">
                {/* Logo Box */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="relative">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Store Logo"
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#dec1af] shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#26170c] text-white flex flex-col items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[28px] text-[#dec1af]">
                          local_cafe
                        </span>
                        <span className="text-[8px] font-bold text-[#dec1af] mt-0.5 uppercase">
                          Default
                        </span>
                      </div>
                    )}
                    {formData.logoUrl && (
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#8fbc8f] text-white text-[8px] font-extrabold rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Upload Buttons & URL Input */}
                <div className="flex-1 w-full space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="store-logo-file-input"
                  />

                  <div>
                    <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                      Upload Logo Image
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#dec1af]">
                          cloud_upload
                        </span>
                        <span>Choose File...</span>
                      </button>

                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-2.5 py-1.5 bg-[#f3ecea] hover:bg-[#e8e1df] text-[#8b2616] text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#26170c] mb-0.5">
                      Or Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.logoUrl.startsWith('data:') ? '' : formData.logoUrl}
                      onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                      placeholder="https://example.com/cafe-logo.png"
                      className="w-full px-3 py-1.5 bg-white border border-[#dec1af] rounded-xl text-xs text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BRANCH & CONTACT                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'location' && (
          <div className="bg-[#f9f2f0] p-3.5 sm:p-4 rounded-2xl border border-[#f3ecea] space-y-2.5">
            <div className="flex items-center gap-1.5 mb-1 pb-1.5 border-b border-[#dec1af]/40">
              <span className="material-symbols-outlined text-[18px] text-[#26170c]">pin_drop</span>
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#26170c]">
                Branch & Contact Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                  Branch / Outlet Name
                </label>
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => handleInputChange('branchName', e.target.value)}
                  placeholder="e.g. Main St. Live, Manila"
                  className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm font-semibold text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+63 (917) 823-4567"
                  className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                  Physical Store Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="e.g. 128 Mahogany Ave, Sampaloc, Manila"
                  className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="orders@iluvkeyks.ph"
                  className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                  Social Handle (IG / FB)
                </label>
                <input
                  type="text"
                  value={formData.socialIg}
                  onChange={(e) => handleInputChange('socialIg', e.target.value)}
                  placeholder="@iluvkeyks.ph"
                  className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: RECEIPT & WI-FI                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'ordering' && (
          <div className="space-y-3">
            <div className="bg-[#f9f2f0] p-3.5 sm:p-4 rounded-2xl border border-[#f3ecea]">
              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-[#dec1af]/40">
                <span className="material-symbols-outlined text-[18px] text-[#26170c]">schedule</span>
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#26170c]">
                  Hours & Delivery Fees
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={formData.openHours}
                    onChange={(e) => handleInputChange('openHours', e.target.value)}
                    placeholder="7:00 AM - 10:00 PM Daily"
                    className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                    Delivery Fee (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.deliveryFee}
                    onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                    placeholder="49"
                    className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm font-bold text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                    Free Delivery Threshold (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formData.freeDeliveryThreshold}
                    onChange={(e) => handleInputChange('freeDeliveryThreshold', parseFloat(e.target.value) || 0)}
                    placeholder="500"
                    className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm font-bold text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                  />
                </div>
              </div>
            </div>

            {/* Guest Wi-Fi & Receipt Footer */}
            <div className="bg-[#f9f2f0] p-3.5 sm:p-4 rounded-2xl border border-[#f3ecea]">
              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-[#dec1af]/40">
                <span className="material-symbols-outlined text-[18px] text-[#26170c]">wifi</span>
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#26170c]">
                  Guest Wi-Fi & Receipt Footer
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                    Guest Wi-Fi Network (SSID)
                  </label>
                  <input
                    type="text"
                    value={formData.wifiSsid}
                    onChange={(e) => handleInputChange('wifiSsid', e.target.value)}
                    placeholder="e.g. CafeGuest_5G"
                    className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                    Wi-Fi Password
                  </label>
                  <input
                    type="text"
                    value={formData.wifiPassword}
                    onChange={(e) => handleInputChange('wifiPassword', e.target.value)}
                    placeholder="e.g. coffeeandcakes"
                    className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#26170c] mb-1">
                  Receipt Footer Message
                </label>
                <textarea
                  rows={2}
                  value={formData.receiptFooter}
                  onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                  placeholder="Thank you for supporting your local cafe! Tag us on IG @iluvkeyks.ph"
                  className="w-full px-3 py-2 bg-white border border-[#dec1af] rounded-xl text-xs sm:text-sm text-[#26170c] focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LIVE BRAND SIMULATOR                                               */}
        {/* ========================================================================= */}
        {activeTab === 'preview' && (
          <div className="bg-[#f9f2f0] p-3.5 sm:p-4 rounded-2xl border border-[#f3ecea] space-y-3">
            <div className="flex items-center gap-1.5 mb-1 pb-1.5 border-b border-[#dec1af]/40">
              <span className="material-symbols-outlined text-[18px] text-[#26170c]">preview</span>
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#26170c]">
                Live Storefront Brand Mockup
              </h3>
            </div>

            {/* Customer Header Simulator */}
            <div>
              <span className="text-[11px] font-bold text-[#81756e] block mb-1.5">
                Customer Header Preview:
              </span>
              <div className="p-3 bg-[#fff8f5] border border-[#dec1af] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="w-8 h-8 rounded-xl object-cover border border-[#dec1af]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-[#26170c] text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] text-[#dec1af]">
                        local_cafe
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#26170c] leading-none">
                      {formData.storeName || 'iLuvKeyks'}
                    </h4>
                    <p className="text-[10px] text-[#6e635d] mt-0.5">
                      {formData.tagline || 'Coffee, Tea & Tub Cakes'}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-[#26170c] text-white text-[10px] font-bold rounded-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">shopping_bag</span>
                  <span>Bag (2)</span>
                </span>
              </div>
            </div>

            {/* Digital Receipt Stamp */}
            <div>
              <span className="text-[11px] font-bold text-[#81756e] block mb-1.5">
                Digital Receipt Stamp:
              </span>
              <div className="max-w-xs mx-auto p-3 bg-white border border-[#dec1af] rounded-xl font-mono text-xs text-[#26170c] text-center space-y-1.5 shadow-xs">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Receipt Logo"
                    className="w-10 h-10 rounded-full object-cover mx-auto border border-[#dec1af]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#26170c] text-white flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[16px]">receipt</span>
                  </div>
                )}
                <p className="font-bold text-xs">{formData.storeName.toUpperCase()}</p>
                <p className="text-[10px] text-[#81756e]">{formData.branchName || 'Manila'}</p>
                <div className="border-t border-dashed border-[#dec1af] pt-1">
                  <p className="text-[10px] font-bold">TOTAL: ₱385.00 (PAID GCASH)</p>
                </div>
                {formData.wifiSsid && (
                  <p className="text-[9px] text-[#4f453f] bg-[#f9f2f0] py-0.5 rounded">
                    📶 Wi-Fi: {formData.wifiSsid} / {formData.wifiPassword}
                  </p>
                )}
                <p className="text-[9px] text-[#81756e] italic">
                  "{formData.receiptFooter}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NON-FLOATING BOTTOM ACTION BAR                                            */}
        {/* Placed in standard document flow at the bottom - never floating           */}
        {/* ========================================================================= */}
        <div className="mt-4 bg-[#26170c] text-white p-3 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 border border-[#dec1af]/30 shadow-sm">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                hasChanges ? 'bg-[#ffb74d] animate-pulse' : 'bg-[#8fbc8f]'
              }`}
            ></span>
            <p className="text-xs font-semibold text-[#dec1af]">
              {hasChanges ? 'You have unsaved changes' : 'All changes are saved & active live!'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Reset Defaults
            </button>

            <button
              type="submit"
              disabled={!hasChanges || isSaving}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                hasChanges && !isSaving
                  ? 'bg-[#8fbc8f] hover:bg-[#7ea67e] text-[#1c331c] shadow-sm active:scale-95 cursor-pointer'
                  : 'bg-[#4f453f]/60 text-[#a89f99] opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isSaving ? 'sync' : hasChanges ? 'check_circle' : 'done'}
              </span>
              <span>{isSaving ? 'Saving & Applying...' : 'Save & Apply Live'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
