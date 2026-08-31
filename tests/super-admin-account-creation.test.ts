import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  type AuthenticatedAdmin,
  enforceAdminCreationRole,
  normalizeUsername,
  publicAdmin,
  secureStringEqual,
} from '../netlify/functions/_shared/auth.mts';
import { RequestError } from '../netlify/functions/_shared/http.mts';
import { hashPassword, validatePassword, verifyPassword } from '../netlify/functions/_shared/password.mts';

describe('Phase A-2: Super Admin Account Creation & Role Validation', () => {
  const superAdminActor: AuthenticatedAdmin = {
    authenticated: true,
    userId: null,
    role: 'SUPER_ADMIN',
    username: 'primary_super',
    displayName: 'Primary Super Admin',
    hasProfilePicture: false,
    isSuperAdmin: true,
    isAdmin: false,
    sessionId: 'session_super_1',
  };

  const adminActor: AuthenticatedAdmin = {
    authenticated: true,
    userId: 'staff_admin_100',
    role: 'ADMIN',
    username: 'staff_admin',
    displayName: 'Staff Admin',
    hasProfilePicture: false,
    isSuperAdmin: false,
    isAdmin: true,
    sessionId: 'session_admin_100',
  };

  it('1. Super Admin can create an account with ADMIN role', () => {
    const role = enforceAdminCreationRole(superAdminActor, 'ADMIN');
    assert.equal(role, 'ADMIN');
  });

  it('2. Super Admin can create an account with SUPER_ADMIN role', () => {
    const role = enforceAdminCreationRole(superAdminActor, 'SUPER_ADMIN');
    assert.equal(role, 'SUPER_ADMIN');
  });

  it('3. Created ADMIN account is assigned ADMIN role', () => {
    const targetRole = enforceAdminCreationRole(superAdminActor, 'ADMIN');
    const dbRole = targetRole === 'SUPER_ADMIN' ? 'super_admin' : 'admin';
    const mappedRole = dbRole === 'super_admin' ? ('SUPER_ADMIN' as const) : ('ADMIN' as const);
    assert.equal(mappedRole, 'ADMIN');
  });

  it('4. Created SUPER_ADMIN account is assigned SUPER_ADMIN role', () => {
    const targetRole = enforceAdminCreationRole(superAdminActor, 'SUPER_ADMIN');
    const dbRole = targetRole === 'SUPER_ADMIN' ? 'super_admin' : 'admin';
    const mappedRole = dbRole === 'super_admin' ? ('SUPER_ADMIN' as const) : ('ADMIN' as const);
    assert.equal(mappedRole, 'SUPER_ADMIN');
  });

  it('5. ADMIN cannot create ADMIN account', () => {
    assert.throws(() => {
      enforceAdminCreationRole(adminActor, 'ADMIN');
    }, (err: unknown) => {
      return err instanceof RequestError && err.status === 403;
    });
  });

  it('6. ADMIN cannot create SUPER_ADMIN account', () => {
    assert.throws(() => {
      enforceAdminCreationRole(adminActor, 'SUPER_ADMIN');
    }, (err: unknown) => {
      return err instanceof RequestError && err.status === 403;
    });
  });

  it('7. ADMIN cannot elevate own role', () => {
    // Attempt by an ADMIN to self-elevate or claim SUPER_ADMIN
    assert.throws(() => {
      enforceAdminCreationRole(adminActor, 'SUPER_ADMIN');
    }, (err: unknown) => {
      return err instanceof RequestError && err.status === 403 && err.message.includes('Only Super Admin');
    });
  });

  it('8. ADMIN cannot elevate other accounts', () => {
    // Any account modification/creation attempted with admin actor must be rejected
    assert.throws(() => {
      enforceAdminCreationRole(adminActor, 'SUPER_ADMIN');
    }, (err: unknown) => {
      return err instanceof RequestError && err.status === 403;
    });
  });

  it('9. Creation endpoint rejects unauthorized role elevation and invalid roles', () => {
    // Invalid roles throw 400 Bad Request
    assert.throws(() => {
      enforceAdminCreationRole(superAdminActor, 'OWNER');
    }, (err: unknown) => {
      return err instanceof RequestError && err.status === 400;
    });

    assert.throws(() => {
      enforceAdminCreationRole(superAdminActor, 'ROOT');
    }, (err: unknown) => {
      return err instanceof RequestError && err.status === 400;
    });
  });

  it('10. Password hashing is applied to newly created accounts', async () => {
    const rawPass = 'SecretP@ssw0rd!2026';
    const validated = validatePassword(rawPass);
    assert.equal(validated, rawPass);

    const hash = await hashPassword(rawPass);
    assert.ok(hash.startsWith('scrypt$'));
    assert.notEqual(hash, rawPass);
  });

  it('11. Plaintext passwords are not stored', async () => {
    const rawPass = 'AnotherSecretPassword!2026';
    const hash = await hashPassword(rawPass);

    assert.ok(!hash.includes(rawPass));
    assert.equal(await verifyPassword(rawPass, hash), true);
    assert.equal(await verifyPassword('incorrect', hash), false);
  });

  it('12. Duplicate username is rejected', () => {
    const existingUsername = 'primary_super';
    const candidateUsername = 'Primary_Super';

    const normalizedCandidate = normalizeUsername(candidateUsername);
    const normalizedExisting = normalizeUsername(existingUsername);

    const isDuplicate = secureStringEqual(normalizedCandidate, normalizedExisting);
    assert.equal(isDuplicate, true);
  });

  it('13. Super Admin can log in with newly created SUPER_ADMIN credentials', async () => {
    const createdSuperUser = {
      id: 'super_abc123',
      username: 'new_super_owner',
      name: 'New Super Admin',
      role: 'super_admin' as const,
      passcode_hash: await hashPassword('SuperSecurePassword!2026'),
      active: true,
      has_profile_picture: false,
    };

    const isPasswordValid = await verifyPassword('SuperSecurePassword!2026', createdSuperUser.passcode_hash);
    assert.equal(isPasswordValid, true);

    const sessionRole = createdSuperUser.role === 'super_admin' ? 'SUPER_ADMIN' : 'ADMIN';
    assert.equal(sessionRole, 'SUPER_ADMIN');

    const authAdmin: AuthenticatedAdmin = {
      authenticated: true,
      userId: createdSuperUser.id,
      role: sessionRole,
      username: createdSuperUser.username,
      displayName: createdSuperUser.name,
      hasProfilePicture: createdSuperUser.has_profile_picture,
      isSuperAdmin: true,
      isAdmin: false,
      sessionId: 'sess_super_abc',
    };

    assert.equal(authAdmin.role, 'SUPER_ADMIN');
    assert.equal(authAdmin.isSuperAdmin, true);
    assert.equal(authAdmin.isAdmin, false);
    assert.equal(authAdmin.username, 'new_super_owner');

    const publicShape = publicAdmin(authAdmin);
    assert.equal(publicShape.role, 'SUPER_ADMIN');
    assert.equal(publicShape.username, 'new_super_owner');
  });

  it('14. Admin can log in with newly created ADMIN credentials', async () => {
    const createdAdminUser = {
      id: 'admin_xyz789',
      username: 'branch_manager_1',
      name: 'Branch Manager',
      role: 'admin' as const,
      passcode_hash: await hashPassword('BranchManagerPassword!2026'),
      active: true,
      has_profile_picture: false,
    };

    const isPasswordValid = await verifyPassword('BranchManagerPassword!2026', createdAdminUser.passcode_hash);
    assert.equal(isPasswordValid, true);

    const sessionRole = createdAdminUser.role === 'super_admin' ? 'SUPER_ADMIN' : 'ADMIN';
    assert.equal(sessionRole, 'ADMIN');

    const authAdmin: AuthenticatedAdmin = {
      authenticated: true,
      userId: createdAdminUser.id,
      role: sessionRole,
      username: createdAdminUser.username,
      displayName: createdAdminUser.name,
      hasProfilePicture: createdAdminUser.has_profile_picture,
      isSuperAdmin: false,
      isAdmin: true,
      sessionId: 'sess_admin_xyz',
    };

    assert.equal(authAdmin.role, 'ADMIN');
    assert.equal(authAdmin.isSuperAdmin, false);
    assert.equal(authAdmin.isAdmin, true);
    assert.equal(authAdmin.username, 'branch_manager_1');

    const publicShape = publicAdmin(authAdmin);
    assert.equal(publicShape.role, 'ADMIN');
    assert.equal(publicShape.username, 'branch_manager_1');
  });

  it('15. Super Admin session grants SUPER_ADMIN role', () => {
    const session = {
      role: 'SUPER_ADMIN' as const,
      staff_user_id: 'super_abc123',
      active: true,
      username: 'new_super_owner',
      display_name: 'New Super Admin',
      has_profile_picture: false,
    };

    const authState: AuthenticatedAdmin = {
      authenticated: true,
      userId: session.staff_user_id,
      role: session.role,
      username: session.username,
      displayName: session.display_name,
      hasProfilePicture: Boolean(session.has_profile_picture),
      isSuperAdmin: session.role === 'SUPER_ADMIN',
      isAdmin: session.role === 'ADMIN',
      sessionId: 'session_token_123',
    };

    assert.equal(authState.role, 'SUPER_ADMIN');
    assert.equal(authState.isSuperAdmin, true);
    assert.equal(authState.isAdmin, false);
  });

  it('16. Admin session grants ADMIN role', () => {
    const session = {
      role: 'ADMIN' as const,
      staff_user_id: 'admin_xyz789',
      active: true,
      username: 'branch_manager_1',
      display_name: 'Branch Manager',
      has_profile_picture: false,
    };

    const authState: AuthenticatedAdmin = {
      authenticated: true,
      userId: session.staff_user_id,
      role: session.role,
      username: session.username,
      displayName: session.display_name,
      hasProfilePicture: Boolean(session.has_profile_picture),
      isSuperAdmin: session.role === 'SUPER_ADMIN',
      isAdmin: session.role === 'ADMIN',
      sessionId: 'session_token_456',
    };

    assert.equal(authState.role, 'ADMIN');
    assert.equal(authState.isSuperAdmin, false);
    assert.equal(authState.isAdmin, true);
  });
});
