import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import {
  type AuthenticatedAdmin,
  canChangeAdminAccountStatus,
  canResetAdminAccountPassword,
  canViewAdminAccount,
  enforceAdminCreationRole,
  publicAdmin,
  verifySuperAdminCredentials,
} from '../netlify/functions/_shared/auth.mts';
import { RequestError } from '../netlify/functions/_shared/http.mts';
import { hashPassword, verifyPassword } from '../netlify/functions/_shared/password.mts';

describe('Phase A-1: Admin & Super Admin Role Foundation Audit & Security', () => {
  const mockSuperAdmin: AuthenticatedAdmin = {
    authenticated: true,
    userId: null,
    role: 'SUPER_ADMIN',
    username: 'superadmin',
    displayName: 'Super Admin',
    hasProfilePicture: false,
    isSuperAdmin: true,
    isAdmin: false,
    sessionId: 'session_super_123',
  };

  const mockAdmin: AuthenticatedAdmin = {
    authenticated: true,
    userId: 'staff_admin_456',
    role: 'ADMIN',
    username: 'manager_john',
    displayName: 'John Doe',
    hasProfilePicture: false,
    isSuperAdmin: false,
    isAdmin: true,
    sessionId: 'session_admin_456',
  };

  it('1. Existing Super Admin authentication credential verification works', () => {
    const origUser = process.env.SUPER_ADMIN_USERNAME;
    const origPass = process.env.SUPER_ADMIN_PASSWORD;
    process.env.SUPER_ADMIN_USERNAME = 'super_owner';
    process.env.SUPER_ADMIN_PASSWORD = 'very_secure_password_123';

    try {
      assert.equal(verifySuperAdminCredentials('super_owner', 'very_secure_password_123'), true);
      assert.equal(verifySuperAdminCredentials('super_owner', 'wrong_pass'), false);
      assert.equal(verifySuperAdminCredentials('wrong_user', 'very_secure_password_123'), false);
    } finally {
      if (origUser === undefined) delete process.env.SUPER_ADMIN_USERNAME;
      else process.env.SUPER_ADMIN_USERNAME = origUser;
      if (origPass === undefined) delete process.env.SUPER_ADMIN_PASSWORD;
      else process.env.SUPER_ADMIN_PASSWORD = origPass;
    }
  });

  it('2. Existing Admin password authentication works via salted scrypt hashes', async () => {
    const rawPassword = 'AdminSecretPassword!2026';
    const hashedPassword = await hashPassword(rawPassword);

    assert.equal(await verifyPassword(rawPassword, hashedPassword), true);
    assert.equal(await verifyPassword('WrongAdminPassword', hashedPassword), false);
  });

  it('3. Authenticated Super Admin is correctly identified with role and flags', () => {
    assert.equal(mockSuperAdmin.authenticated, true);
    assert.equal(mockSuperAdmin.role, 'SUPER_ADMIN');
    assert.equal(mockSuperAdmin.isSuperAdmin, true);
    assert.equal(mockSuperAdmin.isAdmin, false);
    assert.equal(mockSuperAdmin.userId, null);

    const publicShape = publicAdmin(mockSuperAdmin);
    assert.equal(publicShape.role, 'SUPER_ADMIN');
    assert.equal(publicShape.userId, null);
    assert.equal(publicShape.username, 'superadmin');
  });

  it('4. Authenticated Admin is correctly identified with role, flags, and staff user ID', () => {
    assert.equal(mockAdmin.authenticated, true);
    assert.equal(mockAdmin.role, 'ADMIN');
    assert.equal(mockAdmin.isSuperAdmin, false);
    assert.equal(mockAdmin.isAdmin, true);
    assert.equal(mockAdmin.userId, 'staff_admin_456');

    const publicShape = publicAdmin(mockAdmin);
    assert.equal(publicShape.role, 'ADMIN');
    assert.equal(publicShape.userId, 'staff_admin_456');
    assert.equal(publicShape.username, 'manager_john');
  });

  it('5. Client-side role manipulation cannot elevate Admin to Super Admin', () => {
    // Admin actor cannot create accounts (throws RequestError 403)
    assert.throws(() => {
      enforceAdminCreationRole(mockAdmin, 'ADMIN');
    }, (err: unknown) => {
      return err instanceof RequestError && err.status === 403;
    });

    assert.throws(() => {
      enforceAdminCreationRole(mockAdmin, 'SUPER_ADMIN');
    }, (err: unknown) => {
      return err instanceof RequestError && err.status === 403;
    });

    // Super Admin can create ADMIN or SUPER_ADMIN
    assert.equal(enforceAdminCreationRole(mockSuperAdmin, 'ADMIN'), 'ADMIN');
    assert.equal(enforceAdminCreationRole(mockSuperAdmin, 'SUPER_ADMIN'), 'SUPER_ADMIN');
    assert.equal(enforceAdminCreationRole(mockSuperAdmin, undefined), 'ADMIN');
  });

  it('6. Admin cannot modify their own status or manage accounts outside authorization hierarchy', () => {
    // Admin cannot change their own status
    assert.equal(canChangeAdminAccountStatus(mockAdmin, mockAdmin.userId!, null), false);

    // Super Admin has full authority over all admin accounts
    assert.equal(canChangeAdminAccountStatus(mockSuperAdmin, 'any_account_id', null), true);
    assert.equal(canResetAdminAccountPassword(mockSuperAdmin, 'any_account_id', null), true);
    assert.equal(canViewAdminAccount(mockSuperAdmin, 'any_account_id', null), true);

    // Admin can only view accounts they created or their own
    const childAccountId = 'child_admin_789';
    const unrelatedAccountId = 'unrelated_admin_999';
    assert.equal(canViewAdminAccount(mockAdmin, childAccountId, mockAdmin.userId), true);
    assert.equal(canViewAdminAccount(mockAdmin, unrelatedAccountId, 'different_admin'), false);
  });
});
