import { CustomerUser } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateCustomerId } from './idGenerator';

class CustomerApiError extends Error {
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
    throw new CustomerApiError(data.error || 'The customer request could not be completed.', response.status);
  }
  return data;
}

export const customerService = {
  async listCustomers(): Promise<CustomerUser[]> {
    return storageAdapter.getCustomers();
  },

  /** Fetch the authoritative customer directory from the shared database. */
  async listCustomersFromServer(): Promise<CustomerUser[]> {
    const response = await api<{ customers: CustomerUser[] }>('/api/customers', { method: 'GET' });
    if (!response || !Array.isArray(response.customers)) {
      throw new CustomerApiError('Invalid customer directory response.');
    }
    return response.customers;
  },

  async getCustomer(id: string): Promise<CustomerUser | null> {
    const customers = storageAdapter.getCustomers();
    return customers.find((c) => c.id === id) || null;
  },

  async createCustomer(data: {
    name: string;
    email: string;
    mobile: string;
    address: string;
  }): Promise<{ success: boolean; customer?: CustomerUser; error?: string }> {
    const customers = storageAdapter.getCustomers();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanMobile = data.mobile.trim();

    const existingEmail = customers.find((c) => c.email.toLowerCase() === cleanEmail);
    if (existingEmail) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' };
    }

    const newCustomer: CustomerUser = {
      id: generateCustomerId(),
      name: data.name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      address: data.address.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      role: 'customer',
      stamps: 1,
      points: 50,
    };

    try {
      const response = await api<{ customer: CustomerUser }>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(newCustomer),
      });

      if (!response?.customer) {
        return { success: false, error: 'Registration failed.' };
      }

      const savedCustomer = response.customer;
      const updated = [savedCustomer, ...customers.filter((c) => c.id !== savedCustomer.id)];
      storageAdapter.setCustomers(updated);
      return { success: true, customer: savedCustomer };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      return { success: false, error: message };
    }
  },

  async updateCustomer(
    id: string,
    updates: Partial<CustomerUser>
  ): Promise<{ success: boolean; customer?: CustomerUser; error?: string }> {
    const customers = storageAdapter.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: 'Customer not found.' };
    }

    const updatedCustomer = {
      ...customers[index],
      ...updates,
    };

    customers[index] = updatedCustomer;
    storageAdapter.setCustomers(customers);

    const current = storageAdapter.getCurrentCustomer();
    if (current && current.id === id) {
      storageAdapter.setCurrentCustomer(updatedCustomer);
    }

    return { success: true, customer: updatedCustomer };
  },

  async deactivateCustomer(id: string): Promise<{ success: boolean; error?: string }> {
    const customers = storageAdapter.getCustomers();
    const updated = customers.map((c) => (c.id === id ? { ...c, status: 'inactive' as const } : c));
    storageAdapter.setCustomers(updated);
    return { success: true };
  },

  async saveCustomers(customers: CustomerUser[]): Promise<CustomerUser[]> {
    storageAdapter.setCustomers(customers);
    return customers;
  },
};
