import type { Config, Context } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { requireAuthenticatedStaff } from './_shared/staffAuth.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';

const STAFF_STATUSES = ['Brewing', 'Preparing', 'Ready'] as const;

export default async function handler(request: Request, context: Context): Promise<Response> {
  if (request.method !== 'PATCH') return json({ error: 'Method not allowed.' }, 405);
  try {
    enforceSameOrigin(request);
    await requireAuthenticatedStaff(request);
    const orderId = context.params.id;
    if (!orderId) throw new RequestError(400, 'Order ID is required.');
    const body = await readJsonObject(request);
    const status = body.status;
    if (typeof status !== 'string' || !STAFF_STATUSES.includes(status as typeof STAFF_STATUSES[number])) {
      throw new RequestError(400, 'Staff can only set an order to Brewing, Preparing, or Ready.');
    }
    const db = database();
    const rows = await db.sql`
      UPDATE orders
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${orderId}
        AND status IN ('New', 'Brewing', 'Preparing', 'Ready')
      RETURNING id, order_number, status, updated_at
    `;
    if (!rows.length) throw new RequestError(404, 'Active order not found or it can no longer be updated.');
    return json({ order: rows[0] });
  } catch (error) {
    return errorResponse(error);
  }
}
export const config: Config = { path: '/api/staff/orders/:id/status', method: ['PATCH'] };
