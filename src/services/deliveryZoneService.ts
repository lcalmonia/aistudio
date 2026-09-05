export interface DeliveryZone {
  id: string;
  name: string;
  keywords: string[];
  deliveryFee: number;
  freeDeliveryThreshold: number;
  priority: number;
  active: boolean;
}

export interface DeliveryPolicy {
  fee: number;
  freeDeliveryThreshold: number;
  zone: DeliveryZone | null;
  matchedKeyword: string | null;
}

export class DeliveryZoneApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'DeliveryZoneApiError';
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new DeliveryZoneApiError(data.error || 'Delivery-zone request failed.', response.status);
  return data;
}

export const deliveryZoneService = {
  async list(): Promise<DeliveryZone[]> {
    const response = await api<{ zones: DeliveryZone[] }>('/api/delivery-zones', { method: 'GET' });
    return Array.isArray(response.zones) ? response.zones : [];
  },

  async resolve(address: string, subtotal: number): Promise<DeliveryPolicy | null> {
    const params = new URLSearchParams({ address, subtotal: String(subtotal) });
    const response = await api<{ policy: DeliveryPolicy | null }>(`/api/delivery-zones?${params.toString()}`, { method: 'GET' });
    return response.policy || null;
  },

  async save(zones: DeliveryZone[]): Promise<DeliveryZone[]> {
    const response = await api<{ zones: DeliveryZone[] }>('/api/delivery-zones', {
      method: 'PUT',
      body: JSON.stringify({ zones }),
    });
    return response.zones || [];
  },

  async reset(): Promise<DeliveryZone[]> {
    const response = await api<{ zones: DeliveryZone[] }>('/api/delivery-zones', {
      method: 'POST',
      body: JSON.stringify({ action: 'reset' }),
    });
    return response.zones || [];
  },
};
