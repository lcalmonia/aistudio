import type { Config, Context } from '@netlify/functions';
import {
  canChangeAdminAccountStatus,
  requireAuthenticatedAdmin,
  setAdminAccountActive,
} from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

interface ManagedAccountRow {
  id: string;
  created_by_staff_user_id: string | null;
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  if (request.method !== 'PATCH') return json({ error: 'Method not allowed.' }, 405);

  try {
    enforceSameOrigin(request);
    const actor = await requireAuthenticatedAdmin(request);
    const accountId = context.params.id;
    if (!accountId) throw new RequestError(400, 'Admin account ID is required.');

    const db = database();
    const targets = (await db.sql`
      SELECT id, created_by_staff_user_id
      FROM staff_users
      WHERE id = ${accountId} AND role = 'admin'
      LIMIT 1
    `) as ManagedAccountRow[];
    const target = targets[0];
    if (!target) throw new RequestError(404, 'Admin account not found.');

    if (!canChangeAdminAccountStatus(actor, target.id, target.created_by_staff_user_id)) {
      throw new RequestError(403, 'You are not authorized to manage this Admin account.');
    }

    const body = await readJsonObject(request);
    if (typeof body.active !== 'boolean') throw new RequestError(400, 'Active must be a boolean.');
    const account = await setAdminAccountActive(accountId, body.active);
    return json({ account });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/admin/accounts/:id',
  method: 'PATCH',
};
