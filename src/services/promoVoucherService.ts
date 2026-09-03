export interface PromoVoucher {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Promo voucher request failed.');
  return data as T;
};

export const promoVoucherService = {
  async listActive(): Promise<PromoVoucher[]> {
    const data = await api<{ vouchers: PromoVoucher[] }>('/api/promo-vouchers');
    return data.vouchers || [];
  },
  async create(payload: Omit<PromoVoucher, 'id' | 'usedCount' | 'createdAt' | 'updatedAt' | 'active'> & { active?: boolean }): Promise<PromoVoucher> {
    const data = await api<{ voucher: PromoVoucher }>('/api/promo-vouchers', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', ...payload }),
    });
    return data.voucher;
  },
  async toggle(id: string): Promise<PromoVoucher> {
    const data = await api<{ voucher: PromoVoucher }>('/api/promo-vouchers', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle', id }),
    });
    return data.voucher;
  },
  async remove(id: string): Promise<void> {
    await api('/api/promo-vouchers', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id }),
    });
  },
  async validate(code: string, subtotal: number): Promise<{ voucher: PromoVoucher; discount: number }> {
    const data = await api<{ voucher: PromoVoucher; discount: number }>('/api/promo-vouchers', {
      method: 'POST',
      body: JSON.stringify({ action: 'validate', code, subtotal }),
    });
    return data;
  },
};
