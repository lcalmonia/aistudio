import type { Config } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { requireAuthenticatedStaff } from './_shared/staffAuth.mts';
import { errorResponse, json, RequestError } from './_shared/http.mts';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
  try {
    await requireAuthenticatedStaff(request);
    const url = new URL(request.url);
    const sinceValue = url.searchParams.get('updatedSince');
    const db = database();
    const clockRows = await db.sql`SELECT NOW() AS server_time`;
    const serverTime = new Date(clockRows[0].server_time as string).toISOString();
    const client = await db.pool.connect();
    try {
      const params: unknown[] = [];
      let cursorClause = '';
      if (sinceValue) {
        const since = new Date(sinceValue);
        if (Number.isNaN(since.getTime())) throw new RequestError(400, 'Invalid update cursor.');
        params.push(since.toISOString());
        cursorClause = 'AND o.updated_at > $1::timestamptz';
      }
      const result = await client.query(`
        SELECT o.id, o.order_number, o.customer_name, o.status, o.order_type,
               o.table_number, o.notes, o.created_at, o.updated_at,
               COALESCE(json_agg(json_build_object(
                 'name', oi.name, 'quantity', oi.quantity,
                 'customization', oi.customization, 'temperature', oi.temperature, 'size', oi.size
               ) ORDER BY oi.line_position ASC) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.created_at >= NOW() - INTERVAL '24 hours'
          ${cursorClause || "AND o.status IN ('New', 'Brewing', 'Preparing', 'Ready')"}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 80
      `, params);
      return json({ orders: result.rows, serverTime });
    } finally {
      client.release();
    }
  } catch (error) {
    return errorResponse(error);
  }
}
export const config: Config = { path: '/api/staff/orders', method: ['GET'] };
