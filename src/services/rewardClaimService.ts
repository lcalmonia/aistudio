export interface RewardClaim {
  id: string;
  customerId: string;
  customerName: string;
  perkId: string;
  perkName: string;
  redemptionType: 'stamps' | 'points';
  redemptionCost: number;
  status: 'pending' | 'fulfilled' | 'rejected';
  requestedAt: string;
  fulfilledAt: string | null;
}

async function api<T>(init: RequestInit = {}): Promise<T> {
  const response = await fetch('/api/reward-claims', {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(data.error || 'Unable to process reward claim.');
  return data;
}

export const rewardClaimService = {
  async requestClaim(customerId: string, perkIdOrName: string): Promise<RewardClaim> {
    const response = await api<{ claim: RewardClaim }>({
      method: 'POST',
      body: JSON.stringify({ action: 'request', customerId, perkId: perkIdOrName, perkName: perkIdOrName }),
    });
    return response.claim;
  },
  async listPendingClaims(): Promise<RewardClaim[]> {
    const response = await api<{ claims: RewardClaim[] }>({ method: 'GET' });
    return response.claims || [];
  },
  async fulfillClaim(claimId: string): Promise<RewardClaim> {
    const response = await api<{ claim: RewardClaim }>({
      method: 'POST',
      body: JSON.stringify({ action: 'fulfill', claimId }),
    });
    return response.claim;
  },
  async rejectClaim(claimId: string): Promise<RewardClaim> {
    const response = await api<{ claim: RewardClaim }>({
      method: 'POST',
      body: JSON.stringify({ action: 'reject', claimId }),
    });
    return response.claim;
  },
};
