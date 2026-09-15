import type { Config } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { mapOrderRecord, OrderItemRecord, OrderRecord } from './_shared/orders.mts';
import { errorResponse, json } from './_shared/http.mts';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);

    await requireAuthenticatedAdmin(request);

    const url = new URL(request.url);
    const updatedSince = url.searchParams.get('updatedSince');
    if (!updatedSince) return json({ error: 'updatedSince is required.' }, 400);

    const since = new Date(updatedSince);
    if (Number.isNaN(since.getTime())) return json({ error: 'updatedSince must be a valid timestamp.' }, 400);

    const db = database();
    const query = `
      SELECT
        o.id,
        o.order_number,
        o.customer_id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.time_ago,
        o.timestamp,
        o.status,
        o.total,
        o.image,
        o.notes,
        o.order_type,
        o.table_number,
        o.delivery_address,
        o.payment_method,
        o.subtotal,
        o.discount,
        o.delivery_fee,
        o.is_customer_order,
        o.created_at,
        o.updated_at,
        o.completed_at,
        o.cancelled_at,
        COALESCE(
          json_agg(
            json_build_object(
              'line_position', oi.line_position,
              'name', oi.name,
              'quantity', oi.quantity,
              'customization', oi.customization,
              'price', oi.price,
              'completed', oi.completed,
              'temperature', oi.temperature,
              'size', oi.size
            ) ORDER BY oi.line_position ASC
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items_json
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.updated_at > $1::timestamptz
      GROUP BY o.id
      ORDER BY o.updated_at ASC, o.created_at ASC
    `;

    const result = await db.pool.query(query, [since.toISOString()]);
    const orders = result.rows.map((row: OrderRecord & { items_json: OrderItemRecord[] }) =>
      mapOrderRecord(row, row.items_json || [])
    );

    return json({ orders, serverTime: new Date().toISOString() }, 200);
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: '/api/orders/updates',
  method: ['GET'],
};
