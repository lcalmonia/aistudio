import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import {
  enforceSameOrigin,
  errorResponse,
  json,
} from './_shared/http.mts';
import { RequestError } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    const admin = await requireAuthenticatedAdmin(request);

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405);
    }

    enforceSameOrigin(request);
    if (!admin.isSuperAdmin) {
      throw new RequestError(403, 'Only Super Admin can reset all orders.');
    }

    const db = database();
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');
      const itemResult = await client.query('DELETE FROM order_items');
      const orderResult = await client.query('DELETE FROM orders');
      await client.query('COMMIT');

      return json({
        deletedOrders: orderResult.rowCount || 0,
        deletedItems: itemResult.rowCount || 0,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/orders-reset',
  method: ['POST'],
};
