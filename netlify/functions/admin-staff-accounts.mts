import { randomBytes } from 'node:crypto';
import type { Config, Context } from '@netlify/functions';
import { getSuperAdminCredentials, normalizeUsername, requireAuthenticatedAdmin, secureStringEqual } from './_shared/auth.mts';
import { invalidateStaffSessions } from './_shared/staffAuth.mts';
import { database } from './_shared/database.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError, requireString } from './_shared/http.mts';
import { hashPassword, validatePassword } from './_shared/password.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    const actor = await requireAuthenticatedAdmin(request);
    if (!actor.isSuperAdmin) throw new RequestError(403, 'Only Super Admin can manage staff accounts.');
    const db = database();

    if (request.method === 'GET') {
      const rows = await db.sql`
        SELECT id, username, name, active, last_login, created_at, updated_at
        FROM staff_users WHERE role = 'staff'
        ORDER BY created_at DESC
      `;
      return json({ accounts: rows });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      const body = await readJsonObject(request);
      const username = normalizeUsername(requireString(body.username, 'Username', { min: 3, max: 64 }));
      if (!/^[a-z0-9][a-z0-9._-]*$/.test(username)) throw new RequestError(400, 'Username may contain lowercase letters, numbers, periods, underscores, and hyphens.');
      const credentials = getSuperAdminCredentials();
      if (credentials && secureStringEqual(username, normalizeUsername(credentials.username))) throw new RequestError(409, 'That username is already in use.');
      const name = requireString(body.displayName, 'Display name', { min: 2, max: 255 });
      const password = validatePassword(body.password);
      const active = body.active === undefined ? true : body.active;
      if (typeof active !== 'boolean') throw new RequestError(400, 'Active must be a boolean.');
      const id = 'staff_' + randomBytes(12).toString('hex');
      const passwordHash = await hashPassword(password);
      try {
        const rows = await db.sql`
          INSERT INTO staff_users (id, username, name, email, role, active, passcode_hash, created_by_staff_user_id)
          VALUES (${id}, ${username}, ${name}, NULL, 'staff', ${active}, ${passwordHash}, ${actor.userId})
          RETURNING id, username, name, active, last_login, created_at, updated_at
        `;
        return json({ account: rows[0] }, 201);
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') throw new RequestError(409, 'That username is already in use.');
        throw error;
      }
    }

    if (request.method === 'PATCH') {
      enforceSameOrigin(request);
      const body = await readJsonObject(request);
      const id = typeof body.id === 'string' ? body.id : '';
      if (!id || typeof body.active !== 'boolean') throw new RequestError(400, 'Staff account ID and active status are required.');
      const rows = await db.sql`
        UPDATE staff_users SET active = ${body.active}, updated_at = NOW()
        WHERE id = ${id} AND role = 'staff'
        RETURNING id, username, name, active, last_login, created_at, updated_at
      `;
      if (!rows.length) throw new RequestError(404, 'Staff account not found.');
      if (!body.active) await invalidateStaffSessions(id);
      return json({ account: rows[0] });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}
export const config: Config = { path: '/api/admin/staff-accounts', method: ['GET', 'POST', 'PATCH'] };
