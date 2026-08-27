import { CustomerUser, StaffUser, UserRole } from '../types';
import { storageAdapter } from './storageAdapter';
import { customerService } from './customerService';

export interface CustomerAuthResult {
  success: boolean;
  customer?: CustomerUser;
  error?: string;
}

export interface StaffAuthResult {
  success: boolean;
  staff?: StaffUser;
  error?: string;
}

export const authService = {
  // -------------------------------------------------------------
  // Customer Authentication
  // -------------------------------------------------------------
  async registerCustomer(params: {
    name: string;
    email: string;
    mobile: string;
    password?: string;
    address: string;
  }): Promise<CustomerAuthResult> {
    const { name, email, mobile, password, address } = params;

    const res = await customerService.createCustomer({
      name,
      email,
      mobile,
      address,
    });

    if (!res.success || !res.customer) {
      return { success: false, error: res.error || 'Registration failed.' };
    }

    // Save temporary local development credentials (isolated from CustomerUser entity)
    if (password) {
      storageAdapter.setCustomerCredential(res.customer.id, password);
    }

    storageAdapter.setCurrentCustomer(res.customer);
    return { success: true, customer: res.customer };
  },

  async loginCustomer(identifier: string, password?: string): Promise<CustomerAuthResult> {
    const customers = storageAdapter.getCustomers();
    const cleanId = identifier.trim().toLowerCase();

    const customer = customers.find(
      (c) =>
        c.email.toLowerCase() === cleanId ||
        c.mobile.replace(/\D/g, '').endsWith(cleanId.replace(/\D/g, '')) ||
        c.id.toLowerCase() === cleanId
    );

    if (!customer) {
      return {
        success: false,
        error: 'Account not found. Please verify your email or phone number, or create an account.',
      };
    }

    if (customer.status === 'inactive') {
      return {
        success: false,
        error: 'This account has been deactivated. Please contact cafe support.',
      };
    }

    // Temporary local credential verification for development
    const storedCreds = storageAdapter.getCustomerCredentials();
    const storedPassword = storedCreds[customer.id];

    if (storedPassword && password && storedPassword !== password) {
      return {
        success: false,
        error: 'Incorrect password. Please verify your credentials.',
      };
    }

    storageAdapter.setCurrentCustomer(customer);
    return { success: true, customer };
  },

  logoutCustomer(): void {
    storageAdapter.setCurrentCustomer(null);
  },

  getCurrentCustomer(): CustomerUser | null {
    return storageAdapter.getCurrentCustomer();
  },

  updateCurrentCustomerSession(customer: CustomerUser | null): void {
    storageAdapter.setCurrentCustomer(customer);
  },

  // -------------------------------------------------------------
  // Staff & Admin Authentication
  // -------------------------------------------------------------
  async loginStaff(passcode: string, role: UserRole = 'staff'): Promise<StaffAuthResult> {
    const cleanPasscode = passcode.trim();
    if (!cleanPasscode) {
      return { success: false, error: 'Passcode is required to authenticate.' };
    }

    // In production, authentication will be handled securely by Netlify Functions
    // For local development, simulate authentication with a validated staff session:
    const staffSession: StaffUser = {
      id: `staff_${Date.now()}`,
      name: role === 'super_admin' ? 'Store Owner' : role === 'admin' ? 'Duty Manager' : 'Barista Staff',
      email: 'staff@iluvkeyks.ph',
      role,
      active: true,
      lastLogin: new Date().toISOString(),
    };

    storageAdapter.setStaffSession(staffSession);
    return { success: true, staff: staffSession };
  },

  setStaffAuthenticated(isAuth: boolean, role: UserRole = 'admin'): void {
    if (isAuth) {
      const staffSession: StaffUser = {
        id: `staff_${Date.now()}`,
        name: role === 'super_admin' ? 'Store Owner' : role === 'admin' ? 'Duty Manager' : 'Barista Staff',
        email: 'staff@iluvkeyks.ph',
        role,
        active: true,
        lastLogin: new Date().toISOString(),
      };
      storageAdapter.setStaffSession(staffSession);
    } else {
      storageAdapter.setStaffSession(null);
    }
  },

  logoutStaff(): void {
    storageAdapter.setStaffSession(null);
  },

  getCurrentStaff(): StaffUser | null {
    return storageAdapter.getStaffSession();
  },

  isStaffAuthenticated(): boolean {
    return storageAdapter.getStaffSession() !== null;
  },
};
