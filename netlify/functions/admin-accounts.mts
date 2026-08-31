import { randomBytes } from 'node:crypto';
import type { Config } from '@netlify/functions';
import {
  canChangeAdminAccountStatus,
  canResetAdminAccountPassword,
  enforceAdminCreationRole,
  getSuperAdminCredentials,
  normalizeUsername,
  requireAdminAccountManager,
  requireAuthenticatedAdmin,
  secureStringEqual,
} from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import {
  enforceSameOrigin,
  errorResponse,
  json,
  readJsonObject,
  RequestError,
  requireString,
} from './_shared/http.mts';
import { hashPassword, validatePassword } from './_shared/password.mts';

interface AdminAccountRow {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'super_admin';
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by_staff_user_id: string | null;
  has_profile_picture: boolean;
}

function validateUsername(value: unknown): string {
  const username = normalizeUsername(requireString(value, 'Username', { min: 3, max: 64 }));
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(username)) {
    throw new RequestError(400, 'Username may contain lowercase letters, numbers, periods, underscores, and hyphens.');
  }
  return username;
}

function accountResponse(row: AdminAccountRow, actorId: string | null, isSuperAdmin: boolean) {
  const mappedRole = row.role === 'super_admin' ? ('SUPER_ADMIN' as const) : ('ADMIN' as const);
  const actor = {
    authenticated: true as const,
    userId: actorId,
    role: isSuperAdmin ? ('SUPER_ADMIN' as const) : ('ADMIN' as const),
    username: '',
    displayName: '',
    hasProfilePicture: false,
    isSuperAdmin,
    isAdmin: !isSuperAdmin,
    sessionId: '',
  };
  return {
    id: row.id,
    username: row.username,
    displayName: row.name,
    role: mappedRole,
    active: row.active,
    hasProfilePicture: row.has_profile_picture,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canResetPassword: canResetAdminAccountPassword(actor, row.id, row.created_by_staff_user_id),
    canChangeStatus: canChangeAdminAccountStatus(actor, row.id, row.created_by_staff_user_id),
  };
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const actor = await requireAuthenticatedAdmin(request);
    requireAdminAccountManager(actor);
    const db = database();

    if (request.method === 'GET') {
      const rows = actor.isSuperAdmin
        ? ((await db.sql`
            SELECT id, username, name, role, active, created_at, updated_at, created_by_staff_user_id,
              profile_picture IS NOT NULL AS has_profile_picture
            FROM staff_users
            WHERE role IN ('admin', 'super_admin')
            ORDER BY created_at DESC
          `) as AdminAccountRow[])
        : ((await db.sql`
            SELECT id, username, name, role, active, created_at, updated_at, created_by_staff_user_id,
              profile_picture IS NOT NULL AS has_profile_picture
            FROM staff_users
            WHERE role IN ('admin', 'super_admin')
              AND (id = ${actor.userId} OR created_by_staff_user_id = ${actor.userId})
            ORDER BY created_at DESC
          `) as AdminAccountRow[]);

      return json({ accounts: rows.map((row) => accountResponse(row, actor.userId, actor.isSuperAdmin)) });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      if (!actor.isSuperAdmin) {
        throw new RequestError(403, 'Only Super Admin can create administrative accounts.');
      }
      const body = await readJsonObject(request);
      const targetRole = enforceAdminCreationRole(actor, body.role);
      const dbRole = targetRole === 'SUPER_ADMIN' ? 'super_admin' : 'admin';

      const username = validateUsername(body.username);
      const superAdminCredentials = getSuperAdminCredentials();
      if (
        superAdminCredentials &&
        secureStringEqual(username, normalizeUsername(superAdminCredentials.username))
      ) {
        throw new RequestError(409, 'That username is already in use.');
      }
      const displayName = requireString(body.displayName, 'Display name', { min: 2, max: 255 });
      const password = validatePassword(body.password);
      const active = body.active === undefined ? true : body.active;
      if (typeof active !== 'boolean') throw new RequestError(400, 'Active must be a boolean.');

      const passwordHash = await hashPassword(password);
      const id = targetRole === 'SUPER_ADMIN' ? `super_${randomBytes(12).toString('hex')}` : `admin_${randomBytes(12).toString('hex')}`;

      try {
        const rows = (await db.sql`
          INSERT INTO staff_users (
            id, username, name, role, active, passcode_hash, created_by_staff_user_id
          )
          VALUES (
            ${id}, ${username}, ${displayName}, ${dbRole}, ${active}, ${passwordHash}, ${actor.userId}
          )
          RETURNING id, username, name, role, active, created_at, updated_at, created_by_staff_user_id,
            profile_picture IS NOT NULL AS has_profile_picture
        `) as AdminAccountRow[];
        return json({ account: accountResponse(rows[0], actor.userId, actor.isSuperAdmin) }, 201);
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
          throw new RequestError(409, 'That username is already in use.');
        }
        throw error;
      }
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/admin/accounts',
  method: ['GET', 'POST'],
};
