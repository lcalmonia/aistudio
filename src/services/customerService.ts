import { CustomerUser } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateCustomerId } from './idGenerator';

export const customerService = {
  async listCustomers(): Promise<CustomerUser[]> {
    return storageAdapter.getCustomers();
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
      stamps: 1, // Welcome gift stamp
      points: 50, // Welcome bonus points
    };

    const updated = [newCustomer, ...customers];
    storageAdapter.setCustomers(updated);
    return { success: true, customer: newCustomer };
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

    // If updating current active customer, sync current session
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
