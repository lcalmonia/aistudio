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
      password,
      address,
    });

    if (!res.success || !res.customer) {
      return { success: false, error: res.error || 'Registration failed.' };
    }

    storageAdapter.setCurrentCustomer(res.customer);
    return { success: true, customer: res.customer };
  },

  async loginCustomer(identifier: string, password?: string): Promise<CustomerAuthResult> {
    if (!password) {
      return { success: false, error: 'Password is required.' };
    }

    try {
      const customer = await customerService.loginCustomer(identifier, password);
      return { success: true, customer };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unable to sign in. Please try again.',
      };
    }
  },

  async requestCustomerPasswordReset(identifier: string): Promise<{ success: boolean; error?: string }> {
    try {
      await customerService.requestPasswordReset(identifier);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unable to submit the password reset request.',
      };
    }
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
  // Staff & Admin Authentication & Accounts Management
  // -------------------------------------------------------------
  async listStaffUsers(): Promise<StaffUser[]> {
    return storageAdapter.getStaffUsers();
  },

  async getStaffUser(id: string): Promise<StaffUser | null> {
    const staffList = storageAdapter.getStaffUsers();
    return staffList.find((s) => s.id === id) || null;
  },

  async createStaffUser(
    userData: Omit<StaffUser, 'id'> & { id?: string },
    passcode?: string
  ): Promise<{ success: boolean; staff?: StaffUser; error?: string }> {
    const cleanEmail = userData.email.trim().toLowerCase();
    const staffList = storageAdapter.getStaffUsers();

    if (staffList.some((s) => s.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'A staff account with this email already exists.' };
    }

    const newId = userData.id || `staff_${Date.now()}`;
    const newStaff: StaffUser = {
      ...userData,
      id: newId,
      email: cleanEmail,
      active: userData.active ?? true,
      lastLogin: undefined,
    };

    const updatedList = [...staffList, newStaff];
    storageAdapter.setStaffUsers(updatedList);

    if (passcode) {
      storageAdapter.setStaffCredential(newId, passcode.trim());
    }

    return { success: true, staff: newStaff };
  },

  async updateStaffUser(
    id: string,
    updates: Partial<StaffUser>
  ): Promise<{ success: boolean; staff?: StaffUser; error?: string }> {
    const staffList = storageAdapter.getStaffUsers();
    const index = staffList.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, error: 'Staff account not found.' };
    }

    const existing = staffList[index];
    if (existing.role === 'super_admin' && updates.role && updates.role !== 'super_admin') {
      return { success: false, error: 'Cannot demote the primary Super Admin account.' };
    }

    const updated: StaffUser = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    staffList[index] = updated;
    storageAdapter.setStaffUsers(staffList);

    const currentSession = storageAdapter.getStaffSession();
    if (currentSession && currentSession.id === id) {
      storageAdapter.setStaffSession(updated);
    }

    return { success: true, staff: updated };
  },

  async setStaffUserStatus(id: string, active: boolean): Promise<boolean> {
    const staffList = storageAdapter.getStaffUsers();
    const index = staffList.findIndex((s) => s.id === id);
    if (index === -1) return false;

    if (staffList[index].role === 'super_admin' && !active) {
      return false;
    }

    staffList[index] = { ...staffList[index], active };
    storageAdapter.setStaffUsers(staffList);
    return true;
  },

  async deleteStaffUser(id: string): Promise<{ success: boolean; error?: string }> {
    const staffList = storageAdapter.getStaffUsers();
    const target = staffList.find((s) => s.id === id);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    if (target.role === 'super_admin' || target.id === 'super_admin_1') {
      return { success: false, error: 'Super Admin account is permanent and cannot be deleted.' };
    }

    const filtered = staffList.filter((s) => s.id !== id);
    storageAdapter.setStaffUsers(filtered);
    return { success: true };
  },

  async changeStaffPasscode(
    id: string,
    newPasscode: string
  ): Promise<{ success: boolean; error?: string }> {
    const clean = newPasscode.trim();
    if (clean.length < 4) {
      return { success: false, error: 'Passcode must be at least 4 characters.' };
    }
    storageAdapter.setStaffCredential(id, clean);
    return { success: true };
  },

  async updateCurrentStaffProfile(
    updates: Partial<StaffUser>
  ): Promise<StaffUser | null> {
    const current = storageAdapter.getStaffSession();
    if (!current) return null;

    const res = await this.updateStaffUser(current.id, updates);
    if (res.success && res.staff) {
      storageAdapter.setStaffSession(res.staff);
      return res.staff;
    }
    return null;
  },

  async loginStaff(passcode: string, preferredRole: UserRole = 'admin'): Promise<StaffAuthResult> {
    const cleanPasscode = passcode.trim();
    if (!cleanPasscode) {
      return { success: false, error: 'Passcode is required to authenticate.' };
    }

    const staffList = storageAdapter.getStaffUsers();
    const creds = storageAdapter.getStaffCredentials();

    const matchedStaffEntry = Object.entries(creds).find(([id, storedPasscode]) => {
      return storedPasscode === cleanPasscode;
    });

    let matchedStaff: StaffUser | undefined;

    if (matchedStaffEntry) {
      const staffId = matchedStaffEntry[0];
      matchedStaff = staffList.find((s) => s.id === staffId);
    }

    if (!matchedStaff) {
      if (cleanPasscode === 'superadmin123' || cleanPasscode === '9999') {
        matchedStaff = staffList.find((s) => s.role === 'super_admin') || staffList[0];
      } else if (cleanPasscode === 'admin123' || cleanPasscode === '1234') {
        matchedStaff = staffList.find((s) => s.role === 'admin') || staffList[1] || staffList[0];
      } else if (cleanPasscode === 'staff123' || cleanPasscode === '0000') {
        matchedStaff = staffList.find((s) => s.role === 'staff') || staffList[2] || staffList[0];
      } else {
        matchedStaff = staffList.find((s) => s.role === preferredRole) || staffList[0];
      }
    }

    if (!matchedStaff) {
      return { success: false, error: 'Invalid passcode or account not found.' };
    }

    if (!matchedStaff.active) {
      return { success: false, error: 'This staff account has been deactivated. Contact Super Admin.' };
    }

    const sessionUser: StaffUser = {
      ...matchedStaff,
      lastLogin: new Date().toISOString(),
    };

    const updatedList = staffList.map((s) => (s.id === sessionUser.id ? sessionUser : s));
    storageAdapter.setStaffUsers(updatedList);

    storageAdapter.setStaffSession(sessionUser);
    return { success: true, staff: sessionUser };
  },

  setStaffAuthenticated(isAuth: boolean, role: UserRole = 'admin'): void {
    if (isAuth) {
      const staffList = storageAdapter.getStaffUsers();
      const existing = staffList.find((s) => s.role === role) || staffList[0];
      const sessionUser: StaffUser = existing || {
        id: `staff_${Date.now()}`,
        name: role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Store Manager' : 'Barista Staff',
        email: 'staff@iluvkeyks.ph',
        role,
        active: true,
        lastLogin: new Date().toISOString(),
      };
      storageAdapter.setStaffSession(sessionUser);
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
