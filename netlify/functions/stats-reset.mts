import type { Config } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import {
  enforceSameOrigin,
  errorResponse,
  json,
} from './_shared/http.mts';
import { RequestError } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    const admin = await requireAuthenticatedAdmin(request);
    const db = database();

    if (request.method === 'GET') {
      const rows = await db.sql`
        SELECT reset_at
        FROM stats_reset_state
        WHERE id = 'default'
        LIMIT 1
      ` as Array<{ reset_at: string | Date }>;

      const resetAt = rows[0]?.reset_at
        ? new Date(rows[0].reset_at).toISOString()
        : new Date(0).toISOString();

      return json({ resetAt });
    }

    if (request.method === 'POST') {
      enforceSameOrigin(request);
      if (!admin.isSuperAdmin) {
        throw new RequestError(403, 'Only Super Admin can reset sales statistics.');
      }

      const resetAt = new Date();
      await db.sql`
        INSERT INTO stats_reset_state (id, reset_at)
        VALUES ('default', ${resetAt})
        ON CONFLICT (id)
        DO UPDATE SET reset_at = EXCLUDED.reset_at
      `;

      return json({ resetAt: resetAt.toISOString() });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/stats-reset',
  method: ['GET', 'POST'],
};
