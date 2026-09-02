class StatsResetApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new StatsResetApiError(data.error || 'The stats reset request could not be completed.', response.status);
  }
  return data;
}

export const statsResetService = {
  async getResetAt(): Promise<string | null> {
    const response = await api<{ resetAt?: string }>('/api/stats-reset', { method: 'GET' });
    return response.resetAt || null;
  },

  async reset(): Promise<string> {
    const response = await api<{ resetAt: string }>('/api/stats-reset', { method: 'POST' });
    if (!response.resetAt) throw new StatsResetApiError('The stats reset time was not returned by the server.');
    return response.resetAt;
  },
};
