import { AdminAccount, AdminPrincipal } from '../types';

class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body instanceof Blob ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new AdminApiError(data.error || 'The request could not be completed.', response.status);
  }
  return data;
}

export const adminAuthService = {
  async login(username: string, password: string): Promise<AdminPrincipal> {
    return api<AdminPrincipal>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async getSession(): Promise<AdminPrincipal | null> {
    try {
      return await api<AdminPrincipal>('/api/auth/me', { method: 'GET' });
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) return null;
      throw error;
    }
  },

  async logout(): Promise<void> {
    await api<{ authenticated: false }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async listAccounts(): Promise<AdminAccount[]> {
    const result = await api<{ accounts: AdminAccount[] }>('/api/admin/accounts', { method: 'GET' });
    return result.accounts;
  },

  async createAccount(input: {
    username: string;
    displayName: string;
    password: string;
    active: boolean;
  }): Promise<AdminAccount> {
    const result = await api<{ account: AdminAccount }>('/api/admin/accounts', {
      method: 'POST',
      body: JSON.stringify({ ...input, role: 'ADMIN' }),
    });
    return result.account;
  },

  async setAccountActive(id: string, active: boolean): Promise<void> {
    await api(`/api/admin/accounts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  },

  async resetAccountPassword(id: string, password: string): Promise<{ reauthenticationRequired: boolean }> {
    return api(`/api/admin/accounts/${encodeURIComponent(id)}/password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  async uploadProfilePicture(file: File): Promise<void> {
    await api('/api/auth/profile-picture', {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
  },

  async removeProfilePicture(): Promise<void> {
    await api('/api/auth/profile-picture', { method: 'DELETE', body: JSON.stringify({}) });
  },
};
