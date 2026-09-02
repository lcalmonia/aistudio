import { LoyaltyPerk, LoyaltySettings } from '../types';

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, { ...init, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Loyalty request failed.');
  return data as T;
};

export const loyaltyConfigService = {
  async get(): Promise<{ settings: LoyaltySettings; perks: LoyaltyPerk[] }> { return api('/api/loyalty-config'); },
  async saveSettings(settings: LoyaltySettings): Promise<{ settings: LoyaltySettings }> { return api('/api/loyalty-config', { method: 'POST', body: JSON.stringify({ action: 'save-settings', settings }) }); },
  async savePerk(perk: LoyaltyPerk): Promise<{ perk: LoyaltyPerk }> { return api('/api/loyalty-config', { method: 'POST', body: JSON.stringify({ action: 'save-perk', perk }) }); },
  async deletePerk(id: string): Promise<void> { await api('/api/loyalty-config', { method: 'POST', body: JSON.stringify({ action: 'delete-perk', id }) }); },
  async togglePerk(id: string): Promise<{ perk: LoyaltyPerk | null }> { return api('/api/loyalty-config', { method: 'POST', body: JSON.stringify({ action: 'toggle-perk', id }) }); },
};
