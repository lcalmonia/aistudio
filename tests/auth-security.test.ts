import assert from 'node:assert/strict';
import test from 'node:test';
import type { Context } from '@netlify/functions';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_SECONDS,
  canChangeAdminAccountStatus,
  canResetAdminAccountPassword,
  canViewAdminAccount,
  enforceAdminCreationRole,
  secureStringEqual,
  setAdminSessionCookie,
  verifySuperAdminCredentials,
  type AuthenticatedAdmin,
} from '../netlify/functions/_shared/auth.mts';
import logoutHandler from '../netlify/functions/auth-logout.mts';
import { RequestError } from '../netlify/functions/_shared/http.mts';
import { hashPassword, validatePassword, verifyPassword } from '../netlify/functions/_shared/password.mts';
import { MAX_PROFILE_PICTURE_BYTES, validateProfilePicture } from '../netlify/functions/_shared/profile-picture.mts';

const superAdmin: AuthenticatedAdmin = {
  authenticated: true,
  userId: null,
  role: 'SUPER_ADMIN',
  username: 'owner',
  displayName: 'Owner',
  hasProfilePicture: false,
  isSuperAdmin: true,
  isAdmin: false,
  sessionId: 'session-super',
};

const admin: AuthenticatedAdmin = {
  authenticated: true,
  userId: 'admin-parent',
  role: 'ADMIN',
  username: 'manager',
  displayName: 'Manager',
  hasProfilePicture: false,
  isSuperAdmin: false,
  isAdmin: true,
  sessionId: 'session-admin',
};

test('password hashing uses salted scrypt and never embeds plaintext', async () => {
  const password = 'correct horse battery staple';
  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);

  assert.match(firstHash, /^scrypt\$/);
  assert.notEqual(firstHash, secondHash);
  assert.equal(firstHash.includes(password), false);
  assert.equal(await verifyPassword(password, firstHash), true);
  assert.equal(await verifyPassword('incorrect password', firstHash), false);
});

test('password validation rejects weak lengths', () => {
  assert.throws(() => validatePassword('short'), RequestError);
  assert.equal(validatePassword('twelve-chars!'), 'twelve-chars!');
});

test('Super Admin credential comparison is exact and generic', () => {
  const originalUsername = process.env.SUPER_ADMIN_USERNAME;
  const originalPassword = process.env.SUPER_ADMIN_PASSWORD;
  process.env.SUPER_ADMIN_USERNAME = 'secure-owner';
  process.env.SUPER_ADMIN_PASSWORD = 'private-test-password';
  try {
    assert.equal(verifySuperAdminCredentials('secure-owner', 'private-test-password'), true);
    assert.equal(verifySuperAdminCredentials('secure-owner', 'wrong'), false);
    assert.equal(verifySuperAdminCredentials('wrong', 'private-test-password'), false);
    assert.equal(secureStringEqual('same', 'same'), true);
    assert.equal(secureStringEqual('same', 'different'), false);
  } finally {
    if (originalUsername === undefined) delete process.env.SUPER_ADMIN_USERNAME;
    else process.env.SUPER_ADMIN_USERNAME = originalUsername;
    if (originalPassword === undefined) delete process.env.SUPER_ADMIN_PASSWORD;
    else process.env.SUPER_ADMIN_PASSWORD = originalPassword;
  }
});

test('Admin account authorization prevents lateral and Super Admin management', () => {
  assert.equal(canViewAdminAccount(superAdmin, 'any-admin', null), true);
  assert.equal(canChangeAdminAccountStatus(superAdmin, 'any-admin', null), true);
  assert.equal(canResetAdminAccountPassword(superAdmin, 'any-admin', null), true);

  assert.equal(canViewAdminAccount(admin, 'admin-parent', null), true);
  assert.equal(canChangeAdminAccountStatus(admin, 'admin-parent', null), false);
  assert.equal(canResetAdminAccountPassword(admin, 'admin-parent', null), true);

  assert.equal(canViewAdminAccount(admin, 'admin-child', 'admin-parent'), true);
  assert.equal(canChangeAdminAccountStatus(admin, 'admin-child', 'admin-parent'), true);
  assert.equal(canResetAdminAccountPassword(admin, 'admin-child', 'admin-parent'), true);

  assert.equal(canViewAdminAccount(admin, 'admin-unrelated', 'another-admin'), false);
  assert.equal(canChangeAdminAccountStatus(admin, 'admin-unrelated', 'another-admin'), false);
  assert.equal(canResetAdminAccountPassword(admin, 'admin-unrelated', 'another-admin'), false);
});

test('account creation accepts ADMIN only and rejects SUPER_ADMIN', () => {
  assert.doesNotThrow(() => enforceAdminCreationRole(undefined));
  assert.doesNotThrow(() => enforceAdminCreationRole('ADMIN'));
  assert.throws(() => enforceAdminCreationRole('SUPER_ADMIN'), RequestError);
});

test('session cookies use HttpOnly, SameSite, expiration, and production Secure protection', () => {
  const cookies: unknown[] = [];
  const context = {
    cookies: {
      set: (cookie: unknown) => cookies.push(cookie),
    },
  } as unknown as Context;

  setAdminSessionCookie(context, new Request('https://example.com/api/auth/login'), 'token');
  assert.deepEqual(cookies[0], {
    name: ADMIN_SESSION_COOKIE,
    value: 'token',
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: ADMIN_SESSION_SECONDS,
  });
});

test('logout clears the session cookie and returns an unauthenticated response', async () => {
  const deletedCookies: unknown[] = [];
  const context = {
    cookies: {
      delete: (cookie: unknown) => deletedCookies.push(cookie),
    },
  } as unknown as Context;
  const request = new Request('https://example.com/api/auth/logout', {
    method: 'POST',
    headers: { Origin: 'https://example.com' },
  });

  const response = await logoutHandler(request, context);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { authenticated: false });
  assert.deepEqual(deletedCookies, [{ name: ADMIN_SESSION_COOKIE, path: '/' }]);
});

test('profile picture validation accepts known raster signatures and rejects unsafe input', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(validateProfilePicture('image/png', png), 'image/png');
  assert.throws(() => validateProfilePicture('image/svg+xml', new TextEncoder().encode('<svg/>')), RequestError);
  assert.throws(() => validateProfilePicture('image/png', new TextEncoder().encode('not a png')), RequestError);
  assert.throws(
    () => validateProfilePicture('image/jpeg', new Uint8Array(MAX_PROFILE_PICTURE_BYTES + 1)),
    RequestError,
  );
});
